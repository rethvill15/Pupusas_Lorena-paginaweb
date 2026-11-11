
/* =========================================================
   GESTIÓN ADMINISTRATIVA DE RESERVACIONES
   PUPUSAS LORENA
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       CONFIGURACIÓN
    ===================================================== */

    const API_SESION = "../../../api/sesion.php";
    const API_RESERVACIONES = "../../../api/reservaciones.php";

    let reservaciones = [];
    let reservacionSeleccionada = null;
    let guardandoEstado = false;


    /* =====================================================
       ELEMENTOS DEL DOCUMENTO
    ===================================================== */

    const estadoCarga = document.getElementById("estadoCarga");
    const mensajeError = document.getElementById("mensajeError");
    const textoError = document.getElementById("textoError");
    const contenidoAdmin = document.getElementById("contenidoAdmin");

    const totalReservaciones = document.getElementById("totalReservaciones");
    const totalPendientes = document.getElementById("totalPendientes");
    const totalConfirmadas = document.getElementById("totalConfirmadas");
    const totalCanceladas = document.getElementById("totalCanceladas");
    const totalFinalizadas = document.getElementById("totalFinalizadas");

    const buscarReservacion = document.getElementById("buscarReservacion");
    const filtroEstado = document.getElementById("filtroEstado");

    const tablaReservaciones = document.getElementById("tablaReservaciones");
    const sinResultados = document.getElementById("sinResultados");
    const textoResultados = document.getElementById("textoResultados");

    const btnActualizar = document.getElementById("btnActualizar");
    const btnReintentar = document.getElementById("btnReintentar");

    const modalReservacion = document.getElementById("modalReservacion");
    const btnCerrarModal = document.getElementById("btnCerrarModal");
    const btnCancelarModal = document.getElementById("btnCancelarModal");

    const formEstadoReservacion = document.getElementById("formEstadoReservacion");
    const nuevoEstado = document.getElementById("nuevoEstado");
    const btnGuardarEstado = document.getElementById("btnGuardarEstado");
    const mensajeModal = document.getElementById("mensajeModal");


    /* =====================================================
       UTILIDADES
    ===================================================== */

    function mostrarCarga(mostrar) {

        estadoCarga.hidden = !mostrar;

        if (mostrar) {
            mensajeError.hidden = true;
        }
    }


    function mostrarError(mensaje) {

        mostrarCarga(false);

        mensajeError.hidden = false;
        textoError.textContent = mensaje;

        contenidoAdmin.hidden = true;
    }


    function mostrarContenido() {

        mensajeError.hidden = true;
        estadoCarga.hidden = true;
        contenidoAdmin.hidden = false;
    }


    function obtenerFecha(fecha) {

        if (!fecha) return "—";

        const partes = String(fecha).split("-");

        if (partes.length !== 3) {
            return fecha;
        }

        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }


    function obtenerHora(hora) {

        if (!hora) return "—";

        const partes = String(hora).split(":");

        if (partes.length < 2) {
            return hora;
        }

        let horas = Number(partes[0]);
        const minutos = partes[1];

        const periodo = horas >= 12 ? "p. m." : "a. m.";

        horas = horas % 12 || 12;

        return `${horas}:${minutos} ${periodo}`;
    }


    function obtenerClaseEstado(estado) {

        const clases = {
            "Pendiente": "estado-pendiente",
            "Confirmada": "estado-confirmada",
            "Cancelada": "estado-cancelada",
            "Finalizada": "estado-finalizada"
        };

        return clases[estado] || "";
    }


    function crearCelda(texto, clase = "") {

        const celda = document.createElement("td");

        celda.textContent = texto ?? "—";

        if (clase) {
            celda.className = clase;
        }

        return celda;
    }


    /* =====================================================
       VERIFICAR SESIÓN Y PERMISOS
    ===================================================== */

    async function verificarAdministrador() {

        mostrarCarga(true);

        try {

            const respuesta = await fetch(
                `${API_SESION}?_=${Date.now()}`,
                {
                    method: "GET",
                    credentials: "same-origin",
                    cache: "no-store",
                    headers: {
                        "Accept": "application/json"
                    }
                }
            );

            if (!respuesta.ok) {
                throw new Error("No se pudo comprobar la sesión.");
            }

            const datos = await respuesta.json();


            // Sin sesión iniciada.

            if (!datos.sesion_activa || !datos.usuario) {

                alert("Debes iniciar sesión para acceder a esta sección.");

                window.location.replace(
                    "../../Inicio_sesion/login.html"
                );

                return false;
            }


            // Cambio obligatorio de contraseña.

            if (datos.requiere_cambio_password) {

                window.location.replace(
                    "../../Mi_cuenta/cambiar_password.html"
                );

                return false;
            }


            // Comprobar rol.

            if (datos.usuario.rol !== "Administrador") {

                alert("No tienes permisos para administrar reservaciones.");

                window.location.replace(
                    "../../pup_lorena.html"
                );

                return false;
            }

            return true;

        } catch (error) {

            console.error("Error al verificar permisos:", error);

            mostrarError(
                "No fue posible comprobar tu sesión. Recarga la página e inténtalo nuevamente."
            );

            return false;
        }
    }


    /* =====================================================
       OBTENER RESERVACIONES
    ===================================================== */

    async function cargarReservaciones() {

        mostrarCarga(true);

        if (btnActualizar) {
            btnActualizar.disabled = true;
        }

        try {

            const respuesta = await fetch(
                `${API_RESERVACIONES}?_=${Date.now()}`,
                {
                    method: "GET",
                    credentials: "same-origin",
                    cache: "no-store",
                    headers: {
                        "Accept": "application/json"
                    }
                }
            );

            const datos = await respuesta.json();

            if (!respuesta.ok || !datos.exito) {

                throw new Error(
                    datos.mensaje || "No se pudieron obtener las reservaciones."
                );
            }

            reservaciones = Array.isArray(datos.reservaciones)
                ? datos.reservaciones
                : [];

            actualizarContadores();
            aplicarFiltros();
            mostrarContenido();

        } catch (error) {

            console.error("Error al cargar reservaciones:", error);

            mostrarError(error.message);

        } finally {

            if (btnActualizar) {
                btnActualizar.disabled = false;
            }
        }
    }


    /* =====================================================
       ACTUALIZAR CONTADORES
    ===================================================== */

    function actualizarContadores() {

        totalReservaciones.textContent = reservaciones.length;

        totalPendientes.textContent =
            reservaciones.filter(r => r.estado === "Pendiente").length;

        totalConfirmadas.textContent =
            reservaciones.filter(r => r.estado === "Confirmada").length;

        totalCanceladas.textContent =
            reservaciones.filter(r => r.estado === "Cancelada").length;

        totalFinalizadas.textContent =
            reservaciones.filter(r => r.estado === "Finalizada").length;
    }


    /* =====================================================
       APLICAR BÚSQUEDA Y FILTROS
    ===================================================== */

    function aplicarFiltros() {

        const busqueda = buscarReservacion.value
            .trim()
            .toLowerCase();

        const estado = filtroEstado.value;

        const filtradas = reservaciones.filter(reservacion => {

            const coincideEstado =
                estado === "Todos" || reservacion.estado === estado;

            const coincideBusqueda = [

                reservacion.id_reservacion,
                reservacion.usuario,
                reservacion.correo

            ].some(valor =>
                String(valor ?? "").toLowerCase().includes(busqueda)
            );

            return coincideEstado && coincideBusqueda;
        });

        renderizarTabla(filtradas);
    }


    /* =====================================================
       CONSTRUIR TABLA
    ===================================================== */

    function renderizarTabla(lista) {

        tablaReservaciones.replaceChildren();

        textoResultados.textContent =
            `Mostrando ${lista.length} de ${reservaciones.length} reservaciones`;

        sinResultados.hidden = lista.length !== 0;

        lista.forEach(reservacion => {

            const fila = document.createElement("tr");

            fila.appendChild(
                crearCelda(`#${reservacion.id_reservacion}`)
            );

            fila.appendChild(
                crearCelda(
                    reservacion.usuario || "Cliente no registrado",
                    "admin-res-cliente"
                )
            );

            fila.appendChild(
                crearCelda(
                    reservacion.correo || "No disponible",
                    "admin-res-correo"
                )
            );

            fila.appendChild(
                crearCelda(obtenerFecha(reservacion.fecha))
            );

            fila.appendChild(
                crearCelda(obtenerHora(reservacion.hora))
            );

            fila.appendChild(
                crearCelda(String(reservacion.cantidad_personas ?? "—"))
            );

            fila.appendChild(
                crearCelda(
                    reservacion.ninos === "si" ? "Sí" : "No"
                )
            );


            // Estado.

            const celdaEstado = document.createElement("td");

            const etiqueta = document.createElement("span");

            etiqueta.className =
                `admin-res-estado ${obtenerClaseEstado(reservacion.estado)}`;

            etiqueta.textContent = reservacion.estado;

            celdaEstado.appendChild(etiqueta);

            fila.appendChild(celdaEstado);


            // Acción gestionar.

            const celdaAcciones = document.createElement("td");

            celdaAcciones.className = "admin-res-acciones";

            const boton = document.createElement("button");

            boton.type = "button";

            boton.className = "admin-res-boton-gestionar";

            boton.innerHTML =
                '<i class="bi bi-pencil-square" aria-hidden="true"></i> Gestionar';

            boton.addEventListener("click", () => {
                abrirModal(reservacion);
            });

            celdaAcciones.appendChild(boton);

            fila.appendChild(celdaAcciones);

            tablaReservaciones.appendChild(fila);
        });
    }


    /* =====================================================
       ABRIR MODAL
    ===================================================== */

    function abrirModal(reservacion) {

        reservacionSeleccionada = reservacion;

        document.getElementById("detalleId").textContent =
            `#${reservacion.id_reservacion}`;

        document.getElementById("detalleCliente").textContent =
            reservacion.usuario || "Cliente no registrado";

        document.getElementById("detalleCorreo").textContent =
            reservacion.correo || "No disponible";

        document.getElementById("detalleFecha").textContent =
            obtenerFecha(reservacion.fecha);

        document.getElementById("detalleHora").textContent =
            obtenerHora(reservacion.hora);

        document.getElementById("detallePersonas").textContent =
            reservacion.cantidad_personas ?? "—";

        document.getElementById("detalleNinos").textContent =
            reservacion.ninos === "si" ? "Sí" : "No";

        document.getElementById("detalleObservaciones").textContent =
            reservacion.observaciones || "Sin observaciones";

        document.getElementById("detalleEstadoActual").textContent =
            reservacion.estado;

        nuevoEstado.value = reservacion.estado;

        mensajeModal.hidden = true;
        mensajeModal.textContent = "";

        modalReservacion.hidden = false;

        document.body.style.overflow = "hidden";

        btnCerrarModal.focus();
    }


    /* =====================================================
       CERRAR MODAL
    ===================================================== */

    function cerrarModal() {

        if (guardandoEstado) return;

        modalReservacion.hidden = true;

        document.body.style.overflow = "";

        reservacionSeleccionada = null;

        formEstadoReservacion.reset();

        mensajeModal.hidden = true;
        mensajeModal.textContent = "";
    }


    /* =====================================================
       MOSTRAR MENSAJE DEL MODAL
    ===================================================== */

    function mostrarMensajeModal(mensaje) {

        mensajeModal.textContent = mensaje;
        mensajeModal.hidden = false;
    }


    /* =====================================================
       GUARDAR NUEVO ESTADO
    ===================================================== */

    async function guardarEstado(evento) {

        evento.preventDefault();

        if (guardandoEstado || !reservacionSeleccionada) {
            return;
        }

        const estadoAnterior = reservacionSeleccionada.estado;
        const estadoNuevo = nuevoEstado.value;

        if (estadoAnterior === estadoNuevo) {

            mostrarMensajeModal(
                "No has seleccionado un estado diferente."
            );

            return;
        }


        // Confirmación obligatoria.

        const confirmar = window.confirm(
            `¿Estás seguro de cambiar el estado de la reservación #${reservacionSeleccionada.id_reservacion}?\n\n` +
            `Estado actual: ${estadoAnterior}\n` +
            `Nuevo estado: ${estadoNuevo}`
        );

        if (!confirmar) {
            return;
        }


        guardandoEstado = true;

        btnGuardarEstado.disabled = true;
        btnCancelarModal.disabled = true;
        btnCerrarModal.disabled = true;

        btnGuardarEstado.innerHTML =
            '<i class="bi bi-hourglass-split"></i> Guardando...';

        mensajeModal.hidden = true;


        try {

            const respuesta = await fetch(
                `${API_RESERVACIONES}?_=${Date.now()}`,
                {
                    method: "POST",
                    credentials: "same-origin",
                    cache: "no-store",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    body: JSON.stringify({
                        accion: "cambiar_estado",
                        id_reservacion: reservacionSeleccionada.id_reservacion,
                        nuevo_estado: estadoNuevo
                    })
                }
            );

            const datos = await respuesta.json();

            if (!respuesta.ok || !datos.exito) {

                throw new Error(
                    datos.mensaje || "No se pudo actualizar el estado."
                );
            }


            // Actualizar los datos locales.

            reservacionSeleccionada.estado = estadoNuevo;

            cerrarModal();

            actualizarContadores();

            aplicarFiltros();

            alert(
                datos.mensaje || "El estado de la reservación se actualizó correctamente."
            );


        } catch (error) {

            console.error("Error al actualizar reservación:", error);

            mostrarMensajeModal(error.message);

        } finally {

            guardandoEstado = false;

            btnGuardarEstado.disabled = false;
            btnCancelarModal.disabled = false;
            btnCerrarModal.disabled = false;

            btnGuardarEstado.innerHTML =
                '<i class="bi bi-check-lg"></i> Guardar cambios';
        }
    }


    /* =====================================================
       EVENTOS
    ===================================================== */

    buscarReservacion.addEventListener("input", aplicarFiltros);

    filtroEstado.addEventListener("change", aplicarFiltros);

    btnActualizar.addEventListener("click", cargarReservaciones);

    btnReintentar.addEventListener("click", cargarReservaciones);

    btnCerrarModal.addEventListener("click", cerrarModal);

    btnCancelarModal.addEventListener("click", cerrarModal);

    formEstadoReservacion.addEventListener(
        "submit",
        guardarEstado
    );


    // Cerrar al pulsar fuera de la ventana.

    modalReservacion.addEventListener("click", evento => {

        if (evento.target === modalReservacion) {
            cerrarModal();
        }
    });


    // Cerrar con Escape.

    document.addEventListener("keydown", evento => {

        if (
            evento.key === "Escape" &&
            !modalReservacion.hidden
        ) {
            cerrarModal();
        }
    });


    /* =====================================================
       INICIAR MÓDULO
    ===================================================== */

    async function iniciarModulo() {

        const autorizado = await verificarAdministrador();

        if (!autorizado) {
            return;
        }

        await cargarReservaciones();
    }

    iniciarModulo();

});
