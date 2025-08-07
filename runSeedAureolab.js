#!/usr/bin/env node

/**
 * Script para ejecutar seed de datos de Aureolab
 * Uso: node runSeedAureolab.js
 */

require("dotenv").config();
const seedDataAureolab = require("./src/scripts/seedDataAureolab");

console.log("🚀 Iniciando seed de datos para Aureolab...");
console.log("⚠️  Asegúrate de estar en el entorno correcto (development)");
console.log("");

// Ejecutar seed
seedDataAureolab()
  .then(() => {
    console.log("✅ Seed de Aureolab completado exitosamente");
  })
  .catch((error) => {
    console.error("❌ Error ejecutando seed de Aureolab:", error);
    process.exit(1);
  });
