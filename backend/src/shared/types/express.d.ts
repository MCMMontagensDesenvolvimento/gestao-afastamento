import type { AuthenticatedPrincipal } from "../../modules/auth/auth.service.js";

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      auth?: AuthenticatedPrincipal;
    }
  }
}

export {};
