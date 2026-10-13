import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FaCircleExclamation, FaFlask, FaSkullCrossbones } from "react-icons/fa6";
import { getCatalogoInyeccionAPI, inyectarCasoAPI } from "../../../../api/apiEventos";
import styles from "./inyeccionCasos.module.css";

const NIVELES = [
  { id: "alto", etiqueta: "ALTO", rango: "score 50 – 75 %", icono: <FaCircleExclamation />, clase: styles.alto },
  { id: "critico", etiqueta: "CRÍTICO", rango: "score ≥ 75 % · bloquea la cuenta", icono: <FaSkullCrossbones />, clase: styles.critico },
];

export default function InyeccionCasos({ inyectando, setInyectando, desactivado }) {
  const queryClient = useQueryClient();
  const catalogo = useQuery({ queryKey: ["inyeccion_catalogo"], queryFn: getCatalogoInyeccionAPI, staleTime: 0 });

  const inyectar = async (nivel) => {
    setInyectando(true);
    try {
      const r = await inyectarCasoAPI(nivel);
      toast.info(`Caso ${nivel === "alto" ? "alto" : "crítico"} ${r.caso.numero}/${r.caso.total}: ${r.caso.titulo}`, {
        description: `Usuario ${r.usuario.nombre} · ${r.eventos_planificados} evento${r.eventos_planificados > 1 ? "s" : ""}`,
      });
      queryClient.invalidateQueries({ queryKey: ["inyeccion_catalogo"] });
    } catch (error) {
      setInyectando(false);
      toast.error(typeof error?.response?.data?.detail === "string" ? error.response.data.detail : "No se pudo inyectar el caso.");
    }
  };

  return (
    <section className={styles.panel} aria-labelledby="inyeccion-titulo">
      <header>
        <h2 id="inyeccion-titulo"><FaFlask /> Casos de demostración</h2>
        <p>
          Inyecta secuencias reales de un usuario con historial para ver cómo responde el motor sin esperar a que el archivo
          llegue a ellas. Cada pulsación emite el siguiente de los 4 casos de ese nivel; los scores los calcula el ensemble.
        </p>
      </header>
      <div className={styles.niveles}>
        {NIVELES.map(({ id, etiqueta, rango, icono, clase }) => {
          const datos = catalogo.data?.[id];
          return (
            <article key={id} className={`${styles.nivel} ${clase}`}>
              <button type="button" className={styles.boton} disabled={inyectando || desactivado || !datos} onClick={() => inyectar(id)}>
                {icono} Inyectar caso {etiqueta}{datos ? ` · ${datos.siguiente + 1}/${datos.total}` : ""}
              </button>
              <small>{rango}</small>
              <ol>
                {datos?.casos.map((caso, i) => (
                  <li key={caso.id} className={i === datos.siguiente ? styles.siguiente : undefined} title={caso.descripcion}>{caso.titulo}</li>
                ))}
              </ol>
            </article>
          );
        })}
      </div>
      {inyectando && <p role="status" className={styles.estado}>Emitiendo caso… observa el registro de eventos.</p>}
    </section>
  );
}
