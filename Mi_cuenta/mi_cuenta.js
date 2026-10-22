/* Mi cuenta: los datos se obtienen exclusivamente de la sesión activa. */
document.addEventListener('DOMContentLoaded', () => {
  const estado = document.getElementById('estadoCuenta');
  const tarjeta = document.getElementById('datosUsuario');
  const aviso = document.getElementById('enlaceLogin');
  const botonSalir = document.getElementById('cerrarSesion');

  async function cargarMiCuenta() {
    estado.hidden = false;
    estado.innerHTML = '<span class="spinner" aria-hidden="true"></span> Comprobando tu sesión...';
    tarjeta.hidden = true; aviso.hidden = true; botonSalir.hidden = true;
    try {
      // Desde Mi_cuenta/ se sube dos niveles hasta /Pupusas_paginaweb/api/.
      const response = await fetch('../../api/sesion.php', {method:'GET',cache:'no-store',credentials:'same-origin'});
      if (!response.ok) throw new Error('El servidor respondió con un error (' + response.status + ').');
      const data = await response.json();
      if (!data.exito || !data.sesion_activa || !data.usuario) {
        estado.textContent = 'No has iniciado sesión. Inicia sesión para consultar tu cuenta.';
        aviso.hidden = false;
        return;
      }
      const user = data.usuario;
      document.getElementById('nombreCompleto').textContent = [user.nombres,user.apellidos].filter(Boolean).join(' ') || 'No registrado';
      document.getElementById('correo').textContent = user.correo || 'No registrado';
      document.getElementById('telefono').textContent = user.telefono || 'No registrado';
      document.getElementById('direccion').textContent = user.direccion || 'No registrada';
      estado.textContent = '¡Bienvenido/a a tu cuenta!';
      tarjeta.hidden = false; botonSalir.hidden = false;
    } catch (error) {
      console.error('Error al cargar Mi cuenta:', error);
      estado.textContent = 'No fue posible cargar tu cuenta. Comprueba que Apache y MySQL estén funcionando y vuelve a intentarlo.';
    }
  }
  botonSalir.addEventListener('click', async () => {
    botonSalir.disabled = true;
    try {
      const response = await fetch('../../api/logout.php',{method:'GET',cache:'no-store',credentials:'same-origin'});
      const data = await response.json();
      if (!response.ok || !data.exito) throw new Error(data.mensaje || 'No fue posible cerrar la sesión.');
      window.location.href = '../pup_lorena.html';
    } catch (error) {
      console.error(error); alert(error.message || 'No fue posible comunicarse con el servidor.'); botonSalir.disabled = false;
    }
  });
  cargarMiCuenta();
});
