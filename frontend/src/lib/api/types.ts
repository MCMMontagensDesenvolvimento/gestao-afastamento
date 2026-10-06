export interface PageMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}
export interface Page<T> {
  data: T[];
  meta: PageMeta;
}
export interface ResponseData<T> {
  data: T;
}
export type Params = Record<string, string | number | boolean | null | undefined>;
export { withParams } from "./client";
