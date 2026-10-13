import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FaBolt, FaLock } from "react-icons/fa6";
import { API_MACHINE } from "../../api/apiRestMachine";
import { useEstadoEvaluacion } from "../../api/apiEvaluacion";
import { cargarCSVSimuladorAPI, detenerSimuladorAPI, getEstadoSimuladorAPI, iniciarSimuladorAPI, limpiarSimuladorAPI, pausarSimuladorAPI, reanudarSimuladorAPI } from "../../api/apiEventos";
import { CLAVE_BLOQUEOS } from "../../api/apiContencion";
import TablaBloqueos from "../contencion/componentes/tabla_bloqueos/TablaBloqueos";
import ReporteForense from "../contencion/componentes/reporte_forense/ReporteForense";
import ControlSimulador from "./componentes/control_simulador/ControlSimulador";
import KPICardsMonitoreo from "./componentes/kpi_cards_monitoreo/KPICardsMonitoreo";
import BannerUltimoEvento from "./componentes/banner_ultimo_evento/BannerUltimoEvento";
import InyeccionCasos from "./componentes/inyeccion_casos/InyeccionCasos";
import BadgeNivel from "../../components/nivel_riesgo/BadgeNivel";
import LeyendaNiveles from "../../components/nivel_riesgo/LeyendaNiveles";
import GraficosDeteccion from "./deteccion_automatica/GraficosDeteccion";
import styles from "./MotorEventos.module.css";

const MAX_FEED = 300;
const ARCHIVO_SIMULACION = "dataset/sim_eventos_demo_20.csv";
const VACIO = { total: 0, criticos: 0, anomalias: 0, suma: 0 };
const score = (valor) => valor == null ? "—" : Number(valor).toFixed(4);

