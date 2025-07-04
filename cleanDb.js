require("dotenv").config();
const mongoose = require("mongoose");

async function cleanDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Conectado a MongoDB");

    const db = mongoose.connection.db;

    // Eliminar colecciones problemáticas
    await db.collection("users").drop();
    console.log("Colección 'users' eliminada");

    await db.collection("tenants").drop();
    console.log("Colección 'tenants' eliminada");

    await db.collection("complaints").drop();
    console.log("Colección 'complaints' eliminada");

    console.log("Base de datos limpiada exitosamente");
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await mongoose.connection.close();
    console.log("Conexión cerrada");
  }
}

cleanDatabase();
