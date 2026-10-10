import { useState } from "react";
import { useIsMutating, useQueryClient } from "@tanstack/react-query";
import {
  useEvaluarDatasetRevisado, useFilasRevisionEventos, useGuardarRevisionEvento,
  usePrepararRevisionEventos, useRevisionEventos,
} from "../../../../api/apiEvaluacion";
import styles from "./EvaluacionModelo.module.css";

const mensajeError = (error) => {
  const detalle = error?.response?.data?.detail;
  if (typeof detalle === "string") return detalle;
  if (Array.isArray(detalle)) return detalle.map((r) => r.msg).join(". ");
  return error?.message || "No se pudo completar la revisión.";
};
const fecha = (valor) => new Date(valor).toLocaleString("es-PE", { timeZone: "America/Lima" });

export default function RevisionEtiquetas({ ocupado, onDatasetActualizado }) {
  const cliente = useQueryClient();
  const guardando = useIsMutating({ mutationKey: ["revision_guardar"] }) > 0;
  const estado = useRevisionEventos();
  const preparar = usePrepararRevisionEventos();
  const evaluar = useEvaluarDatasetRevisado();
  const [grupo, setGrupo] = useState("pendientes");
  const [pagina, setPagina] = useState(1);
  const [busqueda, setBusqueda] = useState("");
  const [eventoId, setEventoId] = useState(undefined);
  const [seleccion, setSeleccion] = useState(null);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const id = estado.data?.resumen?.id;
  const consulta = useFilasRevisionEventos(id, { grupo, pagina, limite: 20, evento_id: eventoId });
  const resumen = consulta.data?.resumen || estado.data?.resumen;
  const filas = consulta.data?.filas || [];
  const elegida = filas.find((r) => r.id === seleccion) || filas[0];
  const paginas = Math.max(1, Math.ceil((consulta.data?.total_filtrado || 0) / 20));
  const bloqueado = ocupado || guardando || evaluar.isPending || preparar.isPending || estado.data?.desactualizada;

  const cargar = async () => {
    setError(""); setAviso("");
    try {
      await preparar.mutateAsync();
      setGrupo("pendientes"); setPagina(1); setSeleccion(null); setEventoId(undefined); setBusqueda("");
      setAviso("CSV del servidor cargado. Las decisiones anteriores conservan su historial.");
    } catch (err) { setError(mensajeError(err)); }
  };

  const recalcular = async () => {
    setError(""); setAviso("");
    try {
      await evaluar.mutateAsync();
      setAviso("Métricas recalculadas con el CSV actualizado del servidor.");
    } catch (err) { setError(mensajeError(err)); }
  };

  const guardado = (revision, siguiente) => {
    setAviso(`Evento ${revision.evento_id || elegida.id}: CSV actualizado. ${revision.verificada
      ? "Etiqueta verificada con la evidencia declarada." : "Revisión provisional: faltan evidencias o la fuente está limitada."} Recalcula las métricas cuando termines.`);
    onDatasetActualizado();
    if (siguiente) {
      const indice = filas.findIndex((r) => r.id === elegida.id);
      const proxima = filas[indice + 1];
      if (proxima) setSeleccion(proxima.id);
      else {
        const actualizadas = cliente.getQueryData(["revision_filas", id, { grupo, pagina, limite: 20, evento_id: eventoId }])?.filas || [];
        const pendiente = grupo === "pendientes" && actualizadas.find((r) => r.id !== elegida.id && !r.revision?.aplicada_csv);
        if (pendiente) setSeleccion(pendiente.id);
        else if (pagina < paginas) { setPagina(pagina + 1); setSeleccion(null); }
        else setSeleccion(null);
      }
    }
  };

  return <article className={`${styles.panel} ${styles.revision}`} aria-label="Revisión rápida de etiquetas">
    <div className={styles.panelHeader}>
      <h3>Revisión rápida por analista</h3>
      <button type="button" className={styles.botonSecundario} disabled={ocupado || guardando || preparar.isPending || evaluar.isPending}
        onClick={cargar}>{preparar.isPending ? "Cargando…" : "Cargar CSV del servidor"}</button>
    </div>
    <p className={styles.nota}>Cada guardado actualiza <strong>{estado.data?.archivo || "dt_eventos_etiquetados_5000.csv"}</strong> en
      el servidor y conserva copias e historial. Selecciona lo que comprobaste; las opciones no sustituyen la evidencia.</p>
    {(error || estado.isError || consulta.isError) && <div role="alert" className={styles.error}>
      {error || mensajeError(estado.error || consulta.error)}
      <button type="button" onClick={() => { setError(""); estado.refetch(); if (id) consulta.refetch(); }}>Recargar</button>
    </div>}
    {estado.data?.desactualizada && <p className={styles.aviso}>El CSV cambió fuera de esta revisión. Pulsa “Cargar CSV del servidor” para revisar su versión actual.</p>}
    {aviso && <p role="status" className={styles.aviso}>{aviso}</p>}
    {estado.isPending && <p role="status">Cargando revisión guardada…</p>}
    {!resumen && !estado.isPending && <p>Para empezar, carga el CSV del servidor con el botón de arriba.</p>}
    {resumen && <>
      <div className={styles.revisionResumen}>
        <span><strong>{resumen.total.toLocaleString()}</strong> registros</span>
        <span><strong>{resumen.pendientes.toLocaleString()}</strong> pendientes de verificación</span>
        <span><strong>{resumen.verificados.toLocaleString()}</strong> verificados</span>
        <span><strong>{resumen.provisionales.toLocaleString()}</strong> revisados provisionales</span>
      </div>
      <p className={styles.nota}>{resumen.limitados_por_fuente.toLocaleString()} registros con fuente simulada o acción
        alterada. Los grupos de error corresponden a las etiquetas y al modelo de la evaluación original ({resumen.modelo_version}).</p>
      <div className={styles.revisionFiltros}>
        <label>Filtrar eventos<select value={grupo} disabled={guardando || preparar.isPending || evaluar.isPending} onChange={(e) => {
          setGrupo(e.target.value); setPagina(1); setSeleccion(null);
        }}>
          <option value="pendientes">Pendientes</option><option value="fn">Falsos negativos originales</option>
          <option value="fp">Falsos positivos originales</option><option value="criticos">Críticos originales</option>
          <option value="revisados">Revisados</option><option value="verificados">Verificados</option><option value="todos">Todos</option>
        </select></label>
        <form onSubmit={(e) => {
          e.preventDefault(); setError("");
          const texto = busqueda.trim();
          if (texto && (!/^\d+$/.test(texto) || !Number.isSafeInteger(Number(texto)))) {
            setError("El ID debe ser un número entero válido."); return;
          }
          setEventoId(texto ? Number(texto) : undefined); setGrupo("todos"); setPagina(1); setSeleccion(null);
        }}>
          <label>ID de evento<input inputMode="numeric" disabled={guardando} value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Ej. 646837" /></label>
          <button type="submit" className={styles.botonSecundario} disabled={guardando}>Buscar</button>
        </form>
      </div>
      {consulta.isFetching && <p role="status">Cargando eventos…</p>}
      <div className={styles.tablaScroll}><table className={styles.tabla}>
        <thead><tr><th>ID / fecha</th><th>Usuario / rol</th><th>Acción / clasificación</th><th>Revisión</th></tr></thead>
        <tbody>{filas.map((fila) => <tr key={fila.id}>
          <td>{fila.id}<small className={styles.ic}>{fila.datos.FECHA_EVENTO}</small></td>
          <td>{fila.datos.NAME_USER}<small className={styles.ic}>{fila.datos.NAME_ROLE} · ID {fila.datos.ID_USER}</small></td>
          <td>{fila.datos.NAME_TIPO_EVENTO} · {fila.datos.NAME_CLASIFICACION}<small className={styles.ic}>Documento {fila.datos.ID_DOCUMENTO}</small></td>
          <td><button type="button" className={styles.botonSecundario} disabled={guardando} aria-pressed={elegida?.id === fila.id}
            onClick={() => setSeleccion(fila.id)}>{fila.revision
              ? (fila.revision.tipo_registro === "simulacion_contexto" ? "Contexto y evidencia simulados"
                : fila.revision.tipo_registro === "preparacion_pendiente" ? "Evidencia y analista pendientes"
                : `${fila.revision.etiqueta} · ${fila.revision.aplicada_csv ? (fila.revision.verificada ? "verificada" : "provisional") : "anterior, sin aplicar"}`)
              : "Revisar"}</button></td>
        </tr>)}</tbody>
      </table></div>
      {!filas.length && !consulta.isFetching && <p>No hay eventos para estos filtros.</p>}
      <div className={styles.revisionAcciones}>
        <button type="button" className={styles.botonSecundario} disabled={pagina <= 1 || consulta.isFetching || guardando}
          onClick={() => { setPagina(pagina - 1); setSeleccion(null); }}>Anterior</button>
        <span>Página {pagina} de {paginas} · {consulta.data?.total_filtrado ?? 0} eventos</span>
        <button type="button" className={styles.botonSecundario} disabled={pagina >= paginas || consulta.isFetching || guardando}
          onClick={() => { setPagina(pagina + 1); setSeleccion(null); }}>Siguiente</button>
      </div>
      {elegida && estado.data?.opciones && <FormularioRevision key={`${id}-${elegida.id}-${elegida.version}`}
        id={id} fila={elegida} opciones={estado.data.opciones} bloqueado={bloqueado || consulta.isFetching}
        onGuardado={guardado} onRecargar={() => { estado.refetch(); consulta.refetch(); }} />}
      <div className={styles.revisionAcciones}>
        <button type="button" className={styles.boton} disabled={bloqueado} onClick={recalcular}>
          {evaluar.isPending ? "Evaluando CSV actualizado…" : "Evaluar CSV actualizado"}
        </button>
      </div>
      <p className={styles.nota}>Indeterminado conserva la etiqueta anterior y la marca como pendiente. Las decisiones
        sin evidencia completa son provisionales. Este conjunto se usa para desarrollo: reserva otro archivo posterior
        para la prueba final. El botón de arriba evalúa el CSV guardado en el servidor.</p>
    </>}
  </article>;
}

