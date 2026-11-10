import { useState } from "react";
import { toast } from "sonner";
import { useGuardarDecision } from "../../../api/apiRevision";
import styles from "../pages/revisionOficial.module.css";

const SI_NO = [
  { valor: "si", etiqueta: "Sí" },
  { valor: "no", etiqueta: "No" },
  { valor: "no_se", etiqueta: "No lo sé" },
];
const SEVERIDADES = [
  { valor: "baja", etiqueta: "Baja" },
  { valor: "media", etiqueta: "Media" },
  { valor: "alta", etiqueta: "Alta" },
  { valor: "critica", etiqueta: "Crítica" },
];

function Opciones({ nombre, valor, onCambio, opciones }) {
  return (
    <div className={styles.opciones} role="radiogroup" aria-label={nombre}>
      {opciones.map((o) => (
        <label key={o.valor} className={`${styles.opcion} ${valor === o.valor ? styles.opcionActiva : ""}`}>
          <input type="radio" name={nombre} value={o.valor} checked={valor === o.valor} onChange={() => onCambio(o.valor)} />
          {o.etiqueta}
        </label>
      ))}
    </div>
  );
}

const puntuacion = (v) => (v == null ? "—" : Number(v).toFixed(2));

export default function FormularioCaso({ caso, preguntas, alGuardar }) {
  const guardar = useGuardarDecision();
  const previa = caso.decision;
  const [marcados, setMarcados] = useState(() => new Set(previa?.eventos_anomalos_if ?? []));
  const [secuencia, setSecuencia] = useState(previa?.secuencia_anomala ?? "");
  const [desde, setDesde] = useState(previa?.desde_evento ?? "");
  const [incidente, setIncidente] = useState(previa?.es_incidente ?? "");
  const [severidad, setSeveridad] = useState(previa?.severidad ?? "");
  const [comentario, setComentario] = useState(previa?.comentario ?? "");
  const revelado = caso.revelado;
  const porId = Object.fromEntries((revelado?.eventos ?? []).map((e) => [e.id, e]));
  const completo = secuencia && incidente && (incidente !== "si" || severidad);

  const alternar = (id) =>
    setMarcados((actual) => {
      const nuevo = new Set(actual);
      if (nuevo.has(id)) nuevo.delete(id);
      else nuevo.add(id);
      return nuevo;
    });

  const enviar = async (siguiente) => {
    try {
      await guardar.mutateAsync({
        id: caso.id,
        cuerpo: {
          eventos_anomalos_if: [...marcados],
          secuencia_anomala: secuencia,
          desde_evento: secuencia === "si" && desde !== "" ? Number(desde) : null,
          es_incidente: incidente,
          severidad: incidente === "si" ? severidad : null,
          comentario,
        },
      });
      toast.success("Decisión guardada.");
      alGuardar(siguiente);
    } catch (error) {
      toast.error(error?.response?.data?.detail || "No se pudo guardar la decisión.");
    }
  };

  const h = caso.habito;
  return (
    <div className={styles.detalle}>
      <section className={styles.tarjeta} aria-label="Usuario y hábito">
        <h2>
          Usuario {caso.usuario.nombre} <small>#{caso.usuario.id} · {caso.usuario.rol}</small>
        </h2>
        <p className={styles.meta}>
          {caso.inicio} · {caso.duracion_min} min · {caso.n_eventos_total} eventos
          {caso.recortado && ` (se muestran ${caso.eventos.length}, alrededor de la primera alerta)`}
        </p>
        {h?.disponible ? (
          <dl className={styles.habito}>
            <div><dt>Historial</dt><dd>{h.eventos_historial?.toLocaleString()} eventos</dd></div>
            <div><dt>Eventos por día</dt><dd>{h.eventos_por_dia ?? "—"}</dd></div>
            <div><dt>Horas habituales</dt><dd>{h.horas_habituales.map((x) => `${x.hora} (${x.pct}%)`).join(", ") || "—"}</dd></div>
            <div><dt>Fines de semana</dt><dd>{h.pct_fin_de_semana ?? "—"}%</dd></div>
            <div><dt>Oficinas habituales</dt><dd>{h.oficinas_habituales.join(", ") || "—"}</dd></div>
          </dl>
        ) : (
          <p className={styles.meta}>Este usuario no tiene historial de entrenamiento: no hay hábito de referencia.</p>
        )}
      </section>

      <section className={styles.tarjeta} aria-label="Actividad en orden cronológico">
        <h3>Actividad en orden cronológico</h3>
        <div className={styles.tablaScroll}>
          <table className={styles.tabla}>
            <thead>
              <tr>
                <th>#</th><th>Fecha y hora</th><th>Acción</th><th>Documento</th><th>Clasificación</th>
                <th>Oficina</th><th>MB</th><th>Destino</th>
                <th className={styles.colIf}>¿Raro solo? (IF)</th>
                {revelado && <><th>Score IF</th><th>Score LSTM</th><th>Etiqueta dataset</th></>}
              </tr>
            </thead>
            <tbody>
              {caso.eventos.map((e, i) => {
                const r = porId[e.id];
                return (
                  <tr key={e.id} className={marcados.has(e.id) ? styles.filaMarcada : ""}>
                    <td>{i + 1}</td>
                    <td>{e.fecha}</td>
                    <td><span className={`${styles.accion} ${e.accion === "VISTA" ? "" : styles.accionCritica}`}>{e.accion}</span></td>
                    <td>{e.documento}</td>
                    <td>{e.clasificacion}</td>
                    <td>{e.oficina}</td>
                    <td>{e.tamano_mb}</td>
                    <td>{e.destino}</td>
                    <td className={styles.colIf}>
                      <input
                        type="checkbox" checked={marcados.has(e.id)} onChange={() => alternar(e.id)}
                        aria-label={`Marcar el evento ${i + 1} como anómalo por sí solo`}
                      />
                    </td>
                    {r && (
                      <>
                        <td className={r.flag_if ? styles.alerta : ""}>{puntuacion(r.if_norm)}</td>
                        <td className={r.flag_lstm ? styles.alerta : ""}>{puntuacion(r.lstm_norm)}</td>
                        <td>{r.etiqueta_dataset}</td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className={`${styles.tarjeta} ${styles.preguntaIf}`} aria-label="Pregunta Isolation Forest">
        <h3>{preguntas.if.titulo}</h3>
        <p>{preguntas.if.texto}</p>
        <p className={styles.meta}>Marque los eventos en la tabla. Eventos marcados: <strong>{marcados.size}</strong> de {caso.eventos.length}.</p>
      </section>

      <section className={`${styles.tarjeta} ${styles.preguntaLstm}`} aria-label="Pregunta LSTM Autoencoder">
        <h3>{preguntas.lstm.titulo}</h3>
        <p>{preguntas.lstm.texto}</p>
        <Opciones nombre="Secuencia anómala" valor={secuencia} onCambio={(v) => { setSecuencia(v); if (v !== "si") setDesde(""); }} opciones={SI_NO} />
        {secuencia === "si" && (
          <label className={styles.campo}>
            ¿Desde qué evento empieza la anomalía? (opcional)
            <select value={desde} onChange={(e) => setDesde(e.target.value)}>
              <option value="">Toda la secuencia</option>
              {caso.eventos.map((e, i) => (
                <option key={e.id} value={e.id}>{i + 1}. {e.fecha.slice(11)} · {e.accion}</option>
              ))}
            </select>
          </label>
        )}
      </section>

      <section className={`${styles.tarjeta} ${styles.preguntaGlobal}`} aria-label="Decisión final">
        <h3>{preguntas.global.titulo}</h3>
        <p>{preguntas.global.texto}</p>
        <Opciones nombre="Es incidente" valor={incidente} onCambio={setIncidente} opciones={SI_NO} />
        {incidente === "si" && (
          <div className={styles.campo}>
            Severidad
            <Opciones nombre="Severidad" valor={severidad} onCambio={setSeveridad} opciones={SEVERIDADES} />
          </div>
        )}
        <label className={styles.campo}>
          Comentario (opcional)
          <textarea value={comentario} maxLength={500} rows={3} onChange={(e) => setComentario(e.target.value)} />
        </label>
        <div className={styles.acciones}>
          <button type="button" className={styles.botonPrimario} disabled={!completo || guardar.isPending} onClick={() => enviar(false)}>
            {guardar.isPending ? "Guardando…" : previa ? "Actualizar decisión" : "Guardar decisión"}
          </button>
          <button type="button" className={styles.boton} disabled={!completo || guardar.isPending} onClick={() => enviar(true)}>
            Guardar y pasar al siguiente
          </button>
          {!completo && <span className={styles.meta}>Responda el LSTM y la decisión final{incidente === "si" && !severidad ? " (falta la severidad)" : ""}.</span>}
        </div>
      </section>

      {revelado && (
        <section className={`${styles.tarjeta} ${styles.revelado}`} aria-label="Lo que dijeron los modelos">
          <h3>Lo que dijeron los modelos (revelado tras decidir)</h3>
          <p>
            Grupo del caso: <strong>{revelado.grupo_texto}</strong> · umbral {revelado.umbral}. Isolation Forest alertó{" "}
            <strong>{revelado.eventos.filter((e) => e.flag_if).length}</strong> eventos, el LSTM{" "}
            <strong>{revelado.eventos.filter((e) => e.flag_lstm).length}</strong> y el ensemble{" "}
            <strong>{revelado.eventos.filter((e) => e.flag_ens).length}</strong>.
          </p>
        </section>
      )}
    </div>
  );
}
