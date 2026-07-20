    const overlay = document.getElementById("modalOverlay");
    const contenido = document.getElementById("modalContenido");
    let modalAbierto = false;

/* ==========================
Apertura del modal
========================== */

    async function abrirModal(url, datos = {}) {

    if(!overlay || !contenido){

    console.error("No existe el modal.");

    return;

    } 


    if(modalAbierto){

    return;

    }

    modalAbierto = true;

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
        documento.querySelector(".modal-ventas")||
        documento.querySelector(".modal-reservacion");

    if(!nuevoContenido){
        throw new Error("No se encontró un contenido de modal valido.");
    }

    contenido.innerHTML="";

    contenido.appendChild(nuevoContenido);

    if (nuevoContenido.classList.contains("modal-ventas")) {

    inicializarFormulario(datos);

}

else if (nuevoContenido.classList.contains("modal-reservacion")){

    inicializarReservacion();

}

}catch(error){

    console.error("Error cargando modal:", error);

    contenido.innerHTML = `
    <div class="loading">

    ${error.message}

    </div>
    `;

}


    }

/* ==========================
Cierre del modal
========================== */

    function cerrarModal() {

    if (!overlay.classList.contains("active")) {
    return;
    }

    overlay.classList.remove("active");

    document.body.style.overflow = "";

    if (document.getElementById("formVentas")) {
    limpiarFormulario();
    }

    if (document.getElementById("formReservacion")) {
    limpiarReservacion();
    }

modalAbierto = false;

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

/* ==========================
Formulario de ventas
========================== */

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
        

        cantidad.oninput = function(){

        cantidad.value = Math.max(1,parseInt(cantidad.value) || 1);

        actualizarTotal();

        };


        if(producto && datos.producto){
            producto.value = datos.producto;

        }

        if(precio && datos.precio){
            precio.value = Number(datos.precio).toFixed(2);

        }

        actualizarTotal();


        const cancelar = document.getElementById("cancelar");

    if (cancelar) {

    cancelar.onclick = cerrarModal;

}

formulario.onsubmit = function(e){

    e.preventDefault();

    alert("Pedido registrado correctamente.");

    limpiarFormulario();

    cerrarModal();

};

    }



    function actualizarTotal(){

        
    const precioInput =
        document.getElementById("precio");

    const cantidadInput =
        document.getElementById("cantidad");

    const totalInput =
        document.getElementById("total");

    if(!precioInput || !cantidadInput || !totalInput){

        return;

    }

    const precio = Number(precioInput.value);

    const cantidad = Number(cantidadInput.value);

    if(isNaN(precio) || isNaN(cantidad)){

        totalInput.value = "";

        return;

    }

    totalInput.value =
        (precio * cantidad).toFixed(2);


    }   



    function limpiarFormulario() {
        const formulario = document.getElementById("formVentas");

        if (!formulario) return;

        formulario.reset();

        const producto = document.getElementById("producto");
        const precio = document.getElementById("precio");
        const cantidad = document.getElementById("cantidad");
        const total = document.getElementById("total");

        if(producto) producto.value = "";
        if(precio) precio.value = "";
        if(cantidad) cantidad.value = 1;
        if(total) total.value = "";
        
    }

/* ==========================
Formulario de reservaciones
========================== */

    function inicializarReservacion(){
        const formulario =
        document.getElementById("formReservacion");

    if(!formulario){

        return;

    }

    formulario.onsubmit = function(e){

    e.preventDefault();

    alert("Reservación registrada correctamente.");

    limpiarReservacion();

    cerrarModal();

};

}

function limpiarReservacion(){
    const formulario =
document.getElementById("formReservacion");

if(formulario){

    formulario.reset();

}

}







