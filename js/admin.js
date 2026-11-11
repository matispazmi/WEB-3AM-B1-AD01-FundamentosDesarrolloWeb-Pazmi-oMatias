"use strict";

// Filtra las solicitudes por propietario, placa y estado.
function buscarMantenimiento(texto, estado) {
  const consulta = texto.trim().toLowerCase();

  return mantenimientos.filter(item => {
    const coincideTexto = !consulta
      || item.propietario.toLowerCase().includes(consulta)
      || item.vehiculo.placa.toLowerCase().includes(consulta);
    const coincideEstado = estado === "Desactivada"
      ? item.activa === false
      : !estado || estado === "Todos" || (item.activa !== false && item.estado === estado);

    return coincideTexto && coincideEstado;
  });
}

// Actualiza las tarjetas de resumen del dashboard.
function actualizarIndicadores(lista) {
  const activas = lista.filter(item => item.activa !== false);

  document.querySelector("#total-registros").textContent = lista.length;
  document.querySelector("#total-pendientes").textContent =
    activas.filter(item => item.estado === "Pendiente").length;
  document.querySelector("#total-proceso").textContent =
    activas.filter(item => item.estado === "En proceso").length;
  document.querySelector("#total-finalizados").textContent =
    activas.filter(item => item.estado === "Finalizado").length;
}

// Dibuja la tabla de solicitudes desde el array de mantenimientos.
function renderizarTabla() {
  const busqueda = document.querySelector("#busqueda")?.value || "";
  const estado = document.querySelector("#filtro-estado")?.value || "Todos";
  const lista = buscarMantenimiento(busqueda, estado);
  actualizarIndicadores(mantenimientos);

  const cuerpo = document.querySelector("#tabla-mantenimientos");
  if (!cuerpo) return;

  if (lista.length === 0) {
    cuerpo.innerHTML = '<tr><td class="tabla-vacia" colspan="9">No hay solicitudes que coincidan con la búsqueda.</td></tr>';
    return;
  }

  cuerpo.innerHTML = lista.map(item => {
    const activa = item.activa !== false;
    const estadoTexto = activa ? item.estado : "Desactivada";
    const claseEstado = activa
      ? `estado-${item.estado.toLowerCase().replaceAll(" ", "-")}`
      : "estado-inactiva";

    return `
      <tr class="${activa ? "" : "fila-desactivada"}">
        <td><span class="id-tag">${escaparHTML(item.id)}</span></td>
        <td><strong>👤 ${escaparHTML(item.propietario)}</strong><small>${escaparHTML(item.correo)}</small></td>
        <td>🔖 ${escaparHTML(item.vehiculo.placa)}</td>
        <td>🚘 ${escaparHTML(item.vehiculo.marca)} ${escaparHTML(item.vehiculo.modelo)}</td>
        <td>🛠 ${escaparHTML(item.tipoMantenimiento)}</td>
        <td>📅 ${escaparHTML(item.fecha)}</td>
        <td>◷ ${escaparHTML(item.horaRevision || "—")}</td>
        <td><span class="estado ${claseEstado}">${escaparHTML(estadoTexto)}</span></td>
        <td>
          <div class="acciones">
            <button class="icono-boton" data-accion="ver" data-id="${escaparHTML(item.id)}" aria-label="Ver solicitud">👁</button>
            <button class="icono-boton" data-accion="editar" data-id="${escaparHTML(item.id)}" aria-label="Editar solicitud">✎</button>
            <button class="icono-boton ${activa ? "peligro" : "activar"}" data-accion="toggle" data-id="${escaparHTML(item.id)}" aria-label="${activa ? "Desactivar" : "Activar"} solicitud">${activa ? "⏻" : "⏽"}</button>
            <button class="icono-boton peligro" data-accion="eliminar" data-id="${escaparHTML(item.id)}" aria-label="Eliminar solicitud">×</button>
          </div>
        </td>
      </tr>`;
  }).join("");
}

