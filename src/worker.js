import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';

// Importar rutas
import authRoutes from './routes-cf/auth';
import userRoutes from './routes-cf/users';
import complaintRoutes from './routes-cf/complaints';
import investigationRoutes from './routes-cf/investigations';
import resourceRoutes from './routes-cf/resources';

const app = new Hono();

// Middlewares globales
app.use('*', cors());
app.use('*', logger());
app.use('*', secureHeaders());

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
