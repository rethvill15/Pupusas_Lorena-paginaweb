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

if (abrirCarrito) {

    abrirCarrito.addEventListener("click", () => {

        cartOverlay.classList.add("active");

        document.body.style.overflow = "hidden";

    });

}

if (cerrarCarrito) {

    cerrarCarrito.addEventListener("click", () => {

        cartOverlay.classList.remove("active");

        document.body.style.overflow = "";

    });

}

if (cartOverlay) {

    cartOverlay.addEventListener("click", e => {

        if (e.target === cartOverlay) {

            cartOverlay.classList.remove("active");

            document.body.style.overflow = "";

        }

    });

}

function actualizarCarrito(){

cartCount.textContent=

carrito.reduce(

(total,item)=>total+item.cantidad,

0

);

actualizarBotonesProductos();

}

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

function agregarAlCarrito(nombre,precio,imagen){

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