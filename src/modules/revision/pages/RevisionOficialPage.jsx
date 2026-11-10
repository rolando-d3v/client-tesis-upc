import { useState } from "react";
import { FaUserShield, FaFileArrowDown, FaWandMagicSparkles } from "react-icons/fa6";
import { toast } from "sonner";
import {
  descargarDecisiones,
  useCasoRevision,
  useCasosRevision,
  useEstadoRevision,
  useGenerarCasos,
} from "../../../api/apiRevision";
import FormularioCaso from "../componentes/FormularioCaso";
import MetricasRevision from "../componentes/MetricasRevision";
import RevisionRegistrosGold from "../componentes/RevisionRegistrosGold";
import styles from "./revisionOficial.module.css";

export default function RevisionOficialPage() {
  const [pestana, setPestana] = useState("gold");
  const [seleccion, setSeleccion] = useState(null);
  const [soloPendientes, setSoloPendientes] = useState(false);
  const estado = useEstadoRevision();
  const lista = useCasosRevision();
  const generar = useGenerarCasos();
  const casos = lista.data ?? [];
  const visibles = soloPendientes ? casos.filter((c) => !c.decidido) : casos;
  const actualId = seleccion ?? visibles[0]?.id ?? casos[0]?.id ?? null;
  const caso = useCasoRevision(actualId);
  const total = estado.data?.total ?? 0;
  const decididos = estado.data?.decididos ?? 0;

  const crear = async () => {
    try {
      const r = await generar.mutateAsync(4);
      toast.success(r.nuevos ? `${r.nuevos} casos nuevos para revisar.` : "No hay casos nuevos para agregar.");
    } catch (error) {
      toast.error(error?.response?.data?.detail || "No se pudieron generar los casos.");
    }
  };

  const exportar = async () => {
    try {
      await descargarDecisiones();
    } catch {
      toast.error("No se pudo exportar. ¿Hay decisiones guardadas?");
    }
  };

  const alGuardar = (siguiente) => {
    if (!siguiente) return;
    const indice = casos.findIndex((c) => c.id === actualId);
    const proximo = [...casos.slice(indice + 1), ...casos.slice(0, indice)].find((c) => !c.decidido && c.id !== actualId);
    if (proximo) setSeleccion(proximo.id);
    else toast.info("No quedan casos pendientes.");
  };

  return (
    <div className={styles.page}>
      <div className={styles.encabezado}>
        <div>
          <h1 className={styles.titulo}><FaUserShield /> Revisión del oficial de seguridad</h1>
          <p className={styles.subtitulo}>
            Revise casos de actividad y registre etiquetas oficiales sobre la muestra reservada de eventos.
          </p>
        </div>
        {pestana !== "gold" && <div className={styles.progreso} role="status">
          <strong>{decididos} / {total}</strong> casos decididos
          <progress value={decididos} max={Math.max(total, 1)} />
        </div>}
      </div>

      <div className={styles.barra}>
        <div className={styles.pestanas} role="tablist">
          <button role="tab" aria-selected={pestana === "revisar"} className={pestana === "revisar" ? styles.pestanaActiva : ""} onClick={() => setPestana("revisar")}>Casos por modelo</button>
          <button role="tab" aria-selected={pestana === "gold"} className={pestana === "gold" ? styles.pestanaActiva : ""} onClick={() => setPestana("gold")}>Registros gold</button>
          <button role="tab" aria-selected={pestana === "metricas"} className={pestana === "metricas" ? styles.pestanaActiva : ""} onClick={() => setPestana("metricas")}>Métricas de casos</button>
        </div>
        {pestana !== "gold" && <div className={styles.acciones}>
          <button type="button" className={styles.boton} onClick={crear} disabled={generar.isPending}>
            <FaWandMagicSparkles /> {generar.isPending ? "Generando…" : total ? "Generar más casos" : "Generar casos"}
          </button>
          <button type="button" className={styles.boton} onClick={exportar} disabled={decididos === 0}>
            <FaFileArrowDown /> Exportar decisiones (CSV)
          </button>
        </div>}
      </div>

      {pestana === "gold" ? (
        <RevisionRegistrosGold />
      ) : pestana === "metricas" ? (
        <MetricasRevision />
      ) : lista.isPending || estado.isPending ? (
        <p role="status">Cargando casos…</p>
      ) : total === 0 ? (
        <section className={styles.tarjeta}>
          <h2>Aún no hay casos para revisar</h2>
          <p>
            Pulse «Generar casos»: el sistema puntúa el dataset etiquetado y arma 20 casos mezclados (alertados por los dos
            modelos, por uno solo, silenciosos y habituales), en orden aleatorio para que no se note cuál es cuál.
          </p>
        </section>
      ) : (
        <div className={styles.cuerpo}>
          <aside className={styles.lista} aria-label="Casos">
            <label className={styles.filtro}>
              <input type="checkbox" checked={soloPendientes} onChange={(e) => setSoloPendientes(e.target.checked)} /> Solo pendientes
            </label>
            <ul>
              {visibles.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className={`${styles.itemCaso} ${c.id === actualId ? styles.itemActivo : ""}`}
                    onClick={() => setSeleccion(c.id)}
                  >
                    <span className={c.decidido ? styles.hecho : styles.pendiente}>{c.decidido ? "✓" : "○"}</span>
                    <span>
                      <strong>{c.usuario.nombre}</strong>
                      <small>{c.inicio} · {c.n_eventos} eventos</small>
                    </span>
                  </button>
                </li>
              ))}
              {visibles.length === 0 && <li className={styles.meta}>No quedan casos pendientes.</li>}
            </ul>
          </aside>
          <main>
            {caso.isPending && <p role="status">Cargando caso…</p>}
            {caso.isError && <p role="alert" className={styles.error}>No se pudo cargar el caso.</p>}
            {caso.data && estado.data && (
              <FormularioCaso key={`${caso.data.id}-${caso.data.decision?.fecha ?? "nuevo"}`} caso={caso.data} preguntas={estado.data.preguntas} alGuardar={alGuardar} />
            )}
          </main>
        </div>
      )}
    </div>
  );
}
