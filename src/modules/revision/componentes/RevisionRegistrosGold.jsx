import { useState } from "react";
import { FaMagnifyingGlass, FaShieldHalved } from "react-icons/fa6";
import { toast } from "sonner";
import {
  useGuardarDecisionGold,
  useRegistroRevisionGold,
  useRegistrosRevisionGold,
} from "../../../api/apiRevision";
import styles from "../pages/revisionOficial.module.css";

const ETIQUETAS = [
  { valor: "normal", nombre: "Normal" },
  { valor: "anomalia", nombre: "Anomalía" },
  { valor: "no_se", nombre: "No puedo determinar" },
];
const SEVERIDADES = [
  { valor: "media", nombre: "Media" },
  { valor: "alta", nombre: "Alta" },
  { valor: "critica", nombre: "Crítica" },
];
const nombreEtiqueta = (valor) => ({
  normal: "Normal", anomalia: "Anomalía", no_se: "No puedo determinar", critico: "Crítico",
  media: "Media", alta: "Alta", critica: "Crítica",
})[valor] || valor;
const fechaLegible = (valor) => {
  if (!valor) return "—";
  const [fecha, hora = ""] = valor.split(" ");
  return `${fecha} · ${hora}`;
};

function Opciones({ nombre, valor, opciones, onChange }) {
  return (
    <div className={styles.opciones} role="radiogroup" aria-label={nombre}>
      {opciones.map((opcion) => (
        <label key={opcion.valor} className={`${styles.opcion} ${valor === opcion.valor ? styles.opcionActiva : ""}`}>
          <input
            type="radio"
            name={nombre}
            value={opcion.valor}
            checked={valor === opcion.valor}
            onChange={() => onChange(opcion.valor)}
          />
          {opcion.nombre}
        </label>
      ))}
    </div>
  );
}

