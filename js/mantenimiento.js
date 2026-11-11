"use strict";

// Valida los datos del vehículo y la disponibilidad de la fecha.
function validarFormulario(formulario) {
  const datos = new FormData(formulario);
  const placa = String(datos.get("placa") || "").trim().toUpperCase();
  const fecha = String(datos.get("fecha") || "");

  if (!formulario.reportValidity()) return false;

  if (!/^[A-Z0-9-]{5,10}$/.test(placa)) {
    mostrarNotificacion("La placa debe tener entre 5 y 10 letras, números o guiones.", "error");
    return false;
  }

  const anio = Number(datos.get("anio"));
  if (anio < 1950 || anio > new Date().getFullYear() + 1) {
    mostrarNotificacion("Revisa el año de fabricación.", "error");
    return false;
  }

  if (fecha < fechaLocalISO()) {
    mostrarNotificacion("La fecha solicitada no puede ser anterior a hoy.", "error");
    return false;
  }

  return true;
}

// Crea la solicitud usando los datos de la cuenta, sin pedirlos otra vez.
function agregarMantenimiento(evento) {
  evento.preventDefault();

  const formulario = evento.currentTarget;
  const sesion = verificarSesion();
  if (!sesion || !validarFormulario(formulario)) return;

  const datos = new FormData(formulario);
  const usuarioId = sesion.rol === "admin"
    ? Number(datos.get("usuarioId"))
    : sesion.id;
  const usuario = usuarios.find(persona => persona.id === usuarioId
    && persona.activo !== false
    && persona.rol === "usuario");

  if (!usuario) {
    mostrarNotificacion("Selecciona una cuenta de cliente activa para esta solicitud.", "error");
    return;
  }

  const mantenimiento = {
    id: generarId(),
    usuarioId: usuario.id,
    propietario: usuario.nombre,
    tipoDocumento: usuario.tipoDocumento,
    cedula: usuario.cedula,
    correo: usuario.correo,
    telefono: usuario.telefono,
    vehiculo: {
      marca: String(datos.get("marca")).trim(),
      modelo: String(datos.get("modelo")).trim(),
      anio: Number(datos.get("anio")),
      placa: String(datos.get("placa")).trim().toUpperCase(),
      kilometraje: Number(datos.get("kilometraje"))
    },
    tipoMantenimiento: String(datos.get("tipoMantenimiento")),
    fecha: String(datos.get("fecha")),
    horaRevision: String(datos.get("horaRevision")),
    jornada: String(datos.get("jornada")),
    confirmacion: datos.has("confirmacion"),
    descripcion: String(datos.get("descripcion")).trim(),
    observaciones: String(datos.get("observaciones") || "").trim(),
    estado: "Pendiente",
    activa: true,
    creado: new Date().toISOString()
  };

  // Primero se agrega al array en memoria. Después se guarda una copia local.
  mantenimientos.push(mantenimiento);

  if (!guardarMantenimientos()) {
    mantenimientos.pop();
    mostrarNotificacion("No se pudo conservar la solicitud. Inténtalo de nuevo.", "error");
    return;
  }

  guardarHistorial("creado", mantenimiento);
  formulario.reset();
  rellenarDatosUsuario();
  mostrarNotificacion(`Solicitud ${mantenimiento.id} registrada correctamente.`);
}

// Prepara el selector que el administrador usa para asignar una solicitud.
function rellenarDatosUsuario() {
  const sesion = obtenerSesionActiva();
  if (!sesion) return;

  const selector = document.querySelector("#usuario-solicitud");
  const contenedorSelector = document.querySelector("#selector-usuario-admin");
  let propietario = usuarios.find(persona => persona.id === sesion.id);

  if (sesion.rol === "admin" && selector) {
    contenedorSelector.hidden = false;
    selector.required = true;

    const clientes = usuarios.filter(persona => persona.rol === "usuario"
      && persona.activo !== false);

    selector.innerHTML = [
      '<option value="">Selecciona una cuenta de cliente</option>',
      ...clientes.map(cliente => `<option value="${escaparHTML(cliente.id)}">${escaparHTML(cliente.nombre)} · ${escaparHTML(cliente.correo)}</option>`)
    ].join("");

    if (clientes.length > 0) {
      selector.value = String(clientes[0].id);
      propietario = clientes[0];
    } else {
      propietario = null;
    }

    if (selector.dataset.eventoConfigurado !== "true") {
      selector.addEventListener("change", () => {
        const seleccionado = usuarios.find(persona => String(persona.id) === selector.value);
        mostrarDatosPropietario(seleccionado);
      });
      selector.dataset.eventoConfigurado = "true";
    }
  } else if (contenedorSelector) {
    contenedorSelector.hidden = true;
  }

  mostrarDatosPropietario(propietario);
}

