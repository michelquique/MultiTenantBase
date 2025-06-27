const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    tenant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: [true, "El tenant_id es requerido"],
      index: true,
    },
    first_name: {
      type: String,
      required: [true, "El nombre es requerido"],
      trim: true,
      maxlength: [50, "El nombre no puede exceder 50 caracteres"],
    },
    last_name: {
      type: String,
      required: [true, "El apellido es requerido"],
      trim: true,
      maxlength: [50, "El apellido no puede exceder 50 caracteres"],
    },
    email: {
      type: String,
      required: [true, "El email es requerido"],
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Email inválido"],
    },
    password_hash: {
      type: String,
      required: [true, "La contraseña es requerida"],
      minlength: [6, "La contraseña debe tener al menos 6 caracteres"],
      select: false, // Por seguridad, no incluir en consultas por defecto
    },
    role: {
      type: String,
      enum: ["Empleado", "RRHH", "Investigador", "Tenant Admin"],
      default: "Empleado",
    },
    department: {
      type: String,
      trim: true,
      maxlength: [100, "El departamento no puede exceder 100 caracteres"],
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    last_login_at: {
      type: Date,
      default: null,
    },
    password_reset_token: {
      type: String,
      default: null,
    },
    password_reset_expires: {
      type: Date,
      default: null,
    },
    failed_login_attempts: {
      type: Number,
      default: 0,
    },
    account_locked_until: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

// Índice compuesto para email único por tenant
userSchema.index({ tenant_id: 1, email: 1 }, { unique: true });
userSchema.index({ tenant_id: 1, role: 1 });
userSchema.index({ tenant_id: 1, is_active: 1 });
userSchema.index({ tenant_id: 1, department: 1 });

// Hash de la contraseña antes de guardar
userSchema.pre("save", async function (next) {
  // Solo hash si la contraseña ha sido modificada
  if (!this.isModified("password_hash")) return next();

  try {
    // Hash de la contraseña con salt de 12 rounds
    this.password_hash = await bcrypt.hash(this.password_hash, 12);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar contraseñas
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password_hash);
};

// Método para verificar si la cuenta está bloqueada
userSchema.methods.isAccountLocked = function () {
  return this.account_locked_until && this.account_locked_until > Date.now();
};

// Método para incrementar intentos fallidos de login
userSchema.methods.incrementFailedAttempts = function () {
  const maxAttempts = 5;
  const lockoutTime = 30 * 60 * 1000; // 30 minutos

  this.failed_login_attempts += 1;

  if (this.failed_login_attempts >= maxAttempts) {
    this.account_locked_until = Date.now() + lockoutTime;
  }

  return this.save();
};

// Método para resetear intentos fallidos
userSchema.methods.resetFailedAttempts = function () {
  this.failed_login_attempts = 0;
  this.account_locked_until = null;
  return this.save();
};

// Método para actualizar último login
userSchema.methods.updateLastLogin = function () {
  this.last_login_at = new Date();
  return this.save();
};

// Virtual para nombre completo
userSchema.virtual("full_name").get(function () {
  return `${this.first_name} ${this.last_name}`;
});

// Asegurar que los virtuals se incluyan en JSON
userSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("User", userSchema);
