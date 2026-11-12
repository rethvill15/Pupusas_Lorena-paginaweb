
document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    // =====================================================
    // 1. CONFIGURACIÓN Y ELEMENTOS
    // =====================================================

    const URL_SESION = "../../../api/sesion.php";
    const URL_USUARIOS = "../../../api/administracion_usuarios.php";

    const paginaLogin = "../../../inicio sesion/login.html";
    const paginaCambioPassword = "../../../inicio sesion/cambiar_password.html";
    const paginaPrincipal = "../../pup_lorena.html";

    const elemento = (id) => document.getElementById(id);

    const mensajeCarga = elemento("mensajeCarga");
    const alertaError = elemento("alertaError");
    const textoError = elemento("textoError");
    const btnReintentar = elemento("btnReintentar");
    const contenidoUsuarios = elemento("contenidoUsuarios");

    const totalUsuarios = elemento("totalUsuarios");
    const totalClientes = elemento("totalClientes");
    const totalAdministradores = elemento("totalAdministradores");

    const buscadorUsuarios = elemento("buscadorUsuarios");
    const filtroRol = elemento("filtroRol");
    const filtroEstado = elemento("filtroEstado");
    const textoResultados = elemento("textoResultados");
    const tablaUsuarios = elemento("tablaUsuarios");
    const sinResultados = elemento("sinResultados");

    const modalGestionUsuario = elemento("modalGestionUsuario");
    const detalleId = elemento("detalleId");
    const detalleNombre = elemento("detalleNombre");
    const detalleCorreo = elemento("detalleCorreo");
    const detalleTelefono = elemento("detalleTelefono");
    const detalleEstado = elemento("detalleEstado");
    const nuevoRol = elemento("nuevoRol");

    const btnGuardarRol = elemento("btnGuardarRol");
    const btnCambiarEstado = elemento("btnCambiarEstado");
    const btnRestablecerPassword = elemento("btnRestablecerPassword");
    const mensajeModalUsuario = elemento("mensajeModalUsuario");
    const cerrarModalUsuario = elemento("cerrarModalUsuario");
    const cancelarModalUsuario = elemento("cancelarModalUsuario");

    const modalPasswordTemporal = elemento("modalPasswordTemporal");
    const passwordTemporal = elemento("passwordTemporal");
    const btnCopiarPassword = elemento("btnCopiarPassword");
    const mensajeCopiarPassword = elemento("mensajeCopiarPassword");
    const cerrarModalPassword = elemento("cerrarModalPassword");

    // =====================================================
    // 2. ESTADO DEL MÓDULO
    // =====================================================

    let usuarios = [];
    let usuarioSeleccionado = null;
    let idAdministradorActual = null;
    let tokenCsrf = "";

    // =====================================================
    // 3. FUNCIONES GENERALES
    // =====================================================

    function mostrarError(mensaje) {
        textoError.textContent = mensaje;
        alertaError.hidden = false;
        mensajeCarga.hidden = true;
        contenidoUsuarios.hidden = true;
    }

    function ocultarError() {
        alertaError.hidden = true;
        textoError.textContent = "";
    }

    function mostrarMensajeModal(mensaje, tipo = "error") {
        mensajeModalUsuario.textContent = mensaje;
        mensajeModalUsuario.classList.remove(
            "mensaje-exito",
            "mensaje-error"
        );
        mensajeModalUsuario.classList.add(
            tipo === "exito" ? "mensaje-exito" : "mensaje-error"
        );
        mensajeModalUsuario.hidden = false;
    }

    function limpiarMensajeModal() {
        mensajeModalUsuario.textContent = "";
        mensajeModalUsuario.classList.remove(
            "mensaje-exito",
            "mensaje-error"
        );
        mensajeModalUsuario.hidden = true;
    }

    function establecerCargaBotones(ocupado) {
        btnGuardarRol.disabled = ocupado || !usuarioSeleccionado ||
            usuarioSeleccionado.id_usuario === idAdministradorActual;

        btnCambiarEstado.disabled = ocupado || !usuarioSeleccionado ||
            usuarioSeleccionado.id_usuario === idAdministradorActual;

        btnRestablecerPassword.disabled = ocupado || !usuarioSeleccionado ||
            usuarioSeleccionado.id_usuario === idAdministradorActual;
    }

    function formatearFecha(fecha) {
        if (!fecha) {
            return "No disponible";
        }

        const fechaNormalizada = String(fecha).replace(" ", "T");
        const fechaObjeto = new Date(fechaNormalizada);

        if (Number.isNaN(fechaObjeto.getTime())) {
            return String(fecha);
        }

        return fechaObjeto.toLocaleString("es-NI", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    async function leerRespuesta(response) {
        let datos;

        try {
            datos = await response.json();
        } catch {
            throw new Error("El servidor devolvió una respuesta no válida.");
        }

        if (!response.ok || !datos.exito) {
            throw new Error(
                datos.mensaje || "No fue posible completar la solicitud."
            );
        }

        return datos;
    }

    // =====================================================
    // 4. VERIFICAR SESIÓN Y ROL
    // =====================================================

    async function verificarAdministrador() {
        const response = await fetch(URL_SESION, {
            method: "GET",
            credentials: "same-origin",
            cache: "no-store",
            headers: {
                "Accept": "application/json"
            }
        });

        const datos = await leerRespuesta(response);

        if (!datos.sesion_activa) {
            window.location.href = paginaLogin;
            return false;
        }

        if (datos.requiere_cambio_password) {
            window.location.href = paginaCambioPassword;
            return false;
        }

        if (
            !datos.usuario ||
            datos.usuario.rol !== "Administrador"
        ) {
            window.location.href = paginaPrincipal;
            return false;
        }

        idAdministradorActual = Number(datos.usuario.id_usuario);
        tokenCsrf = datos.token_csrf || "";

        if (!/^[a-f0-9]{64}$/i.test(tokenCsrf)) {
            throw new Error(
                "No se pudo obtener un token de seguridad válido. Recarga la página."
            );
        }

        return true;
    }

    // =====================================================
    // 5. CONSULTAR USUARIOS
    // =====================================================

    async function cargarUsuarios() {
        mensajeCarga.hidden = false;
        alertaError.hidden = true;
        contenidoUsuarios.hidden = true;

        try {
            const response = await fetch(URL_USUARIOS, {
                method: "GET",
                credentials: "same-origin",
                cache: "no-store",
                headers: {
                    "Accept": "application/json"
                }
            });

            const datos = await leerRespuesta(response);

            if (!Array.isArray(datos.usuarios)) {
                throw new Error(
                    "La lista de usuarios recibida no tiene un formato válido."
                );
            }

            usuarios = datos.usuarios;
            actualizarContadores();
            aplicarFiltros();

            mensajeCarga.hidden = true;
            contenidoUsuarios.hidden = false;

        } catch (error) {
            mostrarError(error.message);
        }
    }

    // =====================================================
    // 6. CONTADORES
    // =====================================================

    function actualizarContadores() {
        const clientes = usuarios.filter(
            usuario => usuario.rol === "Cliente"
        ).length;

        const administradores = usuarios.filter(
            usuario => usuario.rol === "Administrador"
        ).length;

        totalUsuarios.textContent = usuarios.length;
        totalClientes.textContent = clientes;
        totalAdministradores.textContent = administradores;
    }

    // =====================================================
    // 7. CREAR ELEMENTOS DE LA TABLA
    // =====================================================

    function crearCelda(texto) {
        const celda = document.createElement("td");
        celda.textContent = texto ?? "No disponible";
        return celda;
    }

    function crearEtiqueta(texto, clase) {
        const etiqueta = document.createElement("span");
        etiqueta.className = clase;
        etiqueta.textContent = texto;
        return etiqueta;
    }

    function crearFilaUsuario(usuario) {
        const fila = document.createElement("tr");

        fila.appendChild(crearCelda(usuario.id_usuario));

        const nombre = [
            usuario.nombres,
            usuario.apellidos
        ].filter(Boolean).join(" ");

        fila.appendChild(crearCelda(nombre));
        fila.appendChild(crearCelda(usuario.correo));
        fila.appendChild(crearCelda(usuario.telefono || "No registrado"));

        const celdaRol = document.createElement("td");
        celdaRol.appendChild(
            crearEtiqueta(
                usuario.rol,
                usuario.rol === "Administrador"
                    ? "etiqueta-rol rol-admin"
                    : "etiqueta-rol rol-cliente"
            )
        );
        fila.appendChild(celdaRol);

        const celdaEstado = document.createElement("td");
        celdaEstado.appendChild(
            crearEtiqueta(
                usuario.estado_cuenta,
                usuario.estado_cuenta === "Activo"
                    ? "etiqueta-estado estado-activo"
                    : "etiqueta-estado estado-inactivo"
            )
        );
        fila.appendChild(celdaEstado);

        fila.appendChild(crearCelda(
            formatearFecha(usuario.fecha_registro)
        ));

        const celdaAcciones = document.createElement("td");
        const botonGestionar = document.createElement("button");

        botonGestionar.type = "button";
        botonGestionar.className = "boton-gestionar";
        botonGestionar.textContent = "Gestionar";
        botonGestionar.addEventListener("click", () => {
            abrirModalGestion(usuario);
        });

        celdaAcciones.appendChild(botonGestionar);
        fila.appendChild(celdaAcciones);

        return fila;
    }

    // =====================================================
    // 8. BUSCADOR Y FILTROS
    // =====================================================

    function aplicarFiltros() {
        const busqueda = buscadorUsuarios.value
            .trim()
            .toLowerCase();

        const rolSeleccionado = filtroRol.value;
        const estadoSeleccionado = filtroEstado.value;

        const filtrados = usuarios.filter(usuario => {
            const nombreCompleto = [
                usuario.nombres,
                usuario.apellidos
            ].filter(Boolean).join(" ").toLowerCase();

            const coincideBusqueda =
                String(usuario.id_usuario).includes(busqueda) ||
                nombreCompleto.includes(busqueda) ||
                String(usuario.correo || "").toLowerCase().includes(busqueda);

            const coincideRol =
                !rolSeleccionado ||
                usuario.rol === rolSeleccionado;

            const coincideEstado =
                !estadoSeleccionado ||
                usuario.estado_cuenta === estadoSeleccionado;

            return coincideBusqueda &&
                coincideRol &&
                coincideEstado;
        });

        tablaUsuarios.replaceChildren();

        filtrados.forEach(usuario => {
            tablaUsuarios.appendChild(crearFilaUsuario(usuario));
        });

        textoResultados.textContent =
            `Mostrando ${filtrados.length} de ${usuarios.length} usuarios`;

        sinResultados.hidden = filtrados.length !== 0;
    }

    buscadorUsuarios.addEventListener("input", aplicarFiltros);
    filtroRol.addEventListener("change", aplicarFiltros);
    filtroEstado.addEventListener("change", aplicarFiltros);

    // =====================================================
    // 9. ABRIR Y CERRAR MODAL DE GESTIÓN
    // =====================================================

    function abrirModalGestion(usuario) {
        usuarioSeleccionado = usuario;

        limpiarMensajeModal();

        const nombreCompleto = [
            usuario.nombres,
            usuario.apellidos
        ].filter(Boolean).join(" ");

        detalleId.textContent = usuario.id_usuario;
        detalleNombre.textContent = nombreCompleto;
        detalleCorreo.textContent = usuario.correo;
        detalleTelefono.textContent = usuario.telefono || "No registrado";
        detalleEstado.textContent = usuario.estado_cuenta;

        nuevoRol.value = usuario.rol;

        const esPropiaCuenta =
            Number(usuario.id_usuario) === idAdministradorActual;

        btnCambiarEstado.textContent =
            usuario.estado_cuenta === "Activo"
                ? "Desactivar cuenta"
                : "Activar cuenta";

        btnCambiarEstado.classList.remove(
            "boton-desactivar",
            "boton-activar"
        );

        btnCambiarEstado.classList.add(
            usuario.estado_cuenta === "Activo"
                ? "boton-desactivar"
                : "boton-activar"
        );

        nuevoRol.disabled = esPropiaCuenta;

        establecerCargaBotones(false);

        if (esPropiaCuenta) {
            mostrarMensajeModal(
                "Por seguridad, no puedes modificar tu propia cuenta desde este módulo.",
                "error"
            );
        }

        modalGestionUsuario.hidden = false;
    }

    function cerrarModalGestion() {
        modalGestionUsuario.hidden = true;
        usuarioSeleccionado = null;
        nuevoRol.disabled = false;
        limpiarMensajeModal();
    }

    cerrarModalUsuario.addEventListener("click", cerrarModalGestion);
    cancelarModalUsuario.addEventListener("click", cerrarModalGestion);

    modalGestionUsuario.addEventListener("click", evento => {
        if (evento.target === modalGestionUsuario) {
            cerrarModalGestion();
        }
    });

    // =====================================================
    // 10. ENVIAR ACCIONES A LA API
    // =====================================================

    async function enviarAccion(datos) {
        const response = await fetch(URL_USUARIOS, {
            method: "POST",
            credentials: "same-origin",
            cache: "no-store",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "X-CSRF-Token": tokenCsrf
            },
            body: JSON.stringify(datos)
        });

        return await leerRespuesta(response);
    }

    // =====================================================
    // 11. CAMBIAR ROL
    // =====================================================

    btnGuardarRol.addEventListener("click", async () => {
        if (!usuarioSeleccionado) {
            return;
        }

        const nuevoRolSeleccionado = nuevoRol.value;

        if (!["Cliente", "Administrador"].includes(nuevoRolSeleccionado)) {
            mostrarMensajeModal("El rol seleccionado no es válido.");
            return;
        }

        if (nuevoRolSeleccionado === usuarioSeleccionado.rol) {
            mostrarMensajeModal(
                "La cuenta ya tiene el rol seleccionado.",
                "exito"
            );
            return;
        }

        const confirmado = window.confirm(
            `¿Deseas cambiar el rol de esta cuenta a ${nuevoRolSeleccionado}?`
        );

        if (!confirmado) {
            return;
        }

        establecerCargaBotones(true);
        btnGuardarRol.textContent = "Guardando...";

        try {
            const datos = await enviarAccion({
                accion: "cambiar_rol",
                id_usuario: usuarioSeleccionado.id_usuario,
                nuevo_rol: nuevoRolSeleccionado
            });

            mostrarMensajeModal(datos.mensaje, "exito");

            await cargarUsuarios();

            const usuarioActualizado = usuarios.find(
                usuario =>
                    usuario.id_usuario === Number(datos.id_usuario)
            );

            if (usuarioActualizado) {
                usuarioSeleccionado = usuarioActualizado;
                nuevoRol.value = usuarioActualizado.rol;
            }

        } catch (error) {
            mostrarMensajeModal(error.message);
        } finally {
            btnGuardarRol.textContent = "Guardar cambios";
            establecerCargaBotones(false);
        }
    });

    // =====================================================
    // 12. ACTIVAR O DESACTIVAR CUENTA
    // =====================================================

    btnCambiarEstado.addEventListener("click", async () => {
        if (!usuarioSeleccionado) {
            return;
        }

        const nuevoEstado =
            usuarioSeleccionado.estado_cuenta === "Activo"
                ? "Inactivo"
                : "Activo";

        const accionTexto =
            nuevoEstado === "Inactivo"
                ? "desactivar"
                : "activar";

        const confirmado = window.confirm(
            `¿Estás seguro de que deseas ${accionTexto} esta cuenta?`
        );

        if (!confirmado) {
            return;
        }

        establecerCargaBotones(true);
        btnCambiarEstado.textContent = "Procesando...";

        try {
            const datos = await enviarAccion({
                accion: "cambiar_estado",
                id_usuario: usuarioSeleccionado.id_usuario,
                nuevo_estado: nuevoEstado
            });

            mostrarMensajeModal(datos.mensaje, "exito");

            await cargarUsuarios();

            const usuarioActualizado = usuarios.find(
                usuario =>
                    usuario.id_usuario === Number(datos.id_usuario)
            );

            if (usuarioActualizado) {
                usuarioSeleccionado = usuarioActualizado;

                detalleEstado.textContent =
                    usuarioActualizado.estado_cuenta;

                btnCambiarEstado.textContent =
                    usuarioActualizado.estado_cuenta === "Activo"
                        ? "Desactivar cuenta"
                        : "Activar cuenta";

                btnCambiarEstado.classList.remove(
                    "boton-desactivar",
                    "boton-activar"
                );

                btnCambiarEstado.classList.add(
                    usuarioActualizado.estado_cuenta === "Activo"
                        ? "boton-desactivar"
                        : "boton-activar"
                );
            }

        } catch (error) {
            mostrarMensajeModal(error.message);
        } finally {
            establecerCargaBotones(false);
        }
    });

    // =====================================================
    // 13. RESTABLECER CONTRASEÑA
    // =====================================================

    btnRestablecerPassword.addEventListener("click", async () => {
        if (!usuarioSeleccionado) {
            return;
        }

        const confirmado = window.confirm(
            "¿Deseas generar una contraseña temporal para este usuario? " +
            "Su contraseña actual dejará de funcionar."
        );

        if (!confirmado) {
            return;
        }

        establecerCargaBotones(true);
        btnRestablecerPassword.textContent = "Generando...";

        try {
            const datos = await enviarAccion({
                accion: "restablecer_password",
                id_usuario: usuarioSeleccionado.id_usuario
            });

            if (!datos.password_temporal) {
                throw new Error(
                    "El servidor no devolvió la contraseña temporal."
                );
            }

            cerrarModalGestion();

            passwordTemporal.value = datos.password_temporal;
            mensajeCopiarPassword.textContent =
                `La contraseña temporal tiene una vigencia de ${datos.vigencia_horas} horas.`;

            modalPasswordTemporal.hidden = false;

        } catch (error) {
            mostrarMensajeModal(error.message);
        } finally {
            btnRestablecerPassword.textContent =
                "Restablecer contraseña";

            establecerCargaBotones(false);
        }
    });

    // =====================================================
    // 14. COPIAR CONTRASEÑA TEMPORAL
    // =====================================================

    btnCopiarPassword.addEventListener("click", async () => {
        const texto = passwordTemporal.value;

        if (!texto) {
            mensajeCopiarPassword.textContent =
                "No hay una contraseña para copiar.";
            return;
        }

        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(texto);
            } else {
                passwordTemporal.focus();
                passwordTemporal.select();

                const copiado = document.execCommand("copy");

                if (!copiado) {
                    throw new Error("No se pudo copiar automáticamente.");
                }
            }

            mensajeCopiarPassword.textContent =
                "Contraseña copiada correctamente.";

        } catch {
            mensajeCopiarPassword.textContent =
                "No se pudo copiar automáticamente. Selecciona y copia la contraseña.";
            passwordTemporal.focus();
            passwordTemporal.select();
        }
    });

    // =====================================================
    // 15. CERRAR MODAL DE CONTRASEÑA TEMPORAL
    // =====================================================

    function cerrarModalPasswordTemporal() {
        passwordTemporal.value = "";
        mensajeCopiarPassword.textContent = "";
        modalPasswordTemporal.hidden = true;
    }

    cerrarModalPassword.addEventListener(
        "click",
        cerrarModalPasswordTemporal
    );

    modalPasswordTemporal.addEventListener("click", evento => {
        if (evento.target === modalPasswordTemporal) {
            cerrarModalPasswordTemporal();
        }
    });

    // =====================================================
    // 16. TECLA ESCAPE
    // =====================================================

    document.addEventListener("keydown", evento => {
        if (evento.key !== "Escape") {
            return;
        }

        if (!modalPasswordTemporal.hidden) {
            cerrarModalPasswordTemporal();
        } else if (!modalGestionUsuario.hidden) {
            cerrarModalGestion();
        }
    });

    // =====================================================
    // 17. REINTENTAR CARGA
    // =====================================================

    btnReintentar.addEventListener("click", async () => {
        ocultarError();
        await cargarUsuarios();
    });

    // =====================================================
    // 18. INICIAR MÓDULO
    // =====================================================

    async function iniciarModulo() {
        try {
            const autorizado = await verificarAdministrador();

            if (!autorizado) {
                return;
            }

            await cargarUsuarios();

        } catch (error) {
            mostrarError(error.message);
        }
    }

    iniciarModulo();
});
