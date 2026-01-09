const winston = require("winston");
const fs = require("fs");
const path = require("path");

// Determinar si estamos en un ambiente con filesystem persistente
const canWriteFiles =
  process.env.NODE_ENV !== "production" ||
  process.env.ENABLE_FILE_LOGS === "true";

// Configurar transportes según el ambiente
const transports = [];

// Console transport SIEMPRE (incluso en producción)
transports.push(
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({
        format: "YYYY-MM-DD HH:mm:ss",
      }),
      winston.format.printf(({ level, message, timestamp, ...meta }) => {
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : "";
        return `${timestamp} [${level}]: ${message} ${metaStr}`;
      })
    ),
  })
);

// File transports solo en desarrollo o si explícitamente se habilitan
if (canWriteFiles) {
  try {
    // Crear directorio de logs si no existe
    const logDir = path.join(__dirname, "../../logs");
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    transports.push(
      new winston.transports.File({
        filename: "logs/error.log",
        level: "error",
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
      new winston.transports.File({
        filename: "logs/combined.log",
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      })
    );

    console.log("✅ File logging enabled");
  } catch (error) {
    console.warn(
      "⚠️ Could not create log files, using console only:",
      error.message
    );
  }
} else {
  console.log("ℹ️ File logging disabled (production mode), using console only");
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: "harassment-platform-api" },
  transports,
});

module.exports = logger;
