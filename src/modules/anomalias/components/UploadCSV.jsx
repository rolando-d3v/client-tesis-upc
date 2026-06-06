import { useState, useRef } from "react";
import "../anomalias.css";

export default function UploadCSV({ onUpload, loading = false }) {
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
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSubmit = () => {
    if (file && onUpload) {
      onUpload(file);
    }
  };

  return (
    <div className="upload-section">
      <div
        className={`upload-area ${dragging ? "dragging" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <div className="upload-icon">📄</div>
        <p>Arrastra tu archivo CSV aquí o haz clic para seleccionar</p>
        <p className="upload-hint">
          Formato: registro_trazabilidad.csv (32 columnas)
        </p>

        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          onChange={handleChange}
          style={{ display: "none" }}
        />

        {file && (
          <div className="file-selected">
            📎 {file.name} ({(file.size / 1024).toFixed(1)} KB)
          </div>
        )}
      </div>

      {file && (
        <div style={{ textAlign: "center", marginTop: "0.75rem" }}>
          <button
            className="upload-btn"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2, marginBottom: 0 }} />
                Procesando...
              </>
            ) : (
              <>🤖 Analizar con Isolation Forest</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
