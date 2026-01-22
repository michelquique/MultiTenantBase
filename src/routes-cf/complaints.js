import { Hono } from 'hono';
import { getDB } from '../lib/mongodb-atlas';
import { authMiddleware } from '../middleware-cf/auth';

const complaints = new Hono();

complaints.use('*', authMiddleware);

// GET /api/complaints
complaints.get('/', async (c) => {
  const db = getDB(c.env);
  const tenantId = c.get('tenant');
  
  const result = await db.find('complaints', { tenant: { $oid: tenantId } });
  return c.json({ success: true, data: result.documents });
});

// POST /api/complaints
complaints.post('/', async (c) => {
  const body = await c.req.json();
  const tenantId = c.get('tenant');
  const userId = c.get('userId');

  const db = getDB(c.env);
  const result = await db.insertOne('complaints', {
    ...body,
    tenant: { $oid: tenantId },
    createdBy: { $oid: userId },
    status: 'pending',
    createdAt: new Date().toISOString()
  });

  return c.json({ success: true, data: { id: result.insertedId } }, 201);
});

// GET /api/complaints/:id
complaints.get('/:id', async (c) => {
  const db = getDB(c.env);
  const result = await db.findOne('complaints', { _id: { $oid: c.req.param('id') } });
  
  if (!result.document) {
    return c.json({ success: false, message: 'Denuncia no encontrada' }, 404);
  }

  return c.json({ success: true, data: result.document });
});

export default complaints;
