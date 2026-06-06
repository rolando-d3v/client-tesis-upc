import "../anomalias.css";

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function getLevel(count, maxCount) {
  if (count === 0) return 0;
  const ratio = count / maxCount;
  if (ratio <= 0.15) return 1;
  if (ratio <= 0.3) return 2;
  if (ratio <= 0.5) return 3;
  if (ratio <= 0.75) return 4;
  return 5;
}

export default function HeatmapSemana({ data = [] }) {
  if (!data.length) return null;

  const maxCount = Math.max(...data.map((d) => d.cantidad), 1);

  // Agrupar por hora
  const horas = [];
  for (let h = 0; h < 24; h++) {
    horas.push(h);
  }

  // Crear lookup rápido
  const lookup = {};
  data.forEach((item) => {
    lookup[`${item.hora_num}-${item.dia_num}`] = item.cantidad;
  });

  return (
    <div>
      <div className="heatmap-grid">
        {/* Header row */}
        <div className="heatmap-header"></div>
        {DIAS.map((dia) => (
          <div key={dia} className="heatmap-header">
            {dia}
          </div>
        ))}

        {/* Data rows */}
        {horas.map((hora) => (
          <>
            <div key={`label-${hora}`} className="heatmap-row-label">
              {String(hora).padStart(2, "0")}:00
            </div>
            {Array.from({ length: 7 }, (_, dia) => {
              const count = lookup[`${hora}-${dia}`] || 0;
              const level = getLevel(count, maxCount);
              return (
                <div
                  key={`${hora}-${dia}`}
                  className={`heatmap-cell level-${level}`}
                  title={`${DIAS[dia]} ${String(hora).padStart(2, "0")}:00 — ${count} anomalías`}
                />
              );
            })}
          </>
        ))}
      </div>

      {/* Legend */}
      <div className="heatmap-legend">
        <span>Menos</span>
        {[0, 1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={`heatmap-legend-cell level-${level} heatmap-cell`}
            style={{ width: 14, height: 14, minHeight: "auto", aspectRatio: "auto" }}
          />
        ))}
        <span>Más</span>
      </div>
    </div>
  );
}
