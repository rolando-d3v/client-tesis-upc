import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import styles from "./ModalExpedienteForense.module.css";
import dayjs from "dayjs";
import { FaXmark, FaArrowUpRightFromSquare, FaFilePdf } from "react-icons/fa6";
import RoleBadge from "../../../components/RoleBadge";
import ScoreGauge from "../../entrenamiento/componentes/ScoreGauge";
import MotivosDesglose from "../../entrenamiento/componentes/MotivosDesglose";
import StorylineTimeline from "../../entrenamiento/componentes/StorylineTimeline";
import AccionesContencion from "../../entrenamiento/componentes/AccionesContencion";
import { useIncidenteDetalle } from "../../../api/apiCorrelacion";
import { evaluarEstadoForense, UMBRAL_CRITICO } from "../telemetria";

const TONO = {
  critico: styles.toneCritico,
  alto: styles.toneAlto,
  medio: styles.toneMedio,
  ok: styles.toneOk,
  accent: styles.toneAccent,
  neutral: styles.toneNeutral,
};

const NIVELES = {
  critico: { label: "Crítico", tono: "critico" },
  alto: { label: "Alto", tono: "alto" },
  medio: { label: "Medio", tono: "medio" },
  bajo: { label: "Bajo", tono: "ok" },
};

const ESTADOS = {
  abierto: { label: "Abierto", tono: "critico" },
  en_investigacion: { label: "En investigación", tono: "alto" },
  contenido: { label: "Contenido", tono: "accent" },
  mitigado: { label: "Mitigado", tono: "ok" },
  falso_positivo: { label: "Falso positivo", tono: "neutral" },
};

const TONO_CLASIFICACION = { SECRETO: "critico", RESERVADO: "alto" };

// Los identificadores numéricos se muestran como #123; los de sesión en vivo (STRM-12) tal cual.
const formatearId = (valor) => {
  if (valor === undefined || valor === null || valor === "") return "N/A";
  return /^\d+$/.test(String(valor)) ? `#${valor}` : String(valor);
};

const capitalizar = (texto) => {
  const limpio = String(texto || "").replace(/_/g, " ").trim();
  return limpio.charAt(0).toUpperCase() + limpio.slice(1);
};

function Marca({ tono = "neutral", children }) {
  return (
    <span className={`${styles.marca} ${TONO[tono]}`}>
      <span className={styles.punto} aria-hidden="true" />
      {children}
    </span>
  );
}

function Indicador({ etiqueta, detalle, title, children }) {
  return (
    <div className={styles.indicador} title={title}>
      <span className={styles.indicadorEtiqueta}>{etiqueta}</span>
      <span className={styles.indicadorValor}>{children}</span>
      {detalle && <span className={styles.indicadorDetalle}>{detalle}</span>}
    </div>
  );
}

function Dato({ etiqueta, mono = false, children }) {
  return (
    <div className={styles.dato}>
      <dt className={styles.datoEtiqueta}>{etiqueta}</dt>
      <dd className={`${styles.datoValor} ${mono ? styles.mono : ""}`}>{children}</dd>
    </div>
  );
}

