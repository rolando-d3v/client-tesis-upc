// Niveles de riesgo del score combinado (0 a 1). Mismos cortes que el backend:
// server-machine-learning/src/modules/scoring/constantes.py (UMBRAL_BAJO … UMBRAL_CRITICO).
// Única fuente de colores: los gráficos usan estos valores y las hojas de estilo,
// las variables CSS --riesgo-<nivel>[-fondo|-borde|-texto] que publica aplicarColoresRiesgo().
export const UMBRAL_BAJO = 0.0;
export const UMBRAL_MEDIO = 0.25;
export const UMBRAL_ALTO = 0.5;
export const UMBRAL_CRITICO = 0.75;

export const NIVELES_RIESGO = [
  { id: "bajo", etiqueta: "Bajo", desde: UMBRAL_BAJO, hasta: UMBRAL_MEDIO, rareza: "comportamiento habitual",
    color: "#16a34a", fondo: "#f0fdf4", borde: "#bbf7d0", texto: "#166534" },
  { id: "medio", etiqueta: "Medio", desde: UMBRAL_MEDIO, hasta: UMBRAL_ALTO, rareza: "top 10 % más raro",
    color: "#ca8a04", fondo: "#fefce8", borde: "#fde68a", texto: "#854d0e" },
  { id: "alto", etiqueta: "Alto", desde: UMBRAL_ALTO, hasta: UMBRAL_CRITICO, rareza: "top 1 % más raro",
    color: "#ea580c", fondo: "#fff7ed", borde: "#fed7aa", texto: "#9a3412" },
  { id: "critico", etiqueta: "Crítico", desde: UMBRAL_CRITICO, hasta: 1, rareza: "top 0,1 % · bloquea la cuenta",
    color: "#dc2626", fondo: "#fef2f2", borde: "#fecaca", texto: "#991b1b" },
];

const POR_ID = Object.fromEntries(NIVELES_RIESGO.map((nivel) => [nivel.id, nivel]));

export const nivelDeScore = (score) => {
  const valor = Number(score);
  if (!Number.isFinite(valor)) return "bajo";
  return [...NIVELES_RIESGO].reverse().find((nivel) => valor >= nivel.desde)?.id ?? "bajo";
};

export const infoNivel = (nivel) => POR_ID[String(nivel || "").toLowerCase()] ?? POR_ID.bajo;

export function aplicarColoresRiesgo(raiz = document.documentElement) {
  for (const { id, color, fondo, borde, texto } of NIVELES_RIESGO) {
    raiz.style.setProperty(`--riesgo-${id}`, color);
    raiz.style.setProperty(`--riesgo-${id}-fondo`, fondo);
    raiz.style.setProperty(`--riesgo-${id}-borde`, borde);
    raiz.style.setProperty(`--riesgo-${id}-texto`, texto);
  }
}
