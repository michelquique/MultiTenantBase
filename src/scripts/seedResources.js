const mongoose = require("mongoose");
require("dotenv").config();
const Resource = require("../models/Resource");
const Tenant = require("../models/Tenant");
const logger = require("../config/logger");

// Datos iniciales de recursos
const resourcesData = [
  // Tipos de denuncias
  {
    category: "complaint_types",
    key: "sexual",
    label: "Acoso Sexual",
    description:
      "Denuncias relacionadas con acoso sexual en el lugar de trabajo",
    sort_order: 1,
  },
  {
    category: "complaint_types",
    key: "psychological",
    label: "Acoso Psicológico",
    description: "Denuncias relacionadas con acoso psicológico o mobbing",
    sort_order: 2,
  },
  {
    category: "complaint_types",
    key: "discrimination",
    label: "Discriminación",
    description: "Denuncias por discriminación por género, raza, edad, etc.",
    sort_order: 3,
  },
  {
    category: "complaint_types",
    key: "other",
    label: "Otro",
    description: "Otros tipos de denuncias no clasificadas",
    sort_order: 4,
  },

  // Niveles de severidad
  {
    category: "complaint_severity",
    key: "low",
    label: "Baja",
    description: "Incidentes menores que requieren atención básica",
    sort_order: 1,
    metadata: { color: "#28a745", priority_weight: 1 },
  },
  {
    category: "complaint_severity",
    key: "medium",
    label: "Media",
    description: "Incidentes moderados que requieren atención oportuna",
    sort_order: 2,
    metadata: { color: "#ffc107", priority_weight: 2 },
  },
  {
    category: "complaint_severity",
    key: "high",
    label: "Alta",
    description: "Incidentes graves que requieren atención inmediata",
    sort_order: 3,
    metadata: { color: "#fd7e14", priority_weight: 3 },
  },
  {
    category: "complaint_severity",
    key: "critical",
    label: "Crítica",
    description: "Incidentes críticos que requieren acción urgente",
    sort_order: 4,
    metadata: { color: "#dc3545", priority_weight: 4 },
  },

  // Prioridades
  {
    category: "complaint_priority",
    key: "low",
    label: "Baja",
    description: "Prioridad baja - puede esperar",
    sort_order: 1,
    metadata: { color: "#6c757d", urgency_hours: 168 },
  },
  {
    category: "complaint_priority",
    key: "normal",
    label: "Normal",
    description: "Prioridad normal - atención estándar",
    sort_order: 2,
    metadata: { color: "#17a2b8", urgency_hours: 72 },
  },
  {
    category: "complaint_priority",
    key: "high",
    label: "Alta",
    description: "Prioridad alta - requiere atención rápida",
    sort_order: 3,
    metadata: { color: "#fd7e14", urgency_hours: 24 },
  },
  {
    category: "complaint_priority",
    key: "urgent",
    label: "Urgente",
    description: "Prioridad urgente - requiere atención inmediata",
    sort_order: 4,
    metadata: { color: "#dc3545", urgency_hours: 4 },
  },

  // Estados de denuncias
  {
    category: "complaint_status",
    key: "draft",
    label: "Borrador",
    description: "Denuncia en proceso de creación",
    sort_order: 1,
    metadata: { is_initial: true, color: "#6c757d" },
  },
  {
    category: "complaint_status",
    key: "submitted",
    label: "Enviada",
    description: "Denuncia enviada y pendiente de revisión",
    sort_order: 2,
    metadata: { color: "#17a2b8" },
  },
  {
    category: "complaint_status",
    key: "under_review",
    label: "En Revisión",
    description: "Denuncia siendo revisada por el equipo",
    sort_order: 3,
    metadata: { color: "#ffc107" },
  },
  {
    category: "complaint_status",
    key: "investigating",
    label: "Investigando",
    description: "Denuncia en proceso de investigación",
    sort_order: 4,
    metadata: { color: "#fd7e14" },
  },
  {
    category: "complaint_status",
    key: "resolved",
    label: "Resuelta",
    description: "Denuncia resuelta con conclusiones",
    sort_order: 5,
    metadata: { is_final: true, color: "#28a745" },
  },
  {
    category: "complaint_status",
    key: "closed",
    label: "Cerrada",
    description: "Denuncia cerrada sin resolución",
    sort_order: 6,
    metadata: { is_final: true, color: "#6c757d" },
  },

  // Roles de usuario
  {
    category: "user_roles",
    key: "Empleado",
    label: "Empleado",
    description: "Empleado regular de la organización",
    sort_order: 1,
    metadata: { permissions: ["create_complaint", "view_own_complaints"] },
  },
  {
    category: "user_roles",
    key: "RRHH",
    label: "Recursos Humanos",
    description: "Personal de Recursos Humanos",
    sort_order: 2,
    metadata: {
      permissions: ["view_all_complaints", "assign_complaints", "manage_users"],
    },
  },
  {
    category: "user_roles",
    key: "Investigador",
    label: "Investigador",
    description: "Investigador de denuncias",
    sort_order: 3,
    metadata: {
      permissions: [
        "investigate_complaints",
        "update_complaints",
        "add_evidence",
      ],
    },
  },
  {
    category: "user_roles",
    key: "Tenant Admin",
    label: "Administrador",
    description: "Administrador del tenant",
    sort_order: 4,
    metadata: {
      permissions: [
        "full_access",
        "manage_resources",
        "manage_users",
        "view_analytics",
      ],
    },
  },

  // Tipos de evidencia
  {
    category: "evidence_types",
    key: "document",
    label: "Documento",
    description: "Documentos de texto, PDFs, etc.",
    sort_order: 1,
    metadata: {
      allowed_extensions: [".pdf", ".doc", ".docx", ".txt"],
      max_size_mb: 10,
    },
  },
  {
    category: "evidence_types",
    key: "image",
    label: "Imagen",
    description: "Fotografías y capturas de pantalla",
    sort_order: 2,
    metadata: {
      allowed_extensions: [".jpg", ".jpeg", ".png", ".gif"],
      max_size_mb: 5,
    },
  },
  {
    category: "evidence_types",
    key: "video",
    label: "Video",
    description: "Grabaciones de video",
    sort_order: 3,
    metadata: { allowed_extensions: [".mp4", ".avi", ".mov"], max_size_mb: 50 },
  },
  {
    category: "evidence_types",
    key: "audio",
    label: "Audio",
    description: "Grabaciones de audio",
    sort_order: 4,
    metadata: { allowed_extensions: [".mp3", ".wav", ".m4a"], max_size_mb: 20 },
  },

  // Resultados de resolución
  {
    category: "resolution_outcomes",
    key: "founded",
    label: "Fundada",
    description: "La denuncia tiene fundamentos válidos",
    sort_order: 1,
    metadata: { requires_actions: true, color: "#dc3545" },
  },
  {
    category: "resolution_outcomes",
    key: "unfounded",
    label: "Infundada",
    description: "La denuncia no tiene fundamentos válidos",
    sort_order: 2,
    metadata: { requires_actions: false, color: "#28a745" },
  },
  {
    category: "resolution_outcomes",
    key: "partially_founded",
    label: "Parcialmente Fundada",
    description: "La denuncia tiene algunos fundamentos válidos",
    sort_order: 3,
    metadata: { requires_actions: true, color: "#ffc107" },
  },
  {
    category: "resolution_outcomes",
    key: "insufficient_evidence",
    label: "Evidencia Insuficiente",
    description: "No hay suficiente evidencia para determinar el resultado",
    sort_order: 4,
    metadata: { requires_actions: false, color: "#6c757d" },
  },

  // Acciones del timeline
  {
    category: "timeline_actions",
    key: "created",
    label: "Creada",
    description: "Denuncia creada",
    sort_order: 1,
    metadata: { icon: "plus", color: "#28a745" },
  },
  {
    category: "timeline_actions",
    key: "submitted",
    label: "Enviada",
    description: "Denuncia enviada para revisión",
    sort_order: 2,
    metadata: { icon: "send", color: "#17a2b8" },
  },
  {
    category: "timeline_actions",
    key: "assigned",
    label: "Asignada",
    description: "Denuncia asignada a investigador",
    sort_order: 3,
    metadata: { icon: "user", color: "#ffc107" },
  },
  {
    category: "timeline_actions",
    key: "investigation_started",
    label: "Investigación Iniciada",
    description: "Se inició la investigación",
    sort_order: 4,
    metadata: { icon: "search", color: "#fd7e14" },
  },
  {
    category: "timeline_actions",
    key: "evidence_added",
    label: "Evidencia Agregada",
    description: "Se agregó nueva evidencia",
    sort_order: 5,
    metadata: { icon: "paperclip", color: "#6f42c1" },
  },
  {
    category: "timeline_actions",
    key: "status_changed",
    label: "Estado Cambiado",
    description: "Se cambió el estado de la denuncia",
    sort_order: 6,
    metadata: { icon: "refresh", color: "#20c997" },
  },
  {
    category: "timeline_actions",
    key: "resolved",
    label: "Resuelta",
    description: "Denuncia resuelta",
    sort_order: 7,
    metadata: { icon: "check", color: "#28a745" },
  },
  {
    category: "timeline_actions",
    key: "closed",
    label: "Cerrada",
    description: "Denuncia cerrada",
    sort_order: 8,
    metadata: { icon: "x", color: "#6c757d" },
  },
];

