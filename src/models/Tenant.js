const mongoose = require("mongoose");

const tenantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "El nombre de la empresa es requerido"],
      trim: true,
      maxlength: [200, "El nombre no puede exceder 200 caracteres"],
    },
    slug: {
      type: String,
      required: [true, "El slug es requerido"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-z0-9-]+$/,
        "Slug debe contener solo letras, números y guiones",
      ],
    },
    rut: {
      type: String,
      required: [true, "El RUT es requerido"],
      unique: true,
      trim: true,
      match: [/^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/, "Formato de RUT inválido"],
    },
    address: {
      type: String,
      required: [true, "La dirección es requerida"],
      trim: true,
      maxlength: [300, "La dirección no puede exceder 300 caracteres"],
    },
    phone: {
      type: String,
      required: [true, "El teléfono es requerido"],
      trim: true,
      match: [/^\+56\d{9}$/, "Formato de teléfono chileno inválido"],
    },
    email: {
      type: String,
      required: [true, "El email es requerido"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Email inválido"],
    },
    subscription_plan: {
      type: {
        type: String,
        enum: ["Basic", "Standard", "Premium"],
        default: "Basic",
      },
      start_date: {
        type: Date,
        default: Date.now,
      },
      end_date: {
        type: Date,
        required: true,
      },
      status: {
        type: String,
        enum: ["active", "trial", "suspended", "cancelled"],
        default: "trial",
      },
    },
    branding: {
      logo_url: {
        type: String,
        default: "https://placehold.co/200x50/000/fff?text=Logo",
      },
      primary_color: {
        type: String,
        default: "#0056b3",
        match: [
          /^#[0-9A-F]{6}$/i,
          "Color primario debe ser hexadecimal válido",
        ],
      },
      secondary_color: {
        type: String,
        default: "#4CAF50",
        match: [
          /^#[0-9A-F]{6}$/i,
          "Color secundario debe ser hexadecimal válido",
        ],
      },
    },
    licenses: {
      total: {
        type: Number,
        required: true,
        min: [1, "Debe tener al menos 1 licencia"],
        max: [10000, "Máximo 10000 licencias permitidas"],
      },
      in_use: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    status: {
      type: String,
      enum: ["active", "inactive", "pending"],
      default: "pending",
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
tenantSchema.index({ rut: 1 }, { unique: true });
tenantSchema.index({ email: 1 }, { unique: true });
tenantSchema.index({ status: 1 });
tenantSchema.index({ slug: 1 }, { unique: true });

// Middleware para auto-generar slug desde name si no existe
tenantSchema.pre("save", function (next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[áàäâ]/g, "a")
      .replace(/[éèëê]/g, "e")
      .replace(/[íìïî]/g, "i")
      .replace(/[óòöô]/g, "o")
      .replace(/[úùüû]/g, "u")
      .replace(/[ñ]/g, "n")
      .replace(/[^a-z0-9-]/g, "");
  }
  next();
});

// Middleware para validar que licenses.in_use no exceda total
tenantSchema.pre("save", function (next) {
  if (this.licenses.in_use > this.licenses.total) {
    next(
      new Error("Las licencias en uso no pueden exceder el total de licencias")
    );
  }
  next();
});

// Método para verificar si hay licencias disponibles
tenantSchema.methods.hasAvailableLicenses = function () {
  return this.licenses.in_use < this.licenses.total;
};

// Método para incrementar/decrementar licencias en uso
tenantSchema.methods.updateLicenseUsage = function (increment = true) {
  if (increment && this.hasAvailableLicenses()) {
    this.licenses.in_use += 1;
  } else if (!increment && this.licenses.in_use > 0) {
    this.licenses.in_use -= 1;
  }
  return this.save();
};

module.exports = mongoose.model("Tenant", tenantSchema);