function FormularioRegistro({ registro, alGuardar }) {
  const guardar = useGuardarDecisionGold();
  const previa = registro.decision;
  const [etiqueta, setEtiqueta] = useState(previa?.etiqueta ?? "");
  const [severidad, setSeveridad] = useState(previa?.severidad ?? "");
  const [comentario, setComentario] = useState(previa?.comentario ?? "");
  const completo = Boolean(etiqueta && (etiqueta !== "anomalia" || severidad));
  const contexto = registro.contexto ?? {};

  const enviar = async (siguiente) => {
    try {
      await guardar.mutateAsync({
        id: registro.id,
        decision: {
          etiqueta_humana: etiqueta,
          severidad_humana: etiqueta === "anomalia" ? severidad : null,
          comentario,
        },
      });
      toast.success("Revisión oficial guardada en la muestra gold.");
      alGuardar(siguiente);
    } catch (error) {
      toast.error(error?.response?.data?.detail || "No se pudo guardar la revisión.");
    }
  };

  return (
    <div className={styles.detalle}>
      <section className={styles.tarjeta} aria-label="Datos del evento">
        <div className={styles.goldTituloRegistro}>
          <div>
            <span className={styles.meta}>Registro #{registro.id}</span>
            <h2>{registro.usuario?.nombre || "Usuario sin nombre"}</h2>
          </div>
          <span className={`${styles.goldEtiquetaAccion} ${registro.accion !== "VISTA" ? styles.accionCritica : ""}`}>
            {registro.accion}
          </span>
        </div>
        <p className={styles.meta}>{fechaLegible(registro.fecha)} · Rol: {registro.usuario?.rol || "—"}</p>
        <dl className={styles.habito}>
          <div><dt>Oficina</dt><dd>{registro.oficina?.nombre || "—"} · #{registro.oficina?.id ?? "—"}</dd></div>
          <div><dt>Documento</dt><dd>#{registro.documento ?? "—"} · {registro.clasificacion || "Sin clasificación"}</dd></div>
          <div><dt>Destino</dt><dd>{registro.destino || "—"}</dd></div>
          <div><dt>Tamaño</dt><dd>{registro.tamano_mb == null ? "—" : `${registro.tamano_mb} MB`}</dd></div>
        </dl>
      </section>

      <section className={`${styles.tarjeta} ${styles.goldContexto}`} aria-label="Contexto del evento">
        <h3>Contexto disponible al momento del evento</h3>
        <dl className={styles.habito}>
          <div><dt>Eventos del usuario en 30 min</dt><dd>{contexto.eventos_usuario_30min ?? "—"}</dd></div>
          <div><dt>Documentos distintos en 30 min</dt><dd>{contexto.documentos_distintos_30min ?? "—"}</dd></div>
          <div><dt>Eventos previos en historial</dt><dd>{contexto.historial_eventos_usuario ?? "—"}</dd></div>
          <div><dt>Actividad previa en esta hora</dt><dd>{contexto.pct_historial_en_esta_hora == null ? "—" : `${contexto.pct_historial_en_esta_hora}%`}</dd></div>
          <div><dt>Abrió este documento antes</dt><dd>{contexto.usuario_toco_documento_antes === 1 ? "Sí" : contexto.usuario_toco_documento_antes === 0 ? "No" : "—"}</dd></div>
          <div><dt>Usó esta oficina antes</dt><dd>{contexto.usuario_uso_oficina_antes === 1 ? "Sí" : contexto.usuario_uso_oficina_antes === 0 ? "No" : "—"}</dd></div>
        </dl>
      </section>

      <section className={`${styles.tarjeta} ${styles.goldDecision}`} aria-label="Etiqueta oficial">
        <h3>Decisión del oficial de seguridad</h3>
        <p>Clasifique el evento según el contexto y la evidencia disponible. No se muestran la etiqueta previa ni los scores antes de guardar.</p>
        <Opciones nombre={`etiqueta-${registro.id}`} valor={etiqueta} opciones={ETIQUETAS} onChange={(valor) => { setEtiqueta(valor); if (valor !== "anomalia") setSeveridad(""); }} />
        {etiqueta === "anomalia" && (
          <div className={styles.goldSeveridad}>
            <strong>Severidad de la anomalía</strong>
            <Opciones nombre={`severidad-${registro.id}`} valor={severidad} opciones={SEVERIDADES} onChange={setSeveridad} />
          </div>
        )}
        {etiqueta === "no_se" && (
          <p className={styles.goldNota}>El caso queda marcado como pendiente de una conclusión; podrá revisarlo más adelante.</p>
        )}
        <label className={styles.campo}>
          Comentario o sustento (opcional)
          <textarea value={comentario} maxLength={500} rows={3} onChange={(e) => setComentario(e.target.value)} />
        </label>
        <div className={styles.acciones}>
          <button type="button" className={styles.botonPrimario} disabled={!completo || guardar.isPending} onClick={() => enviar(false)}>
            {guardar.isPending ? "Guardando…" : previa ? "Actualizar revisión" : "Guardar revisión"}
          </button>
          <button type="button" className={styles.boton} disabled={!completo || guardar.isPending} onClick={() => enviar(true)}>
            Guardar y pasar al siguiente
          </button>
          {!completo && <span className={styles.meta}>Seleccione una etiqueta{etiqueta === "anomalia" && !severidad ? " e indique la severidad" : ""}.</span>}
        </div>
        {registro.decision && registro.decision.etiqueta !== "no_se" && registro.comparacion_dataset && (
          <div className={styles.goldComparacion}>
            <strong>Revisión guardada</strong>
            <span>Etiqueta del oficial: {nombreEtiqueta(registro.decision.etiqueta)}{registro.decision.severidad ? ` · ${nombreEtiqueta(registro.decision.severidad)}` : ""}</span>
            <span>Etiqueta previa del dataset: {nombreEtiqueta(registro.comparacion_dataset.etiqueta)}</span>
            <span className={registro.coincide_dataset ? styles.goldCoincide : styles.goldDifiere}>
              {registro.coincide_dataset ? "Coinciden" : "La etiqueta actual del dataset no coincide"}
            </span>
            <small>{registro.decision.revisor} · {registro.decision.fecha}</small>
          </div>
        )}
      </section>
    </div>
  );
}

