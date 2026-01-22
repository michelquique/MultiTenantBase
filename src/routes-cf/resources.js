import { Hono } from 'hono';
import { getDB } from '../lib/mongodb-atlas';
import { authMiddleware } from '../middleware-cf/auth';

const resources = new Hono();

resources.use('*', authMiddleware);

// GET /api/resources
resources.get('/', async (c) => {
  const db = getDB(c.env);
  const tenantId = c.get('tenant');
  
  const result = await db.find('resources', { tenant: { $oid: tenantId } });
  return c.json({ success: true, data: result.documents });
});

// POST /api/resources
resources.post('/', async (c) => {
  const body = await c.req.json();
  const tenantId = c.get('tenant');

  const db = getDB(c.env);
  const result = await db.insertOne('resources', {
    ...body,
    tenant: { $oid: tenantId },
    createdAt: new Date().toISOString()
  });

  return c.json({ success: true, data: { id: result.insertedId } }, 201);
});

export default resources;