// Muestra información de la cuenta; nunca permite editarla en este formulario.
function mostrarDatosPropietario(propietario) {
  const resumen = document.querySelector("#resumen-propietario");
  if (!resumen) return;

  if (!propietario) {
    resumen.hidden = true;
    return;
  }

  const tiposDocumento = {
    cedula: "Cédula",
    pasaporte: "Pasaporte",
    ruc: "RUC"
  };

  document.querySelector("#resumen-nombre").textContent = propietario.nombre;
  document.querySelector("#resumen-documento").textContent =
    `${tiposDocumento[propietario.tipoDocumento] || "Documento"}: ${propietario.cedula || "Sin registrar"}`;
  document.querySelector("#resumen-correo").textContent = propietario.correo;
  document.querySelector("#resumen-telefono").textContent = propietario.telefono || "Sin registrar";
  resumen.hidden = false;
}

// Lista solo los mantenimientos que pertenecen a la sesión activa.
function listarMantenimientos() {
  const sesion = obtenerSesionActiva();
  if (!sesion) return;

  const contenedor = document.querySelector("#mis-solicitudes");
  if (!contenedor) return;

  const propias = mantenimientos.filter(item => item.usuarioId === sesion.id);

  if (propias.length === 0) {
    contenedor.innerHTML = `
      <div class="vacio">
        <span>🔧</span>
        <h3>Aún no tienes solicitudes</h3>
        <p>Registra tu primer mantenimiento y aquí podrás seguir su estado.</p>
        <a class="boton boton-primario" href="mantenimiento.html">Solicitar mantenimiento</a>
      </div>`;
    return;
  }

  contenedor.innerHTML = propias.map(item => {
    const cancelada = item.estado === "Cancelado";
    const desactivada = item.activa === false;
    const claseEstado = desactivada
      ? "estado-inactiva"
      : `estado-${item.estado.toLowerCase().replaceAll(" ", "-")}`;
    const textoEstado = desactivada ? "Desactivada" : item.estado;
    const puedeCancelar = item.estado === "Pendiente" && !desactivada;

    return `
      <article class="solicitud-card">
        <div class="solicitud-top">
          <span class="id-tag">${escaparHTML(item.id)}</span>
          <span class="estado ${claseEstado}">${escaparHTML(textoEstado)}</span>
        </div>
        <h3>${escaparHTML(item.tipoMantenimiento)}</h3>
        <p>${escaparHTML(item.vehiculo.marca)} ${escaparHTML(item.vehiculo.modelo)} · ${escaparHTML(item.vehiculo.placa)}</p>
        <div class="solicitud-meta">
          <span>📅 ${escaparHTML(item.fecha)} · ◷ ${escaparHTML(item.horaRevision || "—")}</span>
          <span>🛠 ${Number(item.vehiculo.kilometraje).toLocaleString("es-EC")} km</span>
        </div>
        <p class="muted">${escaparHTML(item.descripcion)}</p>
        ${puedeCancelar ? `<button class="boton boton-cancelar" type="button" data-cancelar-solicitud="${escaparHTML(item.id)}">Cancelar solicitud</button>` : ""}
        ${cancelada ? '<p class="solicitud-cancelada">Esta solicitud fue cancelada.</p>' : ""}
      </article>`;
  }).join("");
}

// El cliente solo puede cancelar una solicitud propia que siga pendiente.
async function cancelarSolicitud(id) {
  const sesion = obtenerSesionActiva();
  const solicitud = mantenimientos.find(item => String(item.id) === String(id));

  if (!sesion || !solicitud || solicitud.usuarioId !== sesion.id) return;
  if (solicitud.estado !== "Pendiente" || solicitud.activa === false) {
    mostrarNotificacion("Solo puedes cancelar solicitudes pendientes.", "advertencia");
    return;
  }

  const confirma = await confirmarAccion(
    "La solicitud permanecerá en tu historial con estado Cancelado.",
    "¿Cancelar esta solicitud?",
    "Sí, cancelar"
  );
  if (!confirma) return;

  solicitud.estado = "Cancelado";
  if (!guardarMantenimientos()) {
    solicitud.estado = "Pendiente";
    mostrarNotificacion("No se pudo cancelar la solicitud.", "error");
    return;
  }

  guardarHistorial("solicitud_cancelada", solicitud);
  listarMantenimientos();
  mostrarNotificacion("La solicitud fue cancelada.");
}

// Conecta los eventos una vez que el documento está listo.
document.addEventListener("DOMContentLoaded", () => {
  const formulario = document.querySelector("#form-mantenimiento");

  if (formulario) {
    if (!verificarSesion()) return;

    formulario.addEventListener("submit", agregarMantenimiento);

    const fecha = formulario.querySelector('[name="fecha"]');
    if (fecha) fecha.min = fechaLocalISO();

    const anio = formulario.querySelector('[name="anio"]');
    if (anio) anio.max = String(new Date().getFullYear() + 1);

    rellenarDatosUsuario();
  }

  const contenedorSolicitudes = document.querySelector("#mis-solicitudes");
  if (contenedorSolicitudes) {
    if (!verificarSesion()) return;

    contenedorSolicitudes.addEventListener("click", evento => {
      const boton = evento.target.closest("[data-cancelar-solicitud]");
      if (boton) cancelarSolicitud(boton.dataset.cancelarSolicitud);
    });

    listarMantenimientos();
  }
});
