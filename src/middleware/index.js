const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { validationResult } = require("express-validator");
const logger = require("../config/logger");
const { extractTenant } = require("./tenantExtractor");

/**
 * Rate limiting personalizado por tipo de endpoint
 */
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message: message || "Demasiadas solicitudes, intente más tarde",
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn(
        `Rate limit excedido para IP: ${req.ip}, URL: ${req.originalUrl}`
      );
      res.status(429).json({
        success: false,
        message: "Demasiadas solicitudes, intente más tarde",
      });
    },
  });
};

/**
 * Rate limits específicos
 */
const authRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutos
  20, // máximo 20 intentos por IP (aumentado para desarrollo)
  "Demasiados intentos de login, intente más tarde"
);

const generalRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutos
  100, // máximo 100 requests por IP
  "Demasiadas solicitudes, intente más tarde"
);

const apiRateLimit = createRateLimit(
  1 * 60 * 1000, // 1 minuto
  30, // máximo 30 requests por minuto por IP
  "Límite de API excedido, intente más tarde"
);

/**
 * Middleware de logging de requests
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Log de la request
  logger.info(
    `${req.method} ${req.originalUrl} - IP: ${req.ip} - User-Agent: ${req.get(
      "User-Agent"
    )}`
  );

  // Interceptar el end de la response para log
  const originalEnd = res.end;
  res.end = function (chunk, encoding) {
    res.end = originalEnd;
    res.end(chunk, encoding);

    const duration = Date.now() - start;
    logger.info(
      `${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`
    );
  };

  next();
};

/**
 * Middleware para manejo de errores
 */
const errorHandler = (err, req, res, next) => {
  logger.error(`Error en ${req.method} ${req.originalUrl}:`, err);

  // Error de validación de Mongoose
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));

    return res.status(400).json({
      success: false,
      message: "Error de validación",
      errors,
    });
  }

  // Error de duplicado de MongoDB
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      success: false,
      message: `${field} ya existe`,
      field,
    });
  }

  // Error de cast de MongoDB (ObjectId inválido)
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "ID inválido",
    });
  }

  // Error de JWT
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Token inválido",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token expirado",
      code: "TOKEN_EXPIRED",
    });
  }

  // Error genérico
  res.status(err.status || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Error interno del servidor"
        : err.message,
  });
};

/**
 * Middleware para validación de requests
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Datos de entrada inválidos",
      errors: errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
      })),
    });
  }
  next();
};

/**
 * Middleware para rutas no encontradas
 */
const notFoundHandler = (req, res) => {
  logger.warn(
    `Ruta no encontrada: ${req.method} ${req.originalUrl} - IP: ${req.ip}`
  );

  res.status(404).json({
    success: false,
    message: "Ruta no encontrada",
  });
};

/**
 * Configuración de CORS
 */
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sin origin (ej: mobile apps, Postman, Swagger UI)
    if (!origin) return callback(null, true);

    const allowedOrigins = process.env.CORS_ORIGIN?.split(",") || [
      "http://localhost:3000",
      "https://harassment-api.aureolab.cl",
    ];

    // Si CORS_ORIGIN contiene "*", permitir todos los orígenes
    if (allowedOrigins.includes("*")) {
      return callback(null, true);
    }

    // Permitir localhost y subdominios en desarrollo
    if (
      process.env.NODE_ENV === "development" &&
      origin &&
      (origin.startsWith("http://localhost:") ||
        origin.match(/^https?:\/\/[^.]+\.localhost:\d+$/))
    ) {
      return callback(null, true);
    }

    // Permitir el dominio de la API para Swagger
    if (origin && origin.includes("harassment-api.aureolab.cl")) {
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.warn(`CORS bloqueado para origin: ${origin}`);
      callback(new Error("No permitido por CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "X-Tenant-Slug", // Agregar header personalizado para tenant
  ],
};

/**
 * Middleware de seguridad con Helmet
 */
const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

/**
 * Middleware para validar tenant en el header (opcional)
 */
const tenantHeader = (req, res, next) => {
  // Si viene el header x-tenant-id, lo agregamos al request
  const tenantId = req.headers["x-tenant-id"];
  if (tenantId) {
    req.headerTenantId = tenantId;
  }
  next();
};

module.exports = {
  // Rate limiting
  authRateLimit,
  generalRateLimit,
  apiRateLimit,

  // Logging y manejo de errores
  requestLogger,
  errorHandler,
  notFoundHandler,

  // Seguridad
  securityMiddleware,
  corsOptions,
  tenantHeader,

  // Validación
  validateRequest,

  // Express middlewares configurados
  jsonParser: express.json({ limit: "10mb" }),
  urlencodedParser: express.urlencoded({ extended: true, limit: "10mb" }),
  cors: cors(corsOptions),
  extractTenant,
};
