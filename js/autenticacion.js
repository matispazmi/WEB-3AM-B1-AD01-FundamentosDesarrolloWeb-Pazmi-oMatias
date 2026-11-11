"use strict";

// Lee únicamente la información básica de la sesión, nunca la contraseña.
function obtenerSesion() {
  return leerJSON(CONFIGURACION.claves.sesion, null);
}

// Valida la sesión contra la cuenta actual y corrige roles desactualizados.
function obtenerSesionActiva() {
  const sesion = obtenerSesion();
  if (!sesion) return null;

  const usuario = usuarios.find(persona => String(persona.id) === String(sesion.id)
    && persona.activo !== false);

  if (!usuario) {
    localStorage.removeItem(CONFIGURACION.claves.sesion);
    return null;
  }

  const sesionActualizada = {
    id: usuario.id,
    nombre: usuario.nombre,
    correo: usuario.correo,
    rol: usuario.rol
  };

  if (JSON.stringify(sesion) !== JSON.stringify(sesionActualizada)) {
    escribirJSON(CONFIGURACION.claves.sesion, sesionActualizada);
  }

  return sesionActualizada;
}

// Protege páginas y paneles según el rol asignado en la cuenta.
function verificarSesion(rolRequerido) {
  const sesion = obtenerSesionActiva();
  if (!sesion) {
    window.location.href = "login.html?aviso=sesion";
    return null;
  }

  if (rolRequerido && sesion.rol !== rolRequerido) {
    window.location.href = sesion.rol === "admin"
      ? "admin.html#tab-solicitudes"
      : "mis-solicitudes.html";
    return null;
  }

  return sesion;
}

// Comprueba credenciales e inicia la sesión del usuario correspondiente.
function iniciarSesion(evento) {
  evento.preventDefault();

  const correo = document.querySelector("#correo").value.trim().toLowerCase();
  const password = document.querySelector("#password").value;
  const cuenta = usuarios.find(persona => persona.correo.toLowerCase() === correo);
  const error = document.querySelector("#error-login");

  if (!cuenta || cuenta.password !== password) {
    error.textContent = "El correo o la contraseña no son correctos.";
    error.hidden = false;
    return;
  }

  if (cuenta.activo === false) {
    error.textContent = "Esta cuenta está deshabilitada. Contacta al administrador.";
    error.hidden = false;
    return;
  }

  const sesion = {
    id: cuenta.id,
    nombre: cuenta.nombre,
    correo: cuenta.correo,
    rol: cuenta.rol
  };

  if (!escribirJSON(CONFIGURACION.claves.sesion, sesion)) {
    error.textContent = "No se pudo iniciar sesión porque el navegador bloqueó el almacenamiento local.";
    error.hidden = false;
    return;
  }

  window.location.href = cuenta.rol === "admin"
    ? "admin.html#tab-solicitudes"
    : "mis-solicitudes.html";
}

// Registra cuentas nuevas siempre con el rol usuario.
function registrarUsuario(evento) {
  evento.preventDefault();

  const formulario = evento.currentTarget;
  if (!formulario.reportValidity()) return;

  const nombre = formulario.querySelector("#registro-nombre").value.trim();
  const correo = formulario.querySelector("#registro-correo").value.trim().toLowerCase();
  const password = formulario.querySelector("#registro-password").value;
  const confirmar = formulario.querySelector("#registro-confirmar").value;
  const tipoDocumento = formulario.querySelector("#registro-tipo-documento").value;
  const cedula = formulario.querySelector("#registro-cedula").value.trim();
  const telefono = formulario.querySelector("#registro-telefono").value.trim();
  const error = document.querySelector("#error-registro");

  if (usuarios.some(persona => persona.correo.toLowerCase() === correo)) {
    error.textContent = "Ya existe una cuenta con ese correo.";
    error.hidden = false;
    return;
  }

  if (password.length < 8) {
    error.textContent = "La contraseña debe tener al menos 8 caracteres.";
    error.hidden = false;
    return;
  }

  if (password !== confirmar) {
    error.textContent = "Las contraseñas no coinciden.";
    error.hidden = false;
    return;
  }

  if (!validarIdentificacion(tipoDocumento, cedula)) {
    error.textContent = "El documento no coincide con el tipo seleccionado.";
    error.hidden = false;
    return;
  }

  if (!/^\d{10}$/.test(telefono)) {
    error.textContent = "El teléfono celular debe tener exactamente 10 dígitos.";
    error.hidden = false;
    return;
  }

  const nuevoUsuario = {
    id: Date.now(),
    nombre,
    correo,
    password,
    rol: "usuario",
    tipoDocumento,
    cedula,
    telefono,
    activo: true
  };

  // El usuario se agrega al array de trabajo antes de guardar su copia local.
  usuarios.push(nuevoUsuario);
  if (!guardarUsuarios()) {
    usuarios.pop();
    error.textContent = "No se pudo guardar la cuenta. Revisa el almacenamiento del navegador.";
    error.hidden = false;
    return;
  }

  const sesion = {
    id: nuevoUsuario.id,
    nombre: nuevoUsuario.nombre,
    correo: nuevoUsuario.correo,
    rol: "usuario"
  };

  if (!escribirJSON(CONFIGURACION.claves.sesion, sesion)) {
    mostrarFormularioRegistro(false);
    const errorAcceso = document.querySelector("#error-login");
    errorAcceso.textContent = "La cuenta quedó guardada. Inicia sesión con tus datos.";
    errorAcceso.hidden = false;
    document.querySelector("#correo").value = nuevoUsuario.correo;
    return;
  }

  window.location.href = "mantenimiento.html";
}

