const mongoose = require("mongoose");
const logger = require("./logger");

const connectDB = async () => {
  try {
    // Validar que MONGODB_URI esté definida
    if (!process.env.MONGODB_URI) {
      logger.error("MONGODB_URI no está definida en las variables de entorno");
      logger.error("Por favor, configura MONGODB_URI en tu archivo .env");
      process.exit(1);
    }

    const options = {
      maxPoolSize: 10, // Mantener hasta 10 conexiones de socket
      serverSelectionTimeoutMS: 5000, // Timeout después de 5s en lugar de 30s
      socketTimeoutMS: 45000, // Cerrar sockets después de 45s de inactividad
      family: 4, // Usar IPv4, saltar intentos IPv6
    };

    // Mostrar información de conexión (sin credenciales)
    const uriParts = process.env.MONGODB_URI.split("@");
    const hostInfo =
      uriParts.length > 1 ? uriParts[1] : process.env.MONGODB_URI;
    logger.info(`Conectando a MongoDB: ${hostInfo}`);

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    logger.info(`✅ MongoDB conectado exitosamente: ${conn.connection.host}`);
    logger.info(`📊 Base de datos: ${conn.connection.name}`);

    // Event listeners para la conexión
    mongoose.connection.on("error", (err) => {
      logger.error("❌ Error de conexión MongoDB:", err);
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("⚠️ MongoDB desconectado");
    });

    mongoose.connection.on("reconnected", () => {
      logger.info("🔄 MongoDB reconectado");
    });

    // Cerrar conexión cuando la aplicación se termine
    process.on("SIGINT", async () => {
      try {
        await mongoose.connection.close();
        logger.info(
          "🔌 Conexión MongoDB cerrada debido a terminación de la aplicación"
        );
        process.exit(0);
      } catch (err) {
        logger.error("❌ Error cerrando conexión MongoDB:", err);
        process.exit(1);
      }
    });
  } catch (error) {
    logger.error("❌ Error conectando a MongoDB:", error.message);

    // Mensajes de ayuda según el tipo de error
    if (error.message.includes("ECONNREFUSED")) {
      logger.error("💡 Verifica que MongoDB esté ejecutándose");
    } else if (error.message.includes("Authentication failed")) {
      logger.error("💡 Verifica las credenciales en MONGODB_URI");
    } else if (error.message.includes("ENOTFOUND")) {
      logger.error("💡 Verifica que la URL de MongoDB sea correcta");
    }

    process.exit(1);
  }
};

module.exports = connectDB;
