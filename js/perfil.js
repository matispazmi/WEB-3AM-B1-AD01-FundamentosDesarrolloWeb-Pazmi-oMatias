"use strict";

// Muestra los datos guardados en la cuenta del usuario activo.
function cargarPerfil() {
  const sesion = verificarSesion();
  if (!sesion) return null;

  const usuario = usuarios.find(persona => persona.id === sesion.id);
  if (!usuario) {
    cerrarSesion();
    return null;
  }

  document.querySelector("#perfil-nombre").value = usuario.nombre;
  document.querySelector("#perfil-nombre-resumen").textContent = usuario.nombre;
  document.querySelector("#perfil-correo").value = usuario.correo;
  document.querySelector("#perfil-tipo-documento").value = usuario.tipoDocumento || "cedula";
  document.querySelector("#perfil-documento").value = usuario.cedula || "";
  document.querySelector("#perfil-telefono").value = usuario.telefono || "";

  prepararValidacionDocumento(
    document.querySelector("#perfil-tipo-documento"),
    document.querySelector("#perfil-documento")
  );
  prepararCampoNumerico(document.querySelector("#perfil-telefono"), 10);

  return usuario;
}

// Actualiza la cuenta y replica los cambios en sus solicitudes históricas.
function actualizarPerfil(evento) {
  evento.preventDefault();

  const formulario = evento.currentTarget;
  if (!formulario.reportValidity()) return;

  const sesion = obtenerSesionActiva();
  const usuario = usuarios.find(persona => persona.id === sesion?.id);
  if (!usuario) {
    window.location.href = "login.html?aviso=cuenta";
    return;
  }

  const datos = new FormData(formulario);
  const tipoDocumento = String(datos.get("tipoDocumento"));
  const documento = String(datos.get("cedula")).trim().toUpperCase();
  const telefono = String(datos.get("telefono")).trim();
  const password = String(datos.get("password") || "");
  const confirmarPassword = String(datos.get("confirmarPassword") || "");

  if (!validarIdentificacion(tipoDocumento, documento)) {
    mostrarNotificacion("El documento no coincide con el tipo seleccionado.", "error");
    return;
  }

  if (!/^\d{10}$/.test(telefono)) {
    mostrarNotificacion("El teléfono celular debe tener exactamente 10 dígitos.", "error");
    return;
  }

  if (password && password.length < 8) {
    mostrarNotificacion("La nueva contraseña debe tener al menos 8 caracteres.", "error");
    return;
  }

  if (password !== confirmarPassword) {
    mostrarNotificacion("Las contraseñas nuevas no coinciden.", "error");
    return;
  }

  // El correo no se lee del formulario ni se modifica en esta función.
  const usuarioAnterior = { ...usuario };
  usuario.nombre = String(datos.get("nombre")).trim();
  usuario.tipoDocumento = tipoDocumento;
  usuario.cedula = documento;
  usuario.telefono = telefono;
  if (password) usuario.password = password;

  if (!guardarUsuarios()) {
    Object.assign(usuario, usuarioAnterior);
    mostrarNotificacion("No se pudo guardar tu perfil en el navegador.", "error");
    return;
  }

  const mantenimientosAnteriores = mantenimientos;
  mantenimientos = mantenimientos.map(item => item.usuarioId === usuario.id
    ? {
      ...item,
      propietario: usuario.nombre,
      tipoDocumento,
      cedula: documento,
      telefono
    }
    : item);

  if (!guardarMantenimientos()) {
    Object.assign(usuario, usuarioAnterior);
    guardarUsuarios();
    mantenimientos = mantenimientosAnteriores;
    mostrarNotificacion("No se pudieron actualizar las solicitudes asociadas a tu perfil.", "error");
    return;
  }

  escribirJSON(CONFIGURACION.claves.sesion, {
    id: usuario.id,
    nombre: usuario.nombre,
    correo: usuario.correo,
    rol: usuario.rol
  });

  guardarHistorial("perfil_actualizado", { id: usuario.id });
  formulario.elements.password.value = "";
  formulario.elements.confirmarPassword.value = "";
  document.querySelector("#perfil-nombre-resumen").textContent = usuario.nombre;
  mostrarNotificacion("Tu perfil se actualizó correctamente.");
}

// Conecta el formulario de perfil cuando termina de cargar la página.
document.addEventListener("DOMContentLoaded", () => {
  const formulario = document.querySelector("#form-perfil");
  if (!formulario) return;

  cargarPerfil();
  formulario.addEventListener("submit", actualizarPerfil);
});
