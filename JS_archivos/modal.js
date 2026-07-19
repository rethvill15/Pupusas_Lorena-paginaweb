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

try{

    const respuesta = await fetch(url);

    if(!respuesta.ok){
        throw new Error("No se pudo cargar el formulario.");
    }

    const texto = await respuesta.text();

    const parser = new DOMParser();

    const documento =
        parser.parseFromString(texto,"text/html");

    const nuevoContenido =
        documento.querySelector(".modal-ventas");

    if(!nuevoContenido){
        throw new Error("No se encontró .modal-ventas");
    }

    contenido.innerHTML="";

    contenido.appendChild(nuevoContenido);

    inicializarFormulario(datos);

}catch(error){

    contenido.innerHTML=`
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

        if (document.getElementById("formVentas")) {

    limpiarFormulario();

    }

    contenido.innerHTML = "";

    }

    const botonCerrar = document.getElementById("cerrarModal");

    if (botonCerrar) {
        botonCerrar.onclick = cerrarModal;
    }

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

        if (!producto || !precio || !cantidad || !total || !formulario) {
        console.error("No se encontraron todos los elementos del formulario.");
        return;
        }   
        

        cantidad.addEventListener("input", () => {

            if (Number(cantidad.value) < 1 || isNaN(cantidad.value)) {
        cantidad.value = 1;
    }
            actualizarTotal();

        });


        if(producto && datos.producto){
            producto.value = datos.producto;

        }

        if(precio && datos.precio){
            precio.value = Number(datos.precio).toFixed(2);

        }

        actualizarTotal();


        const cancelar = document.getElementById("cancelar");

    if (cancelar) {

        cancelar.addEventListener("click", () => {

            

            cerrarModal();

        });

        

            

        formulario.addEventListener("submit", (e) => {

            e.preventDefault();

            alert("Pedido registrado correctamente.");

            limpiarFormulario();

            cerrarModal();

        });

        };

    }



    function actualizarTotal(){

        const precio = Number(
            document.getElementById("precio").value
        );

        const cantidad = Number(
            document.getElementById("cantidad").value
        );

        if (isNaN(precio) || isNaN(cantidad)) {

        document.getElementById("total").value = "";

        return;

    }

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







