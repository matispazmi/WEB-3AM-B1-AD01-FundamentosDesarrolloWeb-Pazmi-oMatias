"use strict";

// Catálogos y datos iniciales para la demostración académica.
const TIPOS_MANTENIMIENTO = [
  "Cambio de aceite", "Revisión de frenos", "Mantenimiento de motor",
  "Cambio de filtros", "Diagnóstico general", "Revisión de neumáticos"
];
const ESTADOS = ["Pendiente", "En proceso", "Finalizado", "Cancelado"];

const CONFIGURACION = {
  claves: {
    usuarios: "autoPan_usuarios",
    mantenimientos: "autoPan_mantenimientos",
    sesion: "autoPan_sesion",
    historial: "autoPan_historial"
  }
};
const USUARIOS_INICIALES = [
  {
    id: 1,
    nombre: "Administrador",
    correo: "admin@autoPan.com",
    password: "admin123",
    rol: "admin",
    tipoDocumento: "cedula",
    cedula: "0923456789",
    telefono: "0987654321",
    activo: true
  },
  {
    id: 2,
    nombre: "Usuario Demo",
    correo: "usuario@autoPan.com",
    password: "usuario123",
    rol: "usuario",
    tipoDocumento: "cedula",
    cedula: "0912345678",
    telefono: "0988618939",
    activo: true
  },
  {
    id: 3,
    nombre: "Cliente de Prueba",
    correo: "cliente.demo@autoPan.com",
    password: "cliente123",
    rol: "usuario",
    tipoDocumento: "cedula",
    cedula: "1712345678",
    telefono: "0998765432",
    activo: true
  }
];
const MANTENIMIENTOS_INICIALES = [
  {
    id: "AC-1001",
    usuarioId: 2,
    propietario: "Usuario Demo",
    tipoDocumento: "cedula",
    cedula: "0912345678",
    correo: "usuario@autoPan.com",
    telefono: "0988618939",
    vehiculo: {
      marca: "Toyota", modelo: "Corolla", anio: 2020,
      placa: "ABC-1234", kilometraje: 50000
    },
    tipoMantenimiento: "Cambio de aceite",
    fecha: "2026-11-25",
    horaRevision: "09:00",
    jornada: "Mañana",
    confirmacion: true,
    descripcion: "Cambio de aceite y filtros",
    observaciones: "Prefiere atención por la mañana",
    estado: "Pendiente",
    creado: "2026-11-08T09:00:00.000Z"
  },
  {
    id: "AC-1002",
    usuarioId: 2,
    propietario: "Usuario Demo",
    tipoDocumento: "cedula",
    cedula: "0912345678",
    correo: "usuario@autoPan.com",
    telefono: "0988618939",
    vehiculo: {
      marca: "Kia", modelo: "Rio", anio: 2019,
      placa: "PQR-5678", kilometraje: 72000
    },
    tipoMantenimiento: "Revisión de frenos",
    fecha: "2026-11-27",
    horaRevision: "10:30",
    jornada: "Tarde",
    confirmacion: true,
    descripcion: "Revisar ruido al frenar",
    observaciones: "",
    estado: "En proceso",
    creado: "2026-11-08T10:00:00.000Z"
  },
  {
    id: "AC-1003",
    usuarioId: 1,
    propietario: "María Fernanda López",
    tipoDocumento: "cedula",
    cedula: "0923456789",
    correo: "maria@example.com",
    telefono: "0987654321",
    vehiculo: {
      marca: "Chevrolet", modelo: "Onix", anio: 2022,
      placa: "GTR-2468", kilometraje: 28000
    },
    tipoMantenimiento: "Diagnóstico general",
    fecha: "2026-11-20",
    horaRevision: "14:00",
    jornada: "Tarde",
    confirmacion: true,
    descripcion: "Revisión preventiva antes de viajar",
    observaciones: "",
    estado: "Finalizado",
    creado: "2026-11-08T11:00:00.000Z"
  },
  {
    id: "AC-1004",
    usuarioId: 3,
    propietario: "Cliente de Prueba",
    tipoDocumento: "cedula",
    cedula: "1712345678",
    correo: "cliente.demo@autoPan.com",
    telefono: "0998765432",
    vehiculo: {
      marca: "Hyundai", modelo: "Accent", anio: 2021,
      placa: "HJK-3910", kilometraje: 41000
    },
    tipoMantenimiento: "Revisión de neumáticos",
    fecha: "2026-11-30",
    horaRevision: "11:00",
    jornada: "Mañana",
    confirmacion: true,
    descripcion: "Verificar presión y desgaste",
    observaciones: "",
    estado: "Pendiente",
    creado: "2026-11-09T09:00:00.000Z"
  }
];

