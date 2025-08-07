const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema(
  {
    tenant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: [true, "El tenant_id es requerido"],
      index: true,
    },
    category: {
      type: String,
      enum: [
        "complaint_types",
        "complaint_severity",
        "complaint_priority",
        "complaint_status",
        "user_roles",
        "evidence_types",
        "resolution_outcomes",
        "timeline_actions",
      ],
      required: [true, "La categoría es requerida"],
      index: true,
    },
    key: {
      type: String,
      required: [true, "La clave es requerida"],
      trim: true,
    },
    label: {
      type: String,
      required: [true, "La etiqueta es requerida"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    sort_order: {
      type: Number,
      default: 0,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
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
resourceSchema.index({ tenant_id: 1, category: 1 });
resourceSchema.index({ tenant_id: 1, category: 1, key: 1 }, { unique: true });
resourceSchema.index({ tenant_id: 1, category: 1, is_active: 1 });
resourceSchema.index({ tenant_id: 1, category: 1, sort_order: 1 });

// Método estático para obtener recursos por categoría
resourceSchema.statics.getByCategory = function (
  tenant_id,
  category,
  activeOnly = true
) {
  const filter = {
    tenant_id: new mongoose.Types.ObjectId(tenant_id),
    category,
  };

  if (activeOnly) {
    filter.is_active = true;
  }

  return this.find(filter).sort({ sort_order: 1, label: 1 }).lean();
};

// Método estático para obtener todos los recursos agrupados
resourceSchema.statics.getAllGrouped = function (tenant_id, activeOnly = true) {
  const filter = { tenant_id: new mongoose.Types.ObjectId(tenant_id) };

  if (activeOnly) {
    filter.is_active = true;
  }

  return this.aggregate([
    { $match: filter },
    { $sort: { category: 1, sort_order: 1, label: 1 } },
    {
      $group: {
        _id: "$category",
        items: {
          $push: {
            key: "$key",
            label: "$label",
            description: "$description",
            sort_order: "$sort_order",
            metadata: "$metadata",
          },
        },
      },
    },
    { $sort: { _id: 1 } },
  ]);
};

// Método estático para validar si una clave existe en una categoría
resourceSchema.statics.validateKey = async function (tenant_id, category, key) {
  const count = await this.countDocuments({
    tenant_id: new mongoose.Types.ObjectId(tenant_id),
    category,
    key,
    is_active: true,
  });
  return count > 0;
};

module.exports = mongoose.model("Resource", resourceSchema);
