// Exporta un elemento HTML a PDF A4 en varias páginas sin cortar los bloques
// marcados con data-pdf-section="keep". Omite botones y [data-pdf-ignore].
export async function exportarElementoPDF(elemento, nombreArchivo, { ancho = 1000, titulo = nombreArchivo } = {}) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
  const secciones = [];
  let anchoCss = ancho;

  const canvas = await html2canvas(elemento, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
    onclone: async (doc, clon) => {
      clon.style.width = `${ancho}px`;
      clon.style.maxWidth = `${ancho}px`;
      clon.style.maxHeight = "none";
      clon.style.overflow = "visible";
      clon.querySelectorAll('[data-pdf-ignore="true"], button').forEach((nodo) => nodo.remove());
      await new Promise((resolve) => doc.defaultView.requestAnimationFrame(resolve));
      const base = clon.getBoundingClientRect();
      anchoCss = base.width;
      clon.querySelectorAll('[data-pdf-section="keep"]').forEach((seccion) => {
        const rect = seccion.getBoundingClientRect();
        secciones.push({ top: rect.top - base.top, bottom: rect.bottom - base.top });
      });
    },
  });

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  const margen = 10;
  const anchoPagina = pdf.internal.pageSize.getWidth() - margen * 2;
  const altoPagina = pdf.internal.pageSize.getHeight() - margen * 2;
  const altoCorte = Math.floor((altoPagina * canvas.width) / anchoPagina);
  const escala = canvas.width / anchoCss;
  pdf.setProperties({ title: titulo, creator: "Sistema de detección de eventos" });

  let inicio = 0;
  let pagina = 0;
  while (inicio < canvas.height) {
    let fin = Math.min(inicio + altoCorte, canvas.height);
    if (fin < canvas.height) {
      // Si el corte parte un bloque, se corta antes de él (cuando cabe entero en una página)
      const bloque = secciones.find(({ top, bottom }) => top * escala < fin && bottom * escala > fin
        && (bottom - top) * escala <= altoCorte && top * escala > inicio);
      if (bloque) fin = Math.floor(bloque.top * escala);
    }
    const franja = document.createElement("canvas");
    franja.width = canvas.width;
    franja.height = fin - inicio;
    franja.getContext("2d").drawImage(canvas, 0, inicio, canvas.width, fin - inicio, 0, 0, canvas.width, fin - inicio);
    if (pagina > 0) pdf.addPage();
    pdf.addImage(franja.toDataURL("image/jpeg", 0.95), "JPEG", margen, margen, anchoPagina,
      ((fin - inicio) / canvas.width) * anchoPagina, undefined, "FAST");
    pdf.setFontSize(8);
    pdf.setTextColor(120);
    pdf.text(`${titulo} · página ${pagina + 1}`, margen, pdf.internal.pageSize.getHeight() - 4);
    inicio = fin;
    pagina += 1;
  }
  pdf.save(`${nombreArchivo}.pdf`);
}
