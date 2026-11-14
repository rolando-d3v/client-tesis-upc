import { useCallback, useEffect, useState } from "react";

/**
 * Reproduce `total` eventos a la velocidad elegida ({ ms, paso }).
 * `indice` = cantidad de eventos ya procesados (0 … total). El temporizador se programa paso a paso,
 * así pausar o cambiar la velocidad surte efecto en el siguiente paso sin reiniciar la reproducción.
 */
export function useReproduccion(total, velocidad) {
  const [indice, setIndice] = useState(0);
  const [modo, setModo] = useState("detenido"); // detenido | reproduciendo | pausado
  const finalizado = total > 0 && indice >= total;
  const reproduciendo = modo === "reproduciendo" && !finalizado;

  useEffect(() => {
    if (!reproduciendo) return undefined;
    const temporizador = setTimeout(() => setIndice((i) => Math.min(total, i + velocidad.paso)), velocidad.ms);
    return () => clearTimeout(temporizador);
  }, [reproduciendo, indice, total, velocidad]);

  const iniciar = useCallback(() => {
    setIndice((i) => (i >= total ? 0 : i));
    setModo("reproduciendo");
  }, [total]);
  const pausar = useCallback(() => setModo("pausado"), []);
  const reanudar = useCallback(() => setModo("reproduciendo"), []);
  const avanzar = useCallback(() => {
    setModo((m) => (m === "reproduciendo" ? "pausado" : m));
    setIndice((i) => Math.min(total, i + 1));
  }, [total]);
  const completar = useCallback(() => {
    setIndice(total);
    setModo("detenido");
  }, [total]);
  const reiniciar = useCallback(() => {
    setIndice(0);
    setModo("detenido");
  }, []);

  return {
    indice,
    finalizado,
    estado: finalizado ? "finalizado" : modo,
    iniciar,
    pausar,
    reanudar,
    avanzar,
    completar,
    reiniciar,
  };
}