function FormularioRevision({ id, fila, opciones, bloqueado, onGuardado, onRecargar }) {
  const previa = fila.revision;
  const [decision, setDecision] = useState(() => ({
    ...Object.fromEntries(Object.entries(opciones).map(([campo, valores]) => [campo,
      valores.some((v) => v.valor === previa?.[campo]) ? previa[campo] : valores[0].valor])),
    independiente: previa?.independiente || false, referencia: previa?.referencia || "",
    nota: previa?.nota || (previa && !previa.aplicada_csv ? previa.evidencia : "") || "", version: fila.version,
  }));
  const [error, setError] = useState("");
  const [conflicto, setConflicto] = useState(false);
  const guardar = useGuardarRevisionEvento();
  const campo = (nombre, valor) => setDecision((actual) => ({ ...actual, [nombre]: valor }));
  const etiquetas = { etiqueta: "Etiqueta", autorizacion: "Autorización de la acción", contexto_rol: "Rol y permisos",
    contexto_documento: "Finalidad y sensibilidad", contexto_usuario: "Comportamiento y horario",
    evidencia: "Evidencia cotejada", fuente: "Autenticidad del evento" };
  const completa = decision.etiqueta !== "indeterminado" && decision.autorizacion !== "sin_evidencia"
    && ["contexto_rol", "contexto_documento", "contexto_usuario"].every((c) => decision[c] !== "desconocido")
    && decision.evidencia !== "sin_evidencia" && decision.referencia.trim().length >= 4
    && decision.fuente === "autentica" && decision.independiente && !fila.limitaciones.length;
  const datos = fila.datos;
  return <form className={styles.revisionFormulario} onSubmit={async (e) => {
    e.preventDefault(); setError(""); setConflicto(false);
    const siguiente = e.nativeEvent.submitter?.value === "siguiente";
    try {
      const r = await guardar.mutateAsync({ id, eventoId: fila.id, decision });
      onGuardado({ ...r.revision, evento_id: fila.id }, siguiente);
    } catch (err) { setError(mensajeError(err)); setConflicto(err.response?.status === 409); }
  }}>
    <h4>Evento {fila.id}</h4>
    {previa?.tipo_registro === "simulacion_contexto" && <p className={styles.aviso}>
      La evidencia, el analista y los permisos de este ejemplo son ficticios. No acreditan una revisión humana real.
    </p>}
    <p>{datos.FECHA_EVENTO} · {datos.NAME_ROLE} · {datos.NAME_TIPO_EVENTO} · {datos.NAME_CLASIFICACION}<br />
      Oficina {datos.ID_OFICINA}: {datos.NAME_OFICINA}<br />Documento {datos.ID_DOCUMENTO} · {datos.size_archivo_mb} MB · {datos.DOC_INTERNO_EXTERNO}</p>
    {fila.limitaciones.map((texto) => <p className={styles.aviso} key={texto}>{texto}</p>)}
    <fieldset disabled={bloqueado || guardar.isPending} className={styles.revisionCampos}>
      <legend>Selecciona las conclusiones de tu revisión</legend>
      {Object.entries(opciones).map(([nombre, valores]) => <label key={nombre}>{etiquetas[nombre]}
        <select value={decision[nombre]} onChange={(e) => campo(nombre, e.target.value)}>
          {valores.map((v) => <option key={v.valor} value={v.valor}
            disabled={nombre === "fuente" && v.valor === "autentica" && Boolean(fila.limitaciones.length)}>{v.texto}</option>)}
        </select>
      </label>)}
      <label>Referencia del log, ticket, permiso o expediente
        <input maxLength={600} minLength={decision.evidencia === "sin_evidencia" ? undefined : 4}
          required={decision.evidencia !== "sin_evidencia"} value={decision.referencia} placeholder="Ej. ticket AUT-2026-123"
          onChange={(e) => campo("referencia", e.target.value)} />
      </label>
      <label className={styles.revisionNota}>Nota adicional (opcional)
        <textarea maxLength={4000} rows={2} value={decision.nota} onChange={(e) => campo("nota", e.target.value)} />
      </label>
      <label className={styles.revisionCheck}><input type="checkbox" checked={decision.independiente}
        onChange={(e) => campo("independiente", e.target.checked)} />
        Revisé la evidencia independientemente de los scores y reglas del motor.</label>
    </fieldset>
    <p className={styles.nota}>{completa ? "Se guardará como revisión humana verificada según lo declarado."
      : "Se guardará como provisional; no habilita calibración ni certificación."} La etiqueta anterior y el score se muestran después del primer guardado.</p>
    {error && <div className={styles.error} role="alert">{error}
      {conflicto && <button type="button" onClick={onRecargar}>Recargar revisión</button>}
    </div>}
    <div className={styles.revisionAcciones}>
      <button type="submit" className={styles.botonSecundario} disabled={bloqueado || guardar.isPending} value="guardar">Guardar en CSV</button>
      <button type="submit" className={styles.boton} disabled={bloqueado || guardar.isPending} value="siguiente">
        {guardar.isPending ? "Guardando…" : "Guardar y siguiente"}
      </button>
    </div>
    {fila.diagnostico_original && <details className={styles.revisionHistorial}>
      <summary>Etiqueta anterior, predicción e historial</summary>
      <p>Etiqueta original: {fila.etiqueta_original} · Predicción original: {fila.diagnostico_original.prediccion} · Score: {fila.diagnostico_original.score.toFixed(4)}</p>
      <ol>{fila.historial.map((r) => <li key={r.version}>
        Versión {r.version} · {fecha(r.fecha)} · {r.tipo_registro === "simulacion_contexto" ? "Simulación; analista ficticio"
          : r.tipo_registro === "preparacion_pendiente" ? "Preparación automática; analista pendiente" : (r.analista.email || r.analista.id || "Analista pendiente")} · {r.etiqueta} ·
        {r.aplicada_csv ? " aplicada al CSV" : " revisión anterior sin aplicar"} · {r.verificada ? " verificada" : " provisional"}
        <p>{r.referencia || r.evidencia}{r.nota ? ` · ${r.nota}` : ""}</p>
      </li>)}</ol>
    </details>}
  </form>;
}
