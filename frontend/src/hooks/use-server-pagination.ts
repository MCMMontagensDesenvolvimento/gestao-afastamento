import { useState } from "react";

export function useServerPagination(initialSize = 10) {
  const [pagina, setPagina] = useState(1);
  const [tamanho, updateSize] = useState(initialSize);
  const setTamanho = (size: number) => {
    updateSize(size);
    setPagina(1);
  };
  return { pagina, setPagina, tamanho, setTamanho };
}