function leerJSON(clave, valorInicial) {
  try {
    const guardado = localStorage.getItem(clave);
    return guardado ? JSON.parse(guardado) : valorInicial;
  } catch (error) {
    console.warn("No se pudieron leer los datos guardados:", error);
    return valorInicial;
  }
}

// Estos arrays son la fuente de trabajo mientras la aplicación está abierta.
// localStorage conserva una copia para poder recuperar los datos después.
let usuarios = leerJSON(CONFIGURACION.claves.usuarios, USUARIOS_INICIALES);
let mantenimientos = leerJSON(CONFIGURACION.claves.mantenimientos, MANTENIMIENTOS_INICIALES);
let historial = leerJSON(CONFIGURACION.claves.historial, []);

function escribirJSON(clave, valor) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
    return true;
  } catch (error) {
    console.error("No se pudieron guardar los datos en este navegador:", error);
    return false;
  }
}

// Guarda los arrays actuales sin reemplazarlos ni volver a leerlos.
function guardarUsuarios() {
  return escribirJSON(CONFIGURACION.claves.usuarios, usuarios);
}

function guardarMantenimientos() {
  return escribirJSON(CONFIGURACION.claves.mantenimientos, mantenimientos);
}

function obtenerUsuarios() {
  return usuarios;
}

function obtenerMantenimientos() {
  return mantenimientos;
}

function guardarHistorial(accion, mantenimiento) {
  const registro = {
    accion,
    mantenimientoId: mantenimiento.id,
    fecha: new Date().toISOString()
  };

  historial.push(registro);
  if (!escribirJSON(CONFIGURACION.claves.historial, historial)) {
    historial.pop();
  }
}

function generarId() {
  const marcaTiempo = Date.now().toString().slice(-7);
  const aleatorio = Math.floor(Math.random() * 90 + 10);
  return `AC-${marcaTiempo}${aleatorio}`;
}

