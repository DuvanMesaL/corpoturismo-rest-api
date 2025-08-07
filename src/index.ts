import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";

import { connectMongoDB } from "./infrastructure/database/mongodb";
import { logger } from "./infrastructure/logging/winston-logger";
import { errorHandler } from "./infrastructure/middleware/error-handler";
import { requestLogger } from "./infrastructure/middleware/request-logger";

// Routes
import authRoutes from "./infrastructure/routes/auth.routes";
import userRoutes from "./infrastructure/routes/user.routes";
import turnoRoutes from "./infrastructure/routes/turno.routes";
import recaladaRoutes from "./infrastructure/routes/recalada.routes";
import buqueRoutes from "./infrastructure/routes/buque.routes";
import auditRoutes from "./infrastructure/routes/audit.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.",
});

// Middlewares
app.use(helmet());
app.use(cors());
app.use(limiter);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "corpoturismo-api-rest",
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/usuarios", userRoutes);
app.use("/api/turnos", turnoRoutes);
app.use("/api/recaladas", recaladaRoutes);
app.use("/api/buques", buqueRoutes);
app.use("/api/audit", auditRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Endpoint no encontrado",
    path: req.originalUrl,
  });
});

async function startServer() {
  try {
    // Connect to MongoDB for logs
    await connectMongoDB();

    app.listen(PORT, () => {
      logger.info(`🚀 Servidor iniciado en puerto ${PORT}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error("❌ Error al iniciar servidor:", error);
    process.exit(1);
  }
}

startServer();

export default app;
