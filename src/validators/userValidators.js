const { body, query, param, validationResult } = require("express-validator");

/**
 * Middleware para manejar errores de validación
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Datos de entrada inválidos",
      errors: errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
      })),
    });
  }
  next();
};

/**
 * Validaciones para obtener lista de usuarios
 */
const getUsersValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("La página debe ser un número entero mayor a 0"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("El límite debe ser un número entre 1 y 100"),
  query("role")
    .optional()
    .isIn(["Empleado", "RRHH", "Investigador", "Tenant Admin"])
    .withMessage("Rol inválido"),
  query("department")
    .optional()
    .isLength({ max: 100 })
    .withMessage("El departamento no puede exceder 100 caracteres"),
  query("is_active")
    .optional()
    .isBoolean()
    .withMessage("is_active debe ser true o false"),
  query("search")
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage("La búsqueda debe tener entre 2 y 100 caracteres"),
  query("sort_by")
    .optional()
    .isIn([
      "created_at",
      "updated_at",
      "first_name",
      "last_name",
      "email",
      "role",
      "department",
      "last_login_at",
    ])
    .withMessage("Campo de ordenamiento inválido"),
  query("sort_order")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("Orden de clasificación debe ser 'asc' o 'desc'"),
  handleValidationErrors,
];

/**
 * Validaciones para obtener usuario por ID
 */
const getUserByIdValidation = [
  param("id").isMongoId().withMessage("ID de usuario inválido"),
  handleValidationErrors,
];

/**
 * Validaciones para crear usuario
 */
const createUserValidation = [
  body("first_name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("El nombre debe tener entre 2 y 50 caracteres")
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage("El nombre solo puede contener letras y espacios"),
  body("last_name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("El apellido debe tener entre 2 y 50 caracteres")
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage("El apellido solo puede contener letras y espacios"),
  body("email").isEmail().withMessage("Email inválido").normalizeEmail(),
  body("password_hash")
    .isLength({ min: 6 })
    .withMessage("La contraseña debe tener al menos 6 caracteres")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      "La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial"
    ),
  body("role")
    .isIn(["Empleado", "RRHH", "Investigador", "Tenant Admin"])
    .withMessage("Rol inválido"),
  body("department")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("El departamento no puede exceder 100 caracteres"),
  body("is_active")
    .optional()
    .isBoolean()
    .withMessage("is_active debe ser true o false"),
  handleValidationErrors,
];

/**
 * Validaciones para actualizar usuario
 */
const updateUserValidation = [
  param("id").isMongoId().withMessage("ID de usuario inválido"),
  body("first_name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("El nombre debe tener entre 2 y 50 caracteres")
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage("El nombre solo puede contener letras y espacios"),
  body("last_name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("El apellido debe tener entre 2 y 50 caracteres")
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage("El apellido solo puede contener letras y espacios"),
  body("email")
    .optional()
    .isEmail()
    .withMessage("Email inválido")
    .normalizeEmail(),
  body("role")
    .optional()
    .isIn(["Empleado", "RRHH", "Investigador", "Tenant Admin"])
    .withMessage("Rol inválido"),
  body("department")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("El departamento no puede exceder 100 caracteres"),
  body("is_active")
    .optional()
    .isBoolean()
    .withMessage("is_active debe ser true o false"),
  handleValidationErrors,
];

/**
 * Validaciones para eliminar usuario
 */
const deleteUserValidation = [
  param("id").isMongoId().withMessage("ID de usuario inválido"),
  handleValidationErrors,
];

/**
 * Validaciones para cambiar estado de usuario
 */
const toggleUserStatusValidation = [
  param("id").isMongoId().withMessage("ID de usuario inválido"),
  handleValidationErrors,
];

module.exports = {
  getUsersValidation,
  getUserByIdValidation,
  createUserValidation,
  updateUserValidation,
  deleteUserValidation,
  toggleUserStatusValidation,
  handleValidationErrors,
};
