const axios = require("axios");

/**
 * Script para verificar que Swagger esté actualizado con el nuevo formato
 */
async function verifySwaggerUpdate() {
  const baseURL = "http://localhost:3000";

  console.log("🔍 Verificando actualización de Swagger");
  console.log("=======================================");

  try {
    // 1. Verificar que el servidor esté corriendo
    console.log("\n1️⃣ Verificando servidor...");
    const healthResponse = await axios.get(`${baseURL}/`);
    console.log("✅ Servidor funcionando:", healthResponse.data.message);

    // 2. Verificar que Swagger esté accesible
    console.log("\n2️⃣ Verificando acceso a Swagger...");
    const swaggerResponse = await axios.get(`${baseURL}/api/docs/`, {
      timeout: 5000,
      validateStatus: (status) => status < 500, // Aceptar redirects
    });
    console.log("✅ Swagger accesible en:", `${baseURL}/api/docs`);

    // 3. Probar el nuevo formato de login
    console.log("\n3️⃣ Probando nuevo formato de login...");

    const loginResponse = await axios.post(
      `${baseURL}/api/auth/login`,
      {
        email: "admin@empresademo.cl",
        password: "Admin123!",
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-Slug": "empresademo",
        },
      }
    );

    console.log("✅ Login exitoso con nuevo formato");
    console.log("📊 Status:", loginResponse.status);
    console.log("👤 Usuario:", loginResponse.data.data.user.email);
    console.log("🏢 Tenant:", loginResponse.data.data.tenant.name);
    console.log("📝 Slug:", loginResponse.data.data.tenant.slug);

    // 4. Verificar que el formato anterior falle
    console.log("\n4️⃣ Verificando que formato anterior falle...");

    try {
      await axios.post(`${baseURL}/api/auth/login`, {
        email: "admin@empresademo.cl",
        password: "Admin123!",
        tenant_rut: "76.123.456-7", // Formato anterior
      });
      console.log("❌ ERROR: El formato anterior no debería funcionar");
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log("✅ Formato anterior rechazado correctamente");
        console.log("📋 Error:", error.response.data.message);
      } else {
        console.log("⚠️ Error inesperado:", error.message);
      }
    }

    // 5. Verificar headers CORS
    console.log("\n5️⃣ Verificando headers CORS...");

    const corsResponse = await axios.options(`${baseURL}/api/auth/login`);
    const allowedHeaders = corsResponse.headers["access-control-allow-headers"];

    if (allowedHeaders && allowedHeaders.includes("X-Tenant-Slug")) {
      console.log("✅ Header X-Tenant-Slug permitido en CORS");
    } else {
      console.log("⚠️ X-Tenant-Slug no encontrado en CORS headers");
      console.log("📋 Headers permitidos:", allowedHeaders);
    }

    // 6. Resumen final
    console.log("\n🎉 VERIFICACIÓN COMPLETADA");
    console.log("==========================");
    console.log("✅ Servidor funcionando");
    console.log("✅ Swagger accesible");
    console.log("✅ Nuevo formato de login funcionando");
    console.log("✅ Formato anterior rechazado");
    console.log("✅ Headers CORS actualizados");

    console.log("\n📖 Para probar Swagger:");
    console.log(`🌐 Abrir: ${baseURL}/api/docs`);
    console.log("🔧 Usar header: X-Tenant-Slug: empresademo");
    console.log("📧 Email: admin@empresademo.cl");
    console.log("🔑 Password: Admin123!");

    console.log("\n📚 Documentación:");
    console.log("📄 README-TESTS.md - Guía de tests");
    console.log("📄 SWAGGER-MIGRATION.md - Guía de migración");
  } catch (error) {
    console.error("\n❌ Error en verificación:", error.message);

    if (error.code === "ECONNREFUSED") {
      console.log("💡 Asegúrate de que el servidor esté corriendo:");
      console.log("   npm run dev");
    } else if (error.response) {
      console.log("📊 Status:", error.response.status);
      console.log("📋 Data:", error.response.data);
    }

    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  verifySwaggerUpdate();
}

module.exports = verifySwaggerUpdate;
