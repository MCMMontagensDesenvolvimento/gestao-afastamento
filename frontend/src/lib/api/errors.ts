export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly requestId?: string,
    public readonly fieldErrors?: { field: string; message: string }[],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const fields = error.fieldErrors?.map((field) => field.message).join(" ") ?? "";
    return `${error.message}${fields ? ` ${fields}` : ""}${error.requestId ? ` (Referência: ${error.requestId})` : ""}`;
  }
  return "Não foi possível concluir a operação. Verifique a conexão e tente novamente.";
}
