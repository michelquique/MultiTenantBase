const { body } = require("express-validator");

/**
 * Validaciones para login
 */
const loginValidation = [
  body("email")
    .isEmail()
    .withMessage("Email debe tener un formato válido")
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage("Email no puede exceder 100 caracteres"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Contraseña debe tener al menos 6 caracteres")
    .isLength({ max: 100 })
    .withMessage("Contraseña no puede exceder 100 caracteres"),

  body("tenant_rut")
    .matches(/^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/)
    .withMessage("RUT debe tener formato válido (XX.XXX.XXX-X)")
    .isLength({ max: 12 })
    .withMessage("RUT no puede exceder 12 caracteres"),
];

/**
 * Validaciones para refresh token
 */
const refreshTokenValidation = [
  body("refresh_token")
    .notEmpty()
    .withMessage("Refresh token es requerido")
    .isString()
    .withMessage("Refresh token debe ser una cadena de texto")
    .isLength({ min: 10 })
    .withMessage("Refresh token inválido"),
];

/**
 * Validaciones para registro de usuario
 */
const registerValidation = [
  body("first_name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Nombre debe tener entre 2 y 50 caracteres")
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage("Nombre solo puede contener letras y espacios"),

  body("last_name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Apellido debe tener entre 2 y 50 caracteres")
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage("Apellido solo puede contener letras y espacios"),

  body("email")
    .isEmail()
    .withMessage("Email debe tener un formato válido")
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage("Email no puede exceder 100 caracteres"),

  body("password")
    .isLength({ min: 8 })
    .withMessage("Contraseña debe tener al menos 8 caracteres")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Contraseña debe contener al menos una mayúscula, una minúscula y un número"
    ),

  body("role")
    .optional()
    .isIn(["Empleado", "RRHH", "Investigador", "Tenant Admin"])
    .withMessage("Rol debe ser: Empleado, RRHH, Investigador o Tenant Admin"),

  body("department")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Departamento no puede exceder 100 caracteres"),
];

/**
 * Validaciones para cambio de contraseña
 */
const changePasswordValidation = [
  body("current_password")
    .notEmpty()
    .withMessage("Contraseña actual es requerida"),

  body("new_password")
    .isLength({ min: 8 })
    .withMessage("Nueva contraseña debe tener al menos 8 caracteres")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Nueva contraseña debe contener al menos una mayúscula, una minúscula y un número"
    ),

  body("confirm_password").custom((value, { req }) => {
    if (value !== req.body.new_password) {
      throw new Error("Confirmación de contraseña no coincide");
    }
    return true;
  }),
];

/**
 * Validaciones para recuperación de contraseña
 */
const forgotPasswordValidation = [
  body("email")
    .isEmail()
    .withMessage("Email debe tener un formato válido")
    .normalizeEmail(),

  body("tenant_rut")
    .matches(/^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/)
    .withMessage("RUT debe tener formato válido (XX.XXX.XXX-X)"),
];

/**
 * Validaciones para reset de contraseña
 */
const resetPasswordValidation = [
  body("token").notEmpty().withMessage("Token de recuperación es requerido"),

  body("new_password")
    .isLength({ min: 8 })
    .withMessage("Nueva contraseña debe tener al menos 8 caracteres")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Nueva contraseña debe contener al menos una mayúscula, una minúscula y un número"
    ),

  body("confirm_password").custom((value, { req }) => {
    if (value !== req.body.new_password) {
      throw new Error("Confirmación de contraseña no coincide");
    }
    return true;
  }),
];

module.exports = {
  loginValidation,
  refreshTokenValidation,
  registerValidation,
  changePasswordValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
};