export default function MotorEventos() {
  const estadoModelo = useEstadoEvaluacion();
  const queryClient = useQueryClient();
  const [reporte, setReporte] = useState(null);
  const [alertaBloqueo, setAlertaBloqueo] = useState(null);
  const [inyectando, setInyectando] = useState(false);
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
        if (data.tipo === "CUENTA_DESBLOQUEADA") {
          queryClient.invalidateQueries({ queryKey: [CLAVE_BLOQUEOS] });
          setAlertaBloqueo((actual) => (actual?.id_user === data.bloqueo?.id_user ? null : actual));
        }
        if (data.tipo === "INYECCION_FINALIZADA" && data.inyeccion) {
          const { titulo, nombre, nivel_alcanzado: nivel, score_maximo: pico, error: fallo } = data.inyeccion;
          setInyectando(false);
          if (fallo) toast.error(`El caso «${titulo}» se interrumpió: ${fallo}`);
          else toast.success(`Caso «${titulo}» terminado: ${nombre} llegó a nivel ${nivel.toUpperCase()} (${(pico * 100).toFixed(1)} %)`);
        }
        if (data.tipo === "NUEVO_EVENTO" && data.evento) {
          const evento = data.evento;
          if (evento.bloqueo) {
            const { bloqueo } = evento;
            setAlertaBloqueo(bloqueo);
            toast.error(`Cuenta bloqueada: ${bloqueo.nombre_usuario} · score ${(bloqueo.score_final * 100).toFixed(1)} %`, {
              description: bloqueo.motivo, duration: 10000,
              action: { label: "Ver reporte", onClick: () => setReporte(bloqueo.id) },
            });
            queryClient.invalidateQueries({ queryKey: [CLAVE_BLOQUEOS] });
          }
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
  }, [queryClient]);

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
  useEffect(() => {
    if (!inyectando) return undefined;
    const respaldo = setTimeout(() => setInyectando(false), 60000);   // por si se pierde el aviso de fin
    return () => clearTimeout(respaldo);
  }, [inyectando]);
  const limpiar = async () => {
    if (!window.confirm("Se eliminarán los eventos de simulación, los perfiles online y los bloqueos generados por la simulación. ¿Continuar?")) return;
    if (await ejecutar(limpiarSimuladorAPI)) {
      setEventos([]); setResumen(VACIO); setSeleccionado(null); setAlertaBloqueo(null);
      queryClient.invalidateQueries({ queryKey: [CLAVE_BLOQUEOS] });
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}><div><h1><FaBolt /> Detección de eventos en tiempo real</h1>
        <p>Isolation Forest 0.40 + LSTM Autoencoder 0.60 · suma de pesos = 1.00</p></div>
        <span className={conexion === "Conectado" ? styles.conectado : styles.estado}>{conexion}</span>
      </header>
      <div className={styles.modelo}>Entrenamiento: <strong>dt_eventos.csv</strong> · Fuente en vivo: <strong>{simulador.archivo_nombre || "eventos_demo_20.csv"}</strong><br />
        Score combinado = escala(0.40 × rareza Isolation Forest + 0.60 × rareza LSTM Autoencoder). Umbral de anomalía: {Number(umbral).toFixed(3)}.
        {" "}<strong>Bloqueo automático de la cuenta con score ≥ 75 %</strong>, con reporte forense. Las métricas con etiquetas se consultan en Entrenamiento.
      </div>
      <LeyendaNiveles />
      {error && <p role="alert" className={styles.error}>{error}</p>}
      <ControlSimulador simuladorEstado={simulador} intervaloConfig={intervalo} setIntervaloConfig={setIntervalo} cargandoAccion={cargando || conexion !== "Conectado"}
        onIniciar={() => ejecutar(() => iniciarSimuladorAPI({ intervalo, archivo: simulador.archivo || ARCHIVO_SIMULACION, loop: false }))}
        onPausar={() => ejecutar(pausarSimuladorAPI)} onReanudar={() => ejecutar(reanudarSimuladorAPI)} onDetener={() => ejecutar(detenerSimuladorAPI)}
        onLimpiarFeed={limpiar} onUploadCSV={subir} isUploadingCSV={subiendo} />
      <InyeccionCasos inyectando={inyectando} setInyectando={setInyectando} desactivado={conexion !== "Conectado"} />
      {alertaBloqueo && <div role="alert" className={styles.alertaBloqueo}>
        <FaLock />
        <div><strong>Cuenta bloqueada: {alertaBloqueo.nombre_usuario} (ID {alertaBloqueo.id_user})</strong>
          <span>Score {(alertaBloqueo.score_final * 100).toFixed(1)} % · {alertaBloqueo.motivo} · {alertaBloqueo.codigo}</span></div>
        <button type="button" onClick={() => setReporte(alertaBloqueo.id)}>Ver reporte forense</button>
        <button type="button" onClick={() => setAlertaBloqueo(null)}>Cerrar</button>
      </div>}
      <KPICardsMonitoreo totalEventos={resumen.total} totalCriticos={resumen.criticos} totalAnomalias={resumen.anomalias}
        scorePromedio={resumen.total ? (resumen.suma / resumen.total).toFixed(4) : "0.0000"}
        onFilterClick={(tipo) => setFiltros((prev) => ({ ...prev, nivel_riesgo: tipo === "todos" ? "" : tipo }))} />
      <BannerUltimoEvento evento={seleccionado || eventos[0]} />
      <TablaBloqueos estado="activos" compacta titulo="Cuentas bloqueadas"
        descripcion="Bloqueo automático al superar el 75 % de score. Abre el reporte forense o desbloquea con justificación." />
      <GraficosDeteccion eventos={eventos} filtros={filtros} setFiltros={setFiltros} umbralAnomalia={umbral} />
      <section className={styles.panel}>
        <div className={styles.header}><div><h2>Registro de eventos</h2><p>Últimos {MAX_FEED} eventos recibidos. Selecciona uno para inspeccionarlo.</p></div>
          <input aria-label="Buscar eventos" placeholder="Buscar usuario, oficina o acción…" value={filtros.busqueda} onChange={(e) => setFiltros((prev) => ({ ...prev, busqueda: e.target.value }))} />
          {filtros.nivel_riesgo && <button type="button" onClick={() => setFiltros((prev) => ({ ...prev, nivel_riesgo: "" }))}>Quitar filtro: {filtros.nivel_riesgo}</button>}
        </div>
        <div className={styles.tablaScroll}><table><thead><tr><th>Evento</th><th>Fecha</th><th>Usuario</th><th>Acción</th><th>IF · 40%</th><th>LSTM · 60%</th><th>Score combinado</th><th>Riesgo</th><th>Predicción</th></tr></thead>
          <tbody>{visibles.map((e, i) => <tr key={(e.evento_registro_id || e.id_evento) + "-" + i}>
            <td><button type="button" onClick={() => setSeleccionado(e)}>#{e.id_evento}</button></td><td>{e.fecha_evento}</td><td>{e.cuenta_bloqueada && <FaLock title="Cuenta bloqueada" className={styles.candado} />} {e.name_user}</td><td>{e.name_tipo_evento}</td>
            <td>{score(e.score_if_norm)}</td><td>{score(e.score_lstm_norm)}</td><td><strong>{score(e.score_final)}</strong></td><td><BadgeNivel nivel={e.nivel_riesgo} /></td><td>{e.es_anomalia ? "Anomalía" : "Normal"}</td>
          </tr>)}</tbody></table></div>
        {!visibles.length && <p className={styles.vacio}>Sin eventos para mostrar. Inicia la simulación o ajusta los filtros.</p>}
        {seleccionado && <button type="button" onClick={() => setSeleccionado(null)}>Volver al último evento</button>}
      </section>
      {reporte && <ReporteForense idBloqueo={reporte} onClose={() => setReporte(null)} />}
    </div>
  );
}
