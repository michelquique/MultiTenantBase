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
 * Datos de ejemplo para testing - Tenant Aureolab
 */
const seedDataAureolab = async () => {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info("Conectado a MongoDB para seeding - Aureolab");

    // Validar entorno para evitar ejecución en producción
    if (process.env.NODE_ENV === "production") {
      throw new Error("No ejecutar seed en producción");
    }

    // Verificar conexión antes de proceder
    if (mongoose.connection.readyState !== 1) {
      throw new Error("No hay conexión a MongoDB");
    }

    // Crear tenant Aureolab
    const tenantData = {
      name: "Aureolab Innovación S.A.",
      slug: "aureolab",
      rut: "78.555.123-4",
      address: "Av. Vitacura 2939, Las Condes, Santiago",
      phone: "+56223456789",
      email: "contacto@aureolab.cl",
      subscription_plan: {
        type: "Premium",
        start_date: new Date(),
        end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 año
        status: "active",
      },
      branding: {
        logo_url: "https://placehold.co/200x50/4A90E2/fff?text=Aureolab",
        primary_color: "#4A90E2",
        secondary_color: "#F5A623",
      },
      licenses: {
        total: 200,
        in_use: 0,
      },
      status: "active",
    };

    let tenant;
    try {
      // Verificar si el tenant ya existe
      const existingTenant = await Tenant.findOne({ slug: "aureolab" });
      if (existingTenant) {
        logger.info(
          "Tenant Aureolab ya existe, limpiando datos relacionados..."
        );

        // Limpiar datos existentes del tenant
        await Investigation.deleteMany({ tenant_id: existingTenant._id });
        await Complaint.deleteMany({ tenant_id: existingTenant._id });
        await User.deleteMany({ tenant_id: existingTenant._id });

        // Resetear contador de licencias
        existingTenant.licenses.in_use = 0;
        await existingTenant.save();

        tenant = existingTenant;
        logger.info("Datos del tenant Aureolab limpiados");
      } else {
        tenant = await Tenant.create(tenantData);
        logger.info(`Tenant creado: ${tenant.name}`);
      }
    } catch (error) {
      logger.error(`Error creando/actualizando tenant: ${error.message}`);
      throw error;
    }

    // Crear usuarios de prueba para Aureolab
    const users = [
      {
        tenant_id: tenant._id,
        first_name: "Sofia",
        last_name: "Directora",
        email: "directora@aureolab.cl",
        password_hash: "Admin123!",
        role: "Tenant Admin",
        department: "Dirección General",
        is_active: true,
      },
      {
        tenant_id: tenant._id,
        first_name: "Diego",
        last_name: "Morales",
        email: "diego.morales@aureolab.cl",
        password_hash: "Password123!",
        role: "RRHH",
        department: "Recursos Humanos",
        is_active: true,
      },
      {
        tenant_id: tenant._id,
        first_name: "Elena",
        last_name: "Investigadora",
        email: "elena.investigadora@aureolab.cl",
        password_hash: "Password123!",
        role: "Investigador",
        department: "Compliance",
        is_active: true,
      },
      {
        tenant_id: tenant._id,
        first_name: "Roberto",
        last_name: "Desarrollador",
        email: "roberto.dev@aureolab.cl",
        password_hash: "Password123!",
        role: "Empleado",
        department: "Tecnología",
        is_active: true,
      },
      {
        tenant_id: tenant._id,
        first_name: "Carmen",
        last_name: "Diseñadora",
        email: "carmen.design@aureolab.cl",
        password_hash: "Password123!",
        role: "Empleado",
        department: "Diseño UX/UI",
        is_active: true,
      },
      {
        tenant_id: tenant._id,
        first_name: "Fernando",
        last_name: "Analista",
        email: "fernando.analista@aureolab.cl",
        password_hash: "Password123!",
        role: "Investigador",
        department: "Compliance",
        is_active: true,
      },
      {
        tenant_id: tenant._id,
        first_name: "Patricia",
        last_name: "Marketing",
        email: "patricia.marketing@aureolab.cl",
        password_hash: "Password123!",
        role: "Empleado",
        department: "Marketing Digital",
        is_active: true,
      },
      {
        tenant_id: tenant._id,
        first_name: "Miguel",
        last_name: "Gerente",
        email: "miguel.gerente@aureolab.cl",
        password_hash: "Password123!",
        role: "Investigador",
        department: "Proyectos",
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

    // Crear denuncias de ejemplo para Aureolab
    const complaints = [
      {
        tenant_id: tenant._id,
        complainant_id: createdUsers[3]._id, // Roberto (Empleado)
        accused_id: createdUsers[7]._id, // Miguel (Gerente/Investigador)
        type: "psychological",
        severity: "high",
        title: "Presión laboral excesiva y ambiente tóxico",
        description:
          "Mi manager me ha estado presionando con cargas de trabajo imposibles y fechas irreales. Cuando no cumplo, hace comentarios humillantes frente al equipo. Esta situación ha afectado mi salud mental y mi rendimiento.",
        location: "Oficina de desarrollo, piso 3",
        incident_date: new Date("2024-07-10T09:30:00.000Z"),
        status: "investigating",
        priority: "high",
        is_confidential: true,
        assigned_to: createdUsers[2]._id, // Elena como investigadora
        assigned_at: new Date("2024-07-11T10:00:00.000Z"),
      },
      {
        tenant_id: tenant._id,
        complainant_id: createdUsers[4]._id, // Carmen (Empleado)
        accused_id: createdUsers[6]._id, // Patricia (Marketing)
        type: "discrimination",
        severity: "medium",
        title: "Discriminación de género en asignación de proyectos",
        description:
          "He notado que los proyectos más importantes y visibles siempre se asignan a mis colegas masculinos, a pesar de tener igual o mayor experiencia. Cuando he preguntado, recibo respuestas evasivas sobre 'mejor fit para el cliente'.",
        location: "Área de diseño, piso 2",
        incident_date: new Date("2024-07-05T14:15:00.000Z"),
        status: "under_review",
        priority: "normal",
        is_confidential: true,
        assigned_to: createdUsers[5]._id, // Fernando como investigador
        assigned_at: new Date("2024-07-06T09:00:00.000Z"),
      },
      {
        tenant_id: tenant._id,
        complainant_id: createdUsers[1]._id, // Diego (RRHH)
        accused_id: createdUsers[0]._id, // Sofia (Directora)
        type: "other",
        severity: "critical",
        title: "Conflicto de intereses y favoritismo",
        description:
          "He observado decisiones que favorecen a ciertos empleados sin justificación profesional, y se me ha presionado para no documentar ciertas situaciones problemáticas. Esto compromete la integridad de nuestros procesos de RRHH.",
        location: "Oficina dirección, piso 4",
        incident_date: new Date("2024-07-15T11:00:00.000Z"),
        status: "submitted",
        priority: "urgent",
        is_confidential: true,
      },
      {
        tenant_id: tenant._id,
        complainant_id: createdUsers[6]._id, // Patricia (Marketing)
        accused_id: createdUsers[3]._id, // Roberto (Desarrollador)
        type: "sexual",
        severity: "high",
        title: "Comentarios inapropiados y acoso",
        description:
          "Durante las reuniones de coordinación entre marketing y desarrollo, he recibido comentarios sobre mi apariencia y propuestas personales no deseadas. Cuando he intentado mantener una relación estrictamente profesional, el ambiente se ha vuelto hostil.",
        location: "Sala de reuniones principal",
        incident_date: new Date("2024-07-08T16:30:00.000Z"),
        status: "investigating",
        priority: "high",
        is_confidential: true,
        assigned_to: createdUsers[2]._id, // Elena como investigadora
        assigned_at: new Date("2024-07-09T08:30:00.000Z"),
      },
      {
        tenant_id: tenant._id,
        complainant_id: createdUsers[5]._id, // Fernando (Investigador)
        accused_id: createdUsers[7]._id, // Miguel (Gerente/Investigador)
        type: "other",
        severity: "medium",
        title: "Obstrucción a investigaciones internas",
        description:
          "Durante investigaciones anteriores, he recibido presión para acelerar procesos o minimizar hallazgos. Se me ha sugerido que 'ciertos temas es mejor no profundizarlos' y se han limitado mis accesos a información relevante.",
        location: "Oficina de compliance",
        incident_date: new Date("2024-07-12T13:45:00.000Z"),
        status: "under_review",
        priority: "high",
        is_confidential: true,
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
        complaint_id: createdComplaints[0]._id, // Presión laboral excesiva
        investigator_id: createdUsers[2]._id, // Elena
        assigned_by: createdUsers[1]._id, // Diego (RRHH)
        status: "evidence_review",
        priority: "high",
        estimated_completion_date: new Date(
          Date.now() + 10 * 24 * 60 * 60 * 1000
        ), // 10 días
        investigation_type: "formal",
        methodology: "mixed",
        scope:
          "Investigación completa sobre ambiente laboral tóxico y presión excesiva en el área de desarrollo, incluyendo análisis de cargas de trabajo, entrevistas con equipo y revisión de comunicaciones.",
        objectives: [
          "Evaluar la veracidad de las alegaciones sobre presión laboral excesiva",
          "Analizar cargas de trabajo y fechas asignadas vs. capacidad real",
          "Identificar patrones de comunicación problemática",
          "Evaluar impacto en el equipo de desarrollo",
          "Proponer medidas correctivas para mejorar ambiente laboral",
        ],
        confidentiality_level: "confidential",
        timeline: [
          {
            action: "created",
            user_id: createdUsers[1]._id,
            timestamp: new Date("2024-07-11T10:00:00.000Z"),
            notes: "Investigación creada tras denuncia por presión laboral",
          },
          {
            action: "assigned",
            user_id: createdUsers[1]._id,
            timestamp: new Date("2024-07-11T10:15:00.000Z"),
            notes: "Investigación asignada a Elena Investigadora",
          },
          {
            action: "started",
            user_id: createdUsers[2]._id,
            timestamp: new Date("2024-07-11T11:00:00.000Z"),
            notes: "Investigación iniciada - revisión inicial de la denuncia",
          },
          {
            action: "evidence_collected",
            user_id: createdUsers[2]._id,
            timestamp: new Date("2024-07-12T15:00:00.000Z"),
            notes:
              "Recolección de evidencia sobre cargas de trabajo y comunicaciones",
          },
          {
            action: "interview_conducted",
            user_id: createdUsers[2]._id,
            timestamp: new Date("2024-07-13T10:30:00.000Z"),
            notes: "Entrevista con denunciante completada",
          },
          {
            action: "status_changed",
            user_id: createdUsers[2]._id,
            timestamp: new Date("2024-07-14T14:00:00.000Z"),
            notes: "Estado cambiado a revisión de evidencia",
            previous_status: "active",
            new_status: "evidence_review",
          },
        ],
        evidence: [
          {
            type: "document",
            title: "Registro de tareas y plazos asignados",
            description:
              "Historial de asignaciones de tareas con fechas y estimaciones de tiempo vs. tiempo real necesario",
            filename: "registro_tareas_desarrollo.xlsx",
            source: "Sistema de gestión de proyectos",
            collected_date: new Date("2024-07-12T15:00:00.000Z"),
            collected_by: createdUsers[2]._id,
            relevance: "high",
            chain_of_custody: [
              {
                user_id: createdUsers[2]._id,
                action: "collected",
                timestamp: new Date("2024-07-12T15:00:00.000Z"),
                notes: "Evidencia obtenida del sistema de proyectos",
              },
              {
                user_id: createdUsers[2]._id,
                action: "analyzed",
                timestamp: new Date("2024-07-14T10:00:00.000Z"),
                notes: "Análisis de patrones de sobrecarga de trabajo",
              },
            ],
          },
          {
            type: "email",
            title: "Comunicaciones de Slack del equipo",
            description:
              "Mensajes y comunicaciones que muestran presión y ambiente laboral",
            filename: "slack_communications.pdf",
            source: "Plataforma Slack",
            collected_date: new Date("2024-07-13T09:00:00.000Z"),
            collected_by: createdUsers[2]._id,
            relevance: "high",
            chain_of_custody: [
              {
                user_id: createdUsers[2]._id,
                action: "collected",
                timestamp: new Date("2024-07-13T09:00:00.000Z"),
                notes: "Exportación de conversaciones relevantes",
              },
            ],
          },
        ],
        interviews: [
          {
            interviewee_id: createdUsers[3]._id, // Roberto (denunciante)
            interviewer_id: createdUsers[2]._id, // Elena
            interview_date: new Date("2024-07-13T10:30:00.000Z"),
            duration_minutes: 75,
            location: "Sala de reuniones confidencial",
            type: "complainant",
            summary:
              "El denunciante proporcionó detalles específicos sobre sobrecarga de trabajo, fechas irreales y comentarios humillantes. Mostró evidencia de estrés laboral y describió el deterioro en la dinámica del equipo.",
            key_points: [
              "Documentó casos específicos de sobrecarga de trabajo",
              "Describió comentarios humillantes públicos",
              "Mostró impacto en su bienestar y productividad",
              "Identificó otros miembros del equipo afectados",
              "Proporcionó ejemplos de fechas de entrega imposibles",
            ],
            follow_up_required: true,
            follow_up_notes:
              "Entrevistar a otros miembros del equipo de desarrollo",
            conducted_by: createdUsers[2]._id,
          },
          {
            interviewee_id: createdUsers[4]._id, // Carmen (compañera de trabajo)
            interviewer_id: createdUsers[2]._id, // Elena
            interview_date: new Date("2024-07-14T11:00:00.000Z"),
            duration_minutes: 45,
            location: "Sala de reuniones confidencial",
            type: "witness",
            summary:
              "Confirmó haber observado la presión excesiva sobre el equipo de desarrollo. Describió cambios en el ambiente laboral y confirmó comentarios inapropiados durante reuniones interdisciplinarias.",
            key_points: [
              "Confirmó presión excesiva sobre desarrolladores",
              "Observó cambios en dinámicas de trabajo",
              "Presenció comentarios inapropiados en reuniones",
              "Notó impacto en moral del equipo",
            ],
            follow_up_required: false,
            conducted_by: createdUsers[2]._id,
          },
        ],
        findings: [
          {
            category: "behavioral",
            description:
              "Se identificó una sobrecarga sistemática de trabajo con asignación de tareas que requieren 40% más tiempo del estimado y fechas de entrega irreales.",
            severity: "high",
            supporting_evidence: [],
            recommendations: [
              "Implementar metodología ágil para estimación realista",
              "Capacitación en gestión de equipos y planificación",
              "Establecer límites claros de carga de trabajo",
            ],
            documented_by: createdUsers[2]._id,
            documented_at: new Date("2024-07-14T16:00:00.000Z"),
          },
          {
            category: "behavioral",
            description:
              "Se documentaron múltiples instancias de comunicación inapropiada incluyendo comentarios humillantes públicos y falta de respeto hacia el equipo.",
            severity: "high",
            supporting_evidence: [],
            recommendations: [
              "Capacitación en comunicación efectiva y liderazgo",
              "Implementar protocolo de retroalimentación constructiva",
              "Monitoreo de dinámicas de comunicación en el equipo",
            ],
            documented_by: createdUsers[2]._id,
            documented_at: new Date("2024-07-14T16:30:00.000Z"),
          },
        ],
        notes:
          "Investigación en progreso. Evidencia clara de problemas de gestión y comunicación. Pendiente completar entrevistas con equipo completo y preparar recomendaciones finales.",
      },
      {
        tenant_id: tenant._id,
        complaint_id: createdComplaints[3]._id, // Comentarios inapropiados y acoso
        investigator_id: createdUsers[2]._id, // Elena
        assigned_by: createdUsers[1]._id, // Diego
        status: "completed",
        priority: "high",
        estimated_completion_date: new Date("2024-07-20T23:59:59.000Z"),
        actual_completion_date: new Date("2024-07-18T17:00:00.000Z"),
        investigation_type: "formal",
        methodology: "interviews",
        scope:
          "Investigación de alegaciones de acoso sexual y comentarios inapropiados en el contexto de reuniones interdepartamentales entre marketing y desarrollo.",
        objectives: [
          "Verificar alegaciones de comentarios inapropiados",
          "Evaluar ambiente de trabajo entre departamentos",
          "Determinar medidas correctivas necesarias",
          "Prevenir futuros incidentes similares",
        ],
        confidentiality_level: "confidential",
        timeline: [
          {
            action: "created",
            user_id: createdUsers[1]._id,
            timestamp: new Date("2024-07-09T08:30:00.000Z"),
            notes: "Investigación creada por denuncia de acoso",
          },
          {
            action: "assigned",
            user_id: createdUsers[1]._id,
            timestamp: new Date("2024-07-09T08:45:00.000Z"),
            notes: "Investigación asignada a Elena Investigadora",
          },
          {
            action: "started",
            user_id: createdUsers[2]._id,
            timestamp: new Date("2024-07-09T09:00:00.000Z"),
            notes:
              "Investigación iniciada - prioridad alta por naturaleza del caso",
          },
          {
            action: "completed",
            user_id: createdUsers[2]._id,
            timestamp: new Date("2024-07-18T17:00:00.000Z"),
            notes:
              "Investigación completada con medidas disciplinarias recomendadas",
          },
        ],
        evidence: [
          {
            type: "document",
            title: "Registro de reuniones interdepartamentales",
            description:
              "Actas y registros de participantes en reuniones entre marketing y desarrollo",
            filename: "actas_reuniones_mkt_dev.pdf",
            source: "Sistema de calendario y actas",
            collected_date: new Date("2024-07-10T10:00:00.000Z"),
            collected_by: createdUsers[2]._id,
            relevance: "medium",
            chain_of_custody: [
              {
                user_id: createdUsers[2]._id,
                action: "collected",
                timestamp: new Date("2024-07-10T10:00:00.000Z"),
                notes: "Recopilación de documentación oficial",
              },
            ],
          },
          {
            type: "interview",
            title: "Testimonios de testigos presenciales",
            description:
              "Declaraciones de otros participantes en las reuniones donde ocurrieron los incidentes",
            filename: "testimonios_testigos.docx",
            source: "Entrevistas confidenciales",
            collected_date: new Date("2024-07-15T14:00:00.000Z"),
            collected_by: createdUsers[2]._id,
            relevance: "high",
            chain_of_custody: [
              {
                user_id: createdUsers[2]._id,
                action: "collected",
                timestamp: new Date("2024-07-15T14:00:00.000Z"),
                notes: "Testimonios recopilados durante entrevistas",
              },
            ],
          },
        ],
        interviews: [
          {
            interviewee_id: createdUsers[6]._id, // Patricia (denunciante)
            interviewer_id: createdUsers[2]._id, // Elena
            interview_date: new Date("2024-07-10T14:00:00.000Z"),
            duration_minutes: 60,
            location: "Oficina privada - RRHH",
            type: "complainant",
            summary:
              "La denunciante proporcionó detalles específicos sobre comentarios inapropiados y propuestas no deseadas. Describió el impacto en su bienestar y productividad laboral.",
            key_points: [
              "Documentó comentarios específicos sobre su apariencia",
              "Describió propuestas personales no deseadas",
              "Mostró evidencia de ambiente hostil tras rechazar avances",
              "Identificó testigos presenciales",
              "Expresó temor por repercusiones profesionales",
            ],
            follow_up_required: true,
            follow_up_notes: "Entrevistar testigos identificados",
            conducted_by: createdUsers[2]._id,
          },
          {
            interviewee_id: createdUsers[4]._id, // Carmen (testigo)
            interviewer_id: createdUsers[2]._id, // Elena
            interview_date: new Date("2024-07-14T15:30:00.000Z"),
            duration_minutes: 40,
            location: "Sala de reuniones confidencial",
            type: "witness",
            summary:
              "Confirmó haber presenciado comentarios inapropiados durante reuniones. Describió ambiente incómodo y cambios en dinámicas de trabajo.",
            key_points: [
              "Confirmó comentarios inapropiados presenciados",
              "Describió ambiente incómodo en reuniones",
              "Notó cambios en comportamiento de ambas partes",
              "Proporcionó contexto sobre dinámicas previas",
            ],
            follow_up_required: false,
            conducted_by: createdUsers[2]._id,
          },
          {
            interviewee_id: createdUsers[3]._id, // Roberto (acusado)
            interviewer_id: createdUsers[2]._id, // Elena
            interview_date: new Date("2024-07-16T11:00:00.000Z"),
            duration_minutes: 90,
            location: "Sala de reuniones confidencial",
            type: "accused",
            summary:
              "El acusado inicialmente negó las alegaciones pero posteriormente admitió algunos comentarios que consideraba 'bromistas'. Mostró falta de comprensión sobre el impacto de sus acciones.",
            key_points: [
              "Negación inicial de alegaciones serias",
              "Admisión parcial de comentarios 'bromistas'",
              "Falta de comprensión sobre impacto de sus acciones",
              "Actitud defensiva durante la entrevista",
              "Compromiso expresado para cambiar comportamiento",
            ],
            follow_up_required: false,
            conducted_by: createdUsers[2]._id,
          },
        ],
        findings: [
          {
            category: "policy_violation",
            description:
              "Se confirmaron múltiples instancias de comentarios inapropiados sobre apariencia física y propuestas personales no deseadas en contexto laboral.",
            severity: "high",
            supporting_evidence: [],
            recommendations: [
              "Capacitación obligatoria en prevención de acoso sexual",
              "Implementar protocolo estricto de comunicación profesional",
              "Monitoreo de interacciones interdepartamentales",
              "Medidas disciplinarias según política de empresa",
            ],
            documented_by: createdUsers[2]._id,
            documented_at: new Date("2024-07-17T14:00:00.000Z"),
          },
          {
            category: "policy_violation",
            description:
              "Las acciones documentadas constituyen una clara violación de las políticas de respeto y convivencia laboral, así como políticas anti-acoso.",
            severity: "high",
            supporting_evidence: [],
            recommendations: [
              "Aplicar medidas disciplinarias correspondientes",
              "Refuerzo de políticas anti-acoso para toda la organización",
              "Implementar sistema de monitoreo y seguimiento",
            ],
            documented_by: createdUsers[2]._id,
            documented_at: new Date("2024-07-17T14:30:00.000Z"),
          },
        ],
        conclusion: {
          outcome: "substantiated",
          summary:
            "La investigación confirmó las alegaciones de acoso sexual y comentarios inapropiados. Se documentaron múltiples instancias que violan las políticas de la empresa y crearon un ambiente laboral hostil.",
          recommendations: [
            {
              type: "disciplinary",
              description:
                "Aplicar suspensión sin goce de sueldo por 5 días y programa de capacitación obligatorio en prevención de acoso",
              priority: "urgent",
              assigned_to: createdUsers[1]._id,
              due_date: new Date("2024-07-22T23:59:59.000Z"),
              status: "pending",
            },
            {
              type: "training",
              description:
                "Implementar programa de capacitación en prevención de acoso sexual para toda la organización",
              priority: "high",
              assigned_to: createdUsers[1]._id,
              due_date: new Date("2024-08-15T23:59:59.000Z"),
              status: "pending",
            },
            {
              type: "policy",
              description:
                "Revisar y reforzar políticas de comunicación interdepartamental y protocolo de denuncias",
              priority: "medium",
              assigned_to: createdUsers[0]._id,
              due_date: new Date("2024-08-30T23:59:59.000Z"),
              status: "pending",
            },
          ],
          completed_by: createdUsers[2]._id,
          completed_at: new Date("2024-07-18T17:00:00.000Z"),
        },
        notes:
          "Investigación completada exitosamente. Se confirmó acoso sexual y se recomendaron medidas disciplinarias y preventivas. Caso requiere seguimiento para asegurar cumplimiento de recomendaciones.",
      },
    ];

    // Crear investigaciones
    for (const investigationData of investigations) {
      const investigation = await Investigation.create(investigationData);
      logger.info(
        `Investigación creada: ${investigation._id} (${investigation.status})`
      );
    }

    logger.info("=== DATOS DE PRUEBA AUREOLAB CREADOS ===");
    logger.info("Tenant: Aureolab Innovación S.A. (RUT: 78.555.123-4)");
    logger.info("Usuarios creados:");
    logger.info("- directora@aureolab.cl / Admin123! (Tenant Admin)");
    logger.info("- diego.morales@aureolab.cl / Password123! (RRHH)");
    logger.info(
      "- elena.investigadora@aureolab.cl / Password123! (Investigador)"
    );
    logger.info("- roberto.dev@aureolab.cl / Password123! (Empleado)");
    logger.info("- carmen.design@aureolab.cl / Password123! (Empleado)");
    logger.info(
      "- fernando.analista@aureolab.cl / Password123! (Investigador)"
    );
    logger.info("- patricia.marketing@aureolab.cl / Password123! (Empleado)");
    logger.info("- miguel.gerente@aureolab.cl / Password123! (Investigador)");
    logger.info("");
    logger.info("Denuncias creadas:");
    logger.info("- Presión laboral excesiva y ambiente tóxico (investigating)");
    logger.info(
      "- Discriminación de género en asignación de proyectos (under_review)"
    );
    logger.info("- Conflicto de intereses y favoritismo (submitted)");
    logger.info("- Comentarios inapropiados y acoso (investigating)");
    logger.info("- Obstrucción a investigaciones internas (under_review)");
    logger.info("");
    logger.info("Investigaciones creadas:");
    logger.info("- Investigación presión laboral (evidence_review) - Elena");
    logger.info("- Investigación acoso sexual (completed) - Elena");
    logger.info("====================================");
  } catch (error) {
    logger.error("Error en seeding Aureolab:", error);
  } finally {
    await mongoose.connection.close();
    logger.info("Conexión cerrada");
    process.exit(0);
  }
};

// Ejecutar si es llamado directamente
if (require.main === module) {
  seedDataAureolab();
}

module.exports = seedDataAureolab;