export default function RevisionRegistrosGold() {
  const [seleccion, setSeleccion] = useState(null);
  const [soloPendientes, setSoloPendientes] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const listado = useRegistrosRevisionGold();
  const registros = listado.data?.registros ?? [];
  const consultaEstado = listado.data?.estado ?? {};
  const coincideBusqueda = (registro) => {
    const termino = busqueda.trim().toLowerCase();
    return !termino || [registro.id, registro.usuario?.nombre, registro.usuario?.rol, registro.accion]
      .some((valor) => String(valor ?? "").toLowerCase().includes(termino));
  };
  const estaPendiente = (registro) => !registro.decision || registro.decision.etiqueta === "no_se";
  const visibles = registros.filter((registro) => (!soloPendientes || estaPendiente(registro)) && coincideBusqueda(registro));
  const actualId = visibles.some((registro) => registro.id === seleccion) ? seleccion : visibles[0]?.id ?? null;
  const registro = useRegistroRevisionGold(actualId);

  const alGuardar = (siguiente) => {
    if (!siguiente) return;
    const indice = registros.findIndex((item) => item.id === actualId);
    const proximo = [...registros.slice(indice + 1), ...registros.slice(0, indice)]
      .find((item) => estaPendiente(item) && item.id !== actualId);
    if (proximo) setSeleccion(proximo.id);
    else toast.info("No quedan registros pendientes de revisión.");
  };

  if (listado.isPending) return <p role="status">Cargando muestra de revisión oficial…</p>;
  if (listado.isError) return <p role="alert" className={styles.error}>{listado.error?.response?.data?.detail || "No se pudo cargar la muestra gold."}</p>;

  return (
    <section className={styles.goldPage} aria-label="Revisión oficial de etiquetas gold">
      <div className={styles.goldCabecera}>
        <div>
          <h2><FaShieldHalved /> Revisión ciega de registros gold</h2>
          <p>Clasifique cada evento con la evidencia disponible. La etiqueta existente del dataset se revela después de guardar su decisión.</p>
        </div>
        <div className={styles.goldProgreso}>
          <strong>{consultaEstado.revisados ?? 0} / {consultaEstado.total ?? 0}</strong>
          <span>etiquetas oficiales completas</span>
          <progress value={consultaEstado.revisados ?? 0} max={Math.max(consultaEstado.total ?? 0, 1)} />
          <small>{consultaEstado.pendientes ?? 0} pendientes · {consultaEstado.no_se ?? 0} por determinar</small>
        </div>
      </div>

      <div className={styles.goldResumen}>
        <article><span>Total de registros</span><strong>{consultaEstado.total ?? 0}</strong></article>
        <article><span>Normales</span><strong>{consultaEstado.normales ?? 0}</strong></article>
        <article><span>Anomalías</span><strong>{consultaEstado.anomalias ?? 0}</strong></article>
        <article><span>No determinado</span><strong>{consultaEstado.no_se ?? 0}</strong></article>
      </div>

      <div className={styles.goldHerramientas}>
        <label className={styles.filtro}>
          <input type="checkbox" checked={soloPendientes} onChange={(e) => setSoloPendientes(e.target.checked)} />
          Pendientes y por determinar
        </label>
        <label className={styles.goldBusqueda}>
          <FaMagnifyingGlass />
          <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar ID, usuario, rol o acción" />
        </label>
      </div>

      <div className={styles.goldLayout}>
        <aside className={styles.goldLista} aria-label="Registros de la muestra gold">
          <ul>
            {visibles.map((item) => (
              <li key={item.id}>
                <button type="button" className={`${styles.itemCaso} ${item.id === actualId ? styles.itemActivo : ""}`} onClick={() => setSeleccion(item.id)}>
                  <span className={item.decision?.etiqueta === "normal" || item.decision?.etiqueta === "anomalia" ? styles.hecho : styles.pendiente}>
                    {item.decision?.etiqueta === "normal" || item.decision?.etiqueta === "anomalia" ? "✓" : "○"}
                  </span>
                  <span>
                    <strong>{item.usuario?.nombre || `Evento ${item.id}`}</strong>
                    <small>{item.id} · {item.fecha} · {item.accion}</small>
                  </span>
                </button>
              </li>
            ))}
            {visibles.length === 0 && <li className={styles.meta}>No hay registros que coincidan con el filtro.</li>}
          </ul>
        </aside>
        <main>
          {registro.isPending && <p role="status">Cargando registro…</p>}
          {registro.isError && <p role="alert" className={styles.error}>No se pudo cargar el registro.</p>}
          {registro.data && <FormularioRegistro key={`${registro.data.id}-${registro.data.decision?.fecha ?? "nuevo"}`} registro={registro.data} alGuardar={alGuardar} />}
          {!actualId && <section className={styles.tarjeta}><h3>Revisión completada</h3><p>No quedan registros pendientes. Puede quitar el filtro para consultar las decisiones guardadas.</p></section>}
        </main>
      </div>
    </section>
  );
}
