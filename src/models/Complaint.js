const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    tenant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: [true, "El tenant_id es requerido"],
      index: true,
    },
    complainant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "El denunciante es requerido"],
      index: true,
    },
    accused_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "El denunciado es requerido"],
      index: true,
    },
    type: {
      type: String,
      enum: ["sexual", "psychological", "discrimination", "other"],
      required: [true, "El tipo de denuncia es requerido"],
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
      required: true,
    },
    status: {
      type: String,
      enum: [
        "draft",
        "submitted",
        "under_review",
        "investigating",
        "resolved",
        "closed",
      ],
      default: "draft",
      required: true,
    },
    title: {
      type: String,
      required: [true, "El título es requerido"],
      trim: true,
      maxlength: [200, "El título no puede exceder 200 caracteres"],
    },
    description: {
      type: String,
      required: [true, "La descripción es requerida"],
      trim: true,
      maxlength: [5000, "La descripción no puede exceder 5000 caracteres"],
    },
    location: {
      type: String,
      trim: true,
      maxlength: [300, "La ubicación no puede exceder 300 caracteres"],
    },
    incident_date: {
      type: Date,
      required: [true, "La fecha del incidente es requerida"],
    },
    reported_date: {
      type: Date,
      default: Date.now,
    },
    evidence: [
      {
        type: {
          type: String,
          enum: ["document", "image", "video", "audio"],
          required: true,
        },
        filename: {
          type: String,
          required: true,
        },
        original_name: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
        size: {
          type: Number,
          required: true,
        },
        uploaded_at: {
          type: Date,
          default: Date.now,
        },
        uploaded_by: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
      },
    ],
    assigned_to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    assigned_at: {
      type: Date,
    },
    timeline: [
      {
        action: {
          type: String,
          required: true,
          enum: [
            "created",
            "submitted",
            "assigned",
            "investigation_started",
            "evidence_added",
            "status_changed",
            "resolved",
            "closed",
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
    resolution: {
      outcome: {
        type: String,
        enum: [
          "founded",
          "unfounded",
          "partially_founded",
          "insufficient_evidence",
        ],
      },
      actions_taken: [String],
      notes: {
        type: String,
        trim: true,
        maxlength: [
          2000,
          "Las notas de resolución no pueden exceder 2000 caracteres",
        ],
      },
      resolved_at: Date,
      resolved_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },
    is_confidential: {
      type: Boolean,
      default: true,
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
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
complaintSchema.index({ tenant_id: 1, status: 1 });
complaintSchema.index({ tenant_id: 1, complainant_id: 1 });
complaintSchema.index({ tenant_id: 1, accused_id: 1 });
complaintSchema.index({ tenant_id: 1, assigned_to: 1 });
complaintSchema.index({ tenant_id: 1, type: 1 });
complaintSchema.index({ tenant_id: 1, severity: 1 });
complaintSchema.index({ tenant_id: 1, created_at: -1 });

// Middleware para agregar entrada al timeline cuando se crea
complaintSchema.pre("save", function (next) {
  if (this.isNew) {
    this.timeline.push({
      action: "created",
      user_id: this.complainant_id,
      timestamp: new Date(),
      notes: "Denuncia creada",
    });
  }
  next();
});

// Método para agregar entrada al timeline
complaintSchema.methods.addTimelineEntry = function (
  action,
  user_id,
  notes = "",
  previousStatus = null,
  newStatus = null
) {
  this.timeline.push({
    action,
    user_id,
    timestamp: new Date(),
    notes,
    previous_status: previousStatus,
    new_status: newStatus,
  });
  return this.save();
};

// Método para cambiar estado
complaintSchema.methods.changeStatus = function (
  newStatus,
  user_id,
  notes = ""
) {
  const previousStatus = this.status;
  this.status = newStatus;

  // Actualizar fechas según el estado
  if (newStatus === "assigned" && !this.assigned_at) {
    this.assigned_at = new Date();
  } else if (newStatus === "resolved" && !this.resolution.resolved_at) {
    this.resolution.resolved_at = new Date();
    this.resolution.resolved_by = user_id;
  }

  this.addTimelineEntry(
    "status_changed",
    user_id,
    notes,
    previousStatus,
    newStatus
  );
  return this.save();
};

// Método para asignar investigador
complaintSchema.methods.assignInvestigator = function (
  investigator_id,
  user_id,
  notes = ""
) {
  this.assigned_to = investigator_id;
  this.assigned_at = new Date();
  this.status = "assigned";

  this.addTimelineEntry("assigned", user_id, notes);
  return this.save();
};

// Método para agregar evidencia
complaintSchema.methods.addEvidence = function (evidenceData, user_id) {
  this.evidence.push({
    ...evidenceData,
    uploaded_by: user_id,
    uploaded_at: new Date(),
  });

  this.addTimelineEntry(
    "evidence_added",
    user_id,
    `Evidencia agregada: ${evidenceData.original_name}`
  );
  return this.save();
};

// Método para resolver denuncia
complaintSchema.methods.resolve = function (resolutionData, user_id) {
  this.resolution = {
    ...resolutionData,
    resolved_at: new Date(),
    resolved_by: user_id,
  };
  this.status = "resolved";

  this.addTimelineEntry("resolved", user_id, resolutionData.notes);
  return this.save();
};

// Método para verificar si el usuario puede acceder a la denuncia
complaintSchema.methods.canUserAccess = function (user_id, user_role) {
  // Tenant Admin puede acceder a todo
  if (user_role === "Tenant Admin") return true;

  // Denunciante puede ver su propia denuncia
  if (this.complainant_id.equals(user_id)) return true;

  // Investigador asignado puede acceder
  if (this.assigned_to && this.assigned_to.equals(user_id)) return true;

  // RRHH puede acceder a todas las denuncias
  if (user_role === "RRHH") return true;

  // Investigador puede acceder a denuncias asignadas
  if (
    user_role === "Investigador" &&
    this.assigned_to &&
    this.assigned_to.equals(user_id)
  )
    return true;

  return false;
};

// Método para obtener estadísticas básicas
complaintSchema.statics.getStats = function (tenant_id) {
  return this.aggregate([
    { $match: { tenant_id: new mongoose.Types.ObjectId(tenant_id) } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        by_status: {
          $push: "$status",
        },
        by_type: {
          $push: "$type",
        },
        by_severity: {
          $push: "$severity",
        },
      },
    },
    {
      $project: {
        total: 1,
        status_counts: {
          draft: {
            $size: {
              $filter: {
                input: "$by_status",
                cond: { $eq: ["$$this", "draft"] },
              },
            },
          },
          submitted: {
            $size: {
              $filter: {
                input: "$by_status",
                cond: { $eq: ["$$this", "submitted"] },
              },
            },
          },
          under_review: {
            $size: {
              $filter: {
                input: "$by_status",
                cond: { $eq: ["$$this", "under_review"] },
              },
            },
          },
          investigating: {
            $size: {
              $filter: {
                input: "$by_status",
                cond: { $eq: ["$$this", "investigating"] },
              },
            },
          },
          resolved: {
            $size: {
              $filter: {
                input: "$by_status",
                cond: { $eq: ["$$this", "resolved"] },
              },
            },
          },
          closed: {
            $size: {
              $filter: {
                input: "$by_status",
                cond: { $eq: ["$$this", "closed"] },
              },
            },
          },
        },
        type_counts: {
          sexual: {
            $size: {
              $filter: {
                input: "$by_type",
                cond: { $eq: ["$$this", "sexual"] },
              },
            },
          },
          psychological: {
            $size: {
              $filter: {
                input: "$by_type",
                cond: { $eq: ["$$this", "psychological"] },
              },
            },
          },
          discrimination: {
            $size: {
              $filter: {
                input: "$by_type",
                cond: { $eq: ["$$this", "discrimination"] },
              },
            },
          },
          other: {
            $size: {
              $filter: {
                input: "$by_type",
                cond: { $eq: ["$$this", "other"] },
              },
            },
          },
        },
        severity_counts: {
          low: {
            $size: {
              $filter: {
                input: "$by_severity",
                cond: { $eq: ["$$this", "low"] },
              },
            },
          },
          medium: {
            $size: {
              $filter: {
                input: "$by_severity",
                cond: { $eq: ["$$this", "medium"] },
              },
            },
          },
          high: {
            $size: {
              $filter: {
                input: "$by_severity",
                cond: { $eq: ["$$this", "high"] },
              },
            },
          },
          critical: {
            $size: {
              $filter: {
                input: "$by_severity",
                cond: { $eq: ["$$this", "critical"] },
              },
            },
          },
        },
      },
    },
  ]);
};

module.exports = mongoose.model("Complaint", complaintSchema);
