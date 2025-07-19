const Tenant = require("../models/Tenant");
const logger = require("../config/logger");

/**
 * Middleware para extraer y validar tenant desde header X-Tenant-Slug
 */
const extractTenant = async (req, res, next) => {
  try {
    const tenantSlug = req.headers["x-tenant-slug"];

    if (!tenantSlug) {
      return res.status(400).json({
        success: false,
        message: "Header X-Tenant-Slug es requerido",
      });
    }

    // Validar formato del slug
    if (!/^[a-z0-9-]+$/.test(tenantSlug)) {
      return res.status(400).json({
        success: false,
        message: "Formato de tenant slug inválido",
      });
    }

    // Buscar tenant por slug
    const tenant = await Tenant.findOne({
      slug: tenantSlug.toLowerCase(),
      status: "active",
    });

    if (!tenant) {
      logger.warn(`Intento de acceso con tenant slug inválido: ${tenantSlug}`);
      return res.status(401).json({
        success: false,
        message: "Tenant no encontrado o inactivo",
      });
    }

    // Agregar tenant al request para uso posterior
    req.tenant = tenant;
    next();
  } catch (error) {
    logger.error("Error en middleware extractTenant:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
};

module.exports = { extractTenant };
