import { Hono } from 'hono';
import { getDB } from '../lib/mongodb-atlas';
import { hashPassword, comparePassword, signJWT } from '../lib/crypto-cf';

const auth = new Hono();

// POST /api/auth/login
auth.post('/login', async (c) => {
  const { email, password } = await c.req.json();
  const tenantId = c.req.header('x-tenant-id');

  if (!email || !password) {
    return c.json({ success: false, message: 'Email y password requeridos' }, 400);
  }

  const db = getDB(c.env);
  const result = await db.findOne('users', { email, tenant: { $oid: tenantId } });

  if (!result.document) {
    return c.json({ success: false, message: 'Credenciales inválidas' }, 401);
  }

  const user = result.document;
  const validPassword = await comparePassword(password, user.password);

  if (!validPassword) {
    return c.json({ success: false, message: 'Credenciales inválidas' }, 401);
  }

  const token = await signJWT(
    { userId: user._id, role: user.role, tenant: tenantId },
    c.env.JWT_SECRET
  );

  return c.json({
    success: true,
    data: {
      token,
      user: { id: user._id, email: user.email, name: user.name, role: user.role }
    }
  });
});

// POST /api/auth/register
auth.post('/register', async (c) => {
  const body = await c.req.json();
  const tenantId = c.req.header('x-tenant-id');

  const hashedPassword = await hashPassword(body.password);
  
  const db = getDB(c.env);
  const result = await db.insertOne('users', {
    ...body,
    password: hashedPassword,
    tenant: { $oid: tenantId },
    createdAt: new Date().toISOString()
  });

  return c.json({ success: true, data: { id: result.insertedId } }, 201);
});

export default auth;
