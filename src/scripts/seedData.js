require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Modelos
const Tenant = require("../models/Tenant");
const User = require("../models/User");

// Logger
const logger = require("../config/logger");

/**
 * Datos de ejemplo para testing
 */
const seedData = async () => {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info("Conectado a MongoDB para seeding");

    // Limpiar datos existentes (solo en desarrollo)
    if (process.env.NODE_ENV === "development") {
      await User.deleteMany({});
      await Tenant.deleteMany({});
      logger.info("Datos existentes eliminados");
    }

    // Crear tenant de prueba
    const tenantData = {
      name: "Empresa Demo S.A.",
      rut: "76.123.456-7",
      address: "Av. Providencia 1234, Santiago",
      phone: "+56912345678",
      email: "contacto@empresademo.cl",
      subscription_plan: {
        type: "Premium",
        start_date: new Date(),
        end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 año
        status: "active",
      },
      branding: {
        logo_url: "https://placehold.co/200x50/0056b3/fff?text=Demo+Corp",
        primary_color: "#0056b3",
        secondary_color: "#4CAF50",
      },
      licenses: {
        total: 100,
        in_use: 0,
      },
      status: "active",
    };

    const tenant = await Tenant.create(tenantData);
    logger.info(`Tenant creado: ${tenant.name}`);

    // Crear usuarios de prueba
    const users = [
      {
        tenant_id: tenant._id,
        first_name: "Admin",
        last_name: "Sistema",
        email: "admin@empresademo.cl",
        password_hash: "Admin123!",
        role: "Tenant Admin",
        department: "Administración",
        is_active: true,
      },
      {
        tenant_id: tenant._id,
        first_name: "Ana",
        last_name: "García",
        email: "ana.garcia@empresademo.cl",
        password_hash: "Password123!",
        role: "RRHH",
        department: "Recursos Humanos",
        is_active: true,
      },
      {
        tenant_id: tenant._id,
        first_name: "Carlos",
        last_name: "López",
        email: "carlos.lopez@empresademo.cl",
        password_hash: "Password123!",
        role: "Investigador",
        department: "Legal",
        is_active: true,
      },
      {
        tenant_id: tenant._id,
        first_name: "María",
        last_name: "Rodríguez",
        email: "maria.rodriguez@empresademo.cl",
        password_hash: "Password123!",
        role: "Empleado",
        department: "Ventas",
        is_active: true,
      },
      {
        tenant_id: tenant._id,
        first_name: "Juan",
        last_name: "Pérez",
        email: "juan.perez@empresademo.cl",
        password_hash: "Password123!",
        role: "Empleado",
        department: "Marketing",
        is_active: true,
      },
    ];

    // Crear usuarios uno por uno para que se ejecute el middleware de hash
    const createdUsers = [];
    for (const userData of users) {
      const user = await User.create(userData);
      createdUsers.push(user);

      // Actualizar contador de licencias del tenant
      await tenant.updateLicenseUsage(true);

      logger.info(`Usuario creado: ${user.email} (${user.role})`);
    }

    // Crear segundo tenant para testing multi-tenant
    const tenant2Data = {
      name: "Otra Empresa Ltda.",
      rut: "77.987.654-3",
      address: "Av. Las Condes 567, Santiago",
      phone: "+56987654321",
      email: "contacto@otraempresa.cl",
      subscription_plan: {
        type: "Standard",
        start_date: new Date(),
        end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        status: "active",
      },
      licenses: {
        total: 50,
        in_use: 0,
      },
      status: "active",
    };

    const tenant2 = await Tenant.create(tenant2Data);
    logger.info(`Segundo tenant creado: ${tenant2.name}`);

    // Usuario admin para el segundo tenant
    const admin2 = await User.create({
      tenant_id: tenant2._id,
      first_name: "Super",
      last_name: "Admin",
      email: "admin@otraempresa.cl",
      password_hash: "Admin123!",
      role: "Tenant Admin",
      department: "Administración",
      is_active: true,
    });

    await tenant2.updateLicenseUsage(true);
    logger.info(`Usuario creado para segundo tenant: ${admin2.email}`);

    logger.info("=== DATOS DE PRUEBA CREADOS ===");
    logger.info("Tenant 1: Empresa Demo S.A. (RUT: 76.123.456-7)");
    logger.info("- admin@empresademo.cl / Admin123! (Tenant Admin)");
    logger.info("- ana.garcia@empresademo.cl / Password123! (RRHH)");
    logger.info("- carlos.lopez@empresademo.cl / Password123! (Investigador)");
    logger.info("- maria.rodriguez@empresademo.cl / Password123! (Empleado)");
    logger.info("- juan.perez@empresademo.cl / Password123! (Empleado)");
    logger.info("");
    logger.info("Tenant 2: Otra Empresa Ltda. (RUT: 77.987.654-3)");
    logger.info("- admin@otraempresa.cl / Admin123! (Tenant Admin)");
    logger.info("================================");
  } catch (error) {
    logger.error("Error en seeding:", error);
  } finally {
    await mongoose.connection.close();
    logger.info("Conexión cerrada");
    process.exit(0);
  }
};

// Ejecutar si es llamado directamente
if (require.main === module) {
  seedData();
}

module.exports = seedData;
