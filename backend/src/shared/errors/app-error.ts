export interface FieldError {
  field: string;
  message: string;
}

export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors: FieldError[] | undefined;

  constructor(status: number, code: string, message: string, fieldErrors?: FieldError[]) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}
