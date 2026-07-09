import { useState, useRef } from "react";
import styles from "./UploadCSVEventos.module.css";

export default function UploadCSVEventos({ onUpload, loading = false }) {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.name.endsWith(".csv")) {
      setFile(droppedFile);
    }
  };

  const handleChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) setFile(selectedFile);
  };

  const handleSubmit = () => {
    if (file && onUpload) onUpload(file);
  };

  return (
    <div className={styles.upload_section}>
      <div
        className={`${styles.upload_area} ${dragging ? styles.dragging : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <div className={styles.upload_icon}>📊</div>
        <p>Arrastra tu archivo CSV de eventos aquí o haz clic para seleccionar</p>
        <p className={styles.upload_hint}>
          Formato: dt_eventos.csv (17 columnas — ID_EVENTO, FECHA_EVENTO, ID_USER, etc.)
        </p>
        <input ref={inputRef} type="file" accept=".csv" onChange={handleChange} style={{ display: "none" }} />
        {file && (
          <div className={styles.file_selected}>
            📎 {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </div>
        )}
      </div>
      {file && (
        <div style={{ textAlign: "center", marginTop: "0.75rem" }}>
          <button className={styles.upload_btn} onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <><span className={styles.spinner} style={{ width: 16, height: 16, borderWidth: 2, marginBottom: 0 }} /> Procesando...</>
            ) : (
              <>🤖 Analizar Eventos con Risk Engine</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
