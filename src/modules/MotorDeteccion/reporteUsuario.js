function idValido(valor) {
  const id = Number(valor);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function resolverReporteUsuario(evento, consultarUltimoBloqueo) {
  const usuario = idValido(evento.id_user);
  const propio = evento.bloqueo;
  const idDirecto = idValido(propio?.id);
  if (idDirecto && (propio.id_user == null || idValido(propio.id_user) === usuario)) return idDirecto;
  if (!usuario) throw new Error("El evento no identifica un usuario válido.");
  const bloqueo = await consultarUltimoBloqueo(usuario);
  const id = idValido(bloqueo?.id);
  if (!id || idValido(bloqueo.id_user) !== usuario) {
    throw new Error("No se pudo identificar el reporte forense de este usuario.");
  }
  return id;
}

export async function resolverInformeUsuario(evento, consultarUltimoBloqueo, consultarInformeEvento) {
  try {
    return { idBloqueo: await resolverReporteUsuario(evento, consultarUltimoBloqueo) };
  } catch (error) {
    if (error?.response?.status !== 404) throw error;
    const registro = idValido(evento.evento_registro_id);
    if (!registro) {
      const pendiente = new Error("El evento aún no tiene evidencia guardada para generar su informe.");
      pendiente.code = "SIN_EVIDENCIA_PERSISTIDA";
      throw pendiente;
    }
    const informe = await consultarInformeEvento(registro);
    if (idValido(informe?.reporte?.usuario?.id_user) !== idValido(evento.id_user)) {
      throw new Error("El informe recibido no corresponde a este usuario.");
    }
    return { informeConsulta: informe };
  }
}
