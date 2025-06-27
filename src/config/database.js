const mongoose = require("mongoose");
const logger = require("./logger");

const connectDB = async () => {
  try {
    const options = {
      maxPoolSize: 10, // Mantener hasta 10 conexiones de socket
      serverSelectionTimeoutMS: 5000, // Timeout después de 5s en lugar de 30s
      socketTimeoutMS: 45000, // Cerrar sockets después de 45s de inactividad
      family: 4, // Usar IPv4, saltar intentos IPv6
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    logger.info(`MongoDB conectado: ${conn.connection.host}`);

    // Event listeners para la conexión
    mongoose.connection.on("error", (err) => {
      logger.error("Error de conexión MongoDB:", err);
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB desconectado");
    });

    mongoose.connection.on("reconnected", () => {
      logger.info("MongoDB reconectado");
    });

    // Cerrar conexión cuando la aplicación se termine
    process.on("SIGINT", async () => {
      try {
        await mongoose.connection.close();
        logger.info(
          "Conexión MongoDB cerrada debido a terminación de la aplicación"
        );
        process.exit(0);
      } catch (err) {
        logger.error("Error cerrando conexión MongoDB:", err);
        process.exit(1);
      }
    });
  } catch (error) {
    logger.error("Error conectando a MongoDB:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
