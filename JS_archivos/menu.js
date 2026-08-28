/*===============================================================
    PROYECTO : Pupusas Lorena v2
    ARCHIVO  : menu.js

    FUNCIÓN:
    Conectar el menú HTML con la API de productos.

    FLUJO:
    MySQL → productos.php → JSON → menu.js → HTML

    IMPORTANTE:
    - No modifica carrito.js.
    - No modifica localStorage.
    - Mantiene agregarAlCarrito().
    - Las imágenes permanecen fuera de la base de datos.
================================================================*/


/*===============================================================
    1. API DE PRODUCTOS
================================================================*/

// Desde:
// Menu_pupusas/menu_seccion.html
//
// hacia:
// pupusas_lorena/api/productos.php
//
// Ajustaremos esta ruta si la estructura de tus carpetas es distinta.

const API_PRODUCTOS = "../../pupusas_lorena/api/productos.php";


/*===============================================================
    2. MAPA DE IMÁGENES

    La base de datos NO almacena imágenes.

    Utilizamos id_producto como identificador para relacionar
    cada producto de MySQL con su imagen correspondiente.
================================================================*/

const imagenesProductos = {

    // Combos
    4: "Menu_pupusas/Imagenes_menu/20_pupusas.JPG",
    5: "Menu_pupusas/Imagenes_menu/12_pupusas.png",
    6: "Menu_pupusas/Imagenes_menu/5_pupusas.jpg",
    7: "Menu_pupusas/Imagenes_menu/3_pupusas.jpg",

    // Pupusas
    8: "Menu_pupusas/Imagenes_menu/Pupusa_queso_sencilla.png",
    9: "Menu_pupusas/Imagenes_menu/pupusa-de-pollo.png",
    10: "Menu_pupusas/Imagenes_menu/Pupusa_queso_3quesos.jpg",
    11: "Menu_pupusas/Imagenes_menu/Pupusa_carnes_mixtas.jpg",
    12: "Menu_pupusas/Imagenes_menu/pupusa_pollo_queso.jpg",
    13: "Menu_pupusas/Imagenes_menu/Pupusa_queso_frijol.jpg",
    14: "Menu_pupusas/Imagenes_menu/Pupusa_chicharron_frijol.jpg",
    15: "Menu_pupusas/Imagenes_menu/Pupusa_picante.jpg",
    16: "Menu_pupusas/Imagenes_menu/Pupusa_queso_chicharron.jpg",
    17: "Menu_pupusas/Imagenes_menu/Pupusa_pollo_frijol.jpg",
    18: "Menu_pupusas/Imagenes_menu/Pupusa_todo_uno.jpg",
    19: "Menu_pupusas/Imagenes_menu/Pupusa_gigante.jpg",

    // Postres
    20: "Menu_pupusas/Imagenes_menu/Cheesecake.jpg",
    21: "Menu_pupusas/Imagenes_menu/Picos_nica.png",

    // Bebidas
    22: "Menu_pupusas/Imagenes_menu/Coca Cola.jpg",
    23: "Menu_pupusas/Imagenes_menu/Sprite.jpg",
    24: "Menu_pupusas/Imagenes_menu/Te Frio_lipton.jpg",
    25: "Menu_pupusas/Imagenes_menu/Jugo_naranja.jpg",
    26: "Menu_pupusas/Imagenes_menu/Fresco_Jamaica.jpg",
    27: "Menu_pupusas/Imagenes_menu/Limonada.jpg"
};


/*===============================================================
    3. CATEGORÍAS DEL MENÚ
================================================================*/

const categoriasMenu = [
    "Combos",
    "Pupusas",
    "Postres",
    "Bebidas"
];


/*===============================================================
    4. ESCAPAR HTML

    Evita introducir directamente texto proveniente de la BD
    dentro del HTML.
================================================================*/