// Dibuja el directorio de cuentas para el CRUD de usuarios.
function renderizarUsuarios() {
  const cuerpo = document.querySelector("#tabla-usuarios");
  if (!cuerpo) return;

  const sesion = obtenerSesionActiva();
  const administradores = usuarios.filter(usuario => usuario.rol === "admin"
    && usuario.activo !== false).length;

  cuerpo.innerHTML = usuarios.length ? usuarios.map(usuario => {
    const tipos = { cedula: "Cédula", pasaporte: "Pasaporte", ruc: "RUC" };
    const documento = usuario.cedula
      ? `${tipos[usuario.tipoDocumento] || "Documento"}: ${usuario.cedula}`
      : "Pendiente de registrar";
    const activa = usuario.activo !== false;
    const esAdminActual = usuario.rol === "admin"
      && String(usuario.id) === String(sesion?.id);
    const bloqueado = esAdminActual
      || (usuario.rol === "admin" && activa && administradores <= 1);

    return `
      <tr class="${activa ? "" : "fila-desactivada"}">
        <td><strong>👤 ${escaparHTML(usuario.nombre)}</strong><small>ID ${escaparHTML(usuario.id)}</small></td>
        <td>🪪 ${escaparHTML(documento)}</td>
        <td>✉ ${escaparHTML(usuario.correo)}</td>
        <td>☎ ${escaparHTML(usuario.telefono || "Pendiente de registrar")}</td>
        <td><span class="rol-tag">${usuario.rol === "admin" ? "🛡 Administrador" : "🚗 Usuario"}</span></td>
        <td><span class="estado ${activa ? "estado-finalizado" : "estado-inactiva"}">${activa ? "Activa" : "Deshabilitada"}</span></td>
        <td>
          <div class="acciones">
            <button class="icono-boton" data-accion-usuario="editar" data-id="${escaparHTML(usuario.id)}" aria-label="Editar cuenta">✎</button>
            <button class="icono-boton ${activa ? "peligro" : "activar"}" data-accion-usuario="toggle" data-id="${escaparHTML(usuario.id)}" aria-label="${activa ? "Deshabilitar" : "Habilitar"} cuenta" ${bloqueado ? "disabled" : ""}>${activa ? "⏻" : "⏽"}</button>
            <button class="icono-boton peligro" data-accion-usuario="eliminar" data-id="${escaparHTML(usuario.id)}" aria-label="Eliminar cuenta" ${bloqueado ? "disabled" : ""}>×</button>
          </div>
        </td>
      </tr>`;
  }).join("") : '<tr><td class="tabla-vacia" colspan="7">Todavía no hay usuarios registrados.</td></tr>';
}

