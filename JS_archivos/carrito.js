/*=========================================
REFERENCIAS DEL DOM
=========================================*/

const cartOverlay = document.getElementById("cartOverlay");

const abrirCarrito = document.getElementById("abrirCarrito");

const cerrarCarrito = document.getElementById("cerrarCarrito");

/*=========================================
ESTADO DEL CARRITO
=========================================*/

let carrito = [];

const cartBody = document.getElementById("cartBody");

const cartCount = document.getElementById("cartCount");

const cartBtn = document.getElementById("abrirCarrito");

const btnFinalizar = document.getElementById("btnFinalizar");

if (abrirCarrito) {

    abrirCarrito.addEventListener("click", () => {

        cartOverlay.classList.add("active");

        document.body.style.overflow = "hidden";

    });

}

if (cerrarCarrito) {

    cerrarPanelCarrito();

}

if (cartOverlay) {

    cerrarPanelCarrito();

}



/*=========================================
EVENTOS DEL CARRITO
=========================================*/

function actualizarCarrito(){

cartCount.textContent = obtenerCantidadTotal();

if(carrito.length>0){

    cartBtn.classList.add("filled");

}else{

    cartBtn.classList.remove("filled");

}

if (btnFinalizar) {

    btnFinalizar.disabled = carrito.length === 0;

}

actualizarBotonesProductos();

mostrarCarrito();

guardarCarrito();

cartCount.classList.remove("pop");

void cartCount.offsetWidth;

cartCount.classList.add("pop");

}


function guardarCarrito(){

    localStorage.setItem(

        "carritoPupusas",

        JSON.stringify(carrito)

    );

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
ññ




function vaciarCarrito(){

    carrito = [];

    actualizarCarrito();

}

/*=========================================
MOSTRAR CARRITO
=========================================*/

function mostrarCarrito(){

    if(carrito.length===0){

        

        const carritoVacioHTML = `
        <div class="cart-empty">

            <h3>

                Tu carrito está vacío

            </h3>

            <p>

                Agrega algunas pupusas para comenzar tu pedido.;

            </p>

        </div>

        `;

        

    }
    
    else{

            cartBody.innerHTML="";

        }

}


/*=========================================
Cantidad Total
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