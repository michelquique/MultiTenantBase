require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Modelos
const Tenant = require("../models/Tenant");
const User = require("../models/User");
const Complaint = require("../models/Complaint");

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
      await Complaint.deleteMany({});
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

    // Crear denuncias de ejemplo para el primer tenant
    const complaints = [
      {
        tenant_id: tenant._id,
        complainant_id: createdUsers[3]._id, // María Rodríguez (Empleado)
        accused_id: createdUsers[1]._id, // Ana García (RRHH)
        type: "psychological",
        severity: "medium",
        title: "Acoso psicológico por supervisor",
        description:
          "Mi supervisor ha estado haciendo comentarios despectivos sobre mi trabajo y presionándome constantemente para que renuncie. Esto ha estado ocurriendo durante los últimos 3 meses.",
        location: "Oficina 3er piso, área de ventas",
        incident_date: new Date("2024-06-15T10:30:00.000Z"),
        status: "submitted",
        priority: "normal",
        is_confidential: true,
      },
      {
        tenant_id: tenant._id,
        complainant_id: createdUsers[4]._id, // Juan Pérez (Empleado)
        accused_id: createdUsers[2]._id, // Carlos López (Investigador)
        type: "discrimination",
        severity: "high",
        title: "Discriminación por edad en el trabajo",
        description:
          "He sido excluido de proyectos importantes y reuniones clave debido a mi edad. Los comentarios sobre mi 'falta de energía' y 'poca adaptabilidad a las nuevas tecnologías' son constantes.",
        location: "Sala de reuniones, 2do piso",
        incident_date: new Date("2024-06-10T14:00:00.000Z"),
        status: "under_review",
        priority: "high",
        is_confidential: true,
      },
      {
        tenant_id: tenant._id,
        complainant_id: createdUsers[1]._id, // Ana García (RRHH)
        accused_id: createdUsers[0]._id, // Admin Sistema (Tenant Admin)
        type: "sexual",
        severity: "critical",
        title: "Acoso sexual en el trabajo",
        description:
          "He recibido comentarios inapropiados y propuestas sexuales no deseadas por parte de un ejecutivo. También ha habido contacto físico no consentido en varias ocasiones.",
        location: "Oficina ejecutiva, 4to piso",
        incident_date: new Date("2024-06-05T16:00:00.000Z"),
        status: "investigating",
        priority: "urgent",
        is_confidential: true,
        assigned_to: createdUsers[2]._id, // Carlos López como investigador
        assigned_at: new Date("2024-06-06T09:00:00.000Z"),
      },
    ];

    // Crear denuncias
    for (const complaintData of complaints) {
      const complaint = await Complaint.create(complaintData);
      logger.info(`Denuncia creada: ${complaint.title} (${complaint.status})`);
    }

    logger.info("=== DATOS DE PRUEBA CREADOS ===");
    logger.info("Tenant 1: Empresa Demo S.A. (RUT: 76.123.456-7)");
    logger.info("- admin@empresademo.cl / Admin123! (Tenant Admin)");
    logger.info("- ana.garcia@empresademo.cl / Password123! (RRHH)");
    logger.info("- carlos.lopez@empresademo.cl / Password123! (Investigador)");
    logger.info("- maria.rodriguez@empresademo.cl / Password123! (Empleado)");
    logger.info("- juan.perez@empresademo.cl / Password123! (Empleado)");
    logger.info("");
    logger.info("Denuncias de ejemplo creadas:");
    logger.info("- Acoso psicológico por supervisor (submitted)");
    logger.info("- Discriminación por edad en el trabajo (under_review)");
    logger.info("- Acoso sexual en el trabajo (investigating)");
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
