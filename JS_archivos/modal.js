const overlay = document.getElementById("modalOverlay");
const contenido = document.getElementById("modalContenido");

async function abrirModal(url, datos = {}) {

    overlay.classList.add("active");
    document.body.style.overflow = "hidden";

    contenido.innerHTML = `
        <div class="loading">
            Cargando...
        </div>
    `;

    try {

        const respuesta = await fetch(url);
        const texto = await respuesta.text();

        const parser = new DOMParser();
        const documento = parser.parseFromString(texto, "text/html");

        const nuevoContenido = documento.querySelector(".modal-ventas");

        contenido.innerHTML = "";
        contenido.appendChild(nuevoContenido);

        inicializarFormulario(datos);

    } catch (error) {

        contenido.innerHTML = `
            <div class="loading">
                Error al cargar el formulario.
            </div>
        `;

        console.error(error);

    }

}

function cerrarModal() {

    overlay.classList.remove("active");

    document.body.style.overflow = "";

    contenido.innerHTML = "";

}

document.getElementById("cerrarModal").onclick = cerrarModal;

overlay.addEventListener("click", function(e){

    if(e.target === overlay){

        cerrarModal();

    }

});

document.addEventListener("keydown", function(e){

    if(e.key === "Escape"){

        cerrarModal();

    }

});

function inicializarFormulario(datos){

    const producto = document.getElementById("producto");
    const precio = document.getElementById("precio");
    const cantidad = document.getElementById("cantidad");
    const total = document.getElementById("total");

    if(producto && datos.producto){

        producto.value = datos.producto;

    }

    if(precio && datos.precio){

        precio.value = "$" + Number(datos.precio).toFixed(2);

    }

    actualizarTotal();

    if(cantidad){

        cantidad.addEventListener("input", actualizarTotal);

    }

    function actualizarTotal(){

        if(!precio || !cantidad || !total) return;

        const p = Number(datos.precio || 0);
        const c = Number(cantidad.value);

        total.value = "$" + (p*c).toFixed(2);

    }

}

document.querySelectorAll(".btn-ordenar").forEach(boton => {

    boton.addEventListener("click", function(e){

        e.preventDefault();

        abrirModal(
            "Registro_ventas/modal_ventas.html",
            {
                producto: this.dataset.producto,
                precio: Number(this.dataset.precio)
            }
        );

    });

});