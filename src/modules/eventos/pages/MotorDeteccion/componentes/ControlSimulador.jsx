import React, { useRef, useState } from "react";
import styles from "./ControlSimulador.module.css";
import {
  FaPlay,
  FaPause,
  FaStop,
  FaBolt,
  FaFileCsv,
  FaCloudArrowUp,
  FaTrash,
  FaArrowsRotate,
  FaXmark,
} from "react-icons/fa6";

export default function ControlSimulador({
  simuladorEstado = {},
  intervaloConfig = 5.0,
  setIntervaloConfig,
  cargandoAccion = false,
  onIniciar,
  onPausar,
  onReanudar,
  onDetener,
  onInyectarPrueba,
  onLimpiarFeed,
  onUploadCSV,
  isUploadingCSV = false,
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith(".csv")) {
        alert("Por favor selecciona un archivo con extensión .csv");
        return;
      }
      setSelectedFile(file);
      // Carga inmediata automática del dataset de testing para inferencia
      if (onUploadCSV) {
        const ok = await onUploadCSV(file);
        if (ok) {
          setSelectedFile(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }
      }
    }
  };

  const handleClearSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleExecuteUpload = async () => {
    if (selectedFile && onUploadCSV) {
      const ok = await onUploadCSV(selectedFile);
      if (ok) {
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    }
  };

  // Extraer nombre amigable y verificar si corresponde a un dataset de testing
  const nombreArchivoRaw =
    simuladorEstado.archivo_nombre ||
    (simuladorEstado.archivo
      ? simuladorEstado.archivo.split(/[/\\]/).pop().replace(/^sim_/, "")
      : "dt_eventos_5000.csv");

  const esTesting =
    nombreArchivoRaw.toLowerCase().includes("test") ||
    !nombreArchivoRaw.includes("5000");

  return (
    <div className={styles.panel}>
      {/* FILA SUPERIOR: CONTROLES DE REPRODUCCIÓN & VELOCIDAD */}
      <div className={styles.topRow}>
        <div className={styles.controlsLeft}>
          <div className={styles.controlGroup}>
            <span className={styles.controlLabel}>Frecuencia:</span>
            <select
              className={styles.cadenceSelect}
              value={intervaloConfig}
              onChange={(e) => setIntervaloConfig(Number(e.target.value))}
              disabled={simuladorEstado.activo}
              title="Intervalo de tiempo entre cada evento emitido"
            >
              <option value={1}>1 seg (Alta velocidad)</option>
              <option value={2}>2 seg</option>
              <option value={3}>3 seg</option>
              <option value={5}>5 seg (Recomendado)</option>
              <option value={10}>10 seg</option>
            </select>
          </div>

          {!simuladorEstado.activo ? (
            <button
              onClick={onIniciar}
              className={styles.btnPrimary}
              disabled={cargandoAccion}
              title="Iniciar ingesta continua de peticiones"
            >
              <FaPlay /> Iniciar Simulación
            </button>
          ) : (
            <>
              {simuladorEstado.pausado ? (
                <button
                  onClick={onReanudar}
                  className={styles.btnPrimary}
                  disabled={cargandoAccion}
                  title="Reanudar flujo continuo"
                >
                  <FaPlay /> Reanudar
                </button>
              ) : (
                <button
                  onClick={onPausar}
                  className={styles.btnWarning}
                  disabled={cargandoAccion}
                  title="Pausar flujo continuo"
                >
                  <FaPause /> Pausar
                </button>
              )}
              <button
                onClick={onDetener}
                className={styles.btnDanger}
                disabled={cargandoAccion}
                title="Detener simulación"
              >
                <FaStop /> Detener
              </button>
            </>
          )}

          <button
            onClick={onInyectarPrueba}
            className={styles.btnInyectar}
            title="Inyecta 1 evento crítico instantáneo para probar la alerta en vivo durante la sustentación"
            disabled={cargandoAccion}
          >
            <FaBolt style={{ color: "#eab308" }} /> Inyectar Evento Crítico
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>
            Emitidos:{" "}
            <strong style={{ color: "#111827" }}>
              {simuladorEstado.eventos_emitidos || 0}
            </strong>{" "}
            eventos
          </span>
          <button
            onClick={onLimpiarFeed}
            className={styles.btnSecondary}
            title="Limpiar eventos recibidos en memoria del navegador"
          >
            <FaTrash /> Limpiar Feed
          </button>
        </div>
      </div>

      {/* FILA INFERIOR: INPUT DE CARGA CSV PARA DATASET DE TESTING / INFERENCIA ONLINE */}
      <div className={styles.uploadSection}>
        <div className={styles.uploadWrapper}>
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv"
            onChange={handleFileChange}
            className={styles.hiddenInput}
            id="csv-simulador-input"
            disabled={isUploadingCSV}
          />
          <label htmlFor="csv-simulador-input" className={styles.fileInputLabel}>
            <FaFileCsv style={{ fontSize: "1.1rem" }} />
            {isUploadingCSV
              ? "Cargando Dataset..."
              : esTesting
              ? "Cambiar Dataset de Testing (.csv)"
              : "Cargar Dataset de Testing (Inferencia Online)..."}
          </label>

          {isUploadingCSV && (
            <span className={styles.uploadingNotice}>
              <FaArrowsRotate style={{ animation: "spin 1s linear infinite" }} /> Cargando e iniciando inferencia online...
            </span>
          )}

          {selectedFile && !isUploadingCSV && (
            <>
              <span className={styles.fileBadge}>
                {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                <button
                  type="button"
                  onClick={handleClearSelectedFile}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    marginLeft: "0.25rem",
                    color: "#6b7280",
                  }}
                  title="Descartar archivo"
                >
                  <FaXmark />
                </button>
              </span>

              <button
                type="button"
                className={styles.btnUploadExec}
                onClick={handleExecuteUpload}
                disabled={isUploadingCSV}
              >
                <FaCloudArrowUp />
                Subir y Simular Online
              </button>
            </>
          )}
        </div>

        <div className={styles.metaInfo}>
          {esTesting ? (
            <div className={styles.testingContainer}>
              <span className={styles.testingBadge}>
                <span className={styles.testingDot} /> Dataset de Testing Activo:
              </span>
              <span className={styles.activeTestingTag} title="Dataset en inferencia online con modelo previamente entrenado">
                {nombreArchivoRaw}
              </span>
            </div>
          ) : (
            <div className={styles.defaultContainer}>
              <span className={styles.defaultLabel}>Dataset activo:</span>
              <span className={styles.activeFileTag} title="Dataset de eventos base">
                {nombreArchivoRaw}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
