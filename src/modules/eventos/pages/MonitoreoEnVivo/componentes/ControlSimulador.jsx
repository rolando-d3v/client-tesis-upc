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

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith(".csv")) {
        alert("Por favor selecciona un archivo con extensión .csv");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleClearSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleExecuteUpload = () => {
    if (selectedFile && onUploadCSV) {
      onUploadCSV(selectedFile);
    }
  };

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

      {/* FILA INFERIOR: INPUT DE CARGA CSV PARA MONITOREO ONLINE */}
      <div className={styles.uploadSection}>
        <div className={styles.uploadWrapper}>
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv"
            onChange={handleFileChange}
            className={styles.hiddenInput}
            id="csv-simulador-input"
          />
          <label htmlFor="csv-simulador-input" className={styles.fileInputLabel}>
            <FaFileCsv style={{ fontSize: "1.1rem" }} />
            {selectedFile ? "Cambiar CSV..." : "Seleccionar CSV para Simular Online"}
          </label>

          {selectedFile && (
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
                <FaCloudArrowUp className={isUploadingCSV ? "spin" : ""} />
                {isUploadingCSV ? "Cargando e Iniciando..." : "Subir y Simular Online"}
              </button>
            </>
          )}
        </div>

        <div className={styles.metaInfo}>
          <span>Archivo activo:</span>
          <span className={styles.activeFileTag}>
            {simuladorEstado.archivo || "dataset/dt_eventos_5000.csv"}
          </span>
        </div>
      </div>
    </div>
  );
}
