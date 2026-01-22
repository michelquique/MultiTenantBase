import { Hono } from 'hono';
import { getDB } from '../lib/mongodb-atlas';
import { authMiddleware } from '../middleware-cf/auth';

const users = new Hono();

users.use('*', authMiddleware);

// GET /api/users
users.get('/', async (c) => {
  const db = getDB(c.env);
  const tenantId = c.get('tenant');
  
  const result = await db.find('users', { tenant: { $oid: tenantId } }, {
    projection: { password: 0 }
  });

  return c.json({ success: true, data: result.documents });
});

// GET /api/users/:id
users.get('/:id', async (c) => {
  const db = getDB(c.env);
  const result = await db.findOne('users', { _id: { $oid: c.req.param('id') } });
  
  if (!result.document) {
    return c.json({ success: false, message: 'Usuario no encontrado' }, 404);
  }

  const { password, ...user } = result.document;
  return c.json({ success: true, data: user });
});

export default users;
