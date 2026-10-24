import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { HttpError } from "../utils/httpError.js";

export function notFound(req, res) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error instanceof ZodError) {
    return res.status(400).json({ success: false, message: "Validation failed.", errors: error.issues });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") return res.status(409).json({ success: false, message: "A record with this value already exists." });
    if (error.code === "P2025") return res.status(404).json({ success: false, message: "Record not found." });
    if (error.code === "P2003") return res.status(400).json({ success: false, message: "Related record does not exist or is still in use." });
  }
  const status = error instanceof HttpError ? error.status : 500;
  const body = { success: false, message: status === 500 && process.env.NODE_ENV === "production" ? "Internal server error." : error.message || "Internal server error." };
  if (error.details) body.details = error.details;
  if (process.env.NODE_ENV !== "production" && status === 500) body.stack = error.stack;
  res.status(status).json(body);
}
