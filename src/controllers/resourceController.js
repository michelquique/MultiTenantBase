const Resource = require("../models/Resource");
const logger = require("../config/logger");

class ResourceController {
  // Obtener todos los recursos agrupados por categoría
  async getAllResources(req, res) {
    try {
      const { tenant_id } = req.user;
      const activeOnly = req.query.active !== "false";

      logger.info(`Obteniendo recursos para tenant: ${tenant_id}`);

      const resources = await Resource.getAllGrouped(tenant_id, activeOnly);

      // Convertir el resultado del aggregate a un objeto más amigable
      const grouped = resources.reduce((acc, group) => {
        acc[group._id] = group.items;
        return acc;
      }, {});

      res.json({
        success: true,
        data: grouped,
        message: "Recursos obtenidos exitosamente",
      });
    } catch (error) {
      logger.error("Error obteniendo recursos:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
        message: error.message,
      });
    }
  }

  // Obtener recursos por categoría específica
  async getResourcesByCategory(req, res) {
    try {
      const { category } = req.params;
      const { tenant_id } = req.user;
      const activeOnly = req.query.active !== "false";

      logger.info(
        `Obteniendo recursos de categoría: ${category} para tenant: ${tenant_id}`
      );

      const resources = await Resource.getByCategory(
        tenant_id,
        category,
        activeOnly
      );

      if (!resources || resources.length === 0) {
        return res.status(404).json({
          success: false,
          message: `No se encontraron recursos para la categoría: ${category}`,
        });
      }

      res.json({
        success: true,
        data: resources.map((r) => ({
          key: r.key,
          label: r.label,
          description: r.description,
          sort_order: r.sort_order,
          metadata: r.metadata,
        })),
        message: `Recursos de ${category} obtenidos exitosamente`,
      });
    } catch (error) {
      logger.error(
        `Error obteniendo recursos de categoría ${req.params.category}:`,
        error
      );
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
        message: error.message,
      });
    }
  }

  // Crear un nuevo recurso (solo para Tenant Admin)
  async createResource(req, res) {
    try {
      const { tenant_id, role } = req.user;
      const { category, key, label, description, sort_order, metadata } =
        req.body;

      // Verificar permisos
      if (role !== "Tenant Admin") {
        return res.status(403).json({
          success: false,
          message: "No tienes permisos para crear recursos",
        });
      }

      logger.info(
        `Creando recurso para tenant: ${tenant_id}, categoría: ${category}, clave: ${key}`
      );

      // Verificar si ya existe
      const existingResource = await Resource.findOne({
        tenant_id,
        category,
        key,
      });

      if (existingResource) {
        return res.status(409).json({
          success: false,
          message: `Ya existe un recurso con la clave '${key}' en la categoría '${category}'`,
        });
      }

      const resource = new Resource({
        tenant_id,
        category,
        key,
        label,
        description,
        sort_order: sort_order || 0,
        metadata: metadata || {},
      });

      await resource.save();

      res.status(201).json({
        success: true,
        data: {
          key: resource.key,
          label: resource.label,
          description: resource.description,
          sort_order: resource.sort_order,
          metadata: resource.metadata,
        },
        message: "Recurso creado exitosamente",
      });
    } catch (error) {
      logger.error("Error creando recurso:", error);

      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message:
            "Ya existe un recurso con esa combinación de categoría y clave",
        });
      }

      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
        message: error.message,
      });
    }
  }

  // Actualizar un recurso existente (solo para Tenant Admin)
  async updateResource(req, res) {
    try {
      const { tenant_id, role } = req.user;
      const { category, key } = req.params;
      const updates = req.body;

      // Verificar permisos
      if (role !== "Tenant Admin") {
        return res.status(403).json({
          success: false,
          message: "No tienes permisos para actualizar recursos",
        });
      }

      logger.info(
        `Actualizando recurso: ${category}/${key} para tenant: ${tenant_id}`
      );

      const resource = await Resource.findOneAndUpdate(
        { tenant_id, category, key },
        updates,
        { new: true, runValidators: true }
      );

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: "Recurso no encontrado",
        });
      }

      res.json({
        success: true,
        data: {
          key: resource.key,
          label: resource.label,
          description: resource.description,
          sort_order: resource.sort_order,
          metadata: resource.metadata,
          is_active: resource.is_active,
        },
        message: "Recurso actualizado exitosamente",
      });
    } catch (error) {
      logger.error("Error actualizando recurso:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
        message: error.message,
      });
    }
  }

  // Desactivar un recurso (soft delete)
  async deactivateResource(req, res) {
    try {
      const { tenant_id, role } = req.user;
      const { category, key } = req.params;

      // Verificar permisos
      if (role !== "Tenant Admin") {
        return res.status(403).json({
          success: false,
          message: "No tienes permisos para desactivar recursos",
        });
      }

      logger.info(
        `Desactivando recurso: ${category}/${key} para tenant: ${tenant_id}`
      );

      const resource = await Resource.findOneAndUpdate(
        { tenant_id, category, key },
        { is_active: false },
        { new: true }
      );

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: "Recurso no encontrado",
        });
      }

      res.json({
        success: true,
        message: "Recurso desactivado exitosamente",
      });
    } catch (error) {
      logger.error("Error desactivando recurso:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
        message: error.message,
      });
    }
  }

  // Validar si una clave existe en una categoría
  async validateKey(req, res) {
    try {
      const { tenant_id } = req.user;
      const { category, key } = req.params;

      const isValid = await Resource.validateKey(tenant_id, category, key);

      res.json({
        success: true,
        data: {
          category,
          key,
          is_valid: isValid,
        },
        message: isValid ? "Clave válida" : "Clave no válida",
      });
    } catch (error) {
      logger.error("Error validando clave:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor",
        message: error.message,
      });
    }
  }
}

module.exports = new ResourceController();
