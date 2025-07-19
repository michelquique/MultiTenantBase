const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");
const User = require("../src/models/User");
const Tenant = require("../src/models/Tenant");

// Setup para tests
describe("Authentication Endpoints", () => {
  let tenant1, tenant2, adminUser, regularUser;

  beforeAll(async () => {
    // Conectar a base de datos de test
    const mongoUri = process.env.MONGODB_TEST_URI || process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
  });

  beforeEach(async () => {
    // Limpiar datos antes de cada test
    await User.deleteMany({});
    await Tenant.deleteMany({});

    // Crear tenants de prueba
    tenant1 = await Tenant.create({
      name: "Empresa Test S.A.",
      slug: "empresatest",
      rut: "76.111.111-1",
      address: "Av. Test 123, Santiago",
      phone: "+56911111111",
      email: "test@empresatest.cl",
      subscription_plan: {
        type: "Premium",
        start_date: new Date(),
        end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        status: "active",
      },
      licenses: {
        total: 100,
        in_use: 0,
      },
      status: "active",
    });

    tenant2 = await Tenant.create({
      name: "Otra Empresa Test Ltda.",
      slug: "otraempresatest",
      rut: "77.222.222-2",
      address: "Av. Test 456, Santiago",
      phone: "+56922222222",
      email: "test@otraempresatest.cl",
      subscription_plan: {
        type: "Standard",
        start_date: new Date(),
        end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        status: "active",
      },
      licenses: {
        total: 50,
        in_use: 0,
      },
      status: "active",
    });

    // Crear usuarios de prueba
    adminUser = await User.create({
      tenant_id: tenant1._id,
      first_name: "Admin",
      last_name: "Test",
      email: "admin@empresatest.cl",
      password_hash: "Admin123!",
      role: "Tenant Admin",
      department: "Administración",
      is_active: true,
    });

    regularUser = await User.create({
      tenant_id: tenant1._id,
      first_name: "User",
      last_name: "Test",
      email: "user@empresatest.cl",
      password_hash: "User123!",
      role: "Empleado",
      department: "Ventas",
      is_active: true,
    });

    // Actualizar licencias
    await tenant1.updateLicenseUsage(true);
    await tenant1.updateLicenseUsage(true);
  });

  afterEach(async () => {
    // Limpiar después de cada test
    await User.deleteMany({});
    await Tenant.deleteMany({});
  });

  afterAll(async () => {
    // Cerrar conexión después de todos los tests
    await mongoose.connection.close();
  });

  describe("POST /api/auth/login", () => {
    test("Debe hacer login exitoso con credenciales válidas y header X-Tenant-Slug", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .set("X-Tenant-Slug", "empresatest")
        .send({
          email: "admin@empresatest.cl",
          password: "Admin123!",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Login exitoso");

      // Verificar estructura de respuesta
      expect(response.body.data).toHaveProperty("user");
      expect(response.body.data).toHaveProperty("tenant");
      expect(response.body.data).toHaveProperty("tokens");

      // Verificar datos del usuario
      expect(response.body.data.user.email).toBe("admin@empresatest.cl");
      expect(response.body.data.user.role).toBe("Tenant Admin");
      expect(response.body.data.user).not.toHaveProperty("password_hash");

      // Verificar datos del tenant
      expect(response.body.data.tenant.name).toBe("Empresa Test S.A.");
      expect(response.body.data.tenant.slug).toBe("empresatest");

      // Verificar tokens
      expect(response.body.data.tokens).toHaveProperty("access_token");
      expect(response.body.data.tokens).toHaveProperty("refresh_token");
      expect(response.body.data.tokens).toHaveProperty("expires_in");
    });

    test("Debe fallar sin header X-Tenant-Slug", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "admin@empresatest.cl",
        password: "Admin123!",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Header X-Tenant-Slug es requerido");
    });

    test("Debe fallar con tenant slug inválido", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .set("X-Tenant-Slug", "tenant-inexistente")
        .send({
          email: "admin@empresatest.cl",
          password: "Admin123!",
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Tenant no encontrado o inactivo");
    });

    test("Debe fallar con formato de slug inválido", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .set("X-Tenant-Slug", "SLUG_INVALIDO!")
        .send({
          email: "admin@empresatest.cl",
          password: "Admin123!",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Formato de tenant slug inválido");
    });

    test("Debe fallar con email inexistente", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .set("X-Tenant-Slug", "empresatest")
        .send({
          email: "noexiste@empresatest.cl",
          password: "Admin123!",
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Credenciales inválidas");
    });

    test("Debe fallar con contraseña incorrecta", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .set("X-Tenant-Slug", "empresatest")
        .send({
          email: "admin@empresatest.cl",
          password: "PasswordIncorrecto",
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Credenciales inválidas");
    });

    test("Debe fallar con usuario inactivo", async () => {
      // Desactivar usuario
      await User.findByIdAndUpdate(adminUser._id, { is_active: false });

      const response = await request(app)
        .post("/api/auth/login")
        .set("X-Tenant-Slug", "empresatest")
        .send({
          email: "admin@empresatest.cl",
          password: "Admin123!",
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Cuenta inactiva");
    });

    test("Debe fallar con tenant inactivo", async () => {
      // Desactivar tenant
      await Tenant.findByIdAndUpdate(tenant1._id, { status: "inactive" });

      const response = await request(app)
        .post("/api/auth/login")
        .set("X-Tenant-Slug", "empresatest")
        .send({
          email: "admin@empresatest.cl",
          password: "Admin123!",
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Tenant no encontrado o inactivo");
    });

    test("Debe aislar usuarios por tenant (multi-tenancy)", async () => {
      // Crear usuario en segundo tenant con mismo email
      await User.create({
        tenant_id: tenant2._id,
        first_name: "Admin2",
        last_name: "Test",
        email: "admin@empresatest.cl", // Mismo email, diferente tenant
        password_hash: "DifferentPass123!",
        role: "Tenant Admin",
        department: "Administración",
        is_active: true,
      });

      // Login con primer tenant debe funcionar
      const response1 = await request(app)
        .post("/api/auth/login")
        .set("X-Tenant-Slug", "empresatest")
        .send({
          email: "admin@empresatest.cl",
          password: "Admin123!",
        });

      expect(response1.status).toBe(200);
      expect(response1.body.data.tenant.slug).toBe("empresatest");

      // Login con segundo tenant y password diferente debe fallar
      const response2 = await request(app)
        .post("/api/auth/login")
        .set("X-Tenant-Slug", "otraempresatest")
        .send({
          email: "admin@empresatest.cl",
          password: "Admin123!", // Password del primer tenant
        });

      expect(response2.status).toBe(401);
      expect(response2.body.message).toBe("Credenciales inválidas");
    });

    test("Debe incrementar intentos fallidos con contraseña incorrecta", async () => {
      // Intentar login con contraseña incorrecta
      await request(app)
        .post("/api/auth/login")
        .set("X-Tenant-Slug", "empresatest")
        .send({
          email: "admin@empresatest.cl",
          password: "PasswordIncorrecto",
        });

      // Verificar que se incrementaron los intentos fallidos
      const user = await User.findById(adminUser._id);
      expect(user.failed_login_attempts).toBe(1);
    });

    test("Debe resetear intentos fallidos después de login exitoso", async () => {
      // Simular intentos fallidos previos
      await User.findByIdAndUpdate(adminUser._id, { failed_login_attempts: 3 });

      // Login exitoso
      const response = await request(app)
        .post("/api/auth/login")
        .set("X-Tenant-Slug", "empresatest")
        .send({
          email: "admin@empresatest.cl",
          password: "Admin123!",
        });

      expect(response.status).toBe(200);

      // Verificar que se resetearon los intentos fallidos
      const user = await User.findById(adminUser._id);
      expect(user.failed_login_attempts).toBe(0);
    });

    test("Debe validar campos requeridos", async () => {
      // Sin email
      const response1 = await request(app)
        .post("/api/auth/login")
        .set("X-Tenant-Slug", "empresatest")
        .send({
          password: "Admin123!",
        });

      expect(response1.status).toBe(400);
      expect(response1.body.success).toBe(false);
      expect(response1.body.message).toBe("Datos de entrada inválidos");

      // Sin password
      const response2 = await request(app)
        .post("/api/auth/login")
        .set("X-Tenant-Slug", "empresatest")
        .send({
          email: "admin@empresatest.cl",
        });

      expect(response2.status).toBe(400);
      expect(response2.body.success).toBe(false);
      expect(response2.body.message).toBe("Datos de entrada inválidos");
    });

    test("Debe validar formato de email", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .set("X-Tenant-Slug", "empresatest")
        .send({
          email: "email-invalido",
          password: "Admin123!",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Datos de entrada inválidos");
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: "email",
            msg: "Email debe tener un formato válido",
          }),
        ])
      );
    });

    test("Debe actualizar último login exitoso", async () => {
      const beforeLogin = new Date();

      await request(app)
        .post("/api/auth/login")
        .set("X-Tenant-Slug", "empresatest")
        .send({
          email: "admin@empresatest.cl",
          password: "Admin123!",
        });

      const user = await User.findById(adminUser._id);
      expect(user.last_login_at).toBeInstanceOf(Date);
      expect(user.last_login_at.getTime()).toBeGreaterThanOrEqual(
        beforeLogin.getTime()
      );
    });
  });

  describe("Rate Limiting", () => {
    test("Debe aplicar rate limiting en login", async () => {
      // Hacer múltiples requests rápidamente para activar rate limiting
      const requests = Array(6)
        .fill()
        .map(() =>
          request(app)
            .post("/api/auth/login")
            .set("X-Tenant-Slug", "empresatest")
            .send({
              email: "admin@empresatest.cl",
              password: "PasswordIncorrecto",
            })
        );

      const responses = await Promise.all(requests);

      // Algunos requests deben ser bloqueados por rate limiting
      const rateLimitedResponses = responses.filter((r) => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});