// Abre el formulario para editar la información de una cuenta.
function abrirEdicionUsuario(id) {
  const usuario = usuarios.find(registro => String(registro.id) === String(id));
  if (!usuario) return;

  const admin = obtenerSesionActiva();
  const tipoActual = usuario.tipoDocumento || "cedula";
  document.querySelector("#usuario-dialogo-icono").textContent = "✎";
  document.querySelector("#usuario-dialogo-contexto").textContent = "EDICIÓN DE CUENTA";
  document.querySelector("#usuario-dialogo-titulo").textContent = `Editar ${usuario.nombre}`;
  document.querySelector("#usuario-dialogo-operador").textContent =
    `Modificado por ${admin?.nombre || "Administrador"}`;

  const contenido = document.querySelector("#contenido-dialogo-usuario");
  contenido.innerHTML = `
    <form id="form-edicion-usuario" class="form-grid">
      <label>👤 Nombre completo
        <input name="nombre" required maxlength="90" value="${escaparHTML(usuario.nombre)}">
      </label>
      <label>✉ Correo electrónico
        <input name="correo" type="email" required value="${escaparHTML(usuario.correo)}">
      </label>
      <label>🪪 Tipo de documento
        <select name="tipoDocumento">
          <option value="cedula" ${tipoActual === "cedula" ? "selected" : ""}>Cédula</option>
          <option value="pasaporte" ${tipoActual === "pasaporte" ? "selected" : ""}>Pasaporte</option>
          <option value="ruc" ${tipoActual === "ruc" ? "selected" : ""}>RUC</option>
        </select>
      </label>
      <label>🔢 Número de documento
        <input name="cedula" required value="${escaparHTML(usuario.cedula || "")}">
      </label>
      <label>☎ Teléfono celular (10 dígitos)
        <input name="telefono" inputmode="numeric" maxlength="10" pattern="[0-9]{10}" required value="${escaparHTML(usuario.telefono || "")}">
      </label>
      <label>🛡 Rol asignado
        <input value="${usuario.rol === "admin" ? "Administrador" : "Usuario"}" readonly>
      </label>
      <p class="ayuda-rol ancho-completo">El rol se conserva tal como está.</p>
    </form>`;

  const formulario = contenido.querySelector("#form-edicion-usuario");
  prepararValidacionDocumento(formulario.elements.tipoDocumento, formulario.elements.cedula);
  prepararCampoNumerico(formulario.elements.telefono, 10);
  document.querySelector("#guardar-usuario").onclick = () => guardarEdicionUsuario(usuario.id);
  document.querySelector("#dialogo-usuario").showModal();
}

// Guarda cambios del usuario y actualiza sus solicitudes asociadas.
function guardarEdicionUsuario(id) {
  const formulario = document.querySelector("#form-edicion-usuario");
  if (!formulario.reportValidity()) return;

  const datos = new FormData(formulario);
  const usuario = usuarios.find(registro => String(registro.id) === String(id));
  if (!usuario) return;

  const correo = String(datos.get("correo")).trim().toLowerCase();
  const correoDuplicado = usuarios.some(otro => String(otro.id) !== String(id)
    && otro.correo.toLowerCase() === correo);

  if (correoDuplicado) {
    mostrarNotificacion("Ya existe otra cuenta con ese correo.", "error");
    return;
  }

  const tipoDocumento = String(datos.get("tipoDocumento"));
  const cedula = String(datos.get("cedula")).trim().toUpperCase();
  const telefono = String(datos.get("telefono")).trim();

  if (!validarIdentificacion(tipoDocumento, cedula)) {
    mostrarNotificacion("El documento no coincide con el tipo seleccionado.", "error");
    return;
  }

  if (!/^\d{10}$/.test(telefono)) {
    mostrarNotificacion("El teléfono celular debe tener exactamente 10 dígitos.", "error");
    return;
  }

  const usuarioAnterior = { ...usuario };
  const mantenimientosAnteriores = mantenimientos;
  Object.assign(usuario, {
    nombre: String(datos.get("nombre")).trim(),
    correo,
    tipoDocumento,
    cedula,
    telefono
  });

  mantenimientos = mantenimientos.map(item => item.usuarioId === usuario.id
    ? {
      ...item,
      propietario: usuario.nombre,
      correo: usuario.correo,
      tipoDocumento,
      cedula,
      telefono
    }
    : item);

  if (!guardarUsuarios()) {
    Object.assign(usuario, usuarioAnterior);
    mantenimientos = mantenimientosAnteriores;
    mostrarNotificacion("No se pudieron guardar los cambios de la cuenta.", "error");
    return;
  }

  if (!guardarMantenimientos()) {
    Object.assign(usuario, usuarioAnterior);
    guardarUsuarios();
    mantenimientos = mantenimientosAnteriores;
    mostrarNotificacion("No se pudieron actualizar las solicitudes de esta cuenta.", "error");
    return;
  }

  if (String(obtenerSesionActiva()?.id) === String(usuario.id)) {
    escribirJSON(CONFIGURACION.claves.sesion, {
      id: usuario.id,
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol
    });
  }

  guardarHistorial("cuenta_editada", { id: usuario.id });
  document.querySelector("#dialogo-usuario").close();
  renderizarUsuarios();
  mostrarNotificacion("Los datos de la cuenta fueron actualizados.");
}

