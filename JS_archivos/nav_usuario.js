
/* =========================================================
   NAVEGACIÓN Y SESIÓN COMPARTIDAS
   PUPUSAS LORENA
   Control de acceso según el rol del usuario
   ========================================================= */

(() => {

    function iniciarNavegacion() {

        /* =====================================================
           1. CONFIGURACIÓN GENERAL
           ===================================================== */

        const apiBase = "/Pupusas_paginaweb/api/";

        const nav = document.getElementById("usuarioNav");

        if (!nav) return;

        const base = nav.dataset.base || "";

        let tokenCsrf = null;
        let cerrandoSesion = false;


        /* =====================================================
           2. CREAR ENLACES DE NAVEGACIÓN
           ===================================================== */

        function link(href, label, extra = "") {

            const a = document.createElement("a");

            a.href = href;

            a.className =
                "nav-item" + (extra ? " " + extra : "");

            a.textContent = label;

            return a;
        }


        /* =====================================================
           3. MOSTRAR OPCIONES PARA VISITANTES
           ===================================================== */

        function mostrarVisitante() {

            nav.replaceChildren();

            nav.append(
                link(
                    base + "Inicio_sesion/login.html",
                    "Iniciar sesión"
                )
            );

            nav.append(
                link(
                    base + "Registro_usuario/Registro_user.html",
                    "Crear cuenta"
                )
            );
        }


        /* =====================================================
           4. CERRAR SESIÓN
           ===================================================== */

        async function cerrarSesion(event) {

            event.preventDefault();

            if (cerrandoSesion) return;

            if (
                typeof tokenCsrf !== "string" ||
                !/^[a-f0-9]{64}$/.test(tokenCsrf)
            ) {

                alert(
                    "No se pudo validar la seguridad de la sesión. Recarga la página e inténtalo nuevamente."
                );

                return;
            }

            const confirmar = window.confirm(
                "¿Estás seguro de que deseas cerrar tu sesión?"
            );

            if (!confirmar) return;

            cerrandoSesion = true;

            const boton = event.currentTarget;

            if (boton) {
                boton.style.pointerEvents = "none";
                boton.textContent = "Cerrando sesión...";
            }

            try {

                const response = await fetch(
                    apiBase + "logout.php",
                    {
                        method: "POST",

                        credentials: "same-origin",

                        cache: "no-store",

                        headers: {
                            "Accept": "application/json",
                            "X-CSRF-Token": tokenCsrf
                        }
                    }
                );

                const data = await response.json();

                if (!response.ok || !data.exito) {

                    throw new Error(
                        data.mensaje ||
                        "No fue posible cerrar la sesión."
                    );
                }

                window.location.replace(
                    base + "pup_lorena.html"
                );

            } catch (error) {

                console.error(
                    "Error al cerrar sesión:",
                    error
                );

                alert(
                    error.message ||
                    "No fue posible comunicarse con el servidor."
                );

                cerrandoSesion = false;

                if (boton) {
                    boton.style.pointerEvents = "";
                    boton.textContent = "Cerrar sesión";
                }
            }
        }


        /* =====================================================
           5. MOSTRAR NAVEGACIÓN SEGÚN EL ROL
           ===================================================== */

        function mostrarUsuario(usuario, rol) {

            nav.replaceChildren();

            const saludo = document.createElement("span");

            saludo.className = "nav-item usuario-nombre";

            saludo.textContent =
                "Hola, " + (usuario.nombres || "usuario");

            nav.append(saludo);


            // MI CUENTA: ambos roles.

            nav.append(
                link(
                    base + "Mi_cuenta/mi_cuenta.html",
                    "Mi cuenta"
                )
            );


            // PANEL DE ADMINISTRACIÓN: solo Administrador.

            if (rol === "Administrador") {

                nav.append(
                    link(
                        base + "Administracion/index.html",
                        "Panel de administración"
                    )
                );
            }


            // CERRAR SESIÓN.

            const salir = link(
                "#",
                "Cerrar sesión"
            );

            salir.addEventListener(
                "click",
                cerrarSesion
            );

            nav.append(salir);
        }


        /* =====================================================
           6. CONSULTAR SESIÓN ACTUAL
           ===================================================== */

        async function actualizar() {

            nav.replaceChildren();

            try {

                const response = await fetch(
                    apiBase + "sesion.php?_=" + Date.now(),
                    {
                        method: "GET",

                        credentials: "same-origin",

                        cache: "no-store",

                        headers: {
                            "Accept": "application/json"
                        }
                    }
                );

                if (!response.ok) {

                    throw new Error(
                        "No se pudo consultar la sesión."
                    );
                }

                const data = await response.json();


                // COMPROBAR SI EXISTE UNA SESIÓN.

                if (
                    !data.exito ||
                    !data.sesion_activa ||
                    !data.usuario
                ) {

                    tokenCsrf = null;

                    mostrarVisitante();

                    return;
                }


                // COMPROBAR CAMBIO OBLIGATORIO DE CONTRASEÑA.

                if (data.requiere_cambio_password) {

                    window.location.replace(
                        base + "Mi_cuenta/cambiar_password.html"
                    );

                    return;
                }


                // COMPROBAR ROL.

                const rol = data.usuario.rol;

                if (
                    rol !== "Cliente" &&
                    rol !== "Administrador"
                ) {

                    throw new Error(
                        "La cuenta tiene un rol no válido."
                    );
                }


                // VALIDAR TOKEN CSRF.

                if (
                    typeof data.token_csrf !== "string" ||
                    !/^[a-f0-9]{64}$/.test(data.token_csrf)
                ) {

                    throw new Error(
                        "No se recibió un token CSRF válido."
                    );
                }

                tokenCsrf = data.token_csrf;


                // MOSTRAR NAVEGACIÓN SEGÚN EL ROL.

                mostrarUsuario(
                    data.usuario,
                    rol
                );

            } catch (error) {

                console.error(
                    "No se pudo consultar la sesión:",
                    error
                );

                tokenCsrf = null;

                nav.replaceChildren();

                const aviso = document.createElement("span");

                aviso.className = "nav-item";

                aviso.textContent =
                    "No se pudo verificar la sesión.";

                nav.append(aviso);

                nav.append(
                    link(
                        base + "Inicio_sesion/login.html",
                        "Iniciar sesión"
                    )
                );

                nav.append(
                    link(
                        base + "Registro_usuario/Registro_user.html",
                        "Crear cuenta"
                    )
                );
            }
        }


        /* =====================================================
           7. ACTUALIZAR NAVEGACIÓN
           ===================================================== */

        actualizar();
    }


    /* =========================================================
       8. INICIAR CUANDO EL DOCUMENTO ESTÉ DISPONIBLE
       ========================================================= */

    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            iniciarNavegacion
        );

    } else {

        iniciarNavegacion();
    }

})();
