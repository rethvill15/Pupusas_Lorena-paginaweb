/* Navegación y sesión compartidas por todas las páginas principales */
(() => {
  const apiBase = '/Pupusas_paginaweb/api/';
  const nav = document.getElementById('usuarioNav');
  if (!nav) return;
  const base = nav.dataset.base || '';
  const link = (href, label, extra='') => {
    const a = document.createElement('a'); a.href = href; a.className = 'nav-item' + (extra ? ' '+extra : ''); a.textContent = label; return a;
  };
  async function cerrarSesion(event) {
    event.preventDefault();
    try {
      const response = await fetch(apiBase + 'logout.php', {method:'GET', cache:'no-store', credentials:'same-origin'});
      const data = await response.json();
      if (!response.ok || !data.exito) throw new Error(data.mensaje || 'No fue posible cerrar la sesión.');
      window.location.href = base + 'pup_lorena.html';
    } catch (error) { console.error(error); alert(error.message || 'No fue posible comunicarse con el servidor.'); }
  }
  async function actualizar() {
    nav.replaceChildren();
    try {
      const response = await fetch(apiBase + 'sesion.php', {cache:'no-store', credentials:'same-origin'});
      const data = await response.json();
      if (response.ok && data.exito && data.sesion_activa && data.usuario) {
        const saludo = document.createElement('span'); saludo.className='nav-item usuario-nombre'; saludo.textContent='Hola, ' + (data.usuario.nombres || 'usuario'); nav.append(saludo);
        nav.append(link(base+'Mi_cuenta/mi_cuenta.html','Mi cuenta'));
        const salir = link('#','Cerrar sesión'); salir.addEventListener('click', cerrarSesion); nav.append(salir);
      } else {
        nav.append(link(base+'Inicio_sesion/login.html','Iniciar sesión'));
        nav.append(link(base+'Registro_usuario/Registro_user.html','Crear cuenta'));
      }
    } catch (error) {
      console.error('No se pudo consultar la sesión:', error);
      nav.append(link(base+'Inicio_sesion/login.html','Iniciar sesión'));
      nav.append(link(base+'Registro_usuario/Registro_user.html','Crear cuenta'));
    }
  }
  document.addEventListener('DOMContentLoaded', actualizar);
})();