// Habilita o deshabilita una cuenta desde el panel administrativo.
async function cambiarEstadoUsuario(id) {
  const usuario = usuarios.find(registro => String(registro.id) === String(id));
  if (!usuario) return;

  const sesion = obtenerSesionActiva();
  const activaAnterior = usuario.activo !== false;
  const administradoresActivos = usuarios.filter(persona => persona.rol === "admin"
    && persona.activo !== false).length;

  if (usuario.rol === "admin" && String(usuario.id) === String(sesion?.id)) {
    mostrarNotificacion("No puedes deshabilitar la cuenta administradora de esta sesión.", "error");
    return;
  }

  if (activaAnterior && usuario.rol === "admin" && administradoresActivos <= 1) {
    mostrarNotificacion("Debe quedar al menos una cuenta administradora habilitada.", "error");
    return;
  }

  if (activaAnterior && !await confirmarAccion(
    `La cuenta de ${usuario.nombre} no podrá iniciar sesión hasta que la habilites.`,
    "¿Deshabilitar esta cuenta?",
    "Deshabilitar"
  )) return;

  usuario.activo = !activaAnterior;
  if (!guardarUsuarios()) {
    usuario.activo = activaAnterior;
    mostrarNotificacion("No se pudo guardar el estado de la cuenta.", "error");
    return;
  }

  guardarHistorial(usuario.activo ? "cuenta_habilitada" : "cuenta_deshabilitada", { id: usuario.id });
  renderizarUsuarios();
  mostrarNotificacion(usuario.activo ? "Cuenta habilitada." : "Cuenta deshabilitada.");
}

// Elimina una cuenta, manteniendo el historial de sus mantenimientos.
async function eliminarCuentaUsuario(id) {
  const usuario = usuarios.find(registro => String(registro.id) === String(id));
  if (!usuario) return;

  const sesion = obtenerSesionActiva();
  const administradoresActivos = usuarios.filter(persona => persona.rol === "admin"
    && persona.activo !== false).length;

  if (usuario.rol === "admin" && String(usuario.id) === String(sesion?.id)) {
    mostrarNotificacion("No puedes eliminar la cuenta con la que tienes iniciada esta sesión.", "error");
    return;
  }

  if (usuario.rol === "admin" && usuario.activo !== false && administradoresActivos <= 1) {
    mostrarNotificacion("Debe quedar al menos una cuenta administradora habilitada.", "error");
    return;
  }

  const confirma = await confirmarAccion(
    `Las solicitudes históricas de ${usuario.nombre} se conservarán para el administrador.`,
    `¿Eliminar la cuenta de ${usuario.nombre}?`,
    "Eliminar cuenta"
  );
  if (!confirma) return;

  const indice = usuarios.findIndex(persona => String(persona.id) === String(id));
  const [eliminado] = usuarios.splice(indice, 1);

  if (!guardarUsuarios()) {
    usuarios.splice(indice, 0, eliminado);
    mostrarNotificacion("No se pudo eliminar la cuenta del almacenamiento local.", "error");
    return;
  }

  guardarHistorial("cuenta_eliminada", { id: usuario.id });
  renderizarUsuarios();
  mostrarNotificacion("Cuenta eliminada. Las solicitudes anteriores se conservaron.");
}

function procesarAccionUsuario(evento) {
  const boton = evento.target.closest("button[data-accion-usuario]");
  if (!boton || boton.disabled) return;

  const accion = boton.dataset.accionUsuario;
  if (accion === "editar") abrirEdicionUsuario(boton.dataset.id);
  if (accion === "toggle") cambiarEstadoUsuario(boton.dataset.id);
  if (accion === "eliminar") eliminarCuentaUsuario(boton.dataset.id);
}

