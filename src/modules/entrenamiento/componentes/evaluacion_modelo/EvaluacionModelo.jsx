import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { FaChartLine, FaFileCsv } from "react-icons/fa6";
import { useEstadoEvaluacion, useEvaluarDatasetEventos, useEvaluarModelo, useUltimaEvaluacion } from "../../../../api/apiEvaluacion";
import styles from "./EvaluacionModelo.module.css";

const INDICADORES = [
  { key: "accuracy", label: "Accuracy", formula: "(TP + TN) / total" },
  { key: "precision", label: "Precisión", formula: "TP / (TP + FP)" },
  { key: "recall_general", label: "Recall", formula: "TP / (TP + FN)" },
  { key: "f1", label: "F1-Score", formula: "2TP / (2TP + FP + FN)" },
];
const MODELOS = [
  { id: "isolation_forest", nombre: "Isolation Forest", color: "#0284c7" },
  { id: "lstm_autoencoder", nombre: "LSTM Autoencoder", color: "#0d9488" },
  { id: "ensemble", nombre: "Ensemble", color: "#7c3aed" },
];
const porcentaje = (valor) => valor == null ? "—" : (valor * 100).toFixed(2) + "%";
const decimal = (valor) => valor == null ? "—" : Number(valor).toLocaleString("es-ES", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
const errorTexto = (error) => typeof error?.response?.data?.detail === "string"
  ? error.response.data.detail : "No se pudo completar la evaluación de eventos.";

export default function EvaluacionModelo({ ocupado = false }) {
  const [archivo, setArchivo] = useState(null);
  const [errorLocal, setErrorLocal] = useState("");
  const estado = useEstadoEvaluacion();
  const consulta = useUltimaEvaluacion("eventos");
  const evaluarDataset = useEvaluarDatasetEventos();
  const evaluarCSV = useEvaluarModelo();
  const resultado = consulta.data;
  const modelo = estado.data?.modelos?.find((m) => m.dominio === "eventos");
  const pendiente = evaluarDataset.isPending || evaluarCSV.isPending;
  const evaluar = async (usarArchivo = false) => {
    setErrorLocal("");
    try {
      if (usarArchivo) {
        if (!archivo) return;
        await evaluarCSV.mutateAsync({ archivo, dominio: "eventos", etiquetasVerificadas: false });
      } else {
        await evaluarDataset.mutateAsync();
      }
    } catch (error) { setErrorLocal(errorTexto(error)); }
  };
  const variantes = MODELOS.map((modelo) => resultado?.ablacion?.variantes?.find((v) => v.id === modelo.id)).filter(Boolean);
  const grafico = INDICADORES.map(({ key, label }) => ({ nombre: label,
    ...Object.fromEntries(MODELOS.map(({ id }) => {
      const valor = variantes.find((v) => v.id === id)?.[key]?.valor ?? (id === "ensemble" ? resultado?.metricas?.[key]?.valor : null);
      return [id, valor == null ? null : valor * 100];
    })),
  }));
  return (
    <section className={styles.evaluacion} aria-label="Evaluación del ensemble de eventos">
      <div className={styles.encabezado}>
        <div><span className={styles.eyebrow}>TESTING CON ETIQUETAS</span>
          <h2><FaChartLine /> Desempeño de los modelos de eventos</h2>
          <p>Score combinado = 0.40 × Isolation Forest + 0.60 × LSTM Autoencoder, con componentes normalizados entre 0 y 1.</p>
        </div>
        <span className={styles.estado}>{resultado ? "Evaluación disponible" : "Pendiente de evaluación"}</span>
      </div>
      <div className={styles.formulario + " " + styles.formularioEventos}>
        <div><strong>dt_eventos_etiquetados_5000.csv</strong><p className={styles.ayuda}>Compara cada predicción con <code>etiqueta_real</code>. Excluye de las métricas los eventos usados para calibrar. La clase positiva agrupa anomalía y crítico.</p></div>
        <button type="button" className={styles.boton} onClick={() => evaluar()} disabled={ocupado || !modelo?.disponible || !modelo?.dataset_prueba_disponible}>
          <FaFileCsv /> {evaluarDataset.isPending ? "Evaluando dataset…" : "Evaluar eventos reservados"}
        </button>
        <label>Evaluar otro CSV etiquetado<input type="file" accept=".csv" disabled={ocupado} onChange={(e) => setArchivo(e.target.files?.[0] || null)} /></label>
        <button type="button" className={styles.boton} onClick={() => evaluar(true)} disabled={ocupado || !archivo || !modelo?.disponible}>Evaluar CSV seleccionado</button>
      </div>
      {pendiente && <p role="status" className={styles.aviso}>Procesando eventos en orden temporal y calculando métricas sobre sus etiquetas.</p>}
      {(errorLocal || consulta.isError || estado.isError) && <p role="alert" className={styles.error}>{errorLocal || errorTexto(consulta.error || estado.error)}</p>}
      {modelo && !modelo.dataset_prueba_disponible && <p role="alert" className={styles.error}>Falta dt_eventos_etiquetados_5000.csv en el directorio dataset del backend.</p>}
      {consulta.isPending && <p role="status">Cargando última evaluación…</p>}
      <div className={styles.kpis}>
        {INDICADORES.map(({ key, label, formula }) => <article key={key} className={styles.kpi} title={formula}>
          <span className={styles.kpiLabel}>{label}</span><strong className={styles.kpiValor}>{porcentaje(resultado?.metricas?.[key]?.valor)}</strong>
          <small>{formula}</small><span className={styles.pendiente}>{resultado ? "Resultado del ensemble · IF 0.4 + LSTM 0.6" : "Ensemble pendiente de evaluación"}</span>
        </article>)}
      </div>
      {resultado && <>
        <div className={styles.proveniencia}>
          <strong>{resultado.archivo} · {resultado.muestra.total.toLocaleString()} eventos evaluados</strong>
          <span>Entrenamiento: {resultado.dataset_entrenamiento || "dt_eventos.csv"} · Umbral: {resultado.umbral} · Modelo: {resultado.modelo_version}</span>
          <span>Normales: {resultado.muestra.normales.toLocaleString()} · Anomalías (incluye críticos): {resultado.muestra.anomalias.toLocaleString()}</span>
          <span>Evaluación: {new Date(resultado.fecha).toLocaleString("es-CO")}</span>
        </div>
        {resultado.vigente === false && <p className={styles.aviso}>El modelo activo cambió. Evalúa nuevamente para obtener las métricas del modelo actual.</p>}
        {resultado.particion && <div className={styles.proveniencia}>
          <strong>Evaluación temporal: {resultado.particion.eventos_evaluacion.toLocaleString()} eventos</strong>
          <span>Validación para calibrar: {resultado.particion.eventos_validacion.toLocaleString()} eventos · Corte: {new Date(resultado.particion.corte_temporal).toLocaleString("es-CO")}</span>
          <span>Los eventos de calibración no forman parte de los indicadores, la tabla ni los gráficos de este reporte.</span>
        </div>}
        {resultado.verificacion?.advertencias?.map((aviso) => <p className={styles.aviso} key={aviso}>{aviso}</p>)}
        <div className={styles.proveniencia}>
          <strong>Falsos positivos: {resultado.matriz.fp.toLocaleString()} de {resultado.muestra.normales.toLocaleString()} eventos normales ({porcentaje(resultado.punto_operativo?.fpr)})</strong>
          <span>AUC-ROC del ensemble: {decimal(resultado.metricas?.auc_roc?.valor)} · Las métricas de clasificación y la capacidad de ordenar anomalías deben analizarse juntas.</span>
        </div>
        {resultado.particion && resultado.punto_operativo?.fpr > resultado.particion.fpr_maximo_validacion && <p className={styles.aviso}>
          En este periodo, la tasa de falsos positivos supera el límite utilizado durante la calibración. Revisa las etiquetas y los cambios de comportamiento antes de utilizar el modelo para decisiones automáticas.
        </p>}
        <section className={styles.comparacion} aria-labelledby="comparacion-modelos-titulo">
          <div className={styles.panelHeader}><h3 id="comparacion-modelos-titulo">Comparación de modelos</h3><span className={styles.meta}>{resultado.muestra.total.toLocaleString()} eventos · mismo umbral: {resultado.umbral}</span></div>
          <p>Cada modelo individual se evalúa con su score normalizado completo. El ensemble combina ambos scores con pesos 0.40 y 0.60. El umbral común se selecciona para el ensemble; no se optimiza por separado para cada modelo.</p>
          {variantes.length === 3 ? <div className={styles.tablaScroll}>
            <table className={styles.tablaComparacion}>
              <caption>Scores en escala [0, 1]. Std es la desviación estándar poblacional entre los eventos de prueba: una menor dispersión no demuestra mejor detección ni estabilidad entre reentrenamientos.</caption>
              <thead><tr><th scope="col">Modelo</th><th scope="col">Score medio</th>
                {INDICADORES.map(({ key, label }) => <th scope="col" key={key}>{label}</th>)}
                <th scope="col">Dispersión<br />(Std ↓)</th><th scope="col">Observaciones</th>
              </tr></thead>
              <tbody>{variantes.map((v) => <tr key={v.id} className={v.id === "ensemble" ? styles.filaEnsemble : ""}>
                <th scope="row">{MODELOS.find((m) => m.id === v.id).nombre}{v.id === "ensemble" && <small>IF 0.40 + LSTM 0.60</small>}</th>
                <td>{decimal(v.score_medio)}</td>
                {INDICADORES.map(({ key }) => <td key={key}>{porcentaje(v[key]?.valor)}</td>)}
                <td>{decimal(v.score_std)}</td><td>{v.descripcion}</td>
              </tr>)}</tbody>
            </table>
          </div> : <p className={styles.aviso}>Ejecuta la evaluación para obtener la comparación de los tres modelos.</p>}
          {variantes.some((v) => v.score_medio == null || v.score_std == null) && <p className={styles.aviso}>Vuelve a evaluar para calcular el score medio y su desviación estándar.</p>}
        </section>
        <div className={styles.graficos}>
          <article className={styles.panel}><h3>Métricas por modelo</h3><div className={styles.chart}>
            <ResponsiveContainer width="100%" height="100%"><BarChart data={grafico} margin={{ top: 20, right: 15, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="nombre" /><YAxis domain={[0, 100]} tickFormatter={(v) => v + "%"} />
              <Tooltip formatter={(valor, nombre) => [Number(valor).toFixed(2) + "%", nombre]} /><Legend />
              {MODELOS.map((m) => <Bar key={m.id} dataKey={m.id} name={m.nombre} fill={m.color} radius={[4, 4, 0, 0]} />)}
            </BarChart></ResponsiveContainer>
          </div></article>
          <article className={styles.panel}><h3>Matriz de confusión del ensemble</h3><p>Filas: etiqueta real · Columnas: predicción del ensemble</p>
            <div className={styles.matriz}><span /><span className={styles.eje}>Pred. normal</span><span className={styles.eje}>Pred. anomalía</span>
              <span className={styles.eje}>Real normal</span>
              <div className={styles.celda}><strong>{resultado.matriz.tn}</strong><span>TN · Verdaderos negativos</span></div>
              <div className={styles.celda}><strong>{resultado.matriz.fp}</strong><span>FP · Falsos positivos</span></div>
              <span className={styles.eje}>Real anomalía</span>
              <div className={styles.celda}><strong>{resultado.matriz.fn}</strong><span>FN · Falsos negativos</span></div>
              <div className={styles.celda}><strong>{resultado.matriz.tp}</strong><span>TP · Verdaderos positivos</span></div>
            </div>
          </article>
        </div>
      </>}
    </section>
  );
}
