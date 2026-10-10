import { useId, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  FaChartLine,
  FaCircleCheck,
  FaFileCsv,
  FaShieldHalved,
  FaTrashCan,
  FaTriangleExclamation,
} from "react-icons/fa6";
import {
  useBorrarUltimaEvaluacion,
  useEstadoEvaluacion,
  useEvaluarModelo,
  useUltimaEvaluacion,
} from "../../../../api/apiEvaluacion";
import styles from "./EvaluacionModelo.module.css";

const INDICADORES = [
  { key: "accuracy", label: "Accuracy", meta: "≥ 95.0%", formula: "(TP + TN) / total" },
  { key: "precision", label: "Precisión", meta: "≥ 99.0%", formula: "TP / (TP + FP)" },
  { key: "recall_general", label: "Recall General", meta: "≥ 98.0%", formula: "TP / (TP + FN)" },
  { key: "recall_critico", label: "Recall Crítico", meta: "100%", formula: "Críticos detectados / críticos reales" },
  { key: "f1", label: "F1-Score", meta: "≥ 98.5%", formula: "2TP / (2TP + FP + FN)" },
  {
    key: "auc_roc",
    label: "AUC-ROC",
    meta: "≥ 0.923",
    formula: "Área de la ROC del score híbrido; mínimo requerido > 0.85",
  },
];
const CELDAS = [
  { key: "tn", label: "TN · Verdaderos negativos", detalle: "Normal → Normal", correcto: true },
  { key: "fp", label: "FP · Falsos positivos", detalle: "Normal → Anomalía" },
  { key: "fn", label: "FN · Falsos negativos", detalle: "Anomalía → Normal" },
  { key: "tp", label: "TP · Verdaderos positivos", detalle: "Anomalía → Anomalía", correcto: true },
];
const porcentaje = (valor) => (valor == null ? "—" : `${(valor * 100).toFixed(1)}%`);
const porcentajeEje = (valor) => `${Math.round(valor * 100)}%`;
const formatoValor = (valor, key) => (key === "auc_roc" ? (valor == null ? "—" : valor.toFixed(3)) : porcentaje(valor));
const formatoBrecha = (brecha, key) => {
  if (key === "auc_roc") return `Falta ${brecha < 0.0001 ? "< 0.0001" : brecha.toFixed(4)}`;
  return `Faltan ${brecha * 100 < 0.01 ? "< 0.01" : (brecha * 100).toFixed(2)} puntos porcentuales`;
};
const textoIC = (ic, key) => (ic ? `${formatoValor(ic[0], key)} – ${formatoValor(ic[1], key)}` : "—");
const COLUMNAS_ABLACION = [
  { key: "auc_roc", label: "AUC-ROC" },
  { key: "pr_auc", label: "PR-AUC" },
  { key: "precision", label: "Precisión" },
  { key: "recall_general", label: "Recall" },
  { key: "f1", label: "F1" },
];
const errorTexto = (error) => {
  const detalle = error?.response?.data?.detail;
  return typeof detalle === "string"
    ? detalle
    : "No se pudo completar la evaluación. Verifica la conexión y el archivo.";
};

function TooltipROC({ active, payload }) {
  if (!active || !payload?.length) return null;
  const punto = payload[0].payload;
  return (
    <div className={styles.tooltip}>
      <strong>Umbral: {punto.umbral == null ? "Sin detecciones" : punto.umbral.toFixed(4)}</strong>
      <span>Falsos positivos (FPR): {porcentaje(punto.fpr)}</span>
      <span>Verdaderos positivos (TPR): {porcentaje(punto.tpr)}</span>
    </div>
  );
}

