const mongoose = require("mongoose");

const investigationSchema = new mongoose.Schema(
  {
    tenant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: [true, "El tenant_id es requerido"],
      index: true,
    },
    complaint_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Complaint",
      required: [true, "La denuncia asociada es requerida"],
      index: true,
    },
    investigator_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "El investigador es requerido"],
      index: true,
    },
    assigned_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "El usuario que asigna es requerido"],
    },
    status: {
      type: String,
      enum: [
        "pending",
        "in_progress",
        "evidence_review",
        "interviews_pending",
        "analysis",
        "report_draft",
        "completed",
        "suspended",
        "cancelled",
      ],
      default: "pending",
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },
    estimated_completion_date: {
      type: Date,
      required: [true, "La fecha estimada de finalización es requerida"],
    },
    actual_completion_date: {
      type: Date,
    },
    investigation_type: {
      type: String,
      enum: ["formal", "informal", "preliminary", "follow_up"],
      default: "formal",
    },
    methodology: {
      type: String,
      enum: ["interviews", "document_review", "observation", "mixed"],
      default: "mixed",
    },
    scope: {
      type: String,
      required: [true, "El alcance de la investigación es requerido"],
      trim: true,
      maxlength: [1000, "El alcance no puede exceder 1000 caracteres"],
    },
    objectives: [
      {
        type: String,
        required: true,
        trim: true,
        maxlength: [500, "Cada objetivo no puede exceder 500 caracteres"],
      },
    ],
    timeline: [
      {
        action: {
          type: String,
          required: true,
          enum: [
            "created",
            "assigned",
            "started",
            "evidence_collected",
            "interview_conducted",
            "analysis_completed",
            "report_drafted",
            "completed",
            "suspended",
            "cancelled",
            "status_changed",
          ],
        },
        user_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        notes: {
          type: String,
          trim: true,
          maxlength: [1000, "Las notas no pueden exceder 1000 caracteres"],
        },
        previous_status: String,
        new_status: String,
      },
    ],
    evidence: [
      {
        type: {
          type: String,
          enum: ["document", "interview", "email", "photo", "video", "other"],
          required: true,
        },
        title: {
          type: String,
          required: true,
          trim: true,
          maxlength: [200, "El título no puede exceder 200 caracteres"],
        },
        description: {
          type: String,
          trim: true,
          maxlength: [1000, "La descripción no puede exceder 1000 caracteres"],
        },
        filename: String,
        url: String,
        source: {
          type: String,
          required: true,
          trim: true,
        },
        collected_date: {
          type: Date,
          default: Date.now,
        },
        collected_by: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        relevance: {
          type: String,
          enum: ["high", "medium", "low"],
          default: "medium",
        },
        chain_of_custody: [
          {
            user_id: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
              required: true,
            },
            action: {
              type: String,
              enum: ["collected", "reviewed", "analyzed", "transferred"],
              required: true,
            },
            timestamp: {
              type: Date,
              default: Date.now,
            },
            notes: String,
          },
        ],
      },
    ],
    interviews: [
      {
        interviewee_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        interviewer_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        interview_date: {
          type: Date,
          required: true,
        },
        duration_minutes: {
          type: Number,
          min: [1, "La duración debe ser al menos 1 minuto"],
        },
        location: {
          type: String,
          trim: true,
        },
        type: {
          type: String,
          enum: ["witness", "complainant", "accused", "expert", "other"],
          required: true,
        },
        summary: {
          type: String,
          required: [true, "El resumen de la entrevista es requerido"],
          trim: true,
          maxlength: [5000, "El resumen no puede exceder 5000 caracteres"],
        },
        key_points: [String],
        follow_up_required: {
          type: Boolean,
          default: false,
        },
        follow_up_notes: String,
        recording_url: String,
        transcript_url: String,
        conducted_by: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
      },
    ],
    findings: [
      {
        category: {
          type: String,
          enum: ["factual", "policy_violation", "procedural", "behavioral"],
          required: true,
        },
        description: {
          type: String,
          required: true,
          trim: true,
          maxlength: [2000, "La descripción no puede exceder 2000 caracteres"],
        },
        severity: {
          type: String,
          enum: ["low", "medium", "high", "critical"],
          required: true,
        },
        supporting_evidence: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Investigation.evidence",
          },
        ],
        recommendations: [String],
        documented_by: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        documented_at: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    conclusion: {
      outcome: {
        type: String,
        enum: [
          "substantiated",
          "unsubstantiated",
          "partially_substantiated",
          "inconclusive",
          "unfounded",
        ],
      },
      summary: {
        type: String,
        trim: true,
        maxlength: [3000, "El resumen no puede exceder 3000 caracteres"],
      },
      recommendations: [
        {
          type: {
            type: String,
            enum: ["disciplinary", "training", "policy", "procedural", "other"],
            required: true,
          },
          description: {
            type: String,
            required: true,
            trim: true,
          },
          priority: {
            type: String,
            enum: ["low", "medium", "high", "urgent"],
            default: "medium",
          },
          assigned_to: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          due_date: Date,
          status: {
            type: String,
            enum: ["pending", "in_progress", "completed", "cancelled"],
            default: "pending",
          },
        },
      ],
      completed_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      completed_at: Date,
    },
    confidentiality_level: {
      type: String,
      enum: ["public", "internal", "confidential", "highly_confidential"],
      default: "confidential",
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [2000, "Las notas no pueden exceder 2000 caracteres"],
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

// Índices para optimización
investigationSchema.index({ tenant_id: 1, status: 1 });
investigationSchema.index({ tenant_id: 1, investigator_id: 1 });
investigationSchema.index({ tenant_id: 1, complaint_id: 1 });
investigationSchema.index({ tenant_id: 1, priority: 1 });
investigationSchema.index({ tenant_id: 1, created_at: -1 });
investigationSchema.index({ tenant_id: 1, estimated_completion_date: 1 });

// Middleware para agregar entrada al timeline cuando se crea
investigationSchema.pre("save", function (next) {
  if (this.isNew) {
    this.timeline.push({
      action: "created",
      user_id: this.assigned_by,
      timestamp: new Date(),
      notes: "Investigación creada",
    });
  }
  next();
});

// Método para agregar entrada al timeline
investigationSchema.methods.addTimelineEntry = function (
  action,
  userId,
  notes,
  previousStatus,
  newStatus
) {
  this.timeline.push({
    action,
    user_id: userId,
    timestamp: new Date(),
    notes,
    previous_status: previousStatus,
    new_status: newStatus,
  });
};

// Método para verificar si la investigación está vencida
investigationSchema.methods.isOverdue = function () {
  return (
    this.estimated_completion_date < new Date() && this.status !== "completed"
  );
};

// Método para calcular duración en días
investigationSchema.methods.getDurationInDays = function () {
  const end = this.actual_completion_date || new Date();
  const start = this.created_at;
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
};

// Virtual para progreso de la investigación
investigationSchema.virtual("progress_percentage").get(function () {
  const statusProgress = {
    pending: 0,
    in_progress: 20,
    evidence_review: 40,
    interviews_pending: 50,
    analysis: 70,
    report_draft: 85,
    completed: 100,
    suspended: 0,
    cancelled: 0,
  };
  return statusProgress[this.status] || 0;
});

// Asegurar que los virtuals se incluyan en JSON
investigationSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Investigation", investigationSchema);
