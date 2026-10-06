import { formatDateOnly } from "../../shared/dates/date-only.js";

export function mapLeave<T extends {
  dataAfastamento: Date; dataFimBeneficio: Date | null; dataRetornoPrevista: Date | null; dataRetornoEfetiva: Date | null;
}>(item: T) {
  return {
    ...item,
    dataAfastamento: formatDateOnly(item.dataAfastamento),
    dataFimBeneficio: formatDateOnly(item.dataFimBeneficio),
    dataRetornoPrevista: formatDateOnly(item.dataRetornoPrevista),
    dataRetornoEfetiva: formatDateOnly(item.dataRetornoEfetiva),
  };
}
