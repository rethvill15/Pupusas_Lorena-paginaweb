
const overlay = document.getElementById("modalOverlay");
const contenido = document.getElementById("modalContenido");

let modalAbierto = false;
let tokenCsrf = null;

const API_BASE = "/Pupusas_paginaweb/api/";

/* =========================================================
   OBTENER Y VALIDAR TOKEN CSRF
   ========================================================= */

async function obtenerTokenCsrf(requiereSesion = false) {

    const respuesta = await fetch(
        API_BASE + "sesion.php",
        {
            method: "GET",
            headers: {
                "Accept": "application/json"
            },
            cache: "no-store",
            credentials: "same-origin"
        }
    );

    const sesion = await respuesta.json();

    if (!respuesta.ok || !sesion.exito) {
        throw new Error("No fue posible verificar la sesión.");
    }

    if (requiereSesion && !sesion.sesion_activa) {
        throw new Error(
            "Para realizar una reservación debes iniciar sesión o crear una cuenta."
        );
    }

    if (sesion.sesion_activa && sesion.requiere_cambio_password) {

        window.location.href =
            "/Pupusas_paginaweb/Pupusa_paginaweb/Mi_cuenta/cambiar_password.html";

        throw new Error(
            "Debes cambiar tu contraseña antes de continuar."
        );
    }

    if (
        typeof sesion.token_csrf !== "string" ||
        !/^[a-f0-9]{64}$/i.test(sesion.token_csrf)
    ) {
        throw new Error(
            "No se recibió un token de seguridad válido."
        );
    }

    tokenCsrf = sesion.token_csrf;

    return {
        token: tokenCsrf,
        sesionActiva: sesion.sesion_activa
    };
}


/* =========================================================
   APERTURA DEL MODAL
   ========================================================= */

async function abrirModal(url, datos = {}) {

    if (!overlay || !contenido) {
        console.error("No existe el modal.");
        return;
    }

    if (modalAbierto) {
        return;
    }

    modalAbierto = true;

    // ==========================================
    // PROTECCIÓN DEL MODAL DE RESERVACIONES
    // ==========================================

    const esReservacion = url.includes("modal_reservacion.html");

    if (esReservacion) {

        try {

            await obtenerTokenCsrf(true);

        } catch (error) {

            console.error(
                "Error verificando la sesión para reservar:",
                error
            );

            modalAbierto = false;

            alert(error.message);

            return;
        }
    }

    overlay.classList.add("active");

    document.body.style.overflow = "hidden";

    contenido.innerHTML = `
        <div class="loading">
            Cargando...
        </div>
    `;

    try {

        const respuesta = await fetch(url);

        if (!respuesta.ok) {
            throw new Error("No se pudo cargar el formulario.");
        }

        const texto = await respuesta.text();

        const parser = new DOMParser();

        const documento =
            parser.parseFromString(texto, "text/html");

        const nuevoContenido =
            documento.querySelector(".modal-ventas") ||
            documento.querySelector(".modal-reservacion");

        if (!nuevoContenido) {
            throw new Error(
                "No se encontró un contenido de modal válido."
            );
        }

        if (typeof obtenerRutaImagen === "function") {

            nuevoContenido.querySelectorAll("img.check-icon").forEach(icono => {

                icono.src = obtenerRutaImagen(
                    "Imagenes/Check_logo.png"
                );

            });

        }

        contenido.innerHTML = "";

        contenido.appendChild(nuevoContenido);

        if (nuevoContenido.classList.contains("modal-ventas")) {

            inicializarFormulario(datos);

        } else if (
            nuevoContenido.classList.contains("modal-reservacion")
        ) {

            inicializarReservacion();

        }

    } catch (error) {

        console.error("Error cargando modal:", error);

        contenido.innerHTML = `
            <div class="loading">
                ${error.message}
            </div>
        `;

    }
}


/* =========================================================
   CIERRE DEL MODAL
   ========================================================= */

function cerrarModal() {

    if (!overlay || !overlay.classList.contains("active")) {
        return;
    }

    overlay.classList.remove("active");

    document.body.style.overflow = "";

    if (document.getElementById("formVentas")) {
        limpiarFormulario();
    }

    if (document.getElementById("formReservacion")) {
        limpiarReservacion();
    }

    modalAbierto = false;

    contenido.innerHTML = "";
}


const botonCerrar = document.getElementById("cerrarModal");

if (botonCerrar) {
    botonCerrar.onclick = cerrarModal;
}

if (overlay) {

    overlay.addEventListener("click", function (e) {

        if (e.target === overlay) {
            cerrarModal();
        }

    });

}

document.addEventListener("keydown", function (e) {

    if (e.key === "Escape") {
        cerrarModal();
    }

});


/* =========================================================
   FORMULARIO DE VENTAS
   ========================================================= */

function inicializarFormulario(datos) {

    const producto = document.getElementById("producto");
    const precio = document.getElementById("precio");
    const cantidad = document.getElementById("cantidad");
    const total = document.getElementById("total");
    const formulario = document.getElementById("formVentas");

    if (!producto || !precio || !cantidad || !total || !formulario) {

        console.error(
            "No se encontraron todos los elementos del formulario."
        );

        return;
    }

    const campos = formulario.querySelectorAll(
        "input, textarea, select"
    );

    campos.forEach(campo => {

        actualizarCheck(campo);

        campo.addEventListener("input", () => {
            actualizarCheck(campo);
        });

        campo.addEventListener("change", () => {
            actualizarCheck(campo);
        });

    });


    const pedidoDesdeCarrito =
        Array.isArray(datos.carrito) &&
        datos.carrito.length > 0;

    if (pedidoDesdeCarrito) {

        cargarPedidoDesdeCarrito(
            datos.carrito,
            producto,
            precio,
            cantidad,
            total
        );

    } else {

        cantidad.oninput = function () {

            cantidad.value = Math.max(
                1,
                parseInt(cantidad.value) || 1
            );

            actualizarTotal();

        };

        if (producto && datos.producto) {
            producto.value = datos.producto;
        }

        if (precio && datos.precio) {
            precio.value = Number(datos.precio).toFixed(2);
        }

        actualizarTotal();

    }


    const cancelar = document.getElementById("cancelar");

    if (cancelar) {
        cancelar.onclick = cerrarModal;
    }


    formulario.onsubmit = async function (e) {

        e.preventDefault();

        const metodoPago = document.getElementById("metodo");

        const botonEnviar = formulario.querySelector(
            'button[type="submit"], input[type="submit"]'
        );


        // =========================================
        // OBTENER CARRITO
        // =========================================

        const carritoVenta =
            Array.isArray(datos.carrito)
                ? datos.carrito
                : [];

        if (carritoVenta.length === 0) {

            alert("El carrito está vacío.");

            return;
        }


        // =========================================
        // PREPARAR PRODUCTOS PARA LA API
        // =========================================

        const productosVenta = carritoVenta.map(item => ({

            id_producto: Number(item.id_producto),

            cantidad: Number(item.cantidad)

        }));


        // =========================================
        // VALIDAR DATOS DEL CARRITO
        // =========================================

        const productoInvalido = productosVenta.some(item =>

            !Number.isInteger(item.id_producto) ||
            item.id_producto <= 0 ||
            !Number.isInteger(item.cantidad) ||
            item.cantidad <= 0

        );

        if (productoInvalido) {

            alert(
                "El carrito contiene un producto con datos inválidos."
            );

            return;
        }


        // =========================================
        // PREPARAR DATOS DE LA VENTA
        // =========================================

        const datosVenta = {

            id_usuario: null,

            metodo_pago: metodoPago
                ? metodoPago.value
                : null,

            productos: productosVenta

        };

        console.log(
            "Datos enviados a ventas.php:",
            datosVenta
        );


        try {

            if (botonEnviar) {
                botonEnviar.disabled = true;
            }


            // =====================================
            // OBTENER TOKEN CSRF
            // =====================================

            // No exigimos sesión aquí:
            // las compras como visitante siguen permitidas.

            const seguridad = await obtenerTokenCsrf(false);


            // =====================================
            // ENVIAR VENTA A LA API
            // =====================================

            const respuesta = await fetch(
                API_BASE + "ventas.php",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                        "X-CSRF-Token": seguridad.token
                    },

                    credentials: "same-origin",
                    cache: "no-store",

                    body: JSON.stringify(datosVenta)
                }
            );


            // =====================================
            // LEER RESPUESTA
            // =====================================

            const resultado = await respuesta.json();


            // =====================================
            // VERIFICAR RESULTADO
            // =====================================

            if (!respuesta.ok || !resultado.exito) {

                throw new Error(
                    resultado.mensaje ||
                    "No se pudo registrar la venta."
                );
            }


            // =====================================
            // VENTA REGISTRADA CORRECTAMENTE
            // =====================================

            alert(
                "Venta registrada correctamente.\n\n" +
                "Factura: #" + resultado.id_factura + "\n" +
                "Subtotal: $" + resultado.subtotal + "\n" +
                "IVA: $" + resultado.impuesto + "\n" +
                "Total: $" + resultado.total
            );


            // =====================================
            // LIMPIAR CARRITO SOLO CON ÉXITO
            // =====================================

            if (typeof vaciarCarrito === "function") {
                vaciarCarrito();
            }

            limpiarFormulario();

            cerrarModal();


        } catch (error) {

            console.error(
                "Error registrando venta:",
                error
            );

            alert(
                "No se pudo registrar la venta.\n\n" +
                error.message
            );


            // Si ocurre un error:
            // - No vaciamos el carrito.
            // - No cerramos el modal.
            // - El usuario puede volver a intentar.

        } finally {

            if (botonEnviar) {
                botonEnviar.disabled = false;
            }

        }

    };

}


/* =========================================================
   CARGAR PEDIDO COMPLETO DESDE EL CARRITO
   ========================================================= */

function cargarPedidoDesdeCarrito(
    carrito,
    producto,
    precio,
    cantidad,
    total
) {

    let subtotal = 0;
    let lineas = "";

    carrito.forEach(item => {

        const importe = item.precio * item.cantidad;

        subtotal += importe;

        lineas +=
            `${item.cantidad}x ${item.nombre} — $${importe.toFixed(2)}\n`;

    });

    const iva = subtotal * 0.15;

    const totalConIva = subtotal + iva;

    producto.value = lineas.trim();

    cantidad.value = carrito.reduce(
        (acumulado, item) => acumulado + item.cantidad,
        0
    );

    cantidad.readOnly = true;

    precio.value = subtotal.toFixed(2);

    total.value = totalConIva.toFixed(2);

}


/* =========================================================
   ACTUALIZAR INDICADOR DE VALIDACIÓN
   ========================================================= */

function actualizarCheck(campo) {

    const contenedor = campo.closest(".input-check");

    if (!contenedor) {
        return;
    }

    const check = contenedor.querySelector(".check-icon");

    if (!check) {
        return;
    }

    if (campo.value.trim() !== "") {

        check.classList.add("visible");

    } else {

        check.classList.remove("visible");

    }

}


/* =========================================================
   ACTUALIZAR TOTAL DEL FORMULARIO
   ========================================================= */

function actualizarTotal() {

    const precioInput =
        document.getElementById("precio");

    const cantidadInput =
        document.getElementById("cantidad");

    const totalInput =
        document.getElementById("total");

    if (!precioInput || !cantidadInput || !totalInput) {
        return;
    }

    const precio = Number(precioInput.value);

    const cantidad = Number(cantidadInput.value);

    if (isNaN(precio) || isNaN(cantidad)) {

        totalInput.value = "";

        return;
    }

    totalInput.value = (precio * cantidad).toFixed(2);

}


/* =========================================================
   LIMPIAR FORMULARIO DE VENTAS
   ========================================================= */

function limpiarFormulario() {

    const formulario = document.getElementById("formVentas");

    if (!formulario) {
        return;
    }

    formulario.reset();

    const producto = document.getElementById("producto");
    const precio = document.getElementById("precio");
    const cantidad = document.getElementById("cantidad");
    const total = document.getElementById("total");

    if (producto) producto.value = "";
    if (precio) precio.value = "";
    if (cantidad) cantidad.value = 1;
    if (total) total.value = "";

}


/* =========================================================
   FORMULARIO DE RESERVACIONES
   ========================================================= */

function inicializarReservacion() {

    const formulario =
        document.getElementById("formReservacion");

    if (!formulario) {
        return;
    }

    const campos = formulario.querySelectorAll(
        "input, textarea, select"
    );

    campos.forEach(campo => {

        actualizarCheck(campo);

        campo.addEventListener("input", () => {
            actualizarCheck(campo);
        });

        campo.addEventListener("change", () => {
            actualizarCheck(campo);
        });

    });


    const fechaInput = document.getElementById("res-date");
    const horaInput = document.getElementById("res-time");

    if (!fechaInput || !horaInput) {
        console.error("No se encontraron los campos de fecha y hora.");
        return;
    }


    // =========================================
    // FECHA MÍNIMA = HOY
    // =========================================

    const hoy = new Date();

    const fechaHoy =
        hoy.getFullYear() + "-" +
        String(hoy.getMonth() + 1).padStart(2, "0") + "-" +
        String(hoy.getDate()).padStart(2, "0");

    fechaInput.min = fechaHoy;


    function actualizarHoraMinima() {

        if (fechaInput.value === fechaHoy) {

            const ahora = new Date();

            const horas =
                String(ahora.getHours()).padStart(2, "0");

            const minutos =
                String(ahora.getMinutes()).padStart(2, "0");

            horaInput.min = `${horas}:${minutos}`;

        } else {

            horaInput.removeAttribute("min");

        }

    }

    actualizarHoraMinima();

    fechaInput.addEventListener(
        "change",
        actualizarHoraMinima
    );


    // =========================================
    // ENVIAR RESERVACIÓN
    // =========================================

    formulario.onsubmit = async function (e) {

        e.preventDefault();

        const botonEnviar = formulario.querySelector(
            'button[type="submit"], input[type="submit"]'
        );


        const ahora = new Date();

        ahora.setMinutes(ahora.getMinutes() + 5);

        const fechaSeleccionada = new Date(
            fechaInput.value + "T" + horaInput.value
        );

        if (
            !fechaInput.value ||
            !horaInput.value ||
            isNaN(fechaSeleccionada.getTime())
        ) {

            alert("Debes seleccionar una fecha y hora válidas.");

            return;
        }

        if (fechaSeleccionada < ahora) {

            alert(
                "No puede reservar una fecha u hora que ya haya pasado."
            );

            return;
        }


        const datosReservacion = {

            nombre_reserva:
                document.getElementById("res-name").value.trim(),

            fecha: fechaInput.value,

            hora: horaInput.value,

            cantidad_personas: parseInt(
                document.getElementById("res-people").value,
                10
            ),

            ninos: document.getElementById("res-kids").value

        };


        try {

            if (botonEnviar) {
                botonEnviar.disabled = true;
            }


            // =====================================
            // OBTENER TOKEN CSRF
            // =====================================

            // En reservaciones sí exigimos una sesión activa.

            const seguridad = await obtenerTokenCsrf(true);


            // =====================================
            // ENVIAR RESERVACIÓN
            // =====================================

            const respuesta = await fetch(
                API_BASE + "reservaciones.php",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                        "X-CSRF-Token": seguridad.token
                    },

                    credentials: "same-origin",
                    cache: "no-store",

                    body: JSON.stringify(datosReservacion)
                }
            );


            const resultado = await respuesta.json();


            if (!respuesta.ok || !resultado.exito) {

                throw new Error(
                    resultado.mensaje ||
                    "No se pudo registrar la reservación."
                );
            }


            alert(
                resultado.mensaje +
                "\nNúmero de reservación: " +
                resultado.id_reservacion
            );

            limpiarReservacion();

            cerrarModal();


        } catch (error) {

            console.error(
                "Error al registrar reservación:",
                error
            );

            alert(error.message || "No se pudo registrar la reservación.");

        } finally {

            if (botonEnviar) {
                botonEnviar.disabled = false;
            }

        }

    };

}


/* =========================================================
   LIMPIAR FORMULARIO DE RESERVACIONES
   ========================================================= */

function limpiarReservacion() {

    const formulario =
        document.getElementById("formReservacion");

    if (!formulario) {
        return;
    }

    formulario.reset();

    formulario
        .querySelectorAll(".check-icon")
        .forEach(icono => {

            icono.classList.remove("visible");

        });

}
