import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import authRoutes from "./modules/auth/route.js";
import userRoutes from "./modules/user/route.js";
import projectRoutes from "./modules/project/route.js";
import issueRoutes from "./modules/issue/route.js";
import attachmentRoutes from "./modules/attachment/route.js";
import reportRoutes from "./modules/report/route.js";
import settingRoutes from "./modules/setting/route.js";
import { requireAuth } from "./middleware/auth.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(cors({
  origin: (process.env.CLIENT_URL || "http://localhost:5173").split(",").map(x => x.trim()),
  credentials: true
}));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
if (process.env.NODE_ENV !== "test") app.use(morgan("dev"));

app.get("/api/v1/health", (_req, res) => res.json({ success: true, message: "BugTracker API is healthy." }));
app.use("/api/v1/auth", rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false }), authRoutes);
app.use("/api/v1/users", requireAuth, userRoutes);
app.use("/api/v1/projects", requireAuth, projectRoutes);
app.use("/api/v1/issues", requireAuth, issueRoutes);
app.use("/api/v1/attachments", requireAuth, attachmentRoutes);
app.use("/api/v1/reports", requireAuth, reportRoutes);
app.use("/api/v1/settings", requireAuth, settingRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
