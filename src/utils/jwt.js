const jwt = require("jsonwebtoken");
const logger = require("../config/logger");

class JWTUtils {
  /**
   * Genera un token JWT
   * @param {Object} payload - Datos a incluir en el token
   * @param {String} expiresIn - Tiempo de expiración (opcional)
   * @returns {String} Token JWT
   */
  static generateToken(payload, expiresIn = process.env.JWT_EXPIRES_IN) {
    try {
      return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn,
        issuer: "harassment-platform",
        audience: "harassment-platform-users",
      });
    } catch (error) {
      logger.error("Error generando JWT token:", error);
      throw new Error("Error generando token de autenticación");
    }
  }

  /**
   * Genera un refresh token
   * @param {Object} payload - Datos a incluir en el token
   * @returns {String} Refresh token JWT
   */
  static generateRefreshToken(payload) {
    try {
      return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
        issuer: "harassment-platform",
        audience: "harassment-platform-refresh",
      });
    } catch (error) {
      logger.error("Error generando refresh token:", error);
      throw new Error("Error generando refresh token");
    }
  }

  /**
   * Verifica un token JWT
   * @param {String} token - Token a verificar
   * @returns {Object} Payload decodificado
   */
  static verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET, {
        issuer: "harassment-platform",
        audience: "harassment-platform-users",
      });
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        throw new Error("Token expirado");
      } else if (error.name === "JsonWebTokenError") {
        throw new Error("Token inválido");
      } else {
        logger.error("Error verificando JWT token:", error);
        throw new Error("Error verificando token");
      }
    }
  }

  /**
   * Verifica un refresh token
   * @param {String} token - Refresh token a verificar
   * @returns {Object} Payload decodificado
   */
  static verifyRefreshToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET, {
        issuer: "harassment-platform",
        audience: "harassment-platform-refresh",
      });
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        throw new Error("Refresh token expirado");
      } else if (error.name === "JsonWebTokenError") {
        throw new Error("Refresh token inválido");
      } else {
        logger.error("Error verificando refresh token:", error);
        throw new Error("Error verificando refresh token");
      }
    }
  }

  /**
   * Decodifica un token sin verificar (útil para obtener info cuando ya expiró)
   * @param {String} token - Token a decodificar
   * @returns {Object} Payload decodificado
   */
  static decodeToken(token) {
    try {
      return jwt.decode(token);
    } catch (error) {
      logger.error("Error decodificando token:", error);
      throw new Error("Error decodificando token");
    }
  }

  /**
   * Extrae el token del header Authorization
   * @param {String} authHeader - Header de autorización
   * @returns {String|null} Token extraído o null
   */
  static extractTokenFromHeader(authHeader) {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }
    return authHeader.substring(7); // Remover "Bearer "
  }
}

module.exports = JWTUtils;
