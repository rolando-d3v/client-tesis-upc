import { useEffect, useRef, useState } from "react";
import { FaCircleCheck, FaDownload, FaFileShield, FaLock, FaLockOpen, FaTriangleExclamation, FaXmark } from "react-icons/fa6";
import { useReporteBloqueo } from "../../../../api/apiContencion";
import { exportarElementoPDF } from "../../../../tools/exportarPDF";
import ModalDesbloqueo from "../modal_desbloqueo/ModalDesbloqueo";
import { fechaHora, porcentaje } from "../../formato";
import BadgeNivel from "../../../../components/nivel_riesgo/BadgeNivel";
import { infoNivel } from "../../../../config/nivelesRiesgo";
import styles from "./reporteForense.module.css";
import RadarComportamientoForense from "./RadarComportamientoForense";

const ETIQUETA_ACCION = { VISTA: "Vista", DESCARGAR: "Descarga", EDITAR: "Edición", ELIMINAR: "Eliminación", GUARDAR_COPIA: "Copia" };

function Dato({ etiqueta, valor }) {
  return <div className={styles.dato}><span>{etiqueta}</span><strong>{valor ?? "—"}</strong></div>;
}

function Seccion({ numero, titulo, children }) {
  return (
    <section className={styles.seccion} data-pdf-section="keep">
      <h3><span>{numero}</span>{titulo}</h3>
      {children}
    </section>
  );
}

function BarraModelo({ nombre, datos }) {
  return (
    <div className={styles.modelo}>
      <div className={styles.modeloCabecera}><strong>{nombre}</strong><span>peso {porcentaje(datos.peso, 0)}</span></div>
      <div className={styles.barra}><i style={{ width: porcentaje(Math.min(datos.score, 1), 1) }} /></div>
      <div className={styles.modeloPie}><span>{datos.interpreta}</span><strong>{porcentaje(datos.score)}</strong></div>
    </div>
  );
}

