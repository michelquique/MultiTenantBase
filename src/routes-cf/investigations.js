import { Hono } from 'hono';
import { getDB } from '../lib/mongodb-atlas';
import { authMiddleware } from '../middleware-cf/auth';

const investigations = new Hono();

investigations.use('*', authMiddleware);

// GET /api/investigations
investigations.get('/', async (c) => {
  const db = getDB(c.env);
  const tenantId = c.get('tenant');
  
  const result = await db.find('investigations', { tenant: { $oid: tenantId } });
  return c.json({ success: true, data: result.documents });
});

// POST /api/investigations
investigations.post('/', async (c) => {
  const body = await c.req.json();
  const tenantId = c.get('tenant');
  const userId = c.get('userId');

  const db = getDB(c.env);
  const result = await db.insertOne('investigations', {
    ...body,
    tenant: { $oid: tenantId },
    investigator: { $oid: userId },
    status: 'open',
    createdAt: new Date().toISOString()
  });

  return c.json({ success: true, data: { id: result.insertedId } }, 201);
});

export default investigations;