// Abre una vista o el formulario de edición del mantenimiento.
function abrirDetalle(mantenimiento, modo) {
  const dialogo = document.querySelector("#dialogo-mantenimiento");
  const admin = obtenerSesionActiva();
  const lectura = modo === "ver";

  document.querySelector("#dialogo-icono").textContent = lectura ? "👁" : "✎";
  document.querySelector("#dialogo-contexto").textContent = lectura
    ? "VISTA DE SOLICITUD"
    : "EDICIÓN DE SOLICITUD";
  document.querySelector("#dialogo-titulo").textContent =
    `${lectura ? "Solicitud" : "Editar solicitud"} ${mantenimiento.id}`;
  document.querySelector("#dialogo-operador").textContent =
    `Atendido por ${admin?.nombre || "Administrador"}`;

  const area = document.querySelector("#contenido-dialogo");

  if (lectura) {
    const tipoDocumento = { cedula: "Cédula", pasaporte: "Pasaporte", ruc: "RUC" };
    area.innerHTML = `
      <div class="detalle-grid">
        <div><span>👤 Propietario</span><strong>${escaparHTML(mantenimiento.propietario)}</strong></div>
        <div><span>🪪 ${tipoDocumento[mantenimiento.tipoDocumento] || "Documento"}</span><strong>${escaparHTML(mantenimiento.cedula)}</strong></div>
        <div><span>✉ Correo</span><strong>${escaparHTML(mantenimiento.correo)}</strong></div>
        <div><span>☎ Teléfono</span><strong>${escaparHTML(mantenimiento.telefono)}</strong></div>
        <div><span>🚘 Vehículo</span><strong>${escaparHTML(mantenimiento.vehiculo.marca)} ${escaparHTML(mantenimiento.vehiculo.modelo)} (${mantenimiento.vehiculo.anio})</strong></div>
        <div><span>🔖 Placa y kilometraje</span><strong>${escaparHTML(mantenimiento.vehiculo.placa)} · ${Number(mantenimiento.vehiculo.kilometraje).toLocaleString("es-EC")} km</strong></div>
        <div><span>🛠 Servicio</span><strong>${escaparHTML(mantenimiento.tipoMantenimiento)}</strong></div>
        <div><span>📅 Fecha y hora</span><strong>${escaparHTML(mantenimiento.fecha)} · ${escaparHTML(mantenimiento.horaRevision || "Sin hora")} · ${escaparHTML(mantenimiento.jornada || "Sin preferencia")}</strong></div>
        <div><span>● Estado</span><strong>${mantenimiento.activa === false ? "Desactivada" : escaparHTML(mantenimiento.estado)}</strong></div>
        <div class="detalle-ancho"><span>📝 Descripción</span><strong>${escaparHTML(mantenimiento.descripcion)}</strong></div>
        <div class="detalle-ancho"><span>💬 Observaciones</span><strong>${escaparHTML(mantenimiento.observaciones || "Sin observaciones")}</strong></div>
      </div>`;
    document.querySelector("#guardar-edicion").hidden = true;
  } else {
    const estados = ESTADOS.map(estado => `
      <option ${estado === mantenimiento.estado ? "selected" : ""}>${escaparHTML(estado)}</option>`).join("");

    area.innerHTML = `
      <form id="form-edicion" class="form-grid">
        <label>🚘 Marca<input name="marca" required value="${escaparHTML(mantenimiento.vehiculo.marca)}"></label>
        <label>🚘 Modelo<input name="modelo" required value="${escaparHTML(mantenimiento.vehiculo.modelo)}"></label>
        <label>📆 Año<input name="anio" type="number" min="1950" max="${new Date().getFullYear() + 1}" required value="${mantenimiento.vehiculo.anio}"></label>
        <label>🔖 Placa<input name="placa" required pattern="[A-Za-z0-9-]{5,10}" value="${escaparHTML(mantenimiento.vehiculo.placa)}"></label>
        <label>🛞 Kilometraje<input name="kilometraje" type="number" min="0" required value="${mantenimiento.vehiculo.kilometraje}"></label>
        <label>🛠 Tipo de servicio<select name="tipoMantenimiento">${TIPOS_MANTENIMIENTO.map(tipo => `<option ${tipo === mantenimiento.tipoMantenimiento ? "selected" : ""}>${escaparHTML(tipo)}</option>`).join("")}</select></label>
        <label>📅 Fecha<input name="fecha" type="date" required value="${escaparHTML(mantenimiento.fecha)}"></label>
        <label>◷ Hora de revisión<input name="horaRevision" type="time" required value="${escaparHTML(mantenimiento.horaRevision || "09:00")}"></label>
        <label>Jornada<select name="jornada"><option ${mantenimiento.jornada === "Mañana" ? "selected" : ""}>Mañana</option><option ${mantenimiento.jornada === "Tarde" ? "selected" : ""}>Tarde</option></select></label>
        <label>● Estado<select name="estado">${estados}</select></label>
        <label class="checkbox-confirmacion"><input name="confirmacion" type="checkbox" ${mantenimiento.confirmacion ? "checked" : ""}> Datos confirmados</label>
        <label class="ancho-completo">📝 Descripción<textarea name="descripcion" required rows="3">${escaparHTML(mantenimiento.descripcion)}</textarea></label>
        <label class="ancho-completo">💬 Observaciones<textarea name="observaciones" rows="2">${escaparHTML(mantenimiento.observaciones)}</textarea></label>
      </form>`;

    document.querySelector("#guardar-edicion").hidden = false;
    document.querySelector("#guardar-edicion").onclick = () => editarMantenimiento(mantenimiento.id);
  }

  if (!dialogo.open) dialogo.showModal();
}

