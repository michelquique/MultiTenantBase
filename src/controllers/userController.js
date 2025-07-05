const User = require("../models/User");
const Tenant = require("../models/Tenant");
const logger = require("../config/logger");
const mongoose = require("mongoose");

/**
 * Controlador para gestión de usuarios
 */
class UserController {
  /**
   * Obtener lista de usuarios con filtros y paginación
   */
  static async getAll(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        role,
        department,
        is_active,
        search,
        sort_by = "created_at",
        sort_order = "desc",
      } = req.query;

      const tenantId = req.tenantId;
      const userRole = req.user.role;

      // Construir filtros
      const filters = { tenant_id: tenantId };

      if (role) filters.role = role;
      if (department) filters.department = department;
      if (is_active !== undefined) filters.is_active = is_active === "true";

      // Búsqueda por nombre, email o departamento
      if (search) {
        filters.$or = [
          { first_name: { $regex: search, $options: "i" } },
          { last_name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { department: { $regex: search, $options: "i" } },
        ];
      }

      // Validar campo de ordenamiento
      const allowedSortFields = [
        "created_at",
        "updated_at",
        "first_name",
        "last_name",
        "email",
        "role",
        "department",
        "last_login_at",
      ];
      const sortField = allowedSortFields.includes(sort_by)
        ? sort_by
        : "created_at";

      // Calcular paginación
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const limitNum = Math.min(parseInt(limit), 100); // Máximo 100 por página

      // Ejecutar consulta
      const [users, total] = await Promise.all([
        User.find(filters)
          .select(
            "-password_hash -password_reset_token -password_reset_expires"
          )
          .sort({ [sortField]: sort_order === "asc" ? 1 : -1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        User.countDocuments(filters),
      ]);

      const totalPages = Math.ceil(total / limitNum);

      logger.info(`Usuarios obtenidos para tenant ${tenantId}`, {
        user: req.user.email,
        count: users.length,
        total,
        page: parseInt(page),
      });

      res.status(200).json({
        success: true,
        message: "Usuarios obtenidos exitosamente",
        data: users,
        pagination: {
          page: parseInt(page),
          limit: limitNum,
          total,
          totalPages,
        },
      });
    } catch (error) {
      logger.error("Error obteniendo usuarios:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  /**
   * Obtener usuario específico por ID
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const tenantId = req.user.tenantId;
      const userRole = req.user.role;

      const user = await User.findOne({
        _id: id,
        tenant_id: tenantId,
      }).select("-password_hash -password_reset_token -password_reset_expires");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
        });
      }

      logger.info(`Usuario obtenido: ${user.email}`, {
        requestedBy: req.user.email,
        userId: id,
      });

      res.status(200).json({
        success: true,
        message: "Usuario obtenido exitosamente",
        data: user,
      });
    } catch (error) {
      logger.error("Error obteniendo usuario:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  /**
   * Crear nuevo usuario
   */
  static async create(req, res) {
    try {
      const tenantId = new mongoose.Types.ObjectId(req.user.tenantId);
      const userRole = req.user.role;

      // Solo Tenant Admin puede crear usuarios
      if (userRole !== "Tenant Admin") {
        return res.status(403).json({
          success: false,
          message: "No tienes permisos para crear usuarios",
        });
      }

      // Verificar límite de licencias
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        return res.status(404).json({
          success: false,
          message: "Tenant no encontrado",
        });
      }

      if (tenant.licenses.in_use >= tenant.licenses.total) {
        return res.status(400).json({
          success: false,
          message: "Se ha alcanzado el límite de licencias del tenant",
        });
      }

      // Crear usuario
      const userData = {
        ...req.body,
        tenant_id: tenantId,
      };

      const user = await User.create(userData);

      // Actualizar contador de licencias
      await tenant.updateLicenseUsage(true);

      // Obtener usuario sin password_hash
      const createdUser = await User.findById(user._id).select(
        "-password_hash -password_reset_token -password_reset_expires"
      );

      logger.info(`Usuario creado: ${createdUser.email}`, {
        createdBy: req.user.email,
        role: createdUser.role,
        tenantId,
      });

      res.status(201).json({
        success: true,
        message: "Usuario creado exitosamente",
        data: createdUser,
      });
    } catch (error) {
      logger.error("Error creando usuario:", error);

      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: "Ya existe un usuario con ese email en este tenant",
        });
      }

      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  /**
   * Actualizar usuario existente
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const tenantId = req.user.tenantId;
      const userRole = req.user.role;

      // Verificar que el usuario existe y pertenece al tenant
      const existingUser = await User.findOne({
        _id: id,
        tenant_id: tenantId,
      });

      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
        });
      }

      // Solo Tenant Admin puede actualizar usuarios
      if (userRole !== "Tenant Admin") {
        return res.status(403).json({
          success: false,
          message: "No tienes permisos para actualizar usuarios",
        });
      }

      // No permitir cambiar email si ya existe
      if (req.body.email && req.body.email !== existingUser.email) {
        const emailExists = await User.findOne({
          email: req.body.email,
          tenant_id: tenantId,
          _id: { $ne: id },
        });

        if (emailExists) {
          return res.status(400).json({
            success: false,
            message: "Ya existe un usuario con ese email en este tenant",
          });
        }
      }

      // Actualizar usuario
      const updatedUser = await User.findByIdAndUpdate(
        id,
        { ...req.body },
        { new: true, runValidators: true }
      ).select("-password_hash -password_reset_token -password_reset_expires");

      logger.info(`Usuario actualizado: ${updatedUser.email}`, {
        updatedBy: req.user.email,
        userId: id,
      });

      res.status(200).json({
        success: true,
        message: "Usuario actualizado exitosamente",
        data: updatedUser,
      });
    } catch (error) {
      logger.error("Error actualizando usuario:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  /**
   * Eliminar usuario
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const tenantId = req.user.tenantId;
      const userRole = req.user.role;

      // Solo Tenant Admin puede eliminar usuarios
      if (userRole !== "Tenant Admin") {
        return res.status(403).json({
          success: false,
          message: "No tienes permisos para eliminar usuarios",
        });
      }

      // Verificar que el usuario existe y pertenece al tenant
      const user = await User.findOne({
        _id: id,
        tenant_id: tenantId,
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
        });
      }

      // No permitir eliminar el propio usuario
      if (id === req.user.userId) {
        return res.status(400).json({
          success: false,
          message: "No puedes eliminar tu propia cuenta",
        });
      }

      // Eliminar usuario
      await User.findByIdAndDelete(id);

      // Actualizar contador de licencias
      const tenant = await Tenant.findById(tenantId);
      if (tenant) {
        await tenant.updateLicenseUsage(false);
      }

      logger.info(`Usuario eliminado: ${user.email}`, {
        deletedBy: req.user.email,
        userId: id,
      });

      res.status(200).json({
        success: true,
        message: "Usuario eliminado exitosamente",
      });
    } catch (error) {
      logger.error("Error eliminando usuario:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  /**
   * Cambiar estado activo/inactivo de usuario
   */
  static async toggleStatus(req, res) {
    try {
      const { id } = req.params;
      const tenantId = req.user.tenantId;
      const userRole = req.user.role;

      // Solo Tenant Admin puede cambiar estado
      if (userRole !== "Tenant Admin") {
        return res.status(403).json({
          success: false,
          message: "No tienes permisos para cambiar el estado de usuarios",
        });
      }

      // Verificar que el usuario existe
      const user = await User.findOne({
        _id: id,
        tenant_id: tenantId,
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
        });
      }

      // No permitir desactivar el propio usuario
      if (id === req.user.userId) {
        return res.status(400).json({
          success: false,
          message: "No puedes desactivar tu propia cuenta",
        });
      }

      // Cambiar estado
      const newStatus = !user.is_active;
      const updatedUser = await User.findByIdAndUpdate(
        id,
        { is_active: newStatus },
        { new: true }
      ).select("-password_hash -password_reset_token -password_reset_expires");

      logger.info(
        `Estado de usuario cambiado: ${updatedUser.email} -> ${
          newStatus ? "activo" : "inactivo"
        }`,
        {
          changedBy: req.user.email,
          userId: id,
        }
      );

      res.status(200).json({
        success: true,
        message: `Usuario ${
          newStatus ? "activado" : "desactivado"
        } exitosamente`,
        data: updatedUser,
      });
    } catch (error) {
      logger.error("Error cambiando estado de usuario:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  /**
   * Obtener estadísticas de usuarios por tenant
   */
  static async getStats(req, res) {
    try {
      const tenantId = new mongoose.Types.ObjectId(req.user.tenantId);
      const userRole = req.user.role;

      // Solo Tenant Admin puede ver estadísticas
      if (userRole !== "Tenant Admin") {
        return res.status(403).json({
          success: false,
          message: "No tienes permisos para ver estadísticas",
        });
      }

      const stats = await User.aggregate([
        { $match: { tenant_id: tenantId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: {
              $sum: { $cond: ["$is_active", 1, 0] },
            },
            inactive: {
              $sum: { $cond: ["$is_active", 0, 1] },
            },
            byRole: {
              $push: "$role",
            },
            byDepartment: {
              $push: "$department",
            },
          },
        },
        {
          $project: {
            _id: 0,
            total: 1,
            active: 1,
            inactive: 1,
            roles: {
              $reduce: {
                input: "$byRole",
                initialValue: {},
                in: {
                  $mergeObjects: [
                    "$$value",
                    {
                      $literal: {
                        $concat: [
                          "$$this",
                          ": ",
                          {
                            $toString: {
                              $add: [
                                { $indexOfArray: ["$byRole", "$$this"] },
                                1,
                              ],
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            },
            departments: {
              $reduce: {
                input: "$byDepartment",
                initialValue: {},
                in: {
                  $mergeObjects: [
                    "$$value",
                    {
                      $literal: {
                        $concat: [
                          "$$this",
                          ": ",
                          {
                            $toString: {
                              $add: [
                                { $indexOfArray: ["$byDepartment", "$$this"] },
                                1,
                              ],
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      ]);

      // Obtener información del tenant
      const tenant = await Tenant.findById(tenantId).select("licenses");

      const result = {
        total: stats[0]?.total || 0,
        active: stats[0]?.active || 0,
        inactive: stats[0]?.inactive || 0,
        licenses: {
          total: tenant?.licenses?.total || 0,
          in_use: tenant?.licenses?.in_use || 0,
          available:
            (tenant?.licenses?.total || 0) - (tenant?.licenses?.in_use || 0),
        },
        roles: stats[0]?.roles || {},
        departments: stats[0]?.departments || {},
      };

      logger.info(
        `Estadísticas de usuarios obtenidas para tenant ${tenantId}`,
        {
          user: req.user.email,
        }
      );

      res.status(200).json({
        success: true,
        message: "Estadísticas obtenidas exitosamente",
        data: result,
      });
    } catch (error) {
      logger.error("Error obteniendo estadísticas:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }
}

module.exports = UserController;
