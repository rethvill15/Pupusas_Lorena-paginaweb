/*=========================================
REFERENCIAS DEL DOM
=========================================*/

const cartOverlay = document.getElementById("cartOverlay");

const abrirCarrito = document.getElementById("abrirCarrito");

const cerrarCarrito = document.getElementById("cerrarCarrito");

const cartBody = document.getElementById("cartBody");

const cartCount = document.getElementById("cartCount");

const cartBtn = document.getElementById("abrirCarrito");

const btnFinalizar = document.getElementById("btnFinalizar");

const cartSubtotal = document.getElementById("cartSubtotal");

const cartIVA = document.getElementById("cartIVA");

const cartTotal = document.getElementById("cartTotal");

const toastCarrito = document.getElementById("toastCarrito");

const toastProducto = document.getElementById("toastProducto");

/*=========================================
ESTADO DEL CARRITO
=========================================*/

let carrito = [];



if (abrirCarrito) {

    abrirCarrito.addEventListener("click", () => {

        cartOverlay.classList.add("active");

        document.body.style.overflow = "hidden";

    });

}

if (cerrarCarrito) {

    cerrarCarrito.addEventListener("click", cerrarPanelCarrito);

}

if (cartOverlay) {

    cartOverlay.addEventListener("click",(e)=>{

        if(e.target===cartOverlay){

            cerrarPanelCarrito();

        }

    });


}



/*=========================================
EVENTOS DEL CARRITO
=========================================*/

function actualizarCarrito(){

if(cartCount){

    cartCount.textContent = obtenerCantidadTotal();

}

if(cartBtn){

    if(carrito.length>0){

        cartBtn.classList.add("filled");

    }else{

        cartBtn.classList.remove("filled");

    }

}

if (btnFinalizar) {

    btnFinalizar.disabled = carrito.length === 0;

}

actualizarBotonesProductos();

mostrarCarrito();

actualizarTotales();

guardarCarrito();

if(cartCount){

    cartCount.classList.remove("pop");

    void cartCount.offsetWidth;

    cartCount.classList.add("pop");

}

}


function guardarCarrito(){

    localStorage.setItem(

        "carritoPupusas",

        JSON.stringify(carrito)

    );

}

/*=========================================
TOTALES
=========================================*/

function actualizarTotales(){

    let subtotal = 0;

    carrito.forEach(producto=>{

        subtotal += producto.precio * producto.cantidad;

    });

    const iva = subtotal * 0.15;

    const total = subtotal + iva;

    if(cartSubtotal){

    cartSubtotal.textContent = `$${subtotal.toFixed(2)}`;

    }

    if(cartIVA){

    cartIVA.textContent = `$${iva.toFixed(2)}`;

    }

    if(cartTotal){

    cartTotal.textContent = `$${total.toFixed(2)}`;

    }

}

/*=========================================
NOTIFICACIÓN
=========================================*/

let tiempoToast;

function mostrarToast(nombre){

    if(!toastCarrito) return;

    toastProducto.textContent = nombre;

    clearTimeout(tiempoToast);

    toastCarrito.classList.add("show");

    tiempoToast = setTimeout(()=>{

        toastCarrito.classList.remove("show");

    },2500);

}

/*=========================================
RUTAS DE IMÁGENES
=========================================*/

function obtenerRutaImagen(ruta){

    if(!ruta) return "";

    const nivel = window.location.pathname
        .split("/")
        .length - 2;

    return "../".repeat(nivel) + ruta;

}

/*=========================================
ACTUALIZAR INTERFAZ
=========================================*/

function actualizarBotonesProductos(){

    const botones = document.querySelectorAll(".btn-ordenar");

    botones.forEach(boton=>{

        const nombre = boton.dataset.producto;

        const producto = carrito.find(

            item => item.nombre === nombre

        );

        if(producto){

            boton.innerHTML = `✓ Agregado (${producto.cantidad})`;

            boton.classList.add("producto-agregado");

        }else{

            boton.innerHTML = "Ordenar";

            boton.classList.remove("producto-agregado");

        }

    });

}

