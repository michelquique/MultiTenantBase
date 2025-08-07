const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");
const User = require("../src/models/User");
const Tenant = require("../src/models/Tenant");
const Resource = require("../src/models/Resource");

// Setup para tests de recursos
describe("Resources Endpoints", () => {
  let tenant1, tenant2;
  let adminUser, rrhhUser, investigatorUser, employeeUser;
  let adminToken, rrhhToken, investigatorToken, employeeToken;

  beforeAll(async () => {
    // Conectar a base de datos de test
    const mongoUri = process.env.MONGODB_TEST_URI || process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
  });

  beforeEach(async () => {
    // Limpiar datos antes de cada test
    await User.deleteMany({});
    await Tenant.deleteMany({});
    await Resource.deleteMany({});

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
      licenses: { total: 100, in_use: 0 },
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
      licenses: { total: 50, in_use: 0 },
      status: "active",
    });

    // Crear usuarios de prueba con diferentes roles
    adminUser = await User.create({
      tenant_id: tenant1._id,
      first_name: "Admin",
      last_name: "Test",
      email: "admin@empresatest.cl",
      password_hash: "Password123!",
      role: "Tenant Admin",
      department: "Administración",
      is_active: true,
    });

    rrhhUser = await User.create({
      tenant_id: tenant1._id,
      first_name: "RRHH",
      last_name: "Test",
      email: "rrhh@empresatest.cl",
      password_hash: "Password123!",
      role: "RRHH",
      department: "Recursos Humanos",
      is_active: true,
    });

    investigatorUser = await User.create({
      tenant_id: tenant1._id,
      first_name: "Investigador",
      last_name: "Test",
      email: "investigador@empresatest.cl",
      password_hash: "Password123!",
      role: "Investigador",
      department: "Legal",
      is_active: true,
    });

    employeeUser = await User.create({
      tenant_id: tenant1._id,
      first_name: "Empleado",
      last_name: "Test",
      email: "empleado@empresatest.cl",
      password_hash: "Password123!",
      role: "Empleado",
      department: "Ventas",
      is_active: true,
    });

    // Obtener tokens para cada usuario
    const adminLogin = await request(app)
      .post("/api/auth/login")
      .set("X-Tenant-Slug", "empresatest")
      .send({
        email: "admin@empresatest.cl",
        password: "Password123!",
      });
    adminToken = adminLogin.body.data.tokens.access_token;

    const rrhhLogin = await request(app)
      .post("/api/auth/login")
      .set("X-Tenant-Slug", "empresatest")
      .send({
        email: "rrhh@empresatest.cl",
        password: "Password123!",
      });
    rrhhToken = rrhhLogin.body.data.tokens.access_token;

    const investigatorLogin = await request(app)
      .post("/api/auth/login")
      .set("X-Tenant-Slug", "empresatest")
      .send({
        email: "investigador@empresatest.cl",
        password: "Password123!",
      });
    investigatorToken = investigatorLogin.body.data.tokens.access_token;

    const employeeLogin = await request(app)
      .post("/api/auth/login")
      .set("X-Tenant-Slug", "empresatest")
      .send({
        email: "empleado@empresatest.cl",
        password: "Password123!",
      });
    employeeToken = employeeLogin.body.data.tokens.access_token;

    // Crear algunos recursos de prueba
    await Resource.create([
      {
        tenant_id: tenant1._id,
        category: "complaint_types",
        key: "sexual",
        label: "Acoso Sexual",
        description: "Denuncias relacionadas con acoso sexual",
        sort_order: 1,
        metadata: {},
      },
      {
        tenant_id: tenant1._id,
        category: "complaint_types",
        key: "psychological",
        label: "Acoso Psicológico",
        description: "Denuncias relacionadas con acoso psicológico",
        sort_order: 2,
        metadata: {},
      },
      {
        tenant_id: tenant1._id,
        category: "complaint_severity",
        key: "low",
        label: "Baja",
        description: "Incidentes menores",
        sort_order: 1,
        metadata: { color: "#28a745", priority_weight: 1 },
      },
      {
        tenant_id: tenant1._id,
        category: "complaint_severity",
        key: "high",
        label: "Alta",
        description: "Incidentes graves",
        sort_order: 2,
        metadata: { color: "#dc3545", priority_weight: 3 },
      },
      {
        tenant_id: tenant1._id,
        category: "user_roles",
        key: "Empleado",
        label: "Empleado",
        description: "Empleado regular",
        sort_order: 1,
        metadata: { permissions: ["create_complaint"] },
      },
    ]);

    // Crear recursos para tenant2 (para probar aislamiento)
    await Resource.create([
      {
        tenant_id: tenant2._id,
        category: "complaint_types",
        key: "discrimination",
        label: "Discriminación",
        description: "Denuncias por discriminación",
        sort_order: 1,
        metadata: {},
      },
    ]);
  });

  afterAll(async () => {
    // Limpiar y cerrar conexión
    await User.deleteMany({});
    await Tenant.deleteMany({});
    await Resource.deleteMany({});
    await mongoose.connection.close();
  });

  describe("GET /api/resources", () => {
    test("Debería obtener todos los recursos agrupados por categoría", async () => {
      const response = await request(app)
        .get("/api/resources")
        .set("X-Tenant-Slug", "empresatest")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: "Recursos obtenidos exitosamente",
      });

      expect(response.body.data).toHaveProperty("complaint_types");
      expect(response.body.data).toHaveProperty("complaint_severity");
      expect(response.body.data).toHaveProperty("user_roles");

      expect(response.body.data.complaint_types).toHaveLength(2);
      expect(response.body.data.complaint_severity).toHaveLength(2);
      expect(response.body.data.user_roles).toHaveLength(1);

      // Verificar estructura de recurso
      expect(response.body.data.complaint_types[0]).toMatchObject({
        key: "sexual",
        label: "Acoso Sexual",
        description: "Denuncias relacionadas con acoso sexual",
        sort_order: 1,
        metadata: {},
      });
    });

    test("Debería funcionar con diferentes roles", async () => {
      // Test con RRHH
      const rrhhResponse = await request(app)
        .get("/api/resources")
        .set("X-Tenant-Slug", "empresatest")
        .set("Authorization", `Bearer ${rrhhToken}`)
        .expect(200);

      expect(rrhhResponse.body.success).toBe(true);

      // Test con Empleado
      const employeeResponse = await request(app)
        .get("/api/resources")
        .set("X-Tenant-Slug", "empresatest")
        .set("Authorization", `Bearer ${employeeToken}`)
        .expect(200);

      expect(employeeResponse.body.success).toBe(true);
    });

    test("Debería filtrar solo recursos activos por defecto", async () => {
      // Crear un recurso inactivo
      await Resource.create({
        tenant_id: tenant1._id,
        category: "complaint_types",
        key: "inactive",
        label: "Tipo Inactivo",
        description: "Tipo inactivo de prueba",
        sort_order: 3,
        is_active: false,
        metadata: {},
      });

      const response = await request(app)
        .get("/api/resources")
        .set("X-Tenant-Slug", "empresatest")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      // No debería incluir el recurso inactivo
      expect(response.body.data.complaint_types).toHaveLength(2);
      const keys = response.body.data.complaint_types.map((r) => r.key);
      expect(keys).not.toContain("inactive");
    });

    test("Debería incluir recursos inactivos cuando active=false", async () => {
      // Crear un recurso inactivo
      await Resource.create({
        tenant_id: tenant1._id,
        category: "complaint_types",
        key: "inactive",
        label: "Tipo Inactivo",
        description: "Tipo inactivo de prueba",
        sort_order: 3,
        is_active: false,
        metadata: {},
      });

      const response = await request(app)
        .get("/api/resources?active=false")
        .set("X-Tenant-Slug", "empresatest")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      // Debería incluir el recurso inactivo
      expect(response.body.data.complaint_types).toHaveLength(3);
      const keys = response.body.data.complaint_types.map((r) => r.key);
      expect(keys).toContain("inactive");
    });

    test("Debería aislar recursos por tenant", async () => {
      const response = await request(app)
        .get("/api/resources")
        .set("X-Tenant-Slug", "empresatest")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      // No debería incluir recursos de tenant2
      const allKeys = Object.values(response.body.data)
        .flat()
        .map((r) => r.key);
      expect(allKeys).not.toContain("discrimination");
    });

    test("Debería fallar sin token de autenticación", async () => {
      await request(app)
        .get("/api/resources")
        .set("X-Tenant-Slug", "empresatest")
        .expect(401);
    });

    test("Debería fallar sin header de tenant", async () => {
      await request(app)
        .get("/api/resources")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(400);
    });
  });

  describe("GET /api/resources/:category", () => {
    test("Debería obtener recursos de una categoría específica", async () => {
      const response = await request(app)
        .get("/api/resources/complaint_types")
        .set("X-Tenant-Slug", "empresatest")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: "Recursos de complaint_types obtenidos exitosamente",
      });

      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toMatchObject({
        key: "sexual",
        label: "Acoso Sexual",
        sort_order: 1,
      });
    });

    test("Debería devolver 404 para categoría sin recursos", async () => {
      const response = await request(app)
        .get("/api/resources/evidence_types")
        .set("X-Tenant-Slug", "empresatest")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: "No se encontraron recursos para la categoría: evidence_types",
      });
    });

    test("Debería validar categoría inválida", async () => {
      await request(app)
        .get("/api/resources/invalid_category")
        .set("X-Tenant-Slug", "empresatest")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(400);
    });

    test("Debería respetar parámetro active", async () => {
      // Crear recurso inactivo
      await Resource.create({
        tenant_id: tenant1._id,
        category: "complaint_severity",
        key: "critical",
        label: "Crítica",
        description: "Severidad crítica",
        sort_order: 3,
        is_active: false,
        metadata: {},
      });

      // Por defecto solo activos
      const activeResponse = await request(app)
        .get("/api/resources/complaint_severity")
        .set("X-Tenant-Slug", "empresatest")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(activeResponse.body.data).toHaveLength(2);

      // Con active=false incluye inactivos
      const allResponse = await request(app)
        .get("/api/resources/complaint_severity?active=false")
        .set("X-Tenant-Slug", "empresatest")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(allResponse.body.data).toHaveLength(3);
    });
  });

  describe("GET /api/resources/:category/:key/validate", () => {
    test("Debería validar clave existente", async () => {
      const response = await request(app)
        .get("/api/resources/complaint_types/sexual/validate")
        .set("X-Tenant-Slug", "empresatest")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: "Clave válida",
        data: {
          category: "complaint_types",
          key: "sexual",
          is_valid: true,
        },
      });
    });

    test("Debería invalidar clave inexistente", async () => {
      const response = await request(app)
        .get("/api/resources/complaint_types/nonexistent/validate")
        .set("X-Tenant-Slug", "empresatest")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: "Clave no válida",
        data: {
          category: "complaint_types",
          key: "nonexistent",
          is_valid: false,
        },
      });
    });

    test("Debería validar parámetros", async () => {
      // Categoría inválida
      await request(app)
        .get("/api/resources/invalid_category/test/validate")
        .set("X-Tenant-Slug", "empresatest")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(400);

      // Clave con caracteres inválidos
      await request(app)
        .get("/api/resources/complaint_types/test@invalid/validate")
        .set("X-Tenant-Slug", "empresatest")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(400);
    });
  });

  describe("POST /api/resources", () => {
    test("Debería crear nuevo recurso (Tenant Admin)", async () => {
      const newResource = {
        category: "complaint_types",
        key: "violence",
        label: "Violencia Física",
        description: "Denuncias por violencia física",
        sort_order: 3,
        metadata: { color: "#ff0000", icon: "warning" },
      };

      const response = await request(app)
        .post("/api/resources")
        .set("X-Tenant-Slug", "empresatest")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(newResource)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: "Recurso creado exitosamente",
        data: {
          key: "violence",
          label: "Violencia Física",
          description: "Denuncias por violencia física",
          sort_order: 3,
          metadata: { color: "#ff0000", icon: "warning" },
        },
      });

      // Verificar que se creó en BD
      const created = await Resource.findOne({
        tenant_id: tenant1._id,
        category: "complaint_types",
        key: "violence",
      });
      expect(created).toBeTruthy();
    });

    test("Debería fallar con rol no autorizado", async () => {
      const newResource = {
        category: "complaint_types",
        key: "violence",
        label: "Violencia Física",
        description: "Denuncias por violencia física",
      };

      // RRHH no puede crear recursos
      await request(app)
        .post("/api/resources")
        .set("X-Tenant-Slug", "empresatest")
        .set("Authorization", `Bearer ${rrhhToken}`)
        .send(newResource)
        .expect(403);

      // Empleado no puede crear recursos
      await request(app)
        .post("/api/resources")
        .set("X-Tenant-Slug", "empresatest")
        .set("Authorization", `Bearer ${employeeToken}`)
        .send(newResource)
        .expect(403);
    });

    test("Debería validar datos requeridos", async () => {
      // Sin category
      await request(app)
        .post("/api/resources")
        .set("X-Tenant-Slug", "empresatest")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          key: "test",
          label: "Test",
        })
        .expect(400);

      // Sin key
      await request(app)
        .post("/api/resources")
        .set("X-Tenant-Slug", "empresatest")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          category: "complaint_types",
          label: "Test",
        })
        .expect(400);

      // Sin label
      await request(app)
        .post("/api/resources")
        .set("X-Tenant-Slug", "empresatest")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          category: "complaint_types",
          key: "test",
        })
        .expect(400);
    });

    test("Debería validar formato de datos", async () => {
      // Categoría inválida
      await request(app)
        .post("/api/resources")
        .set("X-Tenant-Slug", "empresatest")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          category: "invalid_category",
          key: "test",
          label: "Test",
        })
        .expect(400);

      // Key con caracteres inválidos
      await request(app)
        .post("/api/resources")
        .set("X-Tenant-Slug", "empresatest")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          category: "complaint_types",
          key: "test@invalid!",
          label: "Test",
        })
        .expect(400);

      // sort_order negativo
      await request(app)
        .post("/api/resources")
        .set("X-Tenant-Slug", "empresatest")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          category: "complaint_types",
          key: "test",
          label: "Test",
          sort_order: -1,
        })
        .expect(400);
    });

    test("Debería prevenir duplicados", async () => {
      const newResource = {
        category: "complaint_types",
        key: "sexual", // Ya existe
        label: "Otro Acoso Sexual",
        description: "Duplicado",
      };

      const response = await request(app)
        .post("/api/resources")
        .set("X-Tenant-Slug", "empresatest")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(newResource)
        .expect(409);

      expect(response.body.message).toContain("Ya existe un recurso");
    });
  });

  describe("PUT /api/resources/:category/:key", () => {
    test("Debería actualizar recurso existente (Tenant Admin)", async () => {
      const updates = {
        label: "Acoso Sexual Actualizado",
        description: "Descripción actualizada",
        metadata: { color: "#ff5722", updated: true },
      };

      const response = await request(app)
        .put("/api/resources/complaint_types/sexual")
        .set("X-Tenant-Slug", "empresatest")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updates)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: "Recurso actualizado exitosamente",
        data: {
          key: "sexual",
          label: "Acoso Sexual Actualizado",
          description: "Descripción actualizada",
          metadata: { color: "#ff5722", updated: true },
          is_active: true,
        },
      });

      // Verificar en BD
      const updated = await Resource.findOne({
        tenant_id: tenant1._id,
        category: "complaint_types",
        key: "sexual",
      });
      expect(updated.label).toBe("Acoso Sexual Actualizado");
    });

    test("Debería fallar con rol no autorizado", async () => {
      await request(app)
        .put("/api/resources/complaint_types/sexual")
        .set("X-Tenant-Slug", "empresatest")
        .set("Authorization", `Bearer ${employeeToken}`)
        .send({ label: "Test" })
        .expect(403);
    });

    test("Debería devolver 404 para recurso inexistente", async () => {
      await request(app)
        .put("/api/resources/complaint_types/nonexistent")
        .set("X-Tenant-Slug", "empresatest")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ label: "Test" })
        .expect(404);
    });

    test("Debería validar parámetros de ruta", async () => {
      // Categoría inválida
      await request(app)
        .put("/api/resources/invalid_category/test")
        .set("X-Tenant-Slug", "empresatest")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ label: "Test" })
        .expect(400);
    });

    test("Debería permitir desactivación", async () => {
      const response = await request(app)
        .put("/api/resources/complaint_types/sexual")
        .set("X-Tenant-Slug", "empresatest")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ is_active: false })
        .expect(200);

      expect(response.body.data.is_active).toBe(false);

      // Verificar en BD
      const updated = await Resource.findOne({
        tenant_id: tenant1._id,
        category: "complaint_types",
        key: "sexual",
      });
      expect(updated.is_active).toBe(false);
    });
  });

  describe("DELETE /api/resources/:category/:key", () => {
    test("Debería desactivar recurso (Tenant Admin)", async () => {
      const response = await request(app)
        .delete("/api/resources/complaint_types/sexual")
        .set("X-Tenant-Slug", "empresatest")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: "Recurso desactivado exitosamente",
      });

      // Verificar que se desactivó pero no se eliminó
      const deactivated = await Resource.findOne({
        tenant_id: tenant1._id,
        category: "complaint_types",
        key: "sexual",
      });
      expect(deactivated).toBeTruthy();
      expect(deactivated.is_active).toBe(false);
    });

    test("Debería fallar con rol no autorizado", async () => {
      await request(app)
        .delete("/api/resources/complaint_types/sexual")
        .set("X-Tenant-Slug", "empresatest")
        .set("Authorization", `Bearer ${investigatorToken}`)
        .expect(403);
    });

    test("Debería devolver 404 para recurso inexistente", async () => {
      await request(app)
        .delete("/api/resources/complaint_types/nonexistent")
        .set("X-Tenant-Slug", "empresatest")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(404);
    });

    test("Debería validar parámetros de ruta", async () => {
      await request(app)
        .delete("/api/resources/invalid_category/test")
        .set("X-Tenant-Slug", "empresatest")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(400);
    });
  });

  describe("Aislamiento Multi-tenant", () => {
    test("No debería acceder a recursos de otro tenant", async () => {
      // Crear usuario en tenant2
      const tenant2User = await User.create({
        tenant_id: tenant2._id,
        first_name: "Admin",
        last_name: "Tenant2",
        email: "admin@otraempresatest.cl",
        password_hash: "Password123!",
        role: "Tenant Admin",
        is_active: true,
      });

      const tenant2Login = await request(app)
        .post("/api/auth/login")
        .set("X-Tenant-Slug", "otraempresatest")
        .send({
          email: "admin@otraempresatest.cl",
          password: "Password123!",
        });

      const tenant2Token = tenant2Login.body.data.tokens.access_token;

      // Obtener recursos de tenant2
      const response = await request(app)
        .get("/api/resources")
        .set("X-Tenant-Slug", "otraempresatest")
        .set("Authorization", `Bearer ${tenant2Token}`)
        .expect(200);

      // Solo debería ver recursos de tenant2
      expect(response.body.data.complaint_types).toHaveLength(1);
      expect(response.body.data.complaint_types[0].key).toBe("discrimination");
    });

    test("No debería poder validar claves de otro tenant", async () => {
      // Intentar validar clave de tenant1 usando slug de tenant2
      const response = await request(app)
        .get("/api/resources/complaint_types/sexual/validate")
        .set("X-Tenant-Slug", "otraempresatest")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      // La clave 'sexual' no existe en tenant2
      expect(response.body.data.is_valid).toBe(false);
    });
  });
});
