import type { NextFunction, Request, Response } from "express";
import { env } from "../../config/env.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { AuthService, LoginFlow } from "./auth.service.js";

const FLOW_COOKIE = "mcm_oidc_flow";
const baseCookie = { httpOnly: true, secure: env.COOKIE_SECURE, sameSite: env.COOKIE_SAME_SITE, path: "/" } as const;

export class AuthController {
  constructor(private readonly service: AuthService) {}

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.startLogin(typeof req.query.returnTo === "string" ? req.query.returnTo : undefined);
      res.cookie(FLOW_COOKIE, JSON.stringify(result.flow), { ...baseCookie, signed: true, maxAge: 10 * 60_000 });
      res.redirect(result.url);
    } catch (error) {
      next(error);
    }
  };

  callback = async (req: Request, res: Response): Promise<void> => {
    try {
      const rawFlow = req.signedCookies[FLOW_COOKIE] as string | undefined;
      if (!rawFlow) throw new AppError(401, "OIDC_FLOW_MISSING", "A tentativa de login não foi encontrada.");
      const flow = JSON.parse(rawFlow) as LoginFlow;
      const currentUrl = new URL(env.MICROSOFT_REDIRECT_URI);
      currentUrl.search = new URL(req.originalUrl, "http://localhost").search;
      const result = await this.service.completeLogin(currentUrl, flow, req.requestId);
      res.clearCookie(FLOW_COOKIE, baseCookie);
      res.cookie(env.SESSION_COOKIE_NAME, result.token, { ...baseCookie, expires: result.expiresAt });
      res.redirect(new URL(result.returnTo, env.FRONTEND_ORIGIN).toString());
    } catch (error) {
      res.clearCookie(FLOW_COOKIE, baseCookie);
      const code = error instanceof AppError ? error.code : "AUTHENTICATION_FAILED";
      const target = new URL("/login", env.FRONTEND_ORIGIN);
      target.searchParams.set("authError", code);
      res.redirect(target.toString());
    }
  };

  me = (req: Request, res: Response): void => {
    const auth = req.auth!;
    res.status(200).json({ data: { user: { id: auth.userId, email: auth.email, name: auth.name }, roles: auth.roles, permissions: auth.permissions } });
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.service.logout(req.auth!, req.requestId);
      res.clearCookie(env.SESSION_COOKIE_NAME, baseCookie);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}
