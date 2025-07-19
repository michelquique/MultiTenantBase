require("dotenv").config();

// Setup global para todos los tests
beforeAll(() => {
  // Asegurar que estamos en modo test
  process.env.NODE_ENV = "test";

  // Silenciar logs durante tests
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
});

// Timeout para tests async
jest.setTimeout(30000);