// Alterna entre los paneles para iniciar sesión y registrarse.
function mostrarFormularioRegistro(mostrar) {
  const panelAcceso = document.querySelector("#panel-acceso");
  const panelRegistro = document.querySelector("#panel-registro");
  if (!panelAcceso || !panelRegistro) return;

  panelAcceso.hidden = mostrar;
  panelRegistro.hidden = !mostrar;
}

// Cierra la sesión activa y vuelve a la página pública.
function cerrarSesion() {
  localStorage.removeItem(CONFIGURACION.claves.sesion);
  window.location.href = "index.html";
}

// Muestra solo los enlaces permitidos al visitante y al rol activo.
function actualizarNavegacion() {
  const sesion = obtenerSesionActiva();

  document.querySelectorAll("[data-sesion]").forEach(elemento => {
    elemento.hidden = !sesion;
  });

  document.querySelectorAll("[data-sin-sesion]").forEach(elemento => {
    elemento.hidden = Boolean(sesion);
  });

  document.querySelectorAll("[data-rol]").forEach(elemento => {
    elemento.hidden = !sesion || elemento.dataset.rol !== sesion.rol;
  });

  const nombre = document.querySelector("[data-nombre-usuario]");
  if (nombre && sesion) nombre.textContent = sesion.nombre;

  document.querySelectorAll("[data-cerrar-sesion]").forEach(boton => {
    boton.addEventListener("click", cerrarSesion);
  });
}

// Inicializa los formularios disponibles en la página actual.
document.addEventListener("DOMContentLoaded", () => {
  actualizarNavegacion();

  const formularioLogin = document.querySelector("#form-login");
  if (formularioLogin) formularioLogin.addEventListener("submit", iniciarSesion);

  const formularioRegistro = document.querySelector("#form-registro");
  if (formularioRegistro) {
    formularioRegistro.addEventListener("submit", registrarUsuario);
    prepararValidacionDocumento(
      formularioRegistro.querySelector("#registro-tipo-documento"),
      formularioRegistro.querySelector("#registro-cedula")
    );
    prepararCampoNumerico(formularioRegistro.querySelector("#registro-telefono"), 10);
  }

  document.querySelectorAll("[data-mostrar-registro]").forEach(enlace => {
    enlace.addEventListener("click", evento => {
      evento.preventDefault();
      mostrarFormularioRegistro(true);
    });
  });

  document.querySelectorAll("[data-mostrar-login]").forEach(enlace => {
    enlace.addEventListener("click", evento => {
      evento.preventDefault();
      mostrarFormularioRegistro(false);
    });
  });

  document.querySelectorAll("[data-toggle-password]").forEach(boton => {
    boton.addEventListener("click", () => {
      const campo = document.getElementById(boton.dataset.togglePassword);
      if (!campo) return;

      const visible = campo.type === "password";
      campo.type = visible ? "text" : "password";
      boton.textContent = visible ? "◉" : "◎";
      boton.setAttribute("aria-label", visible ? "Ocultar contraseña" : "Mostrar contraseña");
      boton.setAttribute("aria-pressed", String(visible));
    });
  });

  const parametros = new URLSearchParams(window.location.search);
  if (parametros.has("aviso")) {
    const error = document.querySelector("#error-login");
    if (error) {
      error.textContent = parametros.get("aviso") === "cuenta"
        ? "Esta cuenta fue deshabilitada o eliminada por el administrador."
        : "Inicia sesión para continuar.";
      error.hidden = false;
    }
  }
});
