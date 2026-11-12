
document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    // =====================================================
    // 1. CONFIGURACIÓN Y ELEMENTOS
    // =====================================================

    const URL_SESION = "../../../api/sesion.php";
    const URL_PRODUCTOS = "../../../api/administracion_productos.php";

    const paginaLogin = "../../../inicio sesion/login.html";
    const paginaCambioPassword = "../../../inicio sesion/cambiar_password.html";
    const paginaPrincipal = "../../pup_lorena.html";

    const elemento = (id) => document.getElementById(id);

    const mensajeCarga = elemento("mensajeCarga");
    const alertaError = elemento("alertaError");
    const textoError = elemento("textoError");
    const btnReintentar = elemento("btnReintentar");
    const contenidoProductos = elemento("contenidoProductos");

    const totalProductos = elemento("totalProductos");
    const totalDisponibles = elemento("totalDisponibles");
    const totalInactivos = elemento("totalInactivos");

    const btnActualizar = elemento("btnActualizar");
    const btnNuevoProducto = elemento("btnNuevoProducto");

    const buscadorProductos = elemento("buscadorProductos");
    const filtroCategoria = elemento("filtroCategoria");
    const filtroDisponibilidad = elemento("filtroDisponibilidad");
    const textoResultados = elemento("textoResultados");
    const tablaProductos = elemento("tablaProductos");
    const sinResultados = elemento("sinResultados");

    const modalProducto = elemento("modalProducto");
    const tituloModalProducto = elemento("tituloModalProducto");
    const descripcionModalProducto = elemento("descripcionModalProducto");
    const cerrarModalProducto = elemento("cerrarModalProducto");

    const formularioProducto = elemento("formularioProducto");
    const idProducto = elemento("idProducto");
    const nombreProducto = elemento("nombreProducto");
    const descripcionProducto = elemento("descripcionProducto");
    const precioProducto = elemento("precioProducto");
    const categoriaProducto = elemento("categoriaProducto");
    const proveedorProducto = elemento("proveedorProducto");

    const mensajeFormularioProducto = elemento("mensajeFormularioProducto");
    const cancelarModalProducto = elemento("cancelarModalProducto");
    const btnGuardarProducto = elemento("btnGuardarProducto");

    // =====================================================
    // 2. ESTADO DEL MÓDULO
    // =====================================================

    let productos = [];
    let proveedores = [];
    let tokenCsrf = "";
    let productoSeleccionado = null;
    let guardando = false;

    // =====================================================
    // 3. FUNCIONES GENERALES
    // =====================================================

    function mostrarError(mensaje) {
        textoError.textContent = mensaje;
        alertaError.hidden = false;
        mensajeCarga.hidden = true;
        contenidoProductos.hidden = true;
    }

    function ocultarError() {
        alertaError.hidden = true;
        textoError.textContent = "";
    }

    function mostrarMensajeFormulario(mensaje, tipo = "error") {
        mensajeFormularioProducto.textContent = mensaje;

        mensajeFormularioProducto.classList.remove(
            "mensaje-exito",
            "mensaje-error"
        );

        mensajeFormularioProducto.classList.add(
            tipo === "exito" ? "mensaje-exito" : "mensaje-error"
        );

        mensajeFormularioProducto.hidden = false;
    }

    function limpiarMensajeFormulario() {
        mensajeFormularioProducto.textContent = "";

        mensajeFormularioProducto.classList.remove(
            "mensaje-exito",
            "mensaje-error"
        );

        mensajeFormularioProducto.hidden = true;
    }

    function establecerEstadoGuardado(ocupado) {
        guardando = ocupado;
        btnGuardarProducto.disabled = ocupado;
        cancelarModalProducto.disabled = ocupado;
        cerrarModalProducto.disabled = ocupado;

        btnGuardarProducto.textContent = ocupado
            ? "Guardando..."
            : "Guardar producto";
    }

    async function leerRespuesta(response) {
        let datos;

        try {
            datos = await response.json();
        } catch {
            throw new Error(
                "El servidor devolvió una respuesta no válida."
            );
        }

        if (!response.ok || !datos.exito) {
            throw new Error(
                datos.mensaje || "No fue posible completar la solicitud."
            );
        }

        return datos;
    }

    function formatearPrecio(precio) {
        const numero = Number(precio);

        if (!Number.isFinite(numero)) {
            return "No disponible";
        }

        return numero.toLocaleString("es-NI", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
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

        tokenCsrf = datos.token_csrf || "";

        if (!/^[a-f0-9]{64}$/i.test(tokenCsrf)) {
            throw new Error(
                "No se pudo obtener un token de seguridad válido. Recarga la página."
            );
        }

        return true;
    }

    // =====================================================
    // 5. CARGAR PRODUCTOS Y PROVEEDORES
    // =====================================================

    async function cargarProductos() {
        mensajeCarga.hidden = false;
        alertaError.hidden = true;
        contenidoProductos.hidden = true;

        try {
            const response = await fetch(URL_PRODUCTOS, {
                method: "GET",
                credentials: "same-origin",
                cache: "no-store",
                headers: {
                    "Accept": "application/json"
                }
            });

            const datos = await leerRespuesta(response);

            if (!Array.isArray(datos.productos)) {
                throw new Error(
                    "La lista de productos recibida no tiene un formato válido."
                );
            }

            if (!Array.isArray(datos.proveedores)) {
                throw new Error(
                    "La lista de proveedores recibida no tiene un formato válido."
                );
            }

            productos = datos.productos;
            proveedores = datos.proveedores;

            actualizarContadores(datos);
            cargarOpcionesProveedores();
            aplicarFiltros();

            mensajeCarga.hidden = true;
            contenidoProductos.hidden = false;

        } catch (error) {
            mostrarError(error.message);
        }
    }

    // =====================================================
    // 6. CONTADORES
    // =====================================================

    function actualizarContadores(datos) {
        totalProductos.textContent = datos.total ?? productos.length;

        totalDisponibles.textContent =
            datos.disponibles ??
            productos.filter(producto => producto.disponible).length;

        totalInactivos.textContent =
            datos.inactivos ??
            productos.filter(producto => !producto.disponible).length;
    }

    // =====================================================
    // 7. CARGAR PROVEEDORES EN EL SELECT
    // =====================================================

    function cargarOpcionesProveedores() {
        const proveedorSeleccionado = proveedorProducto.value;

        proveedorProducto.replaceChildren();

        const opcionVacia = document.createElement("option");
        opcionVacia.value = "";
        opcionVacia.textContent = "Sin proveedor";
        proveedorProducto.appendChild(opcionVacia);

        proveedores.forEach(proveedor => {
            const opcion = document.createElement("option");

            opcion.value = proveedor.id_proveedor;
            opcion.textContent = proveedor.nombre_empresa;

            proveedorProducto.appendChild(opcion);
        });

        if (
            proveedorSeleccionado &&
            proveedores.some(
                proveedor =>
                    String(proveedor.id_proveedor) === proveedorSeleccionado
            )
        ) {
            proveedorProducto.value = proveedorSeleccionado;
        }
    }


    // =====================================================
    // 7.1. CARGAR CATEGORÍAS EN EL FILTRO
    // =====================================================

    function cargarOpcionesCategorias() {
        const categoriaSeleccionada = filtroCategoria.value;

        filtroCategoria.replaceChildren();

        const opcionTodas = document.createElement("option");
        opcionTodas.value = "";
        opcionTodas.textContent = "Todas las categorías";
        filtroCategoria.appendChild(opcionTodas);

        const categoriasBase = [
            "Combos",
            "Pupusas",
            "Postres",
            "Bebidas"
        ];

        const categoriasExistentes = productos
            .map(producto => String(producto.categoria || "").trim())
            .filter(Boolean);

        const categorias = [
            ...new Set([...categoriasBase, ...categoriasExistentes])
        ].sort((a, b) => {
            return categoriasBase.indexOf(a) - categoriasBase.indexOf(b);
        });

        categorias.forEach(categoria => {
            const opcion = document.createElement("option");
            opcion.value = categoria;
            opcion.textContent = categoria;
            filtroCategoria.appendChild(opcion);
        });

        if (categorias.includes(categoriaSeleccionada)) {
            filtroCategoria.value = categoriaSeleccionada;
        }
    }


    // =====================================================
    // 8. CREAR ELEMENTOS DE LA TABLA
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

    function crearFilaProducto(producto) {
        const fila = document.createElement("tr");

        fila.appendChild(crearCelda(producto.id_producto));

        const celdaNombre = document.createElement("td");

        const nombre = document.createElement("strong");
        nombre.textContent = producto.nombre || "Sin nombre";
        celdaNombre.appendChild(nombre);

        if (producto.descripcion) {
            const descripcion = document.createElement("small");
            descripcion.textContent = producto.descripcion;
            celdaNombre.appendChild(descripcion);
        }

        fila.appendChild(celdaNombre);
        fila.appendChild(crearCelda(producto.categoria));
        fila.appendChild(crearCelda(
            `C$ ${formatearPrecio(producto.precio)}`
        ));
        fila.appendChild(crearCelda(
            producto.proveedor || "Sin proveedor"
        ));

        const celdaEstado = document.createElement("td");

        celdaEstado.appendChild(
            crearEtiqueta(
                producto.disponible ? "Disponible" : "Inactivo",
                producto.disponible
                    ? "etiqueta-estado estado-activo"
                    : "etiqueta-estado estado-inactivo"
            )
        );

        fila.appendChild(celdaEstado);

        const celdaAcciones = document.createElement("td");
        const contenedorAcciones = document.createElement("div");

        contenedorAcciones.className = "admin-prod-acciones";

        const botonEditar = document.createElement("button");
        botonEditar.type = "button";
        botonEditar.className = "admin-prod-boton-editar";
        botonEditar.textContent = "Editar";

        botonEditar.addEventListener("click", () => {
            abrirModalProducto(producto);
        });

        const botonDisponibilidad = document.createElement("button");
        botonDisponibilidad.type = "button";
        botonDisponibilidad.className = producto.disponible
            ? "admin-prod-boton-desactivar"
            : "admin-prod-boton-activar";

        botonDisponibilidad.textContent = producto.disponible
            ? "Desactivar"
            : "Activar";

        botonDisponibilidad.addEventListener("click", () => {
            cambiarDisponibilidad(producto);
        });

        contenedorAcciones.appendChild(botonEditar);
        contenedorAcciones.appendChild(botonDisponibilidad);

        celdaAcciones.appendChild(contenedorAcciones);
        fila.appendChild(celdaAcciones);

        return fila;
    }

    // =====================================================
    // 9. BUSCADOR Y FILTROS
    // =====================================================

    function aplicarFiltros() {
        const busqueda = buscadorProductos.value
            .trim()
            .toLowerCase();

        const categoriaSeleccionada = filtroCategoria.value;
        const disponibilidadSeleccionada = filtroDisponibilidad.value;

        const filtrados = productos.filter(producto => {
            const nombre = String(producto.nombre || "").toLowerCase();
            const descripcion = String(
                producto.descripcion || ""
            ).toLowerCase();

            const proveedor = String(
                producto.proveedor || ""
            ).toLowerCase();

            const coincideBusqueda =
                String(producto.id_producto).includes(busqueda) ||
                nombre.includes(busqueda) ||
                descripcion.includes(busqueda) ||
                proveedor.includes(busqueda);

            const coincideCategoria =
                !categoriaSeleccionada ||
                producto.categoria === categoriaSeleccionada;

            let coincideDisponibilidad = true;

            if (
                disponibilidadSeleccionada === "1" ||
                disponibilidadSeleccionada === "disponible"
            ) {
                coincideDisponibilidad = Boolean(producto.disponible);
            } else if (
                disponibilidadSeleccionada === "0" ||
                disponibilidadSeleccionada === "inactivo"
            ) {
                coincideDisponibilidad = !producto.disponible;
            }

            return coincideBusqueda &&
                coincideCategoria &&
                coincideDisponibilidad;
        });

        tablaProductos.replaceChildren();

        filtrados.forEach(producto => {
            tablaProductos.appendChild(crearFilaProducto(producto));
        });

        textoResultados.textContent =
            `Mostrando ${filtrados.length} de ${productos.length} productos`;

        sinResultados.hidden = filtrados.length !== 0;
    }

    buscadorProductos.addEventListener("input", aplicarFiltros);
    filtroCategoria.addEventListener("change", aplicarFiltros);
    filtroDisponibilidad.addEventListener("change", aplicarFiltros);

    // =====================================================
    // 10. ABRIR Y CERRAR EL MODAL
    // =====================================================

    function abrirModalProducto(producto = null) {
        productoSeleccionado = producto;

        formularioProducto.reset();
        limpiarMensajeFormulario();
        cargarOpcionesProveedores();

        if (producto) {
            tituloModalProducto.textContent = "Editar producto";
            descripcionModalProducto.textContent =
                "Modifica la información del producto seleccionado.";

            idProducto.value = producto.id_producto;
            nombreProducto.value = producto.nombre || "";
            descripcionProducto.value = producto.descripcion || "";
            precioProducto.value = producto.precio ?? "";
            categoriaProducto.value = producto.categoria || "";
            proveedorProducto.value = producto.id_proveedor ?? "";

            btnGuardarProducto.textContent = "Guardar cambios";

        } else {
            tituloModalProducto.textContent = "Nuevo producto";
            descripcionModalProducto.textContent =
                "Completa los datos para registrar un producto.";

            idProducto.value = "";
            proveedorProducto.value = "";

            btnGuardarProducto.textContent = "Guardar producto";
        }

        establecerEstadoGuardado(false);
        modalProducto.hidden = false;
        nombreProducto.focus();
    }

    function cerrarModal() {
        if (guardando) {
            return;
        }

        modalProducto.hidden = true;
        formularioProducto.reset();
        idProducto.value = "";
        productoSeleccionado = null;
        limpiarMensajeFormulario();
    }

    btnNuevoProducto.addEventListener("click", () => {
        abrirModalProducto();
    });

    cerrarModalProducto.addEventListener("click", cerrarModal);
    cancelarModalProducto.addEventListener("click", cerrarModal);

    modalProducto.addEventListener("click", evento => {
        if (evento.target === modalProducto) {
            cerrarModal();
        }
    });

    // =====================================================
    // 11. ENVIAR ACCIONES A LA API
    // =====================================================

    async function enviarAccion(datos) {
        const response = await fetch(URL_PRODUCTOS, {
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
    // 12. VALIDAR DATOS DEL FORMULARIO
    // =====================================================

    function obtenerDatosFormulario() {
        const nombre = nombreProducto.value.trim();
        const descripcion = descripcionProducto.value.trim();
        const precio = precioProducto.value.trim();
        const categoria = categoriaProducto.value.trim();
        const proveedor = proveedorProducto.value;

        if (!nombre) {
            throw new Error("Escribe el nombre del producto.");
        }

        if (nombre.length > 100) {
            throw new Error(
                "El nombre no puede superar los 100 caracteres."
            );
        }

        if (descripcion.length > 255) {
            throw new Error(
                "La descripción no puede superar los 255 caracteres."
            );
        }

        if (precio === "") {
            throw new Error("Escribe el precio del producto.");
        }

        const precioNumerico = Number(precio);

        if (
            !Number.isFinite(precioNumerico) ||
            precioNumerico < 0 ||
            precioNumerico > 99999999.99
        ) {
            throw new Error("El precio ingresado no es válido.");
        }

        if (!categoria) {
            throw new Error("Escribe o selecciona una categoría.");
        }

        if (categoria.length > 50) {
            throw new Error(
                "La categoría no puede superar los 50 caracteres."
            );
        }

        let idProveedor = null;

        if (proveedor !== "") {
            idProveedor = Number(proveedor);

            if (
                !Number.isInteger(idProveedor) ||
                idProveedor <= 0 ||
                !proveedores.some(
                    item => Number(item.id_proveedor) === idProveedor
                )
            ) {
                throw new Error("El proveedor seleccionado no es válido.");
            }
        }

        return {
            nombre,
            descripcion: descripcion || null,
            precio: precioNumerico,
            categoria,
            id_proveedor: idProveedor
        };
    }

    // =====================================================
    // 13. CREAR O EDITAR PRODUCTO
    // =====================================================

    formularioProducto.addEventListener("submit", async evento => {
        evento.preventDefault();

        if (guardando) {
            return;
        }

        try {
            const datosProducto = obtenerDatosFormulario();

            const esEdicion = Boolean(idProducto.value);

            const datosEnviar = {
                accion: esEdicion ? "editar" : "crear",
                ...datosProducto
            };

            if (esEdicion) {
                datosEnviar.id_producto = Number(idProducto.value);
            }

            establecerEstadoGuardado(true);
            limpiarMensajeFormulario();

            const respuesta = await enviarAccion(datosEnviar);

            mostrarMensajeFormulario(
                respuesta.mensaje ||
                    "El producto se guardó correctamente.",
                "exito"
            );

            await cargarProductos();

            cerrarModal();

        } catch (error) {
            mostrarMensajeFormulario(error.message);
        } finally {
            establecerEstadoGuardado(false);
        }
    });

    // =====================================================
    // 14. ACTIVAR O DESACTIVAR PRODUCTO
    // =====================================================

    async function cambiarDisponibilidad(producto) {
        const nuevoEstado = !Boolean(producto.disponible);

        const accionTexto = nuevoEstado
            ? "activar"
            : "desactivar";

        const confirmado = window.confirm(
            `¿Estás seguro de que deseas ${accionTexto} el producto "${producto.nombre}"?`
        );

        if (!confirmado) {
            return;
        }

        try {
            const respuesta = await enviarAccion({
                accion: "cambiar_disponibilidad",
                id_producto: Number(producto.id_producto),
                disponible: nuevoEstado ? 1 : 0
            });

            window.alert(
                respuesta.mensaje ||
                    "La disponibilidad del producto fue actualizada."
            );

            await cargarProductos();

        } catch (error) {
            window.alert(error.message);
        }
    }

    // =====================================================
    // 15. ACTUALIZAR LISTADO
    // =====================================================

    btnActualizar.addEventListener("click", async () => {
        await cargarProductos();
    });

    // =====================================================
    // 16. TECLA ESCAPE
    // =====================================================

    document.addEventListener("keydown", evento => {
        if (evento.key === "Escape" && !modalProducto.hidden) {
            cerrarModal();
        }
    });

    // =====================================================
    // 17. REINTENTAR CARGA
    // =====================================================

    btnReintentar.addEventListener("click", async () => {
        ocultarError();
        await cargarProductos();
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

            await cargarProductos();

        } catch (error) {
            mostrarError(error.message);
        }
    }

    iniciarModulo();
});