// Edita exclusivamente los datos del vehículo y de su mantenimiento.
function editarMantenimiento(id) {
  const formulario = document.querySelector("#form-edicion");
  if (!formulario.reportValidity()) return;

  const datos = new FormData(formulario);
  const mantenimiento = mantenimientos.find(item => item.id === id);
  if (!mantenimiento) return;

  const copiaAnterior = {
    ...mantenimiento,
    vehiculo: { ...mantenimiento.vehiculo }
  };

  Object.assign(mantenimiento, {
    tipoMantenimiento: String(datos.get("tipoMantenimiento")),
    fecha: String(datos.get("fecha")),
    horaRevision: String(datos.get("horaRevision")),
    jornada: String(datos.get("jornada")),
    confirmacion: datos.has("confirmacion"),
    estado: String(datos.get("estado")),
    descripcion: String(datos.get("descripcion")).trim(),
    observaciones: String(datos.get("observaciones")).trim(),
    vehiculo: {
      marca: String(datos.get("marca")).trim(),
      modelo: String(datos.get("modelo")).trim(),
      anio: Number(datos.get("anio")),
      placa: String(datos.get("placa")).trim().toUpperCase(),
      kilometraje: Number(datos.get("kilometraje"))
    }
  });

  if (!guardarMantenimientos()) {
    Object.assign(mantenimiento, copiaAnterior);
    mostrarNotificacion("No se pudieron guardar los cambios del mantenimiento.", "error");
    return;
  }

  guardarHistorial("editado", mantenimiento);
  document.querySelector("#dialogo-mantenimiento").close();
  renderizarTabla();
  mostrarNotificacion("El mantenimiento fue actualizado.");
}

// Desactiva o reactiva una solicitud sin eliminarla.
async function cambiarEstadoActivo(id) {
  const mantenimiento = mantenimientos.find(item => item.id === id);
  if (!mantenimiento) return;

  const activaAnterior = mantenimiento.activa !== false;
  if (activaAnterior && !await confirmarAccion(
    "El registro seguirá disponible para el administrador y se podrá reactivar después.",
    `¿Desactivar la solicitud ${mantenimiento.id}?`,
    "Desactivar"
  )) return;

  mantenimiento.activa = !activaAnterior;
  if (!guardarMantenimientos()) {
    mantenimiento.activa = activaAnterior;
    mostrarNotificacion("No se pudo guardar el cambio de estado.", "error");
    return;
  }

  guardarHistorial(mantenimiento.activa ? "activado" : "desactivado", mantenimiento);
  renderizarTabla();
  mostrarNotificacion(mantenimiento.activa ? "Solicitud activada." : "Solicitud desactivada.");
}