function escaparHTML(valor) {
  const caracteresEspeciales = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  };

  return String(valor ?? "").replace(/[&<>"']/g, caracter => caracteresEspeciales[caracter]);
}

function mostrarNotificacion(mensaje, tipo = "exito") {
  if (window.Swal) {
    const icono = tipo === "error" ? "error" : tipo === "advertencia" ? "warning" : "success";
    window.Swal.fire({
      toast: true,
      position: "top-end",
      icon: icono,
      title: mensaje,
      showConfirmButton: false,
      timer: 3500,
      timerProgressBar: true
    });
    return;
  }

  let aviso = document.querySelector(".notificacion");
  if (!aviso) {
    aviso = document.createElement("div");
    aviso.className = "notificacion";
    aviso.setAttribute("role", "status");
    document.body.append(aviso);
  }

  aviso.textContent = mensaje;
  aviso.className = `notificacion ${tipo} visible`;
  window.clearTimeout(mostrarNotificacion.temporizador);
  mostrarNotificacion.temporizador = window.setTimeout(
    () => aviso.classList.remove("visible"),
    3500
  );
}

function confirmarAccion(texto, titulo = "¿Confirmas esta acción?", textoBoton = "Confirmar") {
  if (window.Swal) {
    return window.Swal.fire({
      title: titulo,
      text: texto,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#64748b",
      confirmButtonText: textoBoton,
      cancelButtonText: "Cancelar",
      reverseButtons: true
    }).then(resultado => resultado.isConfirmed);
  }

  return Promise.resolve(window.confirm(`${titulo}\n\n${texto}`));
}

function fechaLocalISO() {
  const ahora = new Date();
  const anio = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");
  const dia = String(ahora.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

function validarIdentificacion(tipo, valor) {
  const identificacion = String(valor || "").trim();
  if (tipo === "cedula") return /^\d{10}$/.test(identificacion);
  if (tipo === "ruc") return /^\d{13}$/.test(identificacion);
  return tipo === "pasaporte" && /^[A-Z0-9]{6,15}$/i.test(identificacion);
}

function prepararValidacionDocumento(selector, campo) {
  if (!selector || !campo || selector.dataset.configurado === "true") return;

  const actualizar = () => {
    const tipo = selector.value;
    campo.maxLength = tipo === "cedula" ? 10 : tipo === "ruc" ? 13 : 15;
    campo.inputMode = tipo === "pasaporte" ? "text" : "numeric";
    campo.placeholder = tipo === "cedula" ? "10 dígitos" : tipo === "ruc" ? "13 dígitos" : "6 a 15 letras o números";
    campo.pattern = tipo === "cedula" ? "[0-9]{10}" : tipo === "ruc" ? "[0-9]{13}" : "[A-Za-z0-9]{6,15}";
    campo.title = tipo === "cedula" ? "La cédula debe tener exactamente 10 dígitos." : tipo === "ruc" ? "El RUC debe tener exactamente 13 dígitos." : "El pasaporte debe tener de 6 a 15 letras o números.";
    campo.value = tipo === "pasaporte"
      ? campo.value.replace(/[^a-z0-9]/gi, "").toUpperCase()
      : campo.value.replace(/\D/g, "").slice(0, campo.maxLength);
  };

  selector.addEventListener("change", actualizar);
  campo.addEventListener("input", () => {
    campo.value = selector.value === "pasaporte"
      ? campo.value.replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 15)
      : campo.value.replace(/\D/g, "").slice(0, campo.maxLength);
  });

  selector.dataset.configurado = "true";
  actualizar();
}

function prepararCampoNumerico(campo, maximo) {
  if (!campo || campo.dataset.numericoConfigurado === "true") return;

  campo.maxLength = maximo;
  campo.inputMode = "numeric";
  campo.addEventListener("input", () => {
    campo.value = campo.value.replace(/\D/g, "").slice(0, maximo);
  });
  campo.dataset.numericoConfigurado = "true";
}

// Copia los datos de ejemplo solo al primer uso y conserva los arrays previos.
try {
  if (!localStorage.getItem(CONFIGURACION.claves.usuarios)) {
    guardarUsuarios();
  }
  if (!localStorage.getItem(CONFIGURACION.claves.mantenimientos)) {
    guardarMantenimientos();
  }
  if (!localStorage.getItem(CONFIGURACION.claves.historial)) {
    escribirJSON(CONFIGURACION.claves.historial, historial);
  }

  if (localStorage.getItem("autoPan_versionDatos") !== "3") {
    const clientePrueba = USUARIOS_INICIALES.find(usuario => usuario.id === 3);
    const mantenimientoPrueba = MANTENIMIENTOS_INICIALES.find(item => item.id === "AC-1004");
    let cambioUsuarios = false;
    let cambioMantenimientos = false;

    if (clientePrueba && !usuarios.some(usuario => usuario.id === clientePrueba.id
      || usuario.correo.toLowerCase() === clientePrueba.correo.toLowerCase())) {
      usuarios.push({ ...clientePrueba });
      cambioUsuarios = true;
    }

    if (mantenimientoPrueba && !mantenimientos.some(item => item.id === mantenimientoPrueba.id)) {
      mantenimientos.push({ ...mantenimientoPrueba });
      cambioMantenimientos = true;
    }

    const usuariosGuardados = !cambioUsuarios || guardarUsuarios();
    const mantenimientosGuardados = !cambioMantenimientos || guardarMantenimientos();

    if (usuariosGuardados && mantenimientosGuardados) {
      // Cierra una sesión administrativa antigua para no iniciar el proyecto
      // automáticamente como administrador después de esta actualización.
      const sesionAnterior = leerJSON(CONFIGURACION.claves.sesion, null);
      const cuentaAnterior = usuarios.find(usuario =>
        String(usuario.id) === String(sesionAnterior?.id));

      if (sesionAnterior && (sesionAnterior.rol === "admin" || cuentaAnterior?.rol === "admin")) {
        localStorage.removeItem(CONFIGURACION.claves.sesion);
      }

      localStorage.setItem("autoPan_versionDatos", "3");
    }
  }
} catch (error) {
  console.warn("El navegador no habilitó el almacenamiento local:", error);
}