/*=========================================
AGREGAR PRODUCTOS
=========================================*/

function agregarAlCarrito(boton,nombre,precio,imagen){

const existente = carrito.find(

producto => producto.nombre===nombre

);

if(existente){

existente.cantidad++;

}else{

carrito.push({

nombre,

precio,

imagen,

cantidad:1

});

}

actualizarCarrito();

mostrarToast(nombre);

}

/*=========================================
LOCAL STORAGE
=========================================*/


function cargarCarrito(){

    const datos = localStorage.getItem("carritoPupusas");

    if(datos){

        carrito = JSON.parse(datos);

    }else{

    carrito=[];

    }

    actualizarCarrito();

}


/*=========================================
ELIMINAR PRODUCTOS
=========================================*/


function vaciarCarrito(){

    carrito = [];

    actualizarCarrito();

}

/*=========================================
MODIFICAR CANTIDADES
=========================================*/

function aumentarCantidad(nombre){

    const producto = carrito.find(

        item=>item.nombre===nombre

    );

    if(producto){

        producto.cantidad++;

    }

    actualizarCarrito();

}

function disminuirCantidad(nombre){

    const producto = carrito.find(

        item=>item.nombre===nombre

    );

    if(!producto) return;

    producto.cantidad--;

    if(producto.cantidad<=0){

        eliminarProducto(nombre);

        return;

    }

    actualizarCarrito();

}

function eliminarProducto(nombre){

    carrito = carrito.filter(

        item=>item.nombre!==nombre

    );

    actualizarCarrito();

}


/*=========================================
MOSTRAR CARRITO
=========================================*/

function mostrarCarrito(){

    if(carrito.length===0){

        cartBody.innerHTML=`

        <div class="cart-empty">

            <h3>

                Tu carrito está vacío

            </h3>

            <p>

                Agrega algunas pupusas para comenzar tu pedido.

            </p>

        </div>

        `;

        return;

    }

    cartBody.innerHTML="";

    carrito.forEach(producto=>{

        cartBody.innerHTML += `

        <div class="cart-item">

    <img
    src="${obtenerRutaImagen(producto.imagen)}"
    alt="${producto.nombre}">

    <div class="cart-item-info">

        <h4>${producto.nombre}</h4>

        <div class="cart-price">

            $${producto.precio.toFixed(2)}

        </div>

        <div class="cart-controls">

            <button
                onclick="disminuirCantidad('${producto.nombre}')">

                -

            </button>

            <span>

                ${producto.cantidad}

            </span>

            <button
                onclick="aumentarCantidad('${producto.nombre}')">

                +

            </button>

        </div>

        <button
            class="btn-eliminar"
            onclick="eliminarProducto('${producto.nombre}')">

            Eliminar

        </button>

    </div>

</div>

        `;

    });

}


/*=========================================
CANTIDAD TOTAL
=========================================*/

function obtenerCantidadTotal(){

return carrito.reduce(

(total,item)=>total+item.cantidad,

0

);

}


/*=========================================
UTILIDADES
=========================================*/

function cerrarPanelCarrito(){

cartOverlay.classList.remove("active");

document.body.style.overflow="";

}



/*=========================================
INICIALIZACIÓN
=========================================*/


cargarCarrito();

/*=========================================
FINALIZAR COMPRA
=========================================*/

if(btnFinalizar){

    btnFinalizar.addEventListener("click",()=>{

        if(carrito.length === 0){

            alert("El carrito está vacío.");

            return;

        }


        if(typeof abrirModal !== "function"){

        console.error("La función abrirModal no está disponible.");

        return;

}

        cerrarPanelCarrito();

            abrirModal(

                obtenerRutaModal(),

                {
                    carrito: carrito
                }

        );

    });

}