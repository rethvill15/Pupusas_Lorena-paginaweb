const cartOverlay = document.getElementById("cartOverlay");

const abrirCarrito = document.getElementById("abrirCarrito");

const cerrarCarrito = document.getElementById("cerrarCarrito");

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