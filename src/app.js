// Hacer dotenv opcional en producción
if (process.env.NODE_ENV !== 'production') {
  require("dotenv").config();
}

// Debug logs al inicio
console.log("=== STARTUP DEBUG ===");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("PORT:", process.env.PORT);
console.log("MONGODB_URI exists:", !!process.env.MONGODB_URI);
console.log("====================");

const express = require("express");
const connectDB = require("./config/database");
const logger = require("./config/logger");

// Configuración de Swagger
const { specs, swaggerUi, swaggerUiOptions } = require("./config/swagger");

// Middlewares globales
const {
  jsonParser,
  urlencodedParser,
  cors,
  securityMiddleware,
  requestLogger,
  errorHandler,
  notFoundHandler,
  generalRateLimit,
  tenantHeader,
} = require("./middleware");

// Rutas
const authRoutes = require("./routes/auth");
const complaintRoutes = require("./routes/complaints");
const userRoutes = require("./routes/users");
const investigationRoutes = require("./routes/investigations");
const resourceRoutes = require("./routes/resources");

const app = express();

// Configuración de trust proxy para obtener IP real detrás de proxy/load balancer
app.set("trust proxy", 1);

// Middlewares de seguridad
app.use(securityMiddleware);
app.use(cors);

// Rate limiting general
app.use("/api/", generalRateLimit);

// Middlewares de parsing
app.use(jsonParser);
app.use(urlencodedParser);

// Middleware de logging
app.use(requestLogger);

// Middleware para tenant header
app.use(tenantHeader);

// Documentación Swagger
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(specs, swaggerUiOptions));

// Redirección de /docs a /api/docs
app.get("/docs", (req, res) => {
  res.redirect("/api/docs");
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check del sistema
 *     description: Verifica que la API esté funcionando correctamente
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API funcionando correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API funcionando correctamente",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    environment: process.env.NODE_ENV,
  });
});

/**
 * @swagger
 * /:
 *   get:
 *     summary: Información general de la API
 *     description: Retorna información básica sobre la API y sus endpoints disponibles
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Información de la API
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Harassment Platform API"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 docs:
 *                   type: string
 *                   example: "/api/docs"
 *                 endpoints:
 *                   type: object
 *                   properties:
 *                     auth:
 *                       type: string
 *                       example: "/api/auth"
 *                     health:
 *                       type: string
 *                       example: "/health"
 */
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Harassment Platform API",
    version: "1.0.0",
    docs: "/api/docs",
    endpoints: {
      auth: "/api/auth",
      users: "/api/users",
      complaints: "/api/complaints",
      investigations: "/api/investigations",
      resources: "/api/resources",
      training: "/api/training (próximamente)",
      reports: "/api/reports (próximamente)",
      health: "/health",
    },
  });
});

// Rutas de la API
app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/users", userRoutes);
app.use("/api/investigations", investigationRoutes);
app.use("/api/resources", resourceRoutes);

// Placeholder para futuras rutas con documentación Swagger

/**
 * @swagger
 * /api/training:
 *   get:
 *     summary: Materiales de capacitación (próximamente)
 *     description: Endpoint en desarrollo para gestión de materiales de capacitación
 *     tags: [Training]
 *     responses:
 *       501:
 *         description: Endpoint en desarrollo
 */
app.use("/api/training", (req, res) => {
  res.status(501).json({
    success: false,
    message: "Endpoint en desarrollo",
  });
});

/**
 * @swagger
 * /api/reports:
 *   get:
 *     summary: Reportes y análisis (próximamente)
 *     description: Endpoint en desarrollo para generación de reportes
 *     tags: [Reports]
 *     responses:
 *       501:
 *         description: Endpoint en desarrollo
 */
app.use("/api/reports", (req, res) => {
  res.status(501).json({
    success: false,
    message: "Endpoint en desarrollo",
  });
});

// Middleware para rutas no encontradas
app.use("*", notFoundHandler);

// Middleware de manejo de errores (debe ir al final)
app.use(errorHandler);

// Función async para iniciar el servidor
async function startServer() {
  try {
    // Conectar a la base de datos PRIMERO
    await connectDB();
    
    // Puerto del servidor
    const PORT = process.env.PORT || 3000;

    // Iniciar servidor (agregar '0.0.0.0' para Render)
    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`✅ Servidor iniciado en puerto ${PORT} en modo ${process.env.NODE_ENV}`);
      logger.info(`🏥 Health check disponible en: http://localhost:${PORT}/health`);
      logger.info(`📖 Documentación Swagger disponible en: http://localhost:${PORT}/api/docs`);
    });

    // Manejo graceful de cierre del servidor
    const gracefulShutdown = (signal) => {
      logger.info(`${signal} recibido. Cerrando servidor graciosamente...`);

      server.close((err) => {
        if (err) {
          logger.error("Error cerrando servidor:", err);
          process.exit(1);
        }

        logger.info("Servidor cerrado exitosamente");
        process.exit(0);
      });

      // Forzar cierre después de 30 segundos
      setTimeout(() => {
        logger.error("Forzando cierre del servidor después de timeout");
        process.exit(1);
      }, 30000);
    };

    // Event listeners para cierre graceful
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

  } catch (error) {
    logger.error("❌ Error fatal al iniciar servidor:", error);
    console.error("❌ Error fatal:", error);
    process.exit(1);
  }
}

// Manejo de errores no capturados
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
  logger.error("Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (err, promise) => {
  console.error("❌ Unhandled Rejection:", err);
  logger.error("Unhandled Rejection en:", promise, "razón:", err);
  process.exit(1);
});

// Iniciar el servidor
startServer();

module.exports = app;