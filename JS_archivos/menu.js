/*===============================================================
    PROYECTO : Pupusas Lorena v2
    ARCHIVO  : menu.js

    FUNCIÓN:
    Conectar el menú HTML con la API de productos.

    FLUJO:
    MySQL → productos.php → JSON → menu.js → HTML → carrito.js

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
// Esta ruta ya fue comprobada y actualmente funciona.

const API_PRODUCTOS = "/Pupusas_paginaweb/api/productos.php";


/*===============================================================
    2. MAPA DE IMÁGENES

    La base de datos NO almacena imágenes.

    Utilizamos id_producto como identificador para relacionar
    cada producto de MySQL con su imagen correspondiente.

    IMPORTANTE:
    Estas rutas son relativas a menu_seccion.html.

    menu_seccion.html está dentro de:

        Menu_pupusas/

    y las imágenes están dentro de:

        Menu_pupusas/Imagenes_menu/
================================================================*/

const imagenesProductos = {

    /*-----------------------------------------------------------
        COMBOS
    -----------------------------------------------------------*/

<<<<<<< HEAD
    1: "Menu_pupusas/Imagenes_menu/20_pupusas.JPG",
    2: "Menu_pupusas/Imagenes_menu/12_pupusas.png",
    3: "Menu_pupusas/Imagenes_menu/5_pupusas.jpg",
    4: "Menu_pupusas/Imagenes_menu/3_pupusas.jpg",
=======
    1: "Imagenes_menu/20_pupusas.JPG",
    2: "Imagenes_menu/12_pupusas.png",
    3: "Imagenes_menu/5_pupusas.jpg",
    4: "Imagenes_menu/3_pupusas.jpg",
>>>>>>> c0a8c3d9be5782c61fe21efb69ae46b6d8d540eb


    /*-----------------------------------------------------------
        PUPUSAS
    -----------------------------------------------------------*/

<<<<<<< HEAD
    5:  "Menu_pupusas/Imagenes_menu/Pupusa_queso_sencilla.png",
    6:  "Menu_pupusas/Imagenes_menu/pupusa-de-pollo.png",
    7: "Menu_pupusas/Imagenes_menu/Pupusa_queso_3quesos.jpg",
    8: "Menu_pupusas/Imagenes_menu/Pupusa_carnes_mixtas.jpg",
    9: "Menu_pupusas/Imagenes_menu/pupusa_pollo_queso.jpg",
    10: "Menu_pupusas/Imagenes_menu/Pupusa_queso_frijol.jpg",
    11: "Menu_pupusas/Imagenes_menu/Pupusa_chicharron_frijol.jpg",
    12: "Menu_pupusas/Imagenes_menu/Pupusa_picante.jpg",
    13: "Menu_pupusas/Imagenes_menu/Pupusa_queso_chicharron.jpg",
    14: "Menu_pupusas/Imagenes_menu/Pupusa_pollo_frijol.jpg",
    15: "Menu_pupusas/Imagenes_menu/Pupusa_todo_uno.jpg",
    16: "Menu_pupusas/Imagenes_menu/Pupusa_gigante.jpg",
=======
    5:  "Imagenes_menu/Pupusa_queso_sencilla.png",
    6:  "Imagenes_menu/pupusa-de-pollo.png",
    7: "Imagenes_menu/Pupusa_queso_3quesos.jpg",
    8: "Imagenes_menu/Pupusa_carnes_mixtas.jpg",
    9: "Imagenes_menu/pupusa_pollo_queso.jpg",
    10: "Imagenes_menu/Pupusa_queso_frijol.jpg",
    11: "Imagenes_menu/Pupusa_chicharron_frijol.jpg",
    12: "Imagenes_menu/Pupusa_picante.jpg",
    13: "Imagenes_menu/Pupusa_queso_chicharron.jpg",
    14: "Imagenes_menu/Pupusa_pollo_frijol.jpg",
    15: "Imagenes_menu/Pupusa_todo_uno.jpg",
    16: "Imagenes_menu/Pupusa_gigante.jpg",
>>>>>>> c0a8c3d9be5782c61fe21efb69ae46b6d8d540eb


    /*-----------------------------------------------------------
        POSTRES
    -----------------------------------------------------------*/

<<<<<<< HEAD
    17: "Menu_pupusas/Imagenes_menu/Cheesecake.jpg",
    18: "Menu_pupusas/Imagenes_menu/Picos_nica.png",
=======
    17: "Imagenes_menu/Cheesecake.jpg",
    18: "Imagenes_menu/Picos_nica.png",
>>>>>>> c0a8c3d9be5782c61fe21efb69ae46b6d8d540eb


    /*-----------------------------------------------------------
        BEBIDAS
    -----------------------------------------------------------*/

<<<<<<< HEAD
    19: "Menu_pupusas/Imagenes_menu/Coca Cola.jpg",
    20: "Menu_pupusas/Imagenes_menu/Sprite.jpg",
    21: "Menu_pupusas/Imagenes_menu/Te Frio_lipton.jpg",
    22: "Menu_pupusas/Imagenes_menu/Jugo_naranja.jpg",
    23: "Menu_pupusas/Imagenes_menu/Fresco_Jamaica.jpg",
    24: "Menu_pupusas/Imagenes_menu/Limonada.jpg"
=======
    19: "Imagenes_menu/Coca Cola.jpg",
    20: "Imagenes_menu/Sprite.jpg",
    21: "Imagenes_menu/Te Frio_lipton.jpg",
    22: "Imagenes_menu/Jugo_naranja.jpg",
    23: "Imagenes_menu/Fresco_Jamaica.jpg",
    24: "Imagenes_menu/Limonada.jpg"
>>>>>>> c0a8c3d9be5782c61fe21efb69ae46b6d8d540eb
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

/*
    IMPORTANTE:

    menu_seccion.html y la carpeta Imagenes_menu están dentro
    de Menu_pupusas.

    Por eso una imagen debe utilizar:

        Imagenes_menu/nombre.jpg

    NO:

        ../Imagenes_menu/nombre.jpg

    ni:

        ../Menu_pupusas/Imagenes_menu/nombre.jpg

    Esta función solamente devuelve la ruta que utiliza el HTML.
*/

function obtenerImagenProducto(idProducto) {

    const ruta = imagenesProductos[idProducto];

    if (!ruta) {

        console.warn(
            "No existe una imagen configurada para el producto:",
            idProducto
        );

        return "";
    }

    return ruta;
}


/*===============================================================
    6. CREAR TARJETA DE PRODUCTO
================================================================*/

function crearTarjetaProducto(producto) {

    const idProducto = Number(producto.id_producto);

    const precio = Number(producto.precio);

    const imagen = obtenerImagenProducto(idProducto);


    /*-----------------------------------------------------------
        CREAR TARJETA
    -----------------------------------------------------------*/

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
                    data-producto="${escaparHTML(producto.nombre)}"
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

    /*-------------------------------------------------------
        Comprobar carrito.js
    -------------------------------------------------------*/

    if (typeof agregarAlCarrito !== "function") {

        console.error(
            "ERROR: agregarAlCarrito() no está disponible. " +
            "Comprueba que carrito.js se cargue antes que menu.js."
        );

        return;
    }


    /*-------------------------------------------------------
        AGREGAR AL CARRITO

        Ahora también enviamos id_producto.

        Este ID viene directamente de la API de productos.
        No lo generamos en JavaScript.
    -------------------------------------------------------*/

    agregarAlCarrito(
        this,
        idProducto,
        producto.nombre,
        precio,
        imagen
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
            !Array.isArray(resultado.productos)
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

        resultado.productos.forEach(function (producto) {

            const categoria = producto.categoria;


            /*---------------------------------------------------
                COMPROBAR CATEGORÍA
            ---------------------------------------------------*/

            if (!categoriasMenu.includes(categoria)) {

                console.warn(
                    "Categoría no contemplada:",
                    categoria
                );

                return;
            }


            /*---------------------------------------------------
                OBTENER CONTENEDOR
            ---------------------------------------------------*/

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


            /*---------------------------------------------------
                OBTENER ID DEL PRODUCTO
            ---------------------------------------------------*/

            const idProducto = Number(
                producto.id_producto
            );


            /*---------------------------------------------------
                COMPROBAR IMAGEN
            ---------------------------------------------------*/

            if (!imagenesProductos[idProducto]) {

                console.warn(
                    `El producto ${idProducto} (${producto.nombre}) ` +
                    "no tiene una imagen configurada."
                );

                return;
            }


            /*---------------------------------------------------
                CREAR TARJETA
            ---------------------------------------------------*/

            const tarjeta = crearTarjetaProducto(
                producto
            );


            /*---------------------------------------------------
                INSERTAR TARJETA
            ---------------------------------------------------*/

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