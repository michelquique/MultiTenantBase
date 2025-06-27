const User = require("../models/User");
const Tenant = require("../models/Tenant");
const JWTUtils = require("../utils/jwt");
const logger = require("../config/logger");
const { validationResult } = require("express-validator");

class AuthController {
  /**
   * Login de usuario
   */
  static async login(req, res) {
    try {
      // Verificar errores de validación
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Datos de entrada inválidos",
          errors: errors.array(),
        });
      }

      const { email, password, tenant_rut } = req.body;

      // Log del intento de login
      logger.info(
        `Intento de login para email: ${email}, tenant: ${tenant_rut}`
      );

      // Buscar el tenant por RUT
      const tenant = await Tenant.findOne({
        rut: tenant_rut,
        status: "active",
      });

      if (!tenant) {
        logger.warn(`Intento de login con tenant inválido: ${tenant_rut}`);
        return res.status(401).json({
          success: false,
          message: "Credenciales inválidas",
        });
      }

      // Buscar usuario por email y tenant
      const user = await User.findOne({
        email: email.toLowerCase(),
        tenant_id: tenant._id,
      }).select("+password_hash");

      if (!user) {
        logger.warn(
          `Intento de login con email inexistente: ${email} en tenant ${tenant_rut}`
        );
        return res.status(401).json({
          success: false,
          message: "Credenciales inválidas",
        });
      }

      // Verificar si la cuenta está bloqueada
      if (user.isAccountLocked()) {
        logger.warn(`Intento de login en cuenta bloqueada: ${email}`);
        return res.status(423).json({
          success: false,
          message: "Cuenta temporalmente bloqueada. Intente más tarde.",
        });
      }

      // Verificar si el usuario está activo
      if (!user.is_active) {
        logger.warn(`Intento de login con usuario inactivo: ${email}`);
        return res.status(401).json({
          success: false,
          message: "Cuenta inactiva",
        });
      }

      // Verificar contraseña
      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        logger.warn(`Contraseña incorrecta para: ${email}`);

        // Incrementar intentos fallidos
        await user.incrementFailedAttempts();

        return res.status(401).json({
          success: false,
          message: "Credenciales inválidas",
        });
      }

      // Login exitoso - resetear intentos fallidos
      if (user.failed_login_attempts > 0) {
        await user.resetFailedAttempts();
      }

      // Actualizar último login
      await user.updateLastLogin();

      // Preparar payload para JWT
      const tokenPayload = {
        userId: user._id,
        tenantId: tenant._id,
        email: user.email,
        role: user.role,
      };

      // Generar tokens
      const accessToken = JWTUtils.generateToken(tokenPayload);
      const refreshToken = JWTUtils.generateRefreshToken({
        userId: user._id,
        tenantId: tenant._id,
      });

      logger.info(
        `Login exitoso para: ${email} (${user.role}) en tenant ${tenant.name}`
      );

      // Respuesta exitosa
      res.status(200).json({
        success: true,
        message: "Login exitoso",
        data: {
          user: {
            id: user._id,
            first_name: user.first_name,
            last_name: user.last_name,
            full_name: user.full_name,
            email: user.email,
            role: user.role,
            department: user.department,
          },
          tenant: {
            id: tenant._id,
            name: tenant.name,
            branding: tenant.branding,
          },
          tokens: {
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_in: process.env.JWT_EXPIRES_IN,
          },
        },
      });
    } catch (error) {
      logger.error("Error en login:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  /**
   * Refresh token
   */
  static async refreshToken(req, res) {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        return res.status(400).json({
          success: false,
          message: "Refresh token requerido",
        });
      }

      // Verificar refresh token
      const decoded = JWTUtils.verifyRefreshToken(refresh_token);

      // Buscar usuario
      const user = await User.findById(decoded.userId).populate(
        "tenant_id",
        "name status branding"
      );

      if (!user || !user.is_active) {
        return res.status(401).json({
          success: false,
          message: "Usuario inválido",
        });
      }

      if (!user.tenant_id || user.tenant_id.status !== "active") {
        return res.status(403).json({
          success: false,
          message: "Tenant inactivo",
        });
      }

      // Generar nuevo access token
      const tokenPayload = {
        userId: user._id,
        tenantId: user.tenant_id._id,
        email: user.email,
        role: user.role,
      };

      const newAccessToken = JWTUtils.generateToken(tokenPayload);

      logger.info(`Token renovado para usuario: ${user.email}`);

      res.status(200).json({
        success: true,
        message: "Token renovado exitosamente",
        data: {
          access_token: newAccessToken,
          expires_in: process.env.JWT_EXPIRES_IN,
        },
      });
    } catch (error) {
      logger.error("Error renovando token:", error);

      if (error.message.includes("token")) {
        return res.status(401).json({
          success: false,
          message: "Refresh token inválido o expirado",
        });
      }

      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  /**
   * Logout
   */
  static async logout(req, res) {
    try {
      // En este punto el usuario ya está autenticado (por el middleware)
      logger.info(`Logout para usuario: ${req.user.email}`);

      // Nota: En una implementación más robusta, podrías mantener una blacklist
      // de tokens o usar Redis para invalidar tokens específicos

      res.status(200).json({
        success: true,
        message: "Logout exitoso",
      });
    } catch (error) {
      logger.error("Error en logout:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  /**
   * Obtener información del usuario actual
   */
  static async me(req, res) {
    try {
      const user = await User.findById(req.user._id)
        .populate("tenant_id", "name branding subscription_plan")
        .select("-password_hash");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado",
        });
      }

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user._id,
            first_name: user.first_name,
            last_name: user.last_name,
            full_name: user.full_name,
            email: user.email,
            role: user.role,
            department: user.department,
            last_login_at: user.last_login_at,
            created_at: user.created_at,
          },
          tenant: {
            id: user.tenant_id._id,
            name: user.tenant_id.name,
            branding: user.tenant_id.branding,
            subscription_plan: user.tenant_id.subscription_plan,
          },
        },
      });
    } catch (error) {
      logger.error("Error obteniendo información del usuario:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }
}

module.exports = AuthController;