export default function EvaluacionModelo() {
  const [dominio, setDominio] = useState("eventos");
  const [archivo, setArchivo] = useState(null);
  const [verificadas, setVerificadas] = useState(false);
  const [celda, setCelda] = useState("fn");
  const [errorLocal, setErrorLocal] = useState("");
  const estado = useEstadoEvaluacion();
  const consulta = useUltimaEvaluacion(dominio);
  const evaluar = useEvaluarModelo();
  const borrar = useBorrarUltimaEvaluacion();
  const resultado = consulta.data;
  const modelo = estado.data?.modelos?.find((m) => m.dominio === dominio);
  const maxMb = estado.data?.max_mb ?? 30;
  const gradiente = `roc-${useId().replace(/:/g, "")}`;
  const certificado = resultado?.certificado_critico && resultado?.vigente !== false;
  const calidad = resultado?.verificacion?.calidad_etiquetas;

  const ejecutar = async (event) => {
    event.preventDefault();
    setErrorLocal("");
    if (!archivo) {
      setErrorLocal("Selecciona un CSV etiquetado para evaluar.");
      return;
    }
    if (archivo.size > maxMb * 1024 * 1024) {
      setErrorLocal(`El archivo supera el máximo de ${maxMb} MB.`);
      return;
    }
    try {
      await evaluar.mutateAsync({ archivo, dominio, etiquetasVerificadas: verificadas });
      setCelda("fn");
    } catch (error) {
      setErrorLocal(errorTexto(error));
    }
  };

  return (
    <section className={styles.evaluacion} aria-label="Evaluación del modelo entrenado">
      <div className={styles.encabezado}>
        <div>
          <span className={styles.eyebrow}>VALIDACIÓN DEL MODELO</span>
          <h2>
            <FaChartLine /> Desempeño predictivo
          </h2>
          <p>
            Resultados medidos sobre las etiquetas del conjunto de prueba. Cada indicador muestra su distancia frente a
            la meta.
          </p>
        </div>
        <span className={styles.estado}>{resultado ? "Evaluación disponible" : "Pendiente de validación"}</span>
      </div>

      <form className={styles.formulario} onSubmit={ejecutar}>
        <label>
          Motor a evaluar
          <select
            value={dominio}
            disabled={evaluar.isPending}
            onChange={(event) => {
              setDominio(event.target.value);
              setArchivo(null);
              setErrorLocal("");
              setVerificadas(false);
              evaluar.reset();
            }}
          >
            <option value="eventos">Eventos · Inferencia online</option>
            <option value="trazabilidad">Trazabilidad · Inferencia por lote</option>
          </select>
        </label>
        <label>
          Conjunto de prueba etiquetado
          <input
            key={dominio}
            type="file"
            accept=".csv,text/csv"
            disabled={evaluar.isPending}
            onChange={(event) => {
              setArchivo(event.target.files?.[0] || null);
              setErrorLocal("");
            }}
          />
        </label>
        <button className={styles.boton} type="submit" disabled={evaluar.isPending || !archivo || !modelo?.disponible}>
          <FaFileCsv /> {evaluar.isPending ? "Evaluando observaciones…" : "Evaluar el conjunto"}
        </button>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={verificadas}
            disabled={evaluar.isPending}
            onChange={(e) => setVerificadas(e.target.checked)}
          />
          Las etiquetas fueron revisadas por un analista, independientemente de los scores y reglas del motor.
        </label>
        <p className={styles.ayuda}>
          Usa las columnas del CSV original y añade <code>etiqueta_real</code>: <code>normal</code>,{" "}
          <code>anomalia</code> o <code>critico</code>. Incluye normales y anomalías omitidas. Máximo{" "}
          {(estado.data?.max_filas ?? 100_000).toLocaleString("es-ES")} filas y {maxMb} MB. Los eventos se procesan en
          orden temporal con una sesión de prueba aislada.
        </p>
      </form>



      {evaluar.isPending && (
        <p role="status" className={styles.aviso}>
          Procesando todas las observaciones por bloques en CPU, conservando el orden temporal de cada usuario.
        </p>
      )}
      {(errorLocal || consulta.isError || estado.isError) && (
        <div role="alert" className={styles.error}>
          {errorLocal || errorTexto(consulta.error || estado.error)}
          {(consulta.isError || estado.isError) && (
            <button
              type="button"
              onClick={() => {
                consulta.refetch();
                estado.refetch();
              }}
            >
              Reintentar conexión
            </button>
          )}
        </div>
      )}
      {modelo && !modelo.disponible && (
        <p className={styles.aviso}>
          El modelo no está inicializado. Espera a que el servidor complete la carga del modelo.
        </p>
      )}
      {consulta.isPending && <p role="status">Cargando la última evaluación…</p>}
      <div className={styles.kpis}>
        {INDICADORES.map(({ key, label, meta, formula }) => {
          const indicador = resultado?.metricas?.[key];
          const cumple = indicador?.cumple;
          return (
            <article
              key={key}
              className={`${styles.kpi} ${cumple === true ? styles.kpiCumple : cumple === false ? styles.kpiFalta : ""}`}
              title={formula}
            >
              <span className={styles.kpiLabel}>{label}</span>
              <strong className={styles.kpiValor}>{formatoValor(indicador?.valor, key)}</strong>
              <span className={styles.meta}>Meta {meta}</span>
              {indicador?.valor == null ? (
                <span className={styles.pendiente}>
                  {resultado ? "No calculable con esta muestra" : "Pendiente de evaluación"}
                </span>
              ) : (
                <span className={cumple ? styles.cumple : styles.falta}>
                  {cumple ? "Meta alcanzada" : formatoBrecha(indicador.brecha, key)}
                </span>
              )}
              {key === "recall_critico" && certificado && (
                <span className={styles.certificado}>
                  <FaCircleCheck /> Certificado / Zero Falsos Negativos <small>En la muestra evaluada</small>
                </span>
              )}
              {key === "auc_roc" && indicador?.valor != null && (
                <small>Mínimo &gt; 0.85: {indicador.valor > 0.85 ? "cumple" : "pendiente"}</small>
              )}
            </article>
          );
        })}
      </div>

      {!resultado && !consulta.isPending && (
        <div className={styles.vacio}>
          <FaShieldHalved />
          <h3>La evaluación empieza con evidencia</h3>
          <p>
            Carga una muestra etiquetada para obtener métricas, curva ROC y casos de error. Los porcentajes objetivo no
            se usan como resultados.
          </p>
        </div>
      )}

      {resultado && (
        <>
          <div className={styles.proveniencia}>
            <strong>{resultado.alcance}</strong>
            <span>
              {resultado.muestra.total.toLocaleString()} observaciones · {resultado.muestra.normales.toLocaleString()}{" "}
              normales · {resultado.muestra.anomalias.toLocaleString()} anomalías ·{" "}
              {resultado.muestra.criticos.toLocaleString()} críticos
            </span>
            <span>
              Modelo {resultado.modelo_version} · Evaluado{" "}
              {new Date(resultado.fecha).toLocaleString("es-PE", { timeZone: "America/Lima" })} (Lima)
            </span>
            <span>
              Archivo: {resultado.archivo} · Umbral del score: {resultado.umbral} · Periodo:{" "}
              {resultado.verificacion.periodo_inicio.slice(0, 10)} a {resultado.verificacion.periodo_fin.slice(0, 10)}
            </span>
            {resultado.procesamiento && (
              <span>
                Procesamiento: {resultado.procesamiento.segundos_total.toFixed(1)} s · {resultado.procesamiento.motor} ·{" "}
                {resultado.procesamiento.modo}
              </span>
            )}
            <button
              type="button"
              className={styles.botonBorrar}
              disabled={borrar.isPending || evaluar.isPending}
              onClick={async () => {
                setErrorLocal("");
                try {
                  await borrar.mutateAsync(dominio);
                } catch (error) {
                  setErrorLocal(errorTexto(error));
                }
              }}
            >
              <FaTrashCan /> {borrar.isPending ? "Borrando evaluación…" : "Borrar última evaluación"}
            </button>
          </div>
          {resultado.vigente === false && (
            <p className={styles.aviso}>
              El modelo activo cambió. Esta evaluación es histórica; vuelve a evaluar el modelo actual.
            </p>
          )}
          {/* {resultado.verificacion.advertencias.map((aviso) => (
            <p className={styles.aviso} key={aviso}>
              <FaTriangleExclamation /> {aviso}
            </p>
          ))} */}
          {/* {resultado.complementarias && (
            <div className={styles.complementarias}>
              <article title="Área bajo la curva precisión-recall. El valor de referencia (clasificador al azar) es la prevalencia de anomalías.">
                <span className={styles.kpiLabel}>PR-AUC</span>
                <strong>{formatoValor(resultado.complementarias.pr_auc.valor, "auc_roc")}</strong>
                <small>
                  IC 95%: {textoIC(resultado.complementarias.pr_auc.ic95, "auc_roc")} · al azar ={" "}
                  {porcentaje(resultado.complementarias.prevalencia)}
                </small>
              </article>
              <article title="Anomalías sobre el total de observaciones de la muestra. En producción suele ser mucho menor.">
                <span className={styles.kpiLabel}>Prevalencia en la muestra</span>
                <strong>{porcentaje(resultado.complementarias.prevalencia)}</strong>
                <small>Con prevalencias altas la accuracy y la precisión se ven favorecidas.</small>
              </article>
              <article title="Cantidad de alertas que recibiría un analista por cada 1000 eventos con esta decisión.">
                <span className={styles.kpiLabel}>Alertas por 1000 eventos</span>
                <strong>{resultado.complementarias.alertas_por_mil.toFixed(1)}</strong>
                <small>Carga de revisión del analista con el umbral desplegado.</small>
              </article>
            </div>
          )} */}
          {/* <div className={styles.graficos}>
            <article className={styles.panel}>
              <div className={styles.panelHeader}>
                <h3>Curva ROC</h3>
                <span className={styles.auc}>AUC = {formatoValor(resultado.metricas.auc_roc.valor, "auc_roc")}</span>
              </div>
              <p>
                Cada punto corresponde a un umbral. Más cerca de la esquina superior izquierda significa más
                anomalías detectadas y menos falsas alarmas.
              </p>
              {resultado.roc.length ? (
                <figure className={styles.rocGrafico} aria-label="Curva ROC: tasa de verdaderos positivos frente a tasa de falsos positivos">
                  <span className={styles.ejeVertical}>Tasa de verdaderos positivos (TPR)</span>
                  <div className={styles.chart}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={resultado.roc}
                      margin={{ top: 12, right: 20, bottom: 8, left: 0 }}
                      accessibilityLayer
                    >
                      <defs>
                        <linearGradient id={gradiente} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.03} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        type="number"
                        dataKey="fpr"
                        domain={[0, 1]}
                        ticks={[0, 0.25, 0.5, 0.75, 1]}
                        tickFormatter={porcentajeEje}
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        tickLine={false}
                        tickMargin={8}
                        axisLine={{ stroke: "#94a3b8" }}
                        height={28}
                      />
                      <YAxis
                        type="number"
                        domain={[0, 1]}
                        ticks={[0, 0.25, 0.5, 0.75, 1]}
                        tickFormatter={porcentajeEje}
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        tickLine={false}
                        tickMargin={8}
                        axisLine={{ stroke: "#94a3b8" }}
                        width={48}
                      />
                      <Tooltip content={<TooltipROC />} />
                      <ReferenceLine
                        segment={[
                          { x: 0, y: 0 },
                          { x: 1, y: 1 },
                        ]}
                        stroke="#94a3b8"
                        strokeDasharray="6 5"
                      />
                      <Area
                        type="monotone"
                        dataKey="tpr"
                        name="TPR"
                        stroke="#7c3aed"
                        strokeWidth={3}
                        fill={`url(#${gradiente})`}
                        isAnimationActive={false}
                      />
                      {resultado.punto_operativo.fpr != null && resultado.punto_operativo.tpr != null && (
                        <ReferenceDot
                          x={resultado.punto_operativo.fpr}
                          y={resultado.punto_operativo.tpr}
                          r={5}
                          fill="#059669"
                          stroke="white"
                        />
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                  </div>
                  <figcaption className={styles.ejeHorizontal}>Tasa de falsos positivos (FPR)</figcaption>
                </figure>
              ) : (
                <div className={styles.sinCurva}>Se necesitan normales y anomalías reales para calcular ROC y AUC.</div>
              )}
              {resultado.roc.length > 0 && (
                <div className={styles.rocLeyenda} aria-label="Leyenda de la curva ROC">
                  <span><i className={styles.claveCurva} aria-hidden="true" /> Modelo (ROC)</span>
                  <span><i className={styles.claveAzar} aria-hidden="true" /> Referencia aleatoria</span>
                  <span><i className={styles.claveUmbral} aria-hidden="true" /> Umbral desplegado</span>
                </div>
              )}
              {resultado.roc.length > 0 && resultado.punto_operativo.fpr != null && resultado.punto_operativo.tpr != null && (
                <p className={styles.puntoOperativo}>
                  Umbral desplegado: detecta {porcentaje(resultado.punto_operativo.tpr)} de las anomalías y genera
                  falsas alarmas en {porcentaje(resultado.punto_operativo.fpr)} de los eventos normales.
                </p>
              )}
              <p className={styles.nota}>
                {resultado.nota_roc} Curva suavizada para visualización; AUC calculada con los scores originales.
              </p>
            </article>

            <article className={styles.panel}>
              <div className={styles.panelHeader}>
                <h3>Matriz de confusión</h3>
                <span className={styles.meta}>Real × Predicción</span>
              </div>
              <p>
                Filas = etiqueta real; columnas = predicción. El porcentaje y el color se calculan dentro de cada fila.
                Selecciona una celda para inspeccionar sus observaciones.
              </p>
              <div className={styles.matriz}>
                <span />
                <span className={styles.eje}>Pred. normal</span>
                <span className={styles.eje}>Pred. anomalía</span>
                <span className={styles.eje}>Real normal</span>
                {CELDAS.slice(0, 2).map((item) => (
                  <CeldaMatriz
                    key={item.key}
                    item={item}
                    resultado={resultado}
                    seleccion={celda}
                    onSeleccion={setCelda}
                  />
                ))}
                <span className={styles.eje}>Real anomalía</span>
                {CELDAS.slice(2).map((item) => (
                  <CeldaMatriz
                    key={item.key}
                    item={item}
                    resultado={resultado}
                    seleccion={celda}
                    onSeleccion={setCelda}
                  />
                ))}
              </div>
              <button
                type="button"
                aria-pressed={celda === "fn_criticos"}
                onClick={() => setCelda("fn_criticos")}
                className={`${styles.criticos} ${resultado.muestra.criticos > 0 && resultado.matriz.fn_criticos === 0 ? styles.criticosOk : ""}`}
              >
                <FaShieldHalved />
                <span>
                  FN críticos<strong>{resultado.muestra.criticos > 0 ? resultado.matriz.fn_criticos : "—"}</strong>
                </span>
                <small>
                  {resultado.muestra.criticos > 0
                    ? `${resultado.muestra.criticos_detectados}/${resultado.muestra.criticos} críticos detectados · incluidos en FN`
                    : "Sin críticos en la muestra"}
                </small>
              </button>
              {resultado.intervalo_recall_critico && (
                <p className={styles.nota}>
                  IC 95% del Recall Crítico: {porcentaje(resultado.intervalo_recall_critico.inferior)} –{" "}
                  {porcentaje(resultado.intervalo_recall_critico.superior)}. El resultado describe esta muestra y no
                  garantiza detección futura.
                </p>
              )}
            </article>
          </div> */}

          {/* {resultado.ablacion && <PanelAblacion ablacion={resultado.ablacion} />} */}


          {/* <article className={styles.diagnostico}>
            <h3>Qué falta para alcanzar las metas</h3>
            <ul>
              {resultado.recomendaciones.map((texto) => (
                <li key={texto}>{texto}</li>
              ))}
            </ul>
            <p>
              Las métricas de esta vista corresponden al motor seleccionado. La correlación entre ambos dominios
              requiere su propia muestra etiquetada de incidentes.
            </p>
          </article> */}
        </>
      )}
    </section>
  );
}