export default function ReporteForense({ idBloqueo, informeConsulta, onClose }) {
  const { data: reporteBloqueo, isLoading, isError } = useReporteBloqueo(informeConsulta ? null : idBloqueo);
  const data = informeConsulta ?? reporteBloqueo;
  const hojaRef = useRef(null);
  const [generando, setGenerando] = useState(false);
  const [desbloqueando, setDesbloqueando] = useState(false);

  useEffect(() => {
    const cerrar = (e) => { if (e.key === "Escape" && !desbloqueando) onClose(); };
    window.addEventListener("keydown", cerrar);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", cerrar); document.body.style.overflow = overflow; };
  }, [onClose, desbloqueando]);

  const descargar = async () => {
    setGenerando(true);
    try {
      await exportarElementoPDF(hojaRef.current, `Reporte-forense-${data.codigo}`, { titulo: `Reporte forense ${data.codigo}` });
    } catch (error) {
      console.error("No se pudo generar el PDF del reporte forense.", error);
      window.alert("No se pudo generar el PDF. Inténtalo de nuevo.");
    } finally {
      setGenerando(false);
    }
  };

  const r = data?.reporte;
  const esConsulta = r?.metadata?.tipo_reporte === "consulta";
  return (
    <div className={styles.fondo} onClick={() => !desbloqueando && onClose()}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label="Reporte forense" onClick={(e) => e.stopPropagation()}>
        <header className={styles.barraAcciones}>
          <strong>Reporte forense {data?.codigo ?? ""}</strong>
          <div>
            {data?.activo && <button type="button" className={styles.desbloquear} onClick={() => setDesbloqueando(true)}><FaLockOpen /> Desbloquear cuenta</button>}
            <button type="button" onClick={descargar} disabled={!data || generando}><FaDownload /> {generando ? "Generando…" : "Descargar PDF"}</button>
            <button type="button" className={styles.cerrar} onClick={onClose} aria-label="Cerrar"><FaXmark /></button>
          </div>
        </header>

        <div className={styles.cuerpo}>
          {isLoading && <p className={styles.mensaje}>Cargando reporte…</p>}
          {isError && <p className={styles.mensaje}>No se pudo cargar el reporte forense.</p>}
          {r && (
            <article className={styles.hoja} ref={hojaRef}>
              <div className={styles.membrete} data-pdf-section="keep">
                <div>
                  <span className={styles.confidencial}>{r.metadata.clasificacion_reporte}</span>
                  <h2>{r.metadata.titulo}</h2>
                  <p>{r.metadata.sistema}</p>
                </div>
                <dl>
                  <Dato etiqueta="Código" valor={r.metadata.codigo} />
                  <Dato etiqueta="Emitido" valor={fechaHora(r.metadata.fecha_emision)} />
                  <Dato etiqueta="Responsable" valor={r.metadata.responsable} />
                </dl>
              </div>

              <div className={esConsulta ? styles.estadoConsulta : data.activo ? styles.estadoBloqueada : styles.estadoLiberada} data-pdf-section="keep">
                {esConsulta ? <FaFileShield /> : data.activo ? <FaLock /> : <FaLockOpen />}
                {esConsulta
                  ? <div><strong>Informe de consulta del usuario</strong><span>Actividad y evaluación del evento registrado. Consultar este informe no bloquea ni desbloquea la cuenta.</span></div>
                  : data.activo
                  ? <div><strong>Cuenta bloqueada</strong><span>Desde el {fechaHora(data.fecha_bloqueo)}. Pendiente de revisión por un analista.</span></div>
                  : <div><strong>Cuenta desbloqueada el {fechaHora(data.fecha_desbloqueo)} por {data.desbloqueado_por}</strong>
                      <span>Justificación: {data.justificacion_desbloqueo}</span></div>}
              </div>

              <Seccion numero="1" titulo="Resumen ejecutivo"><p className={styles.resumen}>{r.resumen_ejecutivo}</p></Seccion>

              <Seccion numero="2" titulo="Identificación">
                <div className={styles.dosColumnas}>
                  <div>
                    <h4>{esConsulta ? "Usuario analizado" : "Usuario investigado"}</h4>
                    <dl className={styles.grilla}>
                      <Dato etiqueta="Nombre" valor={r.usuario.nombre} />
                      <Dato etiqueta="ID usuario" valor={r.usuario.id_user} />
                      <Dato etiqueta="Rol" valor={r.usuario.rol} />
                      <Dato etiqueta="Oficina" valor={r.usuario.oficina} />
                    </dl>
                  </div>
                  <div>
                    <h4>{esConsulta ? "Evento analizado" : "Evento que disparó el bloqueo"}</h4>
                    <dl className={styles.grilla}>
                      <Dato etiqueta="Fecha" valor={r.evento_detonante.fecha} />
                      <Dato etiqueta="Acción" valor={r.evento_detonante.accion} />
                      <Dato etiqueta="Documento" valor={`${r.evento_detonante.documento ?? "—"} · ${r.evento_detonante.tipo_documento ?? ""}`} />
                      <Dato etiqueta="Clasificación" valor={r.evento_detonante.clasificacion} />
                      <Dato etiqueta="Tamaño" valor={`${r.evento_detonante.size_mb} MB`} />
                      <Dato etiqueta="Registro / origen" valor={`#${r.evento_detonante.evento_registro_id} · ${r.evento_detonante.origen}`} />
                    </dl>
                  </div>
                </div>
              </Seccion>

              <Seccion numero="3" titulo="Evaluación de los modelos">
                <div className={styles.evaluacion}>
                  <div className={styles.scoreFinal} style={{ background: infoNivel(r.evaluacion_modelos.nivel_riesgo).fondo,
                    borderColor: infoNivel(r.evaluacion_modelos.nivel_riesgo).borde, color: infoNivel(r.evaluacion_modelos.nivel_riesgo).texto }}>
                    <span>Score de riesgo</span>
                    <strong>{porcentaje(r.evaluacion_modelos.score_final)}</strong>
                    <em>Umbral de bloqueo {porcentaje(r.evaluacion_modelos.umbral_bloqueo, 0)}</em>
                    <BadgeNivel nivel={r.evaluacion_modelos.nivel_riesgo} />
                  </div>
                  <div className={styles.modelos}>
                    <BarraModelo nombre="Isolation Forest" datos={r.evaluacion_modelos.isolation_forest} />
                    <BarraModelo nombre="LSTM Autoencoder" datos={r.evaluacion_modelos.lstm_autoencoder} />
                    <p className={styles.nota}>Modelo que más aportó: <strong>{r.evaluacion_modelos.modelo_dominante}</strong>. {r.evaluacion_modelos.escala}</p>
                  </div>
                </div>
              </Seccion>

              <Seccion numero="4" titulo={esConsulta ? "Radar del comportamiento del usuario" : "Radar del comportamiento al bloqueo"}>
                <RadarComportamientoForense reporte={r} />
              </Seccion>

              <Seccion numero="5" titulo={esConsulta ? "Análisis del evento" : "Motivos del bloqueo"}>
                {esConsulta && !r.motivos_comportamiento.length && <p className={styles.nota}>El registro conserva las puntuaciones y las reglas del evento. No se guardaron variables de comportamiento detalladas para reconstruir motivos adicionales.</p>}
                <ul className={styles.motivos}>
                  {r.motivos_comportamiento.map((m) => (
                    <li key={m.codigo} className={styles[`sev_${m.severidad}`]}>
                      <span className={styles.severidad}>{m.severidad}</span>
                      <div><strong>{m.titulo}</strong><p>{m.detalle}</p></div>
                    </li>
                  ))}
                </ul>
                {r.reglas_institucionales.length > 0 && <>
                  <h4>Reglas institucionales activadas</h4>
                  <ul className={styles.reglas}>
                    {r.reglas_institucionales.map((regla, i) => <li key={`${regla.codigo}-${i}`}><code>{regla.codigo}</code>{regla.descripcion}</li>)}
                  </ul>
                </>}
              </Seccion>

              <Seccion numero="6" titulo={`Actividad en las ${r.actividad_reciente.ventana}`}>
                <div className={styles.kpis}>
                  <Dato etiqueta="Eventos" valor={r.actividad_reciente.total_eventos} />
                  <Dato etiqueta="Acciones de alto impacto" valor={r.actividad_reciente.acciones_alto_impacto} />
                  <Dato etiqueta="Documentos distintos" valor={r.actividad_reciente.documentos_distintos} />
                  <Dato etiqueta="Fuera de horario" valor={r.actividad_reciente.fuera_de_horario} />
                  <Dato etiqueta="MB accedidos" valor={r.actividad_reciente.mb_totales} />
                  <Dato etiqueta="Eventos sobre el umbral" valor={r.actividad_reciente.eventos_sobre_umbral} />
                </div>
                <p className={styles.chips}>
                  {Object.entries(r.actividad_reciente.por_accion).map(([accion, n]) => <span key={accion}>{ETIQUETA_ACCION[accion] ?? accion}: {n}</span>)}
                  {Object.entries(r.actividad_reciente.por_clasificacion).map(([clase, n]) => <span key={clase} className={styles.chipClase}>{clase}: {n}</span>)}
                </p>
                <table className={styles.tabla}>
                  <thead><tr><th>Fecha</th><th>Acción</th><th>Documento</th><th>Clasificación</th><th>MB</th><th>Score</th><th>Nivel</th></tr></thead>
                  <tbody>
                    {r.actividad_reciente.linea_de_tiempo.map((e, i) => (
                      <tr key={i} className={e.score >= r.evaluacion_modelos.umbral_bloqueo ? styles.filaCritica : undefined}>
                        <td>{fechaHora(e.fecha)}</td><td>{e.accion}</td><td>{e.documento}</td><td>{e.clasificacion}</td><td>{e.size_mb}</td><td>{porcentaje(e.score)}</td><td><BadgeNivel nivel={e.nivel_riesgo} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Seccion>

              <Seccion numero="7" titulo="Perfil habitual del usuario">
                {r.perfil_habitual.disponible ? (
                  <dl className={styles.grilla}>
                    <Dato etiqueta="Eventos históricos" valor={r.perfil_habitual.eventos_historicos} />
                    <Dato etiqueta="Horas habituales" valor={r.perfil_habitual.horas_habituales.map((h) => `${h.hora} (${h.porcentaje} %)`).join(", ")} />
                    <Dato etiqueta="Actividad en fin de semana" valor={`${r.perfil_habitual.porcentaje_fin_de_semana} %`} />
                    <Dato etiqueta="Eventos por hora (promedio)" valor={r.perfil_habitual.eventos_por_hora_promedio} />
                    <Dato etiqueta="Oficinas habituales" valor={r.perfil_habitual.oficinas_habituales.map((o) => `${o.oficina} (${o.eventos})`).join(", ") || "—"} />
                  </dl>
                ) : <p className={styles.nota}>{r.perfil_habitual.nota}</p>}
                {r.antecedentes.length > 0 && <>
                  <h4>Antecedentes de bloqueo</h4>
                  <ul className={styles.reglas}>
                    {r.antecedentes.map((a) => <li key={a.codigo}><code>{a.codigo}</code>Bloqueo {fechaHora(a.fecha_bloqueo)}{a.fecha_desbloqueo ? ` · desbloqueado por ${a.desbloqueado_por}: ${a.justificacion}` : ""}</li>)}
                  </ul>
                </>}
              </Seccion>

              <Seccion numero="8" titulo={esConsulta ? "Conclusiones y recomendaciones" : "Acción de contención y recomendaciones"}>
                <p className={styles.nota}><strong>{r.accion_contencion.accion.replaceAll("_", " ")}</strong> · {fechaHora(r.accion_contencion.fecha)} · {r.accion_contencion.alcance}</p>
                <ol className={styles.recomendaciones}>{r.recomendaciones.map((texto) => <li key={texto}>{texto}</li>)}</ol>
              </Seccion>

              <Seccion numero="9" titulo={esConsulta ? "Huella del informe de consulta" : "Cadena de custodia"}>
                <div className={styles.custodia}>
                  <div><span>Hash SHA-256 del reporte</span><code>{data.hash_reporte}</code></div>
                  <p className={esConsulta ? styles.nota : data.integridad_verificada ? styles.integro : styles.alterado}>
                    {!esConsulta && (data.integridad_verificada ? <FaCircleCheck /> : <FaTriangleExclamation />)}
                    {esConsulta ? "Huella calculada para el contenido de esta consulta. No corresponde a un reporte de bloqueo registrado."
                      : data.integridad_verificada ? "Integridad verificada: el contenido coincide con el generado al bloquear." : "El contenido no coincide con el hash registrado."}
                  </p>
                </div>
              </Seccion>
            </article>
          )}
        </div>
      </div>
      {desbloqueando && data && (
        <ModalDesbloqueo bloqueo={data} onClose={() => setDesbloqueando(false)} />
      )}
    </div>
  );
}
