import { useEffect, useRef, useState } from "react";
import { FaBolt } from "react-icons/fa6";
import { API_MACHINE } from "../../api/apiRestMachine";
import { useEstadoEvaluacion } from "../../api/apiEvaluacion";
import { cargarCSVSimuladorAPI, detenerSimuladorAPI, getEstadoSimuladorAPI, iniciarSimuladorAPI, pausarSimuladorAPI, reanudarSimuladorAPI } from "../../api/apiEventos";
import ControlSimulador from "./componentes/control_simulador/ControlSimulador";
import KPICardsMonitoreo from "./componentes/kpi_cards_monitoreo/KPICardsMonitoreo";
import BannerUltimoEvento from "./componentes/banner_ultimo_evento/BannerUltimoEvento";
import GraficosDeteccion from "./deteccion_automatica/GraficosDeteccion";
import styles from "./MotorEventos.module.css";

const MAX_FEED = 300;
const VACIO = { total: 0, criticos: 0, anomalias: 0, suma: 0 };
const score = (valor) => valor == null ? "—" : Number(valor).toFixed(4);

export default function MotorEventos() {
  const estadoModelo = useEstadoEvaluacion();
  const [eventos, setEventos] = useState([]);
  const [resumen, setResumen] = useState(VACIO);
  const [simulador, setSimulador] = useState({});
  const [conexion, setConexion] = useState("Conectando");
  const [intervalo, setIntervalo] = useState(5);
  const [cargando, setCargando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");
  const [seleccionado, setSeleccionado] = useState(null);
  const [filtros, setFiltros] = useState({ nivel_riesgo: "", busqueda: "" });
  const ultimaAccion = useRef(false);
  const umbral = eventos[0]?.umbral_anomalia ?? estadoModelo.data?.modelos?.find((m) => m.dominio === "eventos")?.umbral ?? 0.25;

  useEffect(() => {
    let vivo = true;
    let socket;
    let reconectar;
    getEstadoSimuladorAPI().then((estado) => {
      if (vivo) { setSimulador(estado); setIntervalo(estado.intervalo || 5); }
    }).catch(() => { if (vivo) setError("No se pudo consultar el estado del simulador."); });
    const conectar = () => {
      if (!vivo) return;
      setConexion("Conectando");
      const url = new URL(API_MACHINE, window.location.origin);
      url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
      url.pathname = url.pathname.replace(/\/$/, "") + "/eventos/ws/monitoreo";
      socket = new WebSocket(url.toString());
      socket.onopen = () => { if (vivo) setConexion("Conectado"); };
      socket.onmessage = (mensaje) => {
        if (!vivo) return;
        let data;
        try { data = JSON.parse(mensaje.data); } catch { return; }
        if (data.simulador) setSimulador(data.simulador);
        if (data.tipo === "NUEVO_EVENTO" && data.evento) {
          const evento = data.evento;
          setEventos((prev) => [evento, ...prev].slice(0, MAX_FEED));
          setResumen((prev) => ({ total: prev.total + 1,
            criticos: prev.criticos + Number(evento.nivel_riesgo === "critico"),
            anomalias: prev.anomalias + Number(Boolean(evento.es_anomalia)),
            suma: prev.suma + Number(evento.score_final || 0) }));
        }
      };
      socket.onclose = () => {
        if (vivo) { setConexion("Desconectado"); reconectar = setTimeout(conectar, 3000); }
      };
      socket.onerror = () => socket.close();
    };
    conectar();
    return () => { vivo = false; clearTimeout(reconectar); socket?.close(); };
  }, []);

  const ejecutar = async (accion) => {
    if (ultimaAccion.current) return false;
    ultimaAccion.current = true;
    setCargando(true); setError("");
    try {
      const resultado = await accion();
      setSimulador(resultado.simulador || resultado);
      return true;
    } catch (e) {
      setError(typeof e?.response?.data?.detail === "string" ? e.response.data.detail : "No se pudo ejecutar la acción del simulador.");
      return false;
    } finally { ultimaAccion.current = false; setCargando(false); }
  };
  const subir = async (file) => {
    setSubiendo(true);
    try { return await ejecutar(() => cargarCSVSimuladorAPI({ file, intervalo, autoIniciar: true })); }
    finally { setSubiendo(false); }
  };
  const visibles = eventos.filter((e) => {
    const riesgo = filtros.nivel_riesgo;
    const cumpleRiesgo = !riesgo || (riesgo === "anomalia" ? e.es_anomalia : e.nivel_riesgo === riesgo);
    const texto = [e.id_evento, e.name_user, e.name_oficina, e.name_tipo_evento].join(" ").toLowerCase();
    return cumpleRiesgo && texto.includes(filtros.busqueda.toLowerCase());
  });
  const limpiar = () => { setEventos([]); setResumen(VACIO); setSeleccionado(null); };

  return (
    <div className={styles.page}>
      <header className={styles.header}><div><h1><FaBolt /> Detección de eventos en tiempo real</h1>
        <p>Isolation Forest 0.40 + LSTM Autoencoder 0.60 · suma de pesos = 1.00</p></div>
        <span className={conexion === "Conectado" ? styles.conectado : styles.estado}>{conexion}</span>
      </header>
      <div className={styles.modelo}>Entrenamiento: <strong>dt_eventos.csv</strong> · Fuente en vivo: <strong>{simulador.archivo_nombre || "dt_eventos_etiquetados_5000.csv"}</strong><br />
        Score combinado = 0.40 × score IF normalizado + 0.60 × error LSTM normalizado. Umbral de anomalía: {Number(umbral).toFixed(3)}. Las métricas con etiquetas se consultan en Entrenamiento.
      </div>
      {error && <p role="alert" className={styles.error}>{error}</p>}
      <ControlSimulador simuladorEstado={simulador} intervaloConfig={intervalo} setIntervaloConfig={setIntervalo} cargandoAccion={cargando || conexion !== "Conectado"}
        onIniciar={() => ejecutar(() => iniciarSimuladorAPI({ intervalo, archivo: simulador.archivo || "dataset/dt_eventos_etiquetados_5000.csv", loop: false }))}
        onPausar={() => ejecutar(pausarSimuladorAPI)} onReanudar={() => ejecutar(reanudarSimuladorAPI)} onDetener={() => ejecutar(detenerSimuladorAPI)}
        onLimpiarFeed={limpiar} onUploadCSV={subir} isUploadingCSV={subiendo} />
      <KPICardsMonitoreo totalEventos={resumen.total} totalCriticos={resumen.criticos} totalAnomalias={resumen.anomalias}
        scorePromedio={resumen.total ? (resumen.suma / resumen.total).toFixed(4) : "0.0000"}
        onFilterClick={(tipo) => setFiltros((prev) => ({ ...prev, nivel_riesgo: tipo === "todos" ? "" : tipo }))} />
      <BannerUltimoEvento evento={seleccionado || eventos[0]} />
      <GraficosDeteccion eventos={eventos} filtros={filtros} setFiltros={setFiltros} umbralAnomalia={umbral} />
      <section className={styles.panel}>
        <div className={styles.header}><div><h2>Registro de eventos</h2><p>Últimos {MAX_FEED} eventos recibidos. Selecciona uno para inspeccionarlo.</p></div>
          <input aria-label="Buscar eventos" placeholder="Buscar usuario, oficina o acción…" value={filtros.busqueda} onChange={(e) => setFiltros((prev) => ({ ...prev, busqueda: e.target.value }))} />
          {filtros.nivel_riesgo && <button type="button" onClick={() => setFiltros((prev) => ({ ...prev, nivel_riesgo: "" }))}>Quitar filtro: {filtros.nivel_riesgo}</button>}
        </div>
        <div className={styles.tablaScroll}><table><thead><tr><th>Evento</th><th>Fecha</th><th>Usuario</th><th>Acción</th><th>IF · 40%</th><th>LSTM · 60%</th><th>Score combinado</th><th>Riesgo</th><th>Predicción</th></tr></thead>
          <tbody>{visibles.map((e, i) => <tr key={(e.evento_registro_id || e.id_evento) + "-" + i}>
            <td><button type="button" onClick={() => setSeleccionado(e)}>#{e.id_evento}</button></td><td>{e.fecha_evento}</td><td>{e.name_user}</td><td>{e.name_tipo_evento}</td>
            <td>{score(e.score_if_norm)}</td><td>{score(e.score_lstm_norm)}</td><td><strong>{score(e.score_final)}</strong></td><td>{e.nivel_riesgo}</td><td>{e.es_anomalia ? "Anomalía" : "Normal"}</td>
          </tr>)}</tbody></table></div>
        {!visibles.length && <p className={styles.vacio}>Sin eventos para mostrar. Inicia la simulación o ajusta los filtros.</p>}
        {seleccionado && <button type="button" onClick={() => setSeleccionado(null)}>Volver al último evento</button>}
      </section>
    </div>
  );
}