function PanelAblacion({ ablacion }) {
  return (
    <article className={`${styles.panel} ${styles.ablacion}`}>
      <div className={styles.panelHeader}>
        <h3>Ablación de componentes</h3>
        <span className={styles.meta}>
          {ablacion.metodo} · {ablacion.remuestras.toLocaleString()} remuestras
        </span>
      </div>
      <p>
        Mismo conjunto y mismo umbral, evaluando por separado cada parte del motor. Entre paréntesis, el intervalo de
        confianza al 95%.
      </p>
      {ablacion.advertencia && (
        <p className={styles.aviso}>
          <FaTriangleExclamation /> {ablacion.advertencia}
        </p>
      )}
      <div className={styles.tablaScroll}>
        <table className={styles.tabla}>
          <thead>
            <tr>
              <th>Variante</th>
              {COLUMNAS_ABLACION.map(({ key, label }) => (
                <th key={key}>{label}</th>
              ))}
              <th>Alertas / 1000</th>
            </tr>
          </thead>
          <tbody>
            {ablacion.variantes.map((variante) => (
              <tr key={variante.id} title={variante.descripcion}>
                <th scope="row">{variante.nombre}</th>
                {COLUMNAS_ABLACION.map(({ key }) => (
                  <td
                    key={key}
                    className={
                      key === "auc_roc" && variante[key].valor != null && variante[key].valor < 0.5
                        ? styles.falta
                        : undefined
                    }
                  >
                    <strong>{formatoValor(variante[key].valor, key)}</strong>
                    <small className={styles.ic}>({textoIC(variante[key].ic95, key)})</small>
                  </td>
                ))}
                <td>{variante.alertas_por_mil.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {ablacion.variantes
        .filter((variante) => variante.vs_hibrido)
        .map((variante) => {
          const { auc_roc: auc, pr_auc: pr } = variante.vs_hibrido;
          const excluyeCero = (diferencia) => diferencia.ic95 && (diferencia.ic95[0] > 0 || diferencia.ic95[1] < 0);
          return (
            <p key={variante.id} className={styles.nota}>
              Híbrido − {variante.nombre}: AUC {auc.valor >= 0 ? "+" : ""}
              {auc.valor?.toFixed(3)} ({auc.ic95 ? `${auc.ic95[0].toFixed(3)} a ${auc.ic95[1].toFixed(3)}` : "—"}),
              PR-AUC {pr.valor >= 0 ? "+" : ""}
              {pr.valor?.toFixed(3)} ({pr.ic95 ? `${pr.ic95[0].toFixed(3)} a ${pr.ic95[1].toFixed(3)}` : "—"}).
              {excluyeCero(auc) || excluyeCero(pr)
                ? " La diferencia es estadísticamente distinguible de 0."
                : " La diferencia no es distinguible de 0."}
            </p>
          );
        })}
    </article>
  );
}

function CeldaMatriz({ item, resultado, seleccion, onSeleccion }) {
  const valor = resultado.matriz[item.key];
  const totalFila = item.key === "tn" || item.key === "fp"
    ? resultado.matriz.tn + resultado.matriz.fp
    : resultado.matriz.fn + resultado.matriz.tp;
  const tasaFila = totalFila ? valor / totalFila : null;
  const intensidad = 0.08 + 0.32 * (tasaFila ?? 0);
  return (
    <button
      type="button"
      aria-pressed={seleccion === item.key}
      onClick={() => onSeleccion(item.key)}
      className={`${styles.celda} ${seleccion === item.key ? styles.seleccionada : ""}`}
      style={{ background: `rgba(${item.correcto ? "16, 185, 129" : "239, 68, 68"}, ${intensidad})` }}
      title={`${item.detalle}: ${valor.toLocaleString()} (${porcentaje(tasaFila)} de su fila)`}
    >
      <strong>{valor.toLocaleString()}</strong>
      <span>{item.label}</span>
      <small>{porcentaje(tasaFila)} de su fila</small>
    </button>
  );
}
