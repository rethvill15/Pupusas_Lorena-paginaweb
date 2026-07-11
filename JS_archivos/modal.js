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
    const formulario = document.getElementById("formVentas");
    

    cantidad.addEventListener("input", () => {

        if(cantidad.value < 1){

        cantidad.value = 1;

        }
        actualizarTotal();

    });


    if(producto && datos.producto){

        producto.value = datos.producto;

    }

    if(precio && datos.precio){

        precio.value = "$" + Number(datos.precio).toFixed(2);

    }

    actualizarTotal();


    const cancelar = document.getElementById("cancelar");

if (cancelar) {

    cancelar.addEventListener("click", () => {

        limpiarFormulario();

        cerrarModal();

    });

    if(formulario){

    formulario.addEventListener("submit",(e)=>{

        e.preventDefault();

        alert("Pedido registrado correctamente.");

        limpiarFormulario();

        cerrarModal();

    });

}

}

    formulario.addEventListener("submit",(e)=>{

    e.preventDefault();

    alert("Pedido registrado correctamente.");

});

}


function actualizarTotal(){

    const precio = parseFloat(
        document.getElementById("precio").value
    );

    const cantidad = parseInt(
        document.getElementById("cantidad").value
    );

    document.getElementById("total").value =
        (precio * cantidad).toFixed(2);

}   



function limpiarFormulario() {
    const formulario = document.getElementById("formVentas");

    if (!formulario) return;

    formulario.reset();

    document.getElementById("producto").value = "";
    document.getElementById("precio").value = "";
    document.getElementById("cantidad").value = 1;
    document.getElementById("total").value = "";
    
}







