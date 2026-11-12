
"use strict";

// =========================================================
// HISTORIAL DE COMPRAS - PUPUSAS LORENA
// =========================================================

document.addEventListener("DOMContentLoaded", iniciarHistorial);


// =========================================================
// 1. ELEMENTOS HTML
// =========================================================

const estadoHistorial = document.getElementById("estadoHistorial");
const contenedorHistorial = document.getElementById("contenedorHistorial");
const listaFacturas = document.getElementById("listaFacturas");
const totalFacturas = document.getElementById("totalFacturas");
const sinCompras = document.getElementById("sinCompras");
const avisoLogin = document.getElementById("avisoLogin");


// =========================================================
// 2. INICIAR HISTORIAL
// =========================================================

async function iniciarHistorial() {

    try {

        mostrarEstado("Cargando tu historial de compras...");

        const respuesta = await fetch(
            "../../api/historial_compras.php",
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


        // =================================================
        // 3. VERIFICAR RESPUESTA DE LA API
        // =================================================

        if (!respuesta.ok || !datos.exito) {

            if (
                respuesta.status === 401 ||
                (datos.mensaje && datos.mensaje.toLowerCase().includes("sesión"))
            ) {

                mostrarAvisoLogin();
                return;
            }

            throw new Error(
                datos.mensaje || "No fue posible consultar tu historial."
            );
        }


        // =================================================
        // 4. VERIFICAR SI EXISTEN COMPRAS
        // =================================================

        if (!Array.isArray(datos.facturas)) {

            throw new Error("La respuesta del historial no es válida.");
        }

        if (datos.facturas.length === 0) {

            mostrarSinCompras();
            return;
        }


        // =================================================
        // 5. ORDENAR FACTURAS
        // =================================================

        const facturas = [...datos.facturas].sort((a, b) => {

            const fechaA = new Date(
                String(a.fecha).replace(" ", "T")
            ).getTime();

            const fechaB = new Date(
                String(b.fecha).replace(" ", "T")
            ).getTime();

            if (fechaA !== fechaB) {
                return fechaB - fechaA;
            }

            return Number(b.id_factura) - Number(a.id_factura);
        });


        // =================================================
        // 6. MOSTRAR FACTURAS
        // =================================================

        listaFacturas.innerHTML = "";

        facturas.forEach(factura => {

            listaFacturas.appendChild(
                crearTarjetaFactura(factura)
            );

        });

        totalFacturas.textContent =
            facturas.length === 1
                ? "1 factura registrada"
                : `${facturas.length} facturas registradas`;

        estadoHistorial.hidden = true;
        sinCompras.hidden = true;
        avisoLogin.hidden = true;
        contenedorHistorial.hidden = false;


    } catch (error) {

        console.error("Error al cargar el historial:", error);

        mostrarEstado(
            error.message || "Ocurrió un error al cargar tu historial."
        );

    }

}


// =========================================================
// 7. CREAR TARJETA DE FACTURA
// =========================================================

function crearTarjetaFactura(factura) {

    const tarjeta = document.createElement("article");

    tarjeta.className = "factura-card";

    const encabezado = document.createElement("div");

    encabezado.className = "factura-encabezado";

    const identificacion = document.createElement("div");

    identificacion.className = "factura-identificacion";

    const icono = document.createElement("span");

    icono.className = "factura-icono";
    icono.setAttribute("aria-hidden", "true");

    const iconoBolsa = document.createElement("i");

    iconoBolsa.className = "bi bi-receipt";

    icono.appendChild(iconoBolsa);

    const informacion = document.createElement("div");

    const titulo = document.createElement("h3");

    titulo.textContent = `Factura #${factura.id_factura}`;

    const fecha = document.createElement("span");

    fecha.className = "factura-fecha";
    fecha.textContent = formatearFecha(factura.fecha);

    informacion.append(titulo, fecha);

    identificacion.append(icono, informacion);


    // Estado de la factura

    const estado = document.createElement("span");

    estado.className = "estado-factura";

    estado.textContent = factura.estado || "Desconocido";

    const estadoNormalizado = String(factura.estado || "")
        .toLowerCase();

    if (estadoNormalizado === "pendiente") {

        estado.classList.add("estado-pendiente");

    } else if (estadoNormalizado === "pagado") {

        estado.classList.add("estado-pagado");

    } else if (estadoNormalizado === "anulado") {

        estado.classList.add("estado-anulado");

    } else {

        estado.classList.add("estado-desconocido");

    }

    encabezado.append(identificacion, estado);


    // Contenido de la factura

    const contenido = document.createElement("div");

    contenido.className = "factura-contenido";


    // Metadatos

    const metadatos = document.createElement("div");

    metadatos.className = "factura-metadatos";

    metadatos.append(
        crearMetadato(
            "Método de pago",
            factura.metodo_pago || "No especificado"
        ),
        crearMetadato(
            "Canal de compra",
            factura.canal_venta || "No especificado"
        )
    );


    // Productos

    const subtitulo = document.createElement("h4");

    subtitulo.className = "factura-subtitulo";
    subtitulo.textContent = "Productos de la compra";

    const productos = document.createElement("div");

    productos.className = "lista-productos";

    if (
        Array.isArray(factura.productos) &&
        factura.productos.length > 0
    ) {

        factura.productos.forEach(producto => {

            productos.appendChild(
                crearFilaProducto(producto)
            );

        });

    } else {

        const mensaje = document.createElement("p");

        mensaje.textContent = "No hay productos registrados en esta factura.";

        productos.appendChild(mensaje);

    }


    // Resumen económico

    const resumen = document.createElement("div");

    resumen.className = "factura-resumen";

    resumen.append(
        crearFilaResumen("Subtotal", factura.subtotal),
        crearFilaResumen("Impuesto", factura.impuesto)
    );

    const total = document.createElement("div");

    total.className = "resumen-total";

    const etiquetaTotal = document.createElement("span");

    etiquetaTotal.textContent = "Total";

    const valorTotal = document.createElement("strong");

    valorTotal.textContent = formatearMoneda(factura.total);

    total.append(etiquetaTotal, valorTotal);

    resumen.appendChild(total);


    // Construir tarjeta completa

    contenido.append(
        metadatos,
        subtitulo,
        productos,
        resumen
    );

    tarjeta.append(
        encabezado,
        contenido
    );

    return tarjeta;

}


// =========================================================
// 8. CREAR METADATOS
// =========================================================

function crearMetadato(etiqueta, valor) {

    const contenedor = document.createElement("div");

    contenedor.className = "metadato";

    const textoEtiqueta = document.createElement("span");

    textoEtiqueta.textContent = etiqueta;

    const textoValor = document.createElement("strong");

    textoValor.textContent = valor;

    contenedor.append(
        textoEtiqueta,
        textoValor
    );

    return contenedor;

}


// =========================================================
// 9. CREAR FILA DE PRODUCTO
// =========================================================

function crearFilaProducto(producto) {

    const fila = document.createElement("div");

    fila.className = "producto-factura";

    const informacion = document.createElement("div");

    informacion.className = "producto-informacion";

    const nombre = document.createElement("span");

    nombre.className = "producto-nombre";

    nombre.textContent = producto.producto || "Producto";

    const cantidad = document.createElement("span");

    cantidad.className = "producto-cantidad";

    cantidad.textContent =
        `Cantidad: ${Number(producto.cantidad) || 0} × ` +
        formatearMoneda(producto.precio_unitario);

    informacion.append(
        nombre,
        cantidad
    );

    const precio = document.createElement("strong");

    precio.className = "producto-precio";

    precio.textContent = formatearMoneda(producto.subtotal);

    fila.append(
        informacion,
        precio
    );

    return fila;

}


// =========================================================
// 10. CREAR FILA DEL RESUMEN
// =========================================================

function crearFilaResumen(etiqueta, valor) {

    const fila = document.createElement("div");

    fila.className = "resumen-fila";

    const texto = document.createElement("span");

    texto.textContent = etiqueta;

    const cantidad = document.createElement("strong");

    cantidad.textContent = formatearMoneda(valor);

    fila.append(
        texto,
        cantidad
    );

    return fila;

}


// =========================================================
// 11. FORMATEAR MONEDA
// =========================================================

function formatearMoneda(valor) {

    const numero = Number(valor);

    if (!Number.isFinite(numero)) {
        return "C$0.00";
    }

    return new Intl.NumberFormat("es-NI", {
        style: "currency",
        currency: "NIO",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(numero);

}


// =========================================================
// 12. FORMATEAR FECHA
// =========================================================

function formatearFecha(valor) {

    if (!valor) {
        return "Fecha no disponible";
    }

    const partes = String(valor).split(/[- :]/);

    if (partes.length < 6) {
        return valor;
    }

    const fecha = new Date(
        Number(partes[0]),
        Number(partes[1]) - 1,
        Number(partes[2]),
        Number(partes[3]),
        Number(partes[4]),
        Number(partes[5])
    );

    if (Number.isNaN(fecha.getTime())) {
        return valor;
    }

    return new Intl.DateTimeFormat("es-NI", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    }).format(fecha);

}


// =========================================================
// 13. MOSTRAR MENSAJES
// =========================================================

function mostrarEstado(mensaje) {

    estadoHistorial.textContent = mensaje;

    estadoHistorial.hidden = false;

    contenedorHistorial.hidden = true;
    sinCompras.hidden = true;
    avisoLogin.hidden = true;

}


function mostrarSinCompras() {

    estadoHistorial.hidden = true;
    contenedorHistorial.hidden = true;
    avisoLogin.hidden = true;

    sinCompras.hidden = false;

}


function mostrarAvisoLogin() {

    estadoHistorial.hidden = true;
    contenedorHistorial.hidden = true;
    sinCompras.hidden = true;

    avisoLogin.hidden = false;

}