export default function ModalExpedienteForense({
  incidente,
  neutralizadosIds = [],
  onClose,
  detalleBasePath = "/eventos/motor-deteccion/incidente",
}) {
  const tituloId = useId();
  const dialogoRef = useRef(null);
  const [generandoPdf, setGenerandoPdf] = useState(false);

  // Manejo de tecla ESC para cerrar modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Bloquea el scroll de la página mientras el expediente está abierto y lleva el foco al diálogo
  useEffect(() => {
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogoRef.current?.focus();
    return () => {
      document.body.style.overflow = overflowPrevio;
    };
  }, []);

  // Si el incidente tiene ID numérico (en base de datos), consultar detalle enriquecido
  const isPersisted = typeof incidente?.id === "number" || /^\d+$/.test(String(incidente?.id || ""));
  const { data: detalleDB } = useIncidenteDetalle(isPersisted ? incidente?.id : null);

  // Fusionar datos disponibles en tiempo real con datos de base de datos
  const dataActiva = useMemo(() => {
    if (!incidente) return null;
    const base = {
      ...incidente,
      ...(detalleDB || {}),
      storyline: detalleDB?.storyline?.length ? detalleDB.storyline : incidente.storyline || [],
      motivos_trazabilidad:
        detalleDB?.motivos_trazabilidad?.length ? detalleDB.motivos_trazabilidad : incidente.motivos_trazabilidad || [],
      motivos_eventos:
        detalleDB?.motivos_eventos?.length ? detalleDB.motivos_eventos : incidente.motivos_eventos || [],
    };

    const evalForense = evaluarEstadoForense(base, neutralizadosIds);

    // Garantizar que si es crítico, el storyline incluya el paso de Contención Inmediata SOC
    let storylineFinal = [...base.storyline];
    const tienePasoContencion = storylineFinal.some(
      (s) => String(s.fase || "").toLowerCase().includes("contención") || String(s.fase || "").toLowerCase().includes("contencion")
    );
    if (evalForense.esCritico && !tienePasoContencion) {
      storylineFinal.push({
        paso: storylineFinal.length + 1,
        fase: "Contención Inmediata SOC",
        descripcion: `Neutralización automática ejecutada según constantes.py (Score ${(Number(base.score_correlacion || 0.85) * 100).toFixed(0)}% >= 75%). Cuenta del usuario bloqueada y accesos revocados preventivamente.`,
        timestamp: base.fecha_deteccion || new Date().toISOString(),
        icono: "shield",
        nivel_riesgo: "critico",
      });
    }

    return {
      ...base,
      estado: evalForense.estadoEfectivo,
      cuenta_bloqueada: evalForense.esBloqueado,
      es_critico_auto: evalForense.esCritico,
      storyline: storylineFinal,
    };
  }, [incidente, detalleDB, neutralizadosIds]);

  if (!dataActiva) return null;

  const dtFormatted = dataActiva.fecha_deteccion
    ? dayjs(dataActiva.fecha_deteccion).format("DD/MM/YYYY HH:mm:ss")
    : "fecha no registrada";

  const scorePct = Math.round(Number(dataActiva.score_correlacion || 0) * 100);

  const nivel = NIVELES[String(dataActiva.nivel_riesgo || "bajo").toLowerCase()] || NIVELES.bajo;

  const claveEstado = String(dataActiva.estado || "abierto").toLowerCase();
  const estado = ESTADOS[claveEstado] || { label: capitalizar(claveEstado), tono: "neutral" };

  const clasificacion = String(dataActiva.clasificacion_doc || "COMUN").toUpperCase();
  const esExterior = dataActiva.destino_doc === "exterior";

  const descargarPdf = async () => {
    if (!dialogoRef.current || generandoPdf) return;

    setGenerandoPdf(true);
    const idArchivo = String(dataActiva.id ?? "sin-id").replace(/[^a-z\d_-]/gi, "_");
    const nombrePdf = `Expediente-forense-${idArchivo}`;
    const seccionesPdf = [];
    let anchoCssModal = 0;

    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const canvas = await html2canvas(dialogoRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
        onclone: async (documentoClonado) => {
          const modalPdf = documentoClonado.querySelector('[data-pdf-root="true"]');
          if (!modalPdf) throw new Error("No se encontró el expediente para exportar.");

          const fondo = modalPdf.parentElement;
          fondo.style.position = "static";
          fondo.style.inset = "auto";
          fondo.style.display = "block";
          fondo.style.width = "1100px";
          fondo.style.height = "auto";
          fondo.style.minHeight = "0";
          fondo.style.padding = "0";
          fondo.style.overflow = "visible";
          fondo.style.background = "#ffffff";
          fondo.style.backdropFilter = "none";
          fondo.style.animation = "none";
          fondo.style.opacity = "1";

          modalPdf.style.display = "block";
          modalPdf.style.width = "1100px";
          modalPdf.style.maxWidth = "1100px";
          modalPdf.style.height = "auto";
          modalPdf.style.maxHeight = "none";
          modalPdf.style.minHeight = "0";
          modalPdf.style.margin = "0";
          modalPdf.style.overflow = "visible";
          modalPdf.style.border = "0";
          modalPdf.style.borderRadius = "0";
          modalPdf.style.boxShadow = "none";
          modalPdf.style.animation = "none";

          const cuerpo = modalPdf.querySelector(`.${styles.body}`);
          cuerpo.style.flex = "none";
          cuerpo.style.height = "auto";
          cuerpo.style.maxHeight = "none";
          cuerpo.style.minHeight = "0";
          cuerpo.style.overflow = "visible";
          cuerpo.style.overflowY = "visible";
          cuerpo.style.background = "#ffffff";

          modalPdf.querySelector(`.${styles.actions}`)?.remove();
          modalPdf.querySelectorAll('[data-pdf-ignore="true"], button, a').forEach((elemento) => elemento.remove());

          await new Promise((resolve) => documentoClonado.defaultView.requestAnimationFrame(resolve));

          const rectModal = modalPdf.getBoundingClientRect();
          anchoCssModal = rectModal.width;
          modalPdf.querySelectorAll('[data-pdf-section="keep"]').forEach((seccion) => {
            const rectSeccion = seccion.getBoundingClientRect();
            seccionesPdf.push({
              top: rectSeccion.top - rectModal.top,
              bottom: rectSeccion.bottom - rectModal.top,
            });
          });
        },
      });

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
      const margen = 10;
      const anchoPagina = pdf.internal.pageSize.getWidth() - margen * 2;
      const altoPagina = pdf.internal.pageSize.getHeight() - margen * 2;
      const altoCorte = Math.floor((altoPagina * canvas.width) / anchoPagina);
      const escalaCanvas = canvas.width / anchoCssModal;
      let inicio = 0;
      let numeroPagina = 0;

      pdf.setProperties({
        title: nombrePdf,
        subject: "Expediente forense completo",
        creator: "Sistema SOC",
      });

      while (inicio < canvas.height) {
        let fin = Math.min(inicio + altoCorte, canvas.height);
        if (fin < canvas.height) {
          const seccion = seccionesPdf.find((item) => {
            const arriba = item.top * escalaCanvas;
            const abajo = item.bottom * escalaCanvas;
            return arriba < fin && abajo > fin && abajo - arriba <= altoCorte;
          });

          if (seccion) {
            const arriba = Math.floor(seccion.top * escalaCanvas);
            const abajo = Math.ceil(seccion.bottom * escalaCanvas);
            const espacioAntes = arriba - inicio;
            const espacioDespues = abajo - inicio;

            if (espacioAntes >= altoCorte * 0.4) fin = arriba;
            else if (espacioDespues <= altoCorte * 1.15) fin = abajo;
          }
        }

        if (fin <= inicio) fin = Math.min(inicio + altoCorte, canvas.height);

        const altoFranja = fin - inicio;
        const pagina = document.createElement("canvas");
        pagina.width = canvas.width;
        pagina.height = altoFranja;
        pagina.getContext("2d").drawImage(
          canvas,
          0,
          inicio,
          canvas.width,
          altoFranja,
          0,
          0,
          canvas.width,
          altoFranja,
        );

        if (numeroPagina > 0) pdf.addPage();
        pdf.addImage(
          pagina.toDataURL("image/jpeg", 0.96),
          "JPEG",
          margen,
          margen,
          anchoPagina,
          (altoFranja / canvas.width) * anchoPagina,
          undefined,
          "FAST",
        );

        inicio = fin;
        numeroPagina += 1;
      }

      pdf.save(`${nombrePdf}.pdf`);
    } catch (error) {
      console.error("No se pudo generar el PDF del expediente forense.", error);
      window.alert("No se pudo generar el PDF. Inténtalo de nuevo.");
    } finally {
      setGenerandoPdf(false);
    }
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        ref={dialogoRef}
        className={styles.modal}
        data-pdf-root="true"
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.header}>
          <div className={styles.headerMain}>
            <div className={styles.titleRow}>
              <h2 id={tituloId} className={styles.title}>
                Expediente forense
              </h2>
              <span className={styles.ref}>{formatearId(dataActiva.id)}</span>
              {dataActiva.es_en_vivo && (
                <span className={styles.enVivo}>
                  <span className={styles.enVivoPunto} aria-hidden="true" />
                  En vivo
                </span>
              )}
            </div>
            <p className={styles.timestamp}>Detectado el {dtFormatted}</p>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.btnPdf}
              onClick={descargarPdf}
              disabled={generandoPdf}
              aria-label="Descargar expediente forense completo en PDF"
              title="Descargar expediente forense completo en PDF"
            >
              <FaFilePdf aria-hidden="true" />
              <span>{generandoPdf ? "Generando PDF…" : "Descargar PDF"}</span>
            </button>
            <Link
              to={`${detalleBasePath}/${dataActiva.id}`}
              className={styles.btnSecundario}
              title="Abrir expediente en página completa"
            >
              <FaArrowUpRightFromSquare aria-hidden="true" />
              <span>Vista dedicada</span>
            </Link>
            <button
              type="button"
              className={styles.btnIcono}
              onClick={onClose}
              title="Cerrar expediente"
              aria-label="Cerrar expediente"
            >
              <FaXmark aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className={styles.body}>
          {/* Resumen: lo primero que necesita ver el analista */}
          <section className={styles.resumen} aria-label="Resumen del incidente" data-pdf-section="keep">
            <Indicador etiqueta="Score de correlación" detalle={`Umbral crítico ${Math.round(UMBRAL_CRITICO * 100)}%`}>
              <span className={styles.score}>{scorePct}</span>
              <span className={styles.unidad}>%</span>
            </Indicador>

            <Indicador etiqueta="Nivel de riesgo">
              <Marca tono={nivel.tono}>{nivel.label}</Marca>
            </Indicador>

            <Indicador
              etiqueta="Estado"
              detalle={dataActiva.es_critico_auto ? "Contención automática" : null}
              title={claveEstado === "contenido" ? "Contenido en tiempo real según constantes.py" : undefined}
            >
              <Marca tono={estado.tono}>{estado.label}</Marca>
            </Indicador>

            <Indicador
              etiqueta="Cuenta del usuario"
              detalle={dataActiva.cuenta_bloqueada ? "Neutralizada preventivamente" : "Sin restricciones"}
              title={
                dataActiva.cuenta_bloqueada
                  ? "Cuenta bloqueada y neutralizada en tiempo real según constantes.py (Score >= 0.75 / UMBRAL_CRITICO)"
                  : undefined
              }
            >
              <Marca tono={dataActiva.cuenta_bloqueada ? "critico" : "ok"}>
                {dataActiva.cuenta_bloqueada ? "Bloqueada" : "Activa"}
              </Marca>
            </Indicador>
          </section>

          {/* Entidades involucradas */}
          <div className={styles.entidades} data-pdf-section="keep">
            <section className={styles.panel} aria-labelledby={`${tituloId}-doc`}>
              <h3 id={`${tituloId}-doc`} className={styles.panelTitulo}>
                Documento auditado
              </h3>
              <dl className={styles.datos}>
                <Dato etiqueta="ID de documento" mono>
                  {formatearId(dataActiva.id_documento)}
                </Dato>
                <Dato etiqueta="Número" mono>
                  {dataActiva.numero_documento || "S/N"}
                </Dato>
                <Dato etiqueta="Clasificación">
                  <Marca tono={TONO_CLASIFICACION[clasificacion] || "neutral"}>{clasificacion}</Marca>
                </Dato>
                <Dato etiqueta="Tipo de trámite">{dataActiva.tipo_documento || "OFICIO"}</Dato>
                <Dato etiqueta="Destino">
                  {esExterior ? (
                    <>
                      <Marca tono="alto">Exterior</Marca>
                      <span className={styles.nota}>alto riesgo</span>
                    </>
                  ) : (
                    <Marca tono="neutral">Interior</Marca>
                  )}
                </Dato>
              </dl>
            </section>

            <section className={styles.panel} aria-labelledby={`${tituloId}-usr`}>
              <h3 id={`${tituloId}-usr`} className={styles.panelTitulo}>
                Usuario investigado
              </h3>
              <dl className={styles.datos}>
                <Dato etiqueta="Nombre">{dataActiva.nombre_usuario || "Desconocido"}</Dato>
                <Dato etiqueta="Rol institucional">
                  <RoleBadge role={dataActiva.name_role || dataActiva.rol || dataActiva.role} size="small" />
                </Dato>
                <Dato etiqueta="ID / DNI" mono>
                  {formatearId(dataActiva.id_user)}
                </Dato>
                <Dato etiqueta="Oficina">{dataActiva.name_oficina || "División SOC / Operaciones"}</Dato>
                <Dato etiqueta="Sesión de auditoría" mono>
                  Doc {formatearId(dataActiva.sesion_traza_id)} · Ev {formatearId(dataActiva.sesion_eventos_id)}
                </Dato>
              </dl>
            </section>
          </div>

          {/* Gauge de Riesgo Multi-Dominio */}
          <div className={`${styles.embed} ${styles.embedTarjeta}`} data-pdf-section="keep">
            <ScoreGauge incidente={dataActiva} />
          </div>

          {/* Explicabilidad XAI: Desglose de Motivos */}
          <div className={`${styles.embed} ${styles.embedDoble}`} data-pdf-section="keep">
            <MotivosDesglose
              motivosTraza={dataActiva.motivos_trazabilidad}
              motivosEventos={dataActiva.motivos_eventos}
            />
          </div>

          {/* Storyline Timeline: Reconstrucción Cronológica */}
          <div className={`${styles.embed} ${styles.embedTarjeta}`}>
            <StorylineTimeline storyline={dataActiva.storyline} />
          </div>

          {/* Acciones de Contención SOC e Informe Pericial */}
          <div className={`${styles.embed} ${styles.embedTarjeta}`} data-pdf-section="keep">
            <AccionesContencion incidente={dataActiva} />
          </div>
        </div>
      </div>
    </div>
  );
}
