import { verifyJWT } from '../lib/crypto-cf';

export const authMiddleware = async (c, next) => {
  const authHeader = c.req.header('Authorization');
  const tenantId = c.req.header('x-tenant-id');

  if (!tenantId) {
    return c.json({ success: false, message: 'Tenant ID requerido' }, 400);
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, message: 'Token no proporcionado' }, 401);
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = await verifyJWT(token, c.env.JWT_SECRET);
    
    c.set('userId', decoded.userId);
    c.set('role', decoded.role);
    c.set('tenant', tenantId);
    
    await next();
  } catch (error) {
    return c.json({ success: false, message: 'Token inválido' }, 401);
  }
};
