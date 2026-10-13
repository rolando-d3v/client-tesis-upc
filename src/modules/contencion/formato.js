export const fechaHora = (valor) => {
  if (!valor) return "—";
  const fecha = new Date(String(valor).replace(" ", "T"));
  return Number.isNaN(fecha.getTime()) ? String(valor) : fecha.toLocaleString("es-PE", { dateStyle: "short", timeStyle: "medium" });
};

export const porcentaje = (valor, decimales = 1) => valor == null ? "—" : `${(Number(valor) * 100).toFixed(decimales)} %`;
