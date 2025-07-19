const mongoose = require("mongoose");
const Tenant = require("../src/models/Tenant");

async function addSlugsToExistingTenants() {
  await mongoose.connect(process.env.MONGODB_URI);

  const tenants = await Tenant.find({ slug: { $exists: false } });

  for (const tenant of tenants) {
    const slug = tenant.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[áàäâ]/g, "a")
      // ... más reemplazos ...
      .replace(/[^a-z0-9-]/g, "");

    tenant.slug = slug;
    await tenant.save();
    console.log(`Slug añadido para ${tenant.name}: ${slug}`);
  }

  console.log("Migración completada");
  process.exit(0);
}
