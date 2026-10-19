import { useId } from "react";
import { datosRadarComportamiento } from "./radarComportamiento";
import styles from "./reporteForense.module.css";

const CENTRO = { x: 300, y: 185 };
const RADIO = 112;
const formato = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 1 });
const valorTexto = (dato) => dato.valor === null ? "Sin datos" : `${formato.format(dato.valor)} ${dato.unidad}`;

function punto(indice, total, radio) {
  const angulo = -Math.PI / 2 + (2 * Math.PI * indice) / total;
  return { x: CENTRO.x + Math.cos(angulo) * radio, y: CENTRO.y + Math.sin(angulo) * radio };
}

export default function RadarComportamientoForense({ reporte }) {
  const id = useId();
  const esConsulta = reporte.metadata?.tipo_reporte === "consulta";
  const datos = datosRadarComportamiento(reporte);
  const disponibles = datos.filter((dato) => dato.valor !== null);
  const puntos = (nivel) => disponibles.map((_, i) => {
    const p = punto(i, disponibles.length, RADIO * nivel / 100);
    return `${p.x},${p.y}`;
  }).join(" ");
  const perfil = disponibles.map((dato, i) => {
    const p = punto(i, disponibles.length, RADIO * dato.valor / 100);
    return `${p.x},${p.y}`;
  }).join(" ");

  return (
    <div className={styles.radarBloque}>
      <p className={styles.nota}>
        Perfil de {reporte.usuario?.nombre ?? "la cuenta"} {esConsulta ? "para el evento analizado" : "al bloqueo"}. Actividad conservada en el informe:
        {" "}{reporte.actividad_reciente?.total_eventos ?? "sin datos"} eventos.
      </p>
      <div className={styles.radarContenido}>
        {disponibles.length >= 3 ? (
          <figure className={styles.radarFigura}>
            <svg viewBox="0 0 600 380" xmlns="http://www.w3.org/2000/svg" role="img"
              aria-labelledby={`${id}-titulo ${id}-descripcion`}>
              <title id={`${id}-titulo`}>{esConsulta ? "Radar del comportamiento del usuario" : "Radar del comportamiento al bloqueo"}</title>
              <desc id={`${id}-descripcion`}>{disponibles.map((dato) => `${dato.etiqueta}: ${valorTexto(dato)}`).join(". ")}</desc>
              {[25, 50, 75, 100].map((nivel) => (
                <g key={nivel}>
                  <polygon points={puntos(nivel)} fill={nivel === 100 ? "#f8fafc" : "none"}
                    stroke="#cbd5e1" strokeWidth="1" />
                </g>
              )).reverse()}
              {disponibles.map((dato, i) => {
                const fin = punto(i, disponibles.length, RADIO);
                const etiqueta = punto(i, disponibles.length, RADIO + 42);
                const ancla = Math.abs(etiqueta.x - CENTRO.x) < 8 ? "middle" : etiqueta.x > CENTRO.x ? "start" : "end";
                return (
                  <g key={dato.id}>
                    <line x1={CENTRO.x} y1={CENTRO.y} x2={fin.x} y2={fin.y} stroke="#cbd5e1" />
                    <text x={etiqueta.x} y={etiqueta.y - 6} textAnchor={ancla} fill="#334155" fontSize="14" fontFamily="Arial, sans-serif">
                      {dato.lineas.map((linea, index) => <tspan key={linea} x={etiqueta.x} dy={index ? 17 : 0}>{linea}</tspan>)}
                    </text>
                  </g>
                );
              })}
              <polygon points={perfil} fill="#2563eb" fillOpacity="0.15" stroke="#2563eb" strokeWidth="2.5" />
              {disponibles.map((dato, i) => {
                const p = punto(i, disponibles.length, RADIO * dato.valor / 100);
                return <circle key={dato.id} cx={p.x} cy={p.y} r="4" fill="#2563eb" stroke="#fff" strokeWidth="1.5">
                  <title>{dato.etiqueta}: {valorTexto(dato)}</title>
                </circle>;
              })}
              {[25, 50, 75, 100].map((nivel) => (
                <text key={nivel} x={CENTRO.x + 7} y={CENTRO.y - RADIO * nivel / 100 + 4}
                  fill="#64748b" fontSize="11" fontFamily="Arial, sans-serif">{nivel}</text>
              ))}
            </svg>
            <figcaption><i aria-hidden="true" /> Perfil registrado · escala de 0 a 100</figcaption>
          </figure>
        ) : <p className={styles.nota}>Este reporte no conserva suficientes indicadores para dibujar el radar.</p>}
        <dl className={styles.radarDatos}>
          {datos.map((dato) => (
            <div key={dato.id}>
              <dt>{dato.etiqueta}<small>{dato.descripcion}</small></dt>
              <dd>{valorTexto(dato)}</dd>
            </div>
          ))}
        </dl>
      </div>
      <p className={styles.nota}>
        Los tres primeros ejes son proporciones de la actividad registrada en el informe.
        Los modelos y el riesgo final corresponden al evento {esConsulta ? "analizado" : "detonante"}, no al promedio del usuario.
        Estos valores no representan probabilidades de fuga. Las dimensiones sin datos se excluyen del gráfico.
      </p>
    </div>
  );
}
