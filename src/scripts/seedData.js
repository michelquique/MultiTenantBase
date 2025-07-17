require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Modelos
const Tenant = require("../models/Tenant");
const User = require("../models/User");
const Complaint = require("../models/Complaint");
const Investigation = require("../models/Investigation");

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
      await Investigation.deleteMany({});
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
      {
        tenant_id: tenant._id,
        first_name: "Laura",
        last_name: "Martínez",
        email: "laura.martinez@empresademo.cl",
        password_hash: "Password123!",
        role: "Investigador",
        department: "Legal",
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
        status: "investigating",
        priority: "normal",
        is_confidential: true,
        assigned_to: createdUsers[2]._id, // Carlos López como investigador
        assigned_at: new Date("2024-06-16T09:00:00.000Z"),
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
        status: "investigating",
        priority: "high",
        is_confidential: true,
        assigned_to: createdUsers[5]._id, // Laura Martínez como investigadora
        assigned_at: new Date("2024-06-11T10:00:00.000Z"),
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
        status: "submitted",
        priority: "urgent",
        is_confidential: true,
      },
      {
        tenant_id: tenant._id,
        complainant_id: createdUsers[4]._id, // Juan Pérez (Empleado)
        accused_id: createdUsers[3]._id, // María Rodríguez (Empleado)
        type: "other",
        severity: "high",
        title: "Amenazas verbales en el lugar de trabajo",
        description:
          "Durante una discusión sobre un proyecto, recibí amenazas verbales explícitas. La situación escaló y temo por mi seguridad en el lugar de trabajo.",
        location: "Oficina compartida, 2do piso",
        incident_date: new Date("2024-06-20T11:00:00.000Z"),
        status: "under_review",
        priority: "high",
        is_confidential: false,
      },
    ];

    // Crear denuncias
    const createdComplaints = [];
    for (const complaintData of complaints) {
      const complaint = await Complaint.create(complaintData);
      createdComplaints.push(complaint);
      logger.info(`Denuncia creada: ${complaint.title} (${complaint.status})`);
    }

    // Crear investigaciones de ejemplo
    const investigations = [
      {
        tenant_id: tenant._id,
        complaint_id: createdComplaints[0]._id, // Acoso psicológico
        investigator_id: createdUsers[2]._id, // Carlos López
        assigned_by: createdUsers[1]._id, // Ana García
        status: "analysis",
        priority: "normal",
        estimated_completion_date: new Date(
          Date.now() + 15 * 24 * 60 * 60 * 1000
        ), // 15 días
        investigation_type: "formal",
        methodology: "mixed",
        scope:
          "Investigación completa del caso de acoso psicológico reportado, incluyendo entrevistas con testigos, revisión de comunicaciones y evaluación del ambiente laboral en el área de ventas.",
        objectives: [
          "Determinar la veracidad de las alegaciones de acoso psicológico",
          "Identificar patrones de comportamiento problemático",
          "Evaluar el impacto en el ambiente laboral",
          "Proponer medidas correctivas y preventivas",
        ],
        confidentiality_level: "confidential",
        timeline: [
          {
            action: "created",
            user_id: createdUsers[1]._id,
            timestamp: new Date("2024-06-16T09:00:00.000Z"),
            notes: "Investigación creada",
          },
          {
            action: "assigned",
            user_id: createdUsers[1]._id,
            timestamp: new Date("2024-06-16T09:15:00.000Z"),
            notes: "Investigación asignada a Carlos López",
          },
          {
            action: "started",
            user_id: createdUsers[2]._id,
            timestamp: new Date("2024-06-16T10:00:00.000Z"),
            notes: "Investigación iniciada - revisión inicial de la denuncia",
          },
          {
            action: "evidence_collected",
            user_id: createdUsers[2]._id,
            timestamp: new Date("2024-06-17T14:00:00.000Z"),
            notes: "Recolección de evidencia documental",
          },
          {
            action: "interview_conducted",
            user_id: createdUsers[2]._id,
            timestamp: new Date("2024-06-18T10:00:00.000Z"),
            notes: "Entrevista con denunciante completada",
          },
          {
            action: "status_changed",
            user_id: createdUsers[2]._id,
            timestamp: new Date("2024-06-19T16:00:00.000Z"),
            notes: "Estado cambiado a análisis",
            previous_status: "evidence_review",
            new_status: "analysis",
          },
        ],
        evidence: [
          {
            type: "document",
            title: "Emails de comunicación con supervisor",
            description:
              "Cadena de emails que muestran el tono y contenido de las comunicaciones entre el denunciante y el supervisor",
            filename: "emails_comunicacion.pdf",
            source: "Sistema de email corporativo",
            collected_date: new Date("2024-06-17T14:00:00.000Z"),
            collected_by: createdUsers[2]._id,
            relevance: "high",
            chain_of_custody: [
              {
                user_id: createdUsers[2]._id,
                action: "collected",
                timestamp: new Date("2024-06-17T14:00:00.000Z"),
                notes: "Evidencia obtenida del sistema de email",
              },
              {
                user_id: createdUsers[2]._id,
                action: "analyzed",
                timestamp: new Date("2024-06-19T10:00:00.000Z"),
                notes: "Análisis de contenido y tono de las comunicaciones",
              },
            ],
          },
          {
            type: "document",
            title: "Registro de asistencia y horarios",
            description:
              "Datos de asistencia que muestran patrones de comportamiento laboral",
            filename: "registro_asistencia.xlsx",
            source: "Sistema de control de asistencia",
            collected_date: new Date("2024-06-17T15:30:00.000Z"),
            collected_by: createdUsers[2]._id,
            relevance: "medium",
            chain_of_custody: [
              {
                user_id: createdUsers[2]._id,
                action: "collected",
                timestamp: new Date("2024-06-17T15:30:00.000Z"),
                notes: "Datos obtenidos del sistema de RRHH",
              },
            ],
          },
        ],
        interviews: [
          {
            interviewee_id: createdUsers[3]._id, // María Rodríguez (denunciante)
            interviewer_id: createdUsers[2]._id, // Carlos López
            interview_date: new Date("2024-06-18T10:00:00.000Z"),
            duration_minutes: 60,
            location: "Sala de reuniones confidencial",
            type: "complainant",
            summary:
              "La denunciante relató en detalle los incidentes de acoso psicológico. Mostró evidencia de estrés y ansiedad relacionados con la situación laboral. Proporcionó fechas específicas y describió el impacto en su rendimiento y bienestar.",
            key_points: [
              "Confirmó múltiples incidentes de comentarios despectivos",
              "Proporcionó fechas específicas de incidentes",
              "Describió impacto en su salud mental y rendimiento",
              "Mencionó testigos potenciales",
            ],
            follow_up_required: true,
            follow_up_notes: "Programar entrevista con testigos mencionados",
            conducted_by: createdUsers[2]._id,
          },
          {
            interviewee_id: createdUsers[4]._id, // Juan Pérez (testigo)
            interviewer_id: createdUsers[2]._id, // Carlos López
            interview_date: new Date("2024-06-19T11:00:00.000Z"),
            duration_minutes: 30,
            location: "Sala de reuniones confidencial",
            type: "witness",
            summary:
              "El testigo confirmó haber presenciado varios incidentes donde el supervisor hizo comentarios inapropiados. Describió un ambiente laboral tenso y confirmó cambios en el comportamiento del denunciante.",
            key_points: [
              "Confirmó presenciar comentarios inapropiados",
              "Describió ambiente laboral tenso",
              "Notó cambios en comportamiento de la denunciante",
              "Proporcionó contexto adicional sobre dinámicas de equipo",
            ],
            follow_up_required: false,
            conducted_by: createdUsers[2]._id,
          },
        ],
        findings: [
          {
            category: "behavioral",
            description:
              "Se identificó un patrón de comportamiento supervisor-subordinado problemático que incluye comentarios despectivos, presión excesiva y falta de respeto hacia el empleado.",
            severity: "high",
            supporting_evidence: [],
            recommendations: [
              "Capacitación en liderazgo y comunicación efectiva",
              "Implementar programa de supervisión de supervisores",
              "Establecer protocolo de retroalimentación constructiva",
            ],
            documented_by: createdUsers[2]._id,
            documented_at: new Date("2024-06-19T16:00:00.000Z"),
          },
          {
            category: "policy_violation",
            description:
              "Las acciones documentadas constituyen una violación a las políticas de respeto y convivencia laboral establecidas en el manual de empleados.",
            severity: "medium",
            supporting_evidence: [],
            recommendations: [
              "Revisión y refuerzo de políticas de convivencia",
              "Capacitación obligatoria en políticas de respeto laboral",
            ],
            documented_by: createdUsers[2]._id,
            documented_at: new Date("2024-06-19T16:30:00.000Z"),
          },
        ],
        notes:
          "Investigación en progreso. Se han identificado elementos que confirman aspectos de la denuncia. Pendiente completar análisis final y preparar recomendaciones.",
      },
      {
        tenant_id: tenant._id,
        complaint_id: createdComplaints[1]._id, // Discriminación por edad
        investigator_id: createdUsers[5]._id, // Laura Martínez
        assigned_by: createdUsers[1]._id, // Ana García
        status: "completed",
        priority: "high",
        estimated_completion_date: new Date("2024-06-25T23:59:59.000Z"),
        actual_completion_date: new Date("2024-06-24T15:30:00.000Z"),
        investigation_type: "formal",
        methodology: "interviews",
        scope:
          "Investigación de alegaciones de discriminación por edad en asignación de proyectos y oportunidades laborales.",
        objectives: [
          "Evaluar si existe discriminación por edad en el lugar de trabajo",
          "Revisar procesos de asignación de proyectos y oportunidades",
          "Determinar si las políticas de igualdad están siendo aplicadas correctamente",
        ],
        confidentiality_level: "confidential",
        timeline: [
          {
            action: "created",
            user_id: createdUsers[1]._id,
            timestamp: new Date("2024-06-11T10:00:00.000Z"),
            notes: "Investigación creada",
          },
          {
            action: "assigned",
            user_id: createdUsers[1]._id,
            timestamp: new Date("2024-06-11T10:15:00.000Z"),
            notes: "Investigación asignada a Laura Martínez",
          },
          {
            action: "started",
            user_id: createdUsers[5]._id,
            timestamp: new Date("2024-06-11T11:00:00.000Z"),
            notes: "Investigación iniciada - análisis de la denuncia",
          },
          {
            action: "completed",
            user_id: createdUsers[5]._id,
            timestamp: new Date("2024-06-24T15:30:00.000Z"),
            notes: "Investigación completada con recomendaciones",
          },
        ],
        evidence: [
          {
            type: "document",
            title: "Historial de asignación de proyectos",
            description:
              "Registro de asignación de proyectos durante los últimos 2 años",
            filename: "historial_proyectos.xlsx",
            source: "Sistema de gestión de proyectos",
            collected_date: new Date("2024-06-12T09:00:00.000Z"),
            collected_by: createdUsers[5]._id,
            relevance: "high",
            chain_of_custody: [
              {
                user_id: createdUsers[5]._id,
                action: "collected",
                timestamp: new Date("2024-06-12T09:00:00.000Z"),
                notes: "Datos obtenidos del sistema de proyectos",
              },
              {
                user_id: createdUsers[5]._id,
                action: "analyzed",
                timestamp: new Date("2024-06-20T14:00:00.000Z"),
                notes: "Análisis estadístico de patrones de asignación",
              },
            ],
          },
        ],
        interviews: [
          {
            interviewee_id: createdUsers[4]._id, // Juan Pérez (denunciante)
            interviewer_id: createdUsers[5]._id, // Laura Martínez
            interview_date: new Date("2024-06-13T14:00:00.000Z"),
            duration_minutes: 45,
            location: "Oficina de investigación",
            type: "complainant",
            summary:
              "El denunciante proporcionó ejemplos específicos de exclusión de proyectos y comentarios discriminatorios. Mostró documentación de proyectos en los que no fue incluido sin justificación clara.",
            key_points: [
              "Proporcionó ejemplos específicos de exclusión",
              "Documentó comentarios discriminatorios",
              "Mostró impacto en desarrollo profesional",
              "Identificó otros posibles casos similares",
            ],
            follow_up_required: false,
            conducted_by: createdUsers[5]._id,
          },
        ],
        findings: [
          {
            category: "policy_violation",
            description:
              "Se identificó una violación sistemática de las políticas de igualdad de oportunidades. Los criterios de selección para proyectos no fueron aplicados consistentemente.",
            severity: "high",
            supporting_evidence: [],
            recommendations: [
              "Revisión completa de políticas de igualdad",
              "Capacitación en diversidad e inclusión",
              "Implementar sistema de monitoreo de asignaciones",
            ],
            documented_by: createdUsers[5]._id,
            documented_at: new Date("2024-06-22T10:00:00.000Z"),
          },
        ],
        conclusion: {
          outcome: "substantiated",
          summary:
            "La investigación determinó que existió discriminación por edad en la asignación de proyectos y oportunidades laborales. Se identificaron patrones sistemáticos de exclusión basados en edad y comentarios discriminatorios documentados.",
          recommendations: [
            {
              type: "policy",
              description:
                "Revisar y actualizar políticas de igualdad de oportunidades para incluir protecciones específicas contra discriminación por edad",
              priority: "high",
              assigned_to: createdUsers[1]._id,
              due_date: new Date("2024-07-24T23:59:59.000Z"),
              status: "pending",
            },
            {
              type: "training",
              description:
                "Implementar programa de capacitación obligatoria en diversidad, inclusión y prevención de discriminación para todos los supervisores",
              priority: "high",
              assigned_to: createdUsers[1]._id,
              due_date: new Date("2024-08-15T23:59:59.000Z"),
              status: "pending",
            },
            {
              type: "procedural",
              description:
                "Establecer sistema de monitoreo y auditoría para asignación de proyectos y oportunidades laborales",
              priority: "medium",
              assigned_to: createdUsers[0]._id,
              due_date: new Date("2024-09-01T23:59:59.000Z"),
              status: "pending",
            },
          ],
          completed_by: createdUsers[5]._id,
          completed_at: new Date("2024-06-24T15:30:00.000Z"),
        },
        notes:
          "Investigación completada exitosamente. Se confirmó discriminación por edad y se proporcionaron recomendaciones específicas para prevenir futuros casos.",
      },
    ];

    // Crear investigaciones
    for (const investigationData of investigations) {
      const investigation = await Investigation.create(investigationData);
      logger.info(
        `Investigación creada: ${investigation._id} (${investigation.status})`
      );
    }

    logger.info("=== DATOS DE PRUEBA CREADOS ===");
    logger.info("Tenant 1: Empresa Demo S.A. (RUT: 76.123.456-7)");
    logger.info("- admin@empresademo.cl / Admin123! (Tenant Admin)");
    logger.info("- ana.garcia@empresademo.cl / Password123! (RRHH)");
    logger.info("- carlos.lopez@empresademo.cl / Password123! (Investigador)");
    logger.info("- maria.rodriguez@empresademo.cl / Password123! (Empleado)");
    logger.info("- juan.perez@empresademo.cl / Password123! (Empleado)");
    logger.info(
      "- laura.martinez@empresademo.cl / Password123! (Investigador)"
    );
    logger.info("");
    logger.info("Denuncias de ejemplo creadas:");
    logger.info("- Acoso psicológico por supervisor (investigating)");
    logger.info("- Discriminación por edad en el trabajo (investigating)");
    logger.info("- Acoso sexual en el trabajo (submitted)");
    logger.info("- Amenazas verbales en el lugar de trabajo (under_review)");
    logger.info("");
    logger.info("Investigaciones de ejemplo creadas:");
    logger.info(
      "- Investigación de acoso psicológico (analysis) - Carlos López"
    );
    logger.info(
      "- Investigación de discriminación por edad (completed) - Laura Martínez"
    );
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