function escaparHTML(texto) {

    return String(texto ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/*===============================================================
    5. OBTENER IMAGEN DEL PRODUCTO
================================================================*/

function obtenerImagenProducto(idProducto) {

    const ruta = imagenesProductos[idProducto];

    if (!ruta) {

        console.warn(
            "No existe una imagen configurada para el producto:",
            idProducto
        );

        return "";
    }

    /*
        menu.js está en:

        Pupusa_paginaweb/JS_archivos/

        y las imágenes están en:

        Pupusa_paginaweb/Menu_pupusas/Imagenes_menu/

        Por eso desde menu.js utilizamos ../
    */

    return "../" + ruta.replace("Menu_pupusas/", "");
}


/*===============================================================
    6. CREAR TARJETA DE PRODUCTO
================================================================*/

function crearTarjetaProducto(producto) {

    const idProducto = Number(producto.id_producto);

    const precio = Number(producto.precio);

    const imagen = obtenerImagenProducto(idProducto);

    const tarjeta = document.createElement("div");

    tarjeta.className = "product-card";


    /*-----------------------------------------------------------
        HTML DE LA TARJETA
    -----------------------------------------------------------*/

    tarjeta.innerHTML = `

        <img
            src="${escaparHTML(imagen)}"
            alt="${escaparHTML(producto.nombre)}"
            class="product-img"
        >

        <div class="product-info">

            <h3>
                ${escaparHTML(producto.nombre)}
            </h3>

            <p>
                ${escaparHTML(producto.descripcion)}
            </p>

            <div class="product-bottom">

                <span class="product-price">
                    C$ ${precio.toFixed(2)}
                </span>

                <button
                    type="button"
                    class="btn-ordenar"
                >
                    Ordenar
                </button>

            </div>

        </div>
    `;


    /*-----------------------------------------------------------
        BOTÓN ORDENAR
    -----------------------------------------------------------*/

    const boton = tarjeta.querySelector(".btn-ordenar");


    boton.addEventListener("click", function () {

        /*
            Comprobamos que carrito.js esté cargado.
        */

        if (typeof agregarAlCarrito !== "function") {

            console.error(
                "ERROR: agregarAlCarrito() no está disponible. " +
                "Comprueba que carrito.js se cargue antes que menu.js."
            );

            return;
        }


        /*
            IMPORTANTE:

            Seguimos utilizando la función existente del carrito.

            NO estamos creando otro sistema de carrito.
        */

        agregarAlCarrito(
            this,
            producto.nombre,
            precio,
            imagenesProductos[idProducto]
        );

    });


    return tarjeta;
}


/*===============================================================
    7. MENSAJE DE ERROR
================================================================*/

function mostrarErrorMenu(mensaje) {

    categoriasMenu.forEach(function (categoria) {

        const contenedor = document.getElementById(
            `productos-${categoria}`
        );

        if (!contenedor) {
            return;
        }

        contenedor.innerHTML = `

            <p class="menu-error">
                ${escaparHTML(mensaje)}
            </p>

        `;
    });
}


/*===============================================================
    8. CARGAR PRODUCTOS DESDE LA API
================================================================*/

async function cargarProductos() {

    try {

        console.log(
            "Consultando productos:",
            API_PRODUCTOS
        );


        /*-------------------------------------------------------
            SOLICITUD A PHP
        -------------------------------------------------------*/

        const respuesta = await fetch(API_PRODUCTOS, {

            method: "GET",

            headers: {
                "Accept": "application/json"
            }

        });


        /*-------------------------------------------------------
            COMPROBAR RESPUESTA HTTP
        -------------------------------------------------------*/

        if (!respuesta.ok) {

            throw new Error(
                `Error HTTP ${respuesta.status}`
            );
        }


        /*-------------------------------------------------------
            CONVERTIR RESPUESTA A JSON
        -------------------------------------------------------*/

        const resultado = await respuesta.json();


        console.log(
            "Respuesta de productos.php:",
            resultado
        );


        /*-------------------------------------------------------
            COMPROBAR ESTRUCTURA DE LA API
        -------------------------------------------------------*/

        if (
            !resultado.exito ||
            !Array.isArray(resultado.datos)
        ) {

            throw new Error(
                resultado.mensaje ||
                "La API no devolvió una lista válida de productos."
            );
        }


        /*-------------------------------------------------------
            LIMPIAR CONTENEDORES
        -------------------------------------------------------*/

        categoriasMenu.forEach(function (categoria) {

            const contenedor = document.getElementById(
                `productos-${categoria}`
            );

            if (contenedor) {

                contenedor.innerHTML = "";

            }

        });


        /*-------------------------------------------------------
            CONTADOR
        -------------------------------------------------------*/

        let productosMostrados = 0;


        /*-------------------------------------------------------
            RECORRER PRODUCTOS
        -------------------------------------------------------*/

        resultado.datos.forEach(function (producto) {

            const categoria = producto.categoria;


            /*
                Comprobar que la categoría exista en nuestro menú.
            */

            if (!categoriasMenu.includes(categoria)) {

                console.warn(
                    "Categoría no contemplada:",
                    categoria
                );

                return;
            }


            /*
                Obtener contenedor de la categoría.
            */

            const contenedor = document.getElementById(
                `productos-${categoria}`
            );


            if (!contenedor) {

                console.warn(
                    "No se encontró el contenedor:",
                    categoria
                );

                return;
            }


            /*
                Obtener ID.
            */

            const idProducto = Number(
                producto.id_producto
            );


            /*
                Comprobar que tenga imagen.
            */

            if (!imagenesProductos[idProducto]) {

                console.warn(
                    `El producto ${idProducto} (${producto.nombre}) ` +
                    "no tiene una imagen configurada."
                );

                return;
            }


            /*
                Crear tarjeta.
            */

            const tarjeta = crearTarjetaProducto(
                producto
            );


            /*
                Insertar tarjeta.
            */

            contenedor.appendChild(
                tarjeta
            );


            productosMostrados++;

        });


        /*-------------------------------------------------------
            OCULTAR CATEGORÍAS VACÍAS
        -------------------------------------------------------*/

        categoriasMenu.forEach(function (categoria) {

            const seccion = document.getElementById(
                `seccion-${categoria}`
            );

            const contenedor = document.getElementById(
                `productos-${categoria}`
            );


            if (!seccion || !contenedor) {
                return;
            }


            if (contenedor.children.length === 0) {

                seccion.style.display = "none";

            } else {

                seccion.style.display = "";

            }

        });


        /*-------------------------------------------------------
            RESULTADO FINAL
        -------------------------------------------------------*/

        console.log(
            `Productos cargados correctamente: ${productosMostrados}`
        );

    }

    catch (error) {

        console.error(
            "Error al cargar el menú desde la API:",
            error
        );


        mostrarErrorMenu(
            "No se pudo cargar el menú. Verifica que Apache esté activo y que la API de productos esté disponible."
        );

    }

}


/*===============================================================
    9. INICIALIZAR MENÚ
================================================================*/

document.addEventListener(
    "DOMContentLoaded",
    cargarProductos
);