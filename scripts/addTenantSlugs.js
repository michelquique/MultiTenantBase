require("dotenv").config();
const mongoose = require("mongoose");
const Tenant = require("../src/models/Tenant");

async function addSlugsToExistingTenants() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Conectado a MongoDB");

  // Buscar tenants sin slug o con slug undefined
  const tenants = await Tenant.find({
    $or: [{ slug: { $exists: false } }, { slug: null }, { slug: "" }],
  });

  console.log(`Tenants sin slug encontrados: ${tenants.length}`);

  for (const tenant of tenants) {
    const slug = tenant.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[áàäâ]/g, "a")
      .replace(/[éèëê]/g, "e")
      .replace(/[íìïî]/g, "i")
      .replace(/[óòöô]/g, "o")
      .replace(/[úùüû]/g, "u")
      .replace(/[ñ]/g, "n")
      .replace(/[^a-z0-9-]/g, "");

    await Tenant.updateOne({ _id: tenant._id }, { slug: slug });
    console.log(`Slug añadido para ${tenant.name}: ${slug}`);
  }

  console.log("Migración completada");
  await mongoose.connection.close();
  process.exit(0);
}

addSlugsToExistingTenants();
