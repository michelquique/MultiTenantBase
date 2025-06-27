const User = require("../models/User");
const Tenant = require("../models/Tenant");
const JWTUtils = require("../utils/jwt");
const logger = require("../config/logger");

/**
 * Middleware para verificar autenticación JWT
 */
const authenticate = async (req, res, next) => {
  try {
    // Extraer token del header
    const token = JWTUtils.extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token de acceso requerido",
      });
    }

    // Verificar token
    const decoded = JWTUtils.verifyToken(token);

    // Buscar usuario en la base de datos
    const user = await User.findById(decoded.userId).populate(
      "tenant_id",
      "name status subscription_plan"
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    // Verificar si el usuario está activo
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: "Cuenta de usuario inactiva",
      });
    }

    // Verificar si la cuenta está bloqueada
    if (user.isAccountLocked()) {
      return res.status(423).json({
        success: false,
        message:
          "Cuenta temporalmente bloqueada por múltiples intentos fallidos",
      });
    }

    // Verificar si el tenant está activo
    if (!user.tenant_id || user.tenant_id.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Acceso denegado: organización inactiva",
      });
    }

    // Agregar información del usuario y tenant al request
    req.user = user;
    req.tenant = user.tenant_id;
    req.tenantId = user.tenant_id._id;

    logger.info(
      `Usuario autenticado: ${user.email} (${user.role}) - Tenant: ${user.tenant_id.name}`
    );

    next();
  } catch (error) {
    logger.error("Error en autenticación:", error);

    if (error.message === "Token expirado") {
      return res.status(401).json({
        success: false,
        message: "Token expirado",
        code: "TOKEN_EXPIRED",
      });
    }

    if (error.message === "Token inválido") {
      return res.status(401).json({
        success: false,
        message: "Token inválido",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
};

/**
 * Middleware para verificar roles específicos
 * @param {Array} roles - Array de roles permitidos
 */
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
    }

    // Si no se especifican roles, permitir acceso a usuarios autenticados
    if (roles.length === 0) {
      return next();
    }

    // Verificar si el usuario tiene uno de los roles permitidos
    if (!roles.includes(req.user.role)) {
      logger.warn(
        `Acceso denegado para usuario ${req.user.email} con rol ${
          req.user.role
        }. Roles requeridos: ${roles.join(", ")}`
      );

      return res.status(403).json({
        success: false,
        message: "Acceso denegado: permisos insuficientes",
      });
    }

    next();
  };
};

/**
 * Middleware para verificar que el usuario pertenezca a un tenant específico
 * Útil para endpoints que requieren verificación adicional de tenant
 */
const requireTenant = (req, res, next) => {
  if (!req.tenantId) {
    return res.status(403).json({
      success: false,
      message: "Acceso denegado: tenant no identificado",
    });
  }

  // Verificar que el tenant tenga una suscripción activa
  if (req.tenant.subscription_plan.status !== "active") {
    return res.status(403).json({
      success: false,
      message: "Acceso denegado: suscripción inactiva",
    });
  }

  next();
};

/**
 * Middleware para verificar límites de licencias
 */
const checkLicenseLimit = async (req, res, next) => {
  try {
    const tenant = await Tenant.findById(req.tenantId);

    if (!tenant) {
      return res.status(403).json({
        success: false,
        message: "Tenant no encontrado",
      });
    }

    if (!tenant.hasAvailableLicenses()) {
      return res.status(403).json({
        success: false,
        message: "Límite de licencias alcanzado",
      });
    }

    req.tenant = tenant;
    next();
  } catch (error) {
    logger.error("Error verificando límite de licencias:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
};

module.exports = {
  authenticate,
  authorize,
  requireTenant,
  checkLicenseLimit,
};