// Elimina una solicitud tras pedir confirmación.
async function eliminarMantenimiento(id) {
  const mantenimiento = mantenimientos.find(item => item.id === id);
  if (!mantenimiento) return;

  const confirma = await confirmarAccion(
    `Se eliminará permanentemente la solicitud de ${mantenimiento.propietario}.`,
    `¿Eliminar ${mantenimiento.id}?`,
    "Eliminar solicitud"
  );
  if (!confirma) return;

  const indice = mantenimientos.findIndex(item => item.id === mantenimiento.id);
  const [eliminado] = mantenimientos.splice(indice, 1);

  if (!guardarMantenimientos()) {
    mantenimientos.splice(indice, 0, eliminado);
    mostrarNotificacion("No se pudo eliminar la solicitud del almacenamiento.", "error");
    return;
  }

  guardarHistorial("eliminado", mantenimiento);
  renderizarTabla();
  mostrarNotificacion("La solicitud fue eliminada.");
}

function procesarAccion(evento) {
  const boton = evento.target.closest("button[data-accion]");
  if (!boton) return;

  const mantenimiento = mantenimientos.find(item => item.id === boton.dataset.id);
  if (!mantenimiento) return;

  if (boton.dataset.accion === "ver") abrirDetalle(mantenimiento, "ver");
  if (boton.dataset.accion === "editar") abrirDetalle(mantenimiento, "editar");
  if (boton.dataset.accion === "toggle") cambiarEstadoActivo(mantenimiento.id);
  if (boton.dataset.accion === "eliminar") eliminarMantenimiento(mantenimiento.id);
}

// Cambia entre la pestaña de solicitudes y el directorio de usuarios.
function activarPestanaAdmin(idPestana) {
  const pestanas = ["tab-solicitudes", "tab-usuarios"];
  const activa = pestanas.includes(idPestana) ? idPestana : "tab-solicitudes";

  pestanas.forEach(id => {
    const panel = document.getElementById(id);
    const enlace = document.querySelector(`[data-pestana-admin="${id}"]`);
    if (panel) panel.hidden = id !== activa;
    if (enlace) enlace.classList.toggle("activo", id === activa);
  });
}

// Inicializa controles y tablas al entrar al panel administrativo.
document.addEventListener("DOMContentLoaded", () => {
  if (!document.querySelector("#tabla-mantenimientos")) return;
  if (!verificarSesion("admin")) return;

  document.querySelector("#busqueda").addEventListener("input", renderizarTabla);
  document.querySelector("#filtro-estado").addEventListener("change", renderizarTabla);
  document.querySelector("#tabla-mantenimientos").addEventListener("click", procesarAccion);
  document.querySelector("#tabla-usuarios").addEventListener("click", procesarAccionUsuario);
  document.querySelector("#cerrar-dialogo").addEventListener("click", () => {
    document.querySelector("#dialogo-mantenimiento").close();
  });
  document.querySelector("#cerrar-dialogo-usuario").addEventListener("click", () => {
    document.querySelector("#dialogo-usuario").close();
  });

  document.querySelectorAll("[data-pestana-admin]").forEach(enlace => {
    enlace.addEventListener("click", evento => {
      evento.preventDefault();
      const idPestana = enlace.dataset.pestanaAdmin;
      window.location.hash = idPestana;
      activarPestanaAdmin(idPestana);
    });
  });

  window.addEventListener("hashchange", () => {
    activarPestanaAdmin(window.location.hash.slice(1));
  });

  activarPestanaAdmin(window.location.hash.slice(1));
  renderizarTabla();
  renderizarUsuarios();
});