const seedResources = async () => {
  try {
    // Conectar a la base de datos
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info("🔗 Conectado a MongoDB para seed de recursos");

    // Obtener todos los tenants
    const tenants = await Tenant.find({});

    if (tenants.length === 0) {
      logger.warn(
        "⚠️ No se encontraron tenants. Ejecuta primero el seed de tenants."
      );
      return;
    }

    logger.info(
      `📊 Encontrados ${tenants.length} tenants para poblar recursos`
    );

    // Eliminar recursos existentes (opcional - comentar si quieres mantener datos existentes)
    await Resource.deleteMany({});
    logger.info("🗑️ Recursos existentes eliminados");

    let totalCreated = 0;

    // Crear recursos para cada tenant
    for (const tenant of tenants) {
      logger.info(
        `📝 Creando recursos para tenant: ${tenant.name} (${tenant._id})`
      );

      const tenantResources = resourcesData.map((resource) => ({
        ...resource,
        tenant_id: tenant._id,
      }));

      try {
        await Resource.insertMany(tenantResources);
        totalCreated += tenantResources.length;
        logger.info(
          `✅ ${tenantResources.length} recursos creados para ${tenant.name}`
        );
      } catch (error) {
        logger.error(
          `❌ Error creando recursos para ${tenant.name}:`,
          error.message
        );
      }
    }

    logger.info(
      `🎉 Seed completado: ${totalCreated} recursos creados en total`
    );

    // Mostrar resumen por categoría
    const summary = await Resource.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          tenants: { $addToSet: "$tenant_id" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    logger.info("\n📋 Resumen por categoría:");
    summary.forEach((item) => {
      logger.info(
        `  ${item._id}: ${item.count} recursos (${item.tenants.length} tenants)`
      );
    });
  } catch (error) {
    logger.error("❌ Error durante el seed de recursos:", error);
  } finally {
    await mongoose.connection.close();
    logger.info("🔌 Conexión cerrada");
    process.exit(0);
  }
};

// Ejecutar el seed si el archivo se ejecuta directamente
if (require.main === module) {
  seedResources();
}

module.exports = { seedResources, resourcesData };
