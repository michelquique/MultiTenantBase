import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { swaggerUI } from '@hono/swagger-ui';

// Importar rutas
import authRoutes from './routes-cf/auth';
import userRoutes from './routes-cf/users';
import complaintRoutes from './routes-cf/complaints';
import investigationRoutes from './routes-cf/investigations';
import resourceRoutes from './routes-cf/resources';

const app = new Hono();

// OpenAPI spec
const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Harassment Platform API',
    version: '1.0.0',
    description: 'API multi-tenant para gestión de denuncias de acoso laboral'
  },
  servers: [{ url: 'https://backendqsaito.michelquique.workers.dev' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
    },
    parameters: {
      TenantSlugHeader: {
        name: 'X-Tenant-Slug',
        in: 'header',
        required: true,
        schema: { type: 'string', example: 'aureolab' }
      }
    }
  },
  paths: {
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login',
        parameters: [{ $ref: '#/components/parameters/TenantSlugHeader' }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', example: 'admin@aureolab.cl' },
                  password: { type: 'string', example: 'Admin123!' }
                }
              }
            }
          }
        },
        responses: { '200': { description: 'Login exitoso' } }
      }
    },
    '/api/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh token',
        parameters: [{ $ref: '#/components/parameters/TenantSlugHeader' }],
        responses: { '200': { description: 'Token renovado' } }
      }
    },
    '/api/users': {
      get: {
        tags: ['Users'],
        summary: 'Listar usuarios',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/TenantSlugHeader' }],
        responses: { '200': { description: 'Lista de usuarios' } }
      }
    },
    '/api/complaints': {
      get: {
        tags: ['Complaints'],
        summary: 'Listar denuncias',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/TenantSlugHeader' }],
        responses: { '200': { description: 'Lista de denuncias' } }
      }
    },
    '/api/investigations': {
      get: {
        tags: ['Investigations'],
        summary: 'Listar investigaciones',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/TenantSlugHeader' }],
        responses: { '200': { description: 'Lista de investigaciones' } }
      }
    },
    '/api/resources': {
      get: {
        tags: ['Resources'],
        summary: 'Obtener todos los recursos',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/TenantSlugHeader' }],
        responses: { '200': { description: 'Recursos del tenant' } }
      }
    }
  }
};

// Middlewares globales
app.use('*', cors());
app.use('*', logger());
app.use('*', secureHeaders());

// Swagger UI
app.get('/api-docs', swaggerUI({ url: '/api-docs/spec' }));
app.get('/api-docs/spec', (c) => c.json(openApiSpec));

// Health check
app.get('/health', (c) => {
  return c.json({
    success: true,
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: c.env.ENVIRONMENT || 'cloudflare-workers'
  });
});

// Root
app.get('/', (c) => {
  return c.json({
    success: true,
    message: 'Harassment Platform API - Cloudflare Workers',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      complaints: '/api/complaints',
      investigations: '/api/investigations',
      resources: '/api/resources',
      health: '/health'
    }
  });
});

// Rutas API
app.route('/api/auth', authRoutes);
app.route('/api/users', userRoutes);
app.route('/api/complaints', complaintRoutes);
app.route('/api/investigations', investigationRoutes);
app.route('/api/resources', resourceRoutes);

// 404 handler
app.notFound((c) => {
  return c.json({ success: false, message: 'Endpoint no encontrado' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({ success: false, message: 'Error interno del servidor' }, 500);
});

export default app;
