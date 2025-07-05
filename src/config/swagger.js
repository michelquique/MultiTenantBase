const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Harassment Platform API",
      version: "1.0.0",
      description: `
        API para plataforma de gestión de denuncias de acoso laboral con arquitectura multi-tenant.
        
        ## Características principales:
        - **Multi-tenant**: Aislamiento completo de datos por empresa
        - **Autenticación JWT**: Sistema robusto con access y refresh tokens
        - **Seguridad**: Rate limiting, validaciones, logging de auditoría
        - **Roles**: Tenant Admin, RRHH, Investigador, Empleado
        
        ## Autenticación:
        1. Hacer login con email, password y RUT del tenant
        2. Usar el access_token en el header Authorization: Bearer <token>
        3. Renovar token usando refresh_token cuando expire
        
        ## Rate Limiting:
        - Auth endpoints: 5 intentos por 15 minutos por IP
        - API general: 100 requests por 15 minutos por IP
        - API específica: 30 requests por minuto por IP
      `,
      contact: {
        name: "API Support",
        email: "support@aureolab.cl",
      },
      license: {
        name: "ISC",
        url: "https://opensource.org/licenses/ISC",
      },
    },
    servers: [
      {
        url:
          process.env.NODE_ENV === "production"
            ? "https://harassment-api.aureolab.cl"
            : `http://localhost:${process.env.PORT || 3000}`,
        description:
          process.env.NODE_ENV === "production"
            ? "Production server"
            : "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT token obtenido del endpoint /api/auth/login",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "ID único del usuario",
              example: "60d5ecb54b24a820f8d1c3a1",
            },
            first_name: {
              type: "string",
              description: "Nombre del usuario",
              example: "Juan",
            },
            last_name: {
              type: "string",
              description: "Apellido del usuario",
              example: "Pérez",
            },
            full_name: {
              type: "string",
              description: "Nombre completo del usuario",
              example: "Juan Pérez",
            },
            email: {
              type: "string",
              format: "email",
              description: "Email del usuario",
              example: "juan.perez@empresa.com",
            },
            role: {
              type: "string",
              enum: ["Empleado", "RRHH", "Investigador", "Tenant Admin"],
              description: "Rol del usuario en la organización",
              example: "Empleado",
            },
            department: {
              type: "string",
              description: "Departamento del usuario",
              example: "Ventas",
            },
            last_login_at: {
              type: "string",
              format: "date-time",
              description: "Fecha del último login",
              example: "2024-06-26T15:30:00.000Z",
            },
            created_at: {
              type: "string",
              format: "date-time",
              description: "Fecha de creación del usuario",
              example: "2024-01-15T10:00:00.000Z",
            },
          },
        },
        Tenant: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "ID único del tenant",
              example: "60d5ecb54b24a820f8d1c3a2",
            },
            name: {
              type: "string",
              description: "Nombre de la empresa",
              example: "Empresa Demo S.A.",
            },
            branding: {
              type: "object",
              properties: {
                logo_url: {
                  type: "string",
                  format: "uri",
                  description: "URL del logo de la empresa",
                  example: "https://example.com/logo.png",
                },
                primary_color: {
                  type: "string",
                  pattern: "^#[0-9A-F]{6}$",
                  description: "Color primario en hexadecimal",
                  example: "#0056b3",
                },
                secondary_color: {
                  type: "string",
                  pattern: "^#[0-9A-F]{6}$",
                  description: "Color secundario en hexadecimal",
                  example: "#4CAF50",
                },
              },
            },
            subscription_plan: {
              type: "object",
              properties: {
                type: {
                  type: "string",
                  enum: ["Basic", "Standard", "Premium"],
                  example: "Premium",
                },
                status: {
                  type: "string",
                  enum: ["active", "trial", "suspended", "cancelled"],
                  example: "active",
                },
              },
            },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password", "tenant_rut"],
          properties: {
            email: {
              type: "string",
              format: "email",
              description: "Email del usuario",
              example: "admin@empresademo.cl",
            },
            password: {
              type: "string",
              minLength: 6,
              description: "Contraseña del usuario",
              example: "Admin123!",
            },
            tenant_rut: {
              type: "string",
              pattern: "^\\d{1,2}\\.\\d{3}\\.\\d{3}-[\\dkK]$",
              description: "RUT de la empresa en formato chileno",
              example: "76.123.456-7",
            },
          },
        },
        LoginResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "Login exitoso",
            },
            data: {
              type: "object",
              properties: {
                user: {
                  $ref: "#/components/schemas/User",
                },
                tenant: {
                  $ref: "#/components/schemas/Tenant",
                },
                tokens: {
                  type: "object",
                  properties: {
                    access_token: {
                      type: "string",
                      description: "JWT access token",
                      example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                    },
                    refresh_token: {
                      type: "string",
                      description: "JWT refresh token",
                      example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                    },
                    expires_in: {
                      type: "string",
                      description: "Tiempo de expiración del access token",
                      example: "24h",
                    },
                  },
                },
              },
            },
          },
        },
        RefreshTokenRequest: {
          type: "object",
          required: ["refresh_token"],
          properties: {
            refresh_token: {
              type: "string",
              description: "Refresh token obtenido del login",
              example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            },
          },
        },
        RefreshTokenResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "Token renovado exitosamente",
            },
            data: {
              type: "object",
              properties: {
                access_token: {
                  type: "string",
                  description: "Nuevo JWT access token",
                  example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                },
                expires_in: {
                  type: "string",
                  description: "Tiempo de expiración del nuevo access token",
                  example: "24h",
                },
              },
            },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            message: {
              type: "string",
              example: "Mensaje de error",
            },
            errors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: {
                    type: "string",
                    example: "email",
                  },
                  message: {
                    type: "string",
                    example: "Email debe tener un formato válido",
                  },
                },
              },
            },
          },
        },
        HealthResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "API funcionando correctamente",
            },
            timestamp: {
              type: "string",
              format: "date-time",
              example: "2024-06-26T15:30:00.000Z",
            },
            version: {
              type: "string",
              example: "1.0.0",
            },
            environment: {
              type: "string",
              example: "development",
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: "Token de acceso requerido o inválido",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },
              example: {
                success: false,
                message: "Token de acceso requerido",
              },
            },
          },
        },
        ForbiddenError: {
          description: "Acceso denegado - permisos insuficientes",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },
              example: {
                success: false,
                message: "Acceso denegado: permisos insuficientes",
              },
            },
          },
        },
        ValidationError: {
          description: "Error de validación de datos",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },
              example: {
                success: false,
                message: "Datos de entrada inválidos",
                errors: [
                  {
                    field: "email",
                    message: "Email debe tener un formato válido",
                  },
                ],
              },
            },
          },
        },
        RateLimitError: {
          description: "Límite de requests excedido",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },
              example: {
                success: false,
                message: "Demasiadas solicitudes, intente más tarde",
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: "System",
        description: "Endpoints del sistema (health check, info)",
      },
      {
        name: "Authentication",
        description: "Endpoints de autenticación y autorización",
      },
      {
        name: "Users",
        description: "Gestión de usuarios (próximamente)",
      },
      {
        name: "Complaints",
        description: "Gestión de denuncias (próximamente)",
      },
      {
        name: "Investigations",
        description: "Gestión de investigaciones (próximamente)",
      },
      {
        name: "Training",
        description: "Materiales de capacitación (próximamente)",
      },
      {
        name: "Reports",
        description: "Reportes y análisis (próximamente)",
      },
    ],
  },
  apis: ["./src/routes/*.js", "./src/controllers/*.js", "./src/models/*.js"],
};

const specs = swaggerJsdoc(options);

// Personalización de la UI de Swagger
const swaggerUiOptions = {
  explorer: true,
  swaggerOptions: {
    persistAuthorization: true, // Mantener token después de refresh
    displayRequestDuration: true,
    docExpansion: "none", // No expandir por defecto
    filter: true, // Habilitar filtro de búsqueda
    showExtensions: true,
    showCommonExtensions: true,
    tryItOutEnabled: true,
  },
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #0056b3; }
    .swagger-ui .scheme-container { background: #f8f9fa; padding: 10px; }
  `,
  customSiteTitle: "Harassment Platform API Docs",
  customfavIcon: "/favicon.ico",
};

module.exports = {
  specs,
  swaggerUi,
  swaggerUiOptions,
};
