import { Request, Response } from "express";
import { logger } from "./logger";

export const commonProxyOptions = {
  changeOrigin: true,
  // xfwd: true,
  logger,
  timeout: 25_000,
  proxyTimeout: 25_000,
  onError(err: unknown, _req: Request, res: Response) {
    logger.error({ err }, "Proxy error");
    if (!res.headersSent) {
      res.status(502).json({ error: "Bad Gateway" });
    }
  },
  onProxyReq(proxyReq: any, req: Request) {
    const reqId = (req as any).id || (req.headers["x-request-id"] as string | undefined);
    if (reqId) {
      proxyReq.setHeader("x-request-id", reqId);
    }
  },
};