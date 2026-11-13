
document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    // =====================================================
    // 1. CONFIGURACIÓN Y ELEMENTOS
    // =====================================================

    const URL_SESION = "../../../api/sesion.php";
    const URL_VENTAS = "../../../api/administracion_ventas.php";

    const paginaLogin = "../../../inicio sesion/login.html";
    const paginaCambioPassword = "../../../inicio sesion/cambiar_password.html";
    const paginaPrincipal = "../../pup_lorena.html";

    const elemento = (id) => document.getElementById(id);

    const mensajeCarga = elemento("mensajeCarga");
    const alertaError = elemento("alertaError");
    const textoError = elemento("textoError");
    const btnReintentar = elemento("btnReintentar");
    const contenidoVentas = elemento("contenidoVentas");

    const totalFacturas = elemento("totalFacturas");
    const totalPendientes = elemento("totalPendientes");
    const totalPagadas = elemento("totalPagadas");
    const totalAnuladas = elemento("totalAnuladas");

    const buscadorVentas = elemento("buscadorVentas");
    const filtroEstado = elemento("filtroEstado");
    const textoResultados = elemento("textoResultados");
    const tablaVentas = elemento("tablaVentas");
    const sinResultados = elemento("sinResultados");

    const btnActualizar = elemento("btnActualizar");

    const modalDetalleVenta = elemento("modalDetalleVenta");
    const cerrarModalVenta = elemento("cerrarModalVenta");
    const cancelarModalVenta = elemento("cancelarModalVenta");

    const detalleIdFactura = elemento("detalleIdFactura");
    const detalleFecha = elemento("detalleFecha");
    const detalleCliente = elemento("detalleCliente");
    const detalleCorreo = elemento("detalleCorreo");
    const detalleMetodoPago = elemento("detalleMetodoPago");
    const detalleCanal = elemento("detalleCanal");
    const detalleEstado = elemento("detalleEstado");

    const tablaDetalleProductos = elemento("tablaDetalleProductos");

    const detalleSubtotal = elemento("detalleSubtotal");
    const detalleImpuesto = elemento("detalleImpuesto");
    const detalleTotal = elemento("detalleTotal");

    const nuevoEstado = elemento("nuevoEstado");
    const btnGuardarEstado = elemento("btnGuardarEstado");
    const mensajeModalVenta = elemento("mensajeModalVenta");

    // =====================================================
    // 2. ESTADO DEL MÓDULO
    // =====================================================

    let facturas = [];
    let facturaSeleccionada = null;
    let tokenCsrf = "";

    // =====================================================
    // 3. FUNCIONES GENERALES
    // =====================================================

    function mostrarError(mensaje) {
        textoError.textContent = mensaje;
        alertaError.hidden = false;
        mensajeCarga.hidden = true;
        contenidoVentas.hidden = true;
    }

    function ocultarError() {
        alertaError.hidden = true;
        textoError.textContent = "";
    }

    function mostrarMensajeModal(mensaje, tipo = "error") {
        mensajeModalVenta.textContent = mensaje;

        mensajeModalVenta.classList.remove(
            "mensaje-exito",
            "mensaje-error"
        );

        mensajeModalVenta.classList.add(
            tipo === "exito" ? "mensaje-exito" : "mensaje-error"
        );

        mensajeModalVenta.hidden = false;
    }

    function limpiarMensajeModal() {
        mensajeModalVenta.textContent = "";

        mensajeModalVenta.classList.remove(
            "mensaje-exito",
            "mensaje-error"
        );

        mensajeModalVenta.hidden = true;
    }

    function establecerCargaBoton(ocupado) {
        btnGuardarEstado.disabled = ocupado || !facturaSeleccionada;
        btnActualizar.disabled = ocupado;
    }

    function formatearMoneda(valor) {
        const numero = Number(valor);

        if (!Number.isFinite(numero)) {
            return "C$ 0.00";
        }

        return numero.toLocaleString("es-NI", {
            style: "currency",
            currency: "NIO",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
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
    // 5. CONSULTAR FACTURAS
    // =====================================================

    async function cargarVentas() {
        mensajeCarga.hidden = false;
        alertaError.hidden = true;
        contenidoVentas.hidden = true;

        try {
            const response = await fetch(URL_VENTAS, {
                method: "GET",
                credentials: "same-origin",
                cache: "no-store",
                headers: {
                    "Accept": "application/json"
                }
            });

            const datos = await leerRespuesta(response);

            if (!Array.isArray(datos.facturas)) {
                throw new Error(
                    "La lista de facturas recibida no tiene un formato válido."
                );
            }

            facturas = datos.facturas;

            actualizarContadores();
            aplicarFiltros();

            mensajeCarga.hidden = true;
            contenidoVentas.hidden = false;

        } catch (error) {
            mostrarError(error.message);
        }
    }

    // =====================================================
    // 6. CONTADORES
    // =====================================================

    function actualizarContadores() {
        const pendientes = facturas.filter(
            factura => factura.estado === "Pendiente"
        ).length;

        const pagadas = facturas.filter(
            factura => factura.estado === "Pagado"
        ).length;

        const anuladas = facturas.filter(
            factura => factura.estado === "Anulado"
        ).length;

        totalFacturas.textContent = facturas.length;
        totalPendientes.textContent = pendientes;
        totalPagadas.textContent = pagadas;
        totalAnuladas.textContent = anuladas;
    }

    // =====================================================
    // 7. CREAR ELEMENTOS DE LA TABLA
    // =====================================================

    function crearCelda(texto) {
        const celda = document.createElement("td");
        celda.textContent = texto ?? "No disponible";
        return celda;
    }

    function crearEtiquetaEstado(estado) {
        const etiqueta = document.createElement("span");

        etiqueta.className = "etiqueta-estado";
        etiqueta.textContent = estado || "No disponible";

        if (estado === "Pagado") {
            etiqueta.classList.add("estado-pagado");
        } else if (estado === "Anulado") {
            etiqueta.classList.add("estado-anulado");
        } else {
            etiqueta.classList.add("estado-pendiente");
        }

        return etiqueta;
    }

    function crearFilaFactura(factura) {
        const fila = document.createElement("tr");

        fila.appendChild(
            crearCelda(`#${factura.id_factura}`)
        );

        fila.appendChild(
            crearCelda(formatearFecha(factura.fecha))
        );

        fila.appendChild(
            crearCelda(factura.cliente || "Compra como visitante")
        );

        fila.appendChild(
            crearCelda(factura.metodo_pago || "No especificado")
        );

        fila.appendChild(
            crearCelda(factura.canal_venta || "No disponible")
        );

        fila.appendChild(
            crearCelda(formatearMoneda(factura.total))
        );

        const celdaEstado = document.createElement("td");

        celdaEstado.appendChild(
            crearEtiquetaEstado(factura.estado)
        );

        fila.appendChild(celdaEstado);

        const celdaAcciones = document.createElement("td");
        const botonDetalles = document.createElement("button");

        botonDetalles.type = "button";
        botonDetalles.className = "boton-gestionar";
        botonDetalles.textContent = "Ver detalles";

        botonDetalles.addEventListener("click", () => {
            abrirModalVenta(factura);
        });

        celdaAcciones.appendChild(botonDetalles);
        fila.appendChild(celdaAcciones);

        return fila;
    }

    // =====================================================
    // 8. BUSCADOR Y FILTRO
    // =====================================================

    function aplicarFiltros() {
        const busqueda = buscadorVentas.value
            .trim()
            .toLowerCase();

        const estadoSeleccionado = filtroEstado.value;

        const filtradas = facturas.filter(factura => {
            const coincideBusqueda =
                String(factura.id_factura).includes(busqueda) ||
                String(factura.cliente || "")
                    .toLowerCase()
                    .includes(busqueda) ||
                String(factura.correo_cliente || "")
                    .toLowerCase()
                    .includes(busqueda);

            const coincideEstado =
                !estadoSeleccionado ||
                factura.estado === estadoSeleccionado;

            return coincideBusqueda && coincideEstado;
        });

        tablaVentas.replaceChildren();

        filtradas.forEach(factura => {
            tablaVentas.appendChild(
                crearFilaFactura(factura)
            );
        });

        textoResultados.textContent =
            `Mostrando ${filtradas.length} de ${facturas.length} facturas`;

        sinResultados.hidden = filtradas.length !== 0;
    }

    buscadorVentas.addEventListener("input", aplicarFiltros);
    filtroEstado.addEventListener("change", aplicarFiltros);

    // =====================================================
    // 9. ABRIR MODAL DE DETALLES
    // =====================================================

    function abrirModalVenta(factura) {
        facturaSeleccionada = factura;

        limpiarMensajeModal();

        detalleIdFactura.textContent = `#${factura.id_factura}`;
        detalleFecha.textContent = formatearFecha(factura.fecha);
        detalleCliente.textContent =
            factura.cliente || "Compra como visitante";

        detalleCorreo.textContent =
            factura.correo_cliente || "No registrado";

        detalleMetodoPago.textContent =
            factura.metodo_pago || "No especificado";

        detalleCanal.textContent =
            factura.canal_venta || "No disponible";

        detalleEstado.replaceChildren(
            crearEtiquetaEstado(factura.estado)
        );

        detalleSubtotal.textContent =
            formatearMoneda(factura.subtotal);

        detalleImpuesto.textContent =
            formatearMoneda(factura.impuesto);

        detalleTotal.textContent =
            formatearMoneda(factura.total);

        nuevoEstado.value = factura.estado;

        cargarDetallesProductos(factura.detalles);

        establecerCargaBoton(false);

        modalDetalleVenta.hidden = false;
    }

    // =====================================================
    // 10. MOSTRAR PRODUCTOS DE LA FACTURA
    // =====================================================

    function cargarDetallesProductos(detalles) {
        tablaDetalleProductos.replaceChildren();

        if (!Array.isArray(detalles) || detalles.length === 0) {
            const fila = document.createElement("tr");
            const celda = document.createElement("td");

            celda.colSpan = 4;
            celda.textContent = "Esta factura no contiene detalles.";

            fila.appendChild(celda);
            tablaDetalleProductos.appendChild(fila);

            return;
        }

        detalles.forEach(producto => {
            const fila = document.createElement("tr");

            fila.appendChild(
                crearCelda(
                    producto.nombre_producto || "Producto no disponible"
                )
            );

            fila.appendChild(
                crearCelda(producto.cantidad)
            );

            fila.appendChild(
                crearCelda(
                    formatearMoneda(producto.precio_unitario)
                )
            );

            fila.appendChild(
                crearCelda(
                    formatearMoneda(producto.subtotal)
                )
            );

            tablaDetalleProductos.appendChild(fila);
        });
    }

    // =====================================================
    // 11. CERRAR MODAL
    // =====================================================

    function cerrarModal() {
        modalDetalleVenta.hidden = true;
        facturaSeleccionada = null;
        limpiarMensajeModal();
    }

    cerrarModalVenta.addEventListener("click", cerrarModal);
    cancelarModalVenta.addEventListener("click", cerrarModal);

    modalDetalleVenta.addEventListener("click", evento => {
        if (evento.target === modalDetalleVenta) {
            cerrarModal();
        }
    });

    // =====================================================
    // 12. ENVIAR CAMBIO DE ESTADO A LA API
    // =====================================================

    async function enviarAccion(datos) {
        const response = await fetch(URL_VENTAS, {
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
    // 13. GUARDAR NUEVO ESTADO
    // =====================================================

    btnGuardarEstado.addEventListener("click", async () => {
        if (!facturaSeleccionada) {
            return;
        }

        const estadoSeleccionado = nuevoEstado.value;

        const estadosPermitidos = [
            "Pendiente",
            "Pagado",
            "Anulado"
        ];

        if (!estadosPermitidos.includes(estadoSeleccionado)) {
            mostrarMensajeModal(
                "El estado seleccionado no es válido."
            );
            return;
        }

        if (estadoSeleccionado === facturaSeleccionada.estado) {
            mostrarMensajeModal(
                "La factura ya tiene el estado seleccionado.",
                "exito"
            );
            return;
        }

        const confirmado = window.confirm(
            `¿Deseas cambiar el estado de la factura #${facturaSeleccionada.id_factura} a "${estadoSeleccionado}"?`
        );

        if (!confirmado) {
            return;
        }

        establecerCargaBoton(true);
        btnGuardarEstado.textContent = "Guardando...";

        try {
            const datos = await enviarAccion({
                accion: "cambiar_estado",
                id_factura: facturaSeleccionada.id_factura,
                nuevo_estado: estadoSeleccionado
            });

            mostrarMensajeModal(
                datos.mensaje || "El estado se actualizó correctamente.",
                "exito"
            );

            const idActualizado = Number(datos.id_factura);

            const facturaActualizada = facturas.find(
                factura => Number(factura.id_factura) === idActualizado
            );

            if (facturaActualizada) {
                facturaActualizada.estado = datos.estado;
                facturaSeleccionada = facturaActualizada;
            }

            actualizarContadores();
            aplicarFiltros();

            detalleEstado.replaceChildren(
                crearEtiquetaEstado(datos.estado)
            );

            nuevoEstado.value = datos.estado;

        } catch (error) {
            mostrarMensajeModal(error.message);

        } finally {
            btnGuardarEstado.textContent = "Guardar estado";
            establecerCargaBoton(false);
        }
    });

    // =====================================================
    // 14. ACTUALIZAR FACTURAS
    // =====================================================

    btnActualizar.addEventListener("click", async () => {
        await cargarVentas();
    });

    // =====================================================
    // 15. REINTENTAR CARGA
    // =====================================================

    btnReintentar.addEventListener("click", async () => {
        ocultarError();
        await cargarVentas();
    });

    // =====================================================
    // 16. TECLA ESCAPE
    // =====================================================

    document.addEventListener("keydown", evento => {
        if (
            evento.key === "Escape" &&
            !modalDetalleVenta.hidden
        ) {
            cerrarModal();
        }
    });

    // =====================================================
    // 17. INICIAR MÓDULO
    // =====================================================

    async function iniciarModulo() {
        try {
            const autorizado = await verificarAdministrador();

            if (!autorizado) {
                return;
            }

            await cargarVentas();

        } catch (error) {
            mostrarError(error.message);
        }
    }

    iniciarModulo();
});
