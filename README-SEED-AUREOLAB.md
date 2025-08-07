# Seed de Datos - Aureolab

Este documento explica cómo usar los scripts de seed para el tenant **Aureolab**.

## Archivo Creado

- `src/scripts/seedDataAureolab.js` - Script de seed específico para Aureolab
- `runSeedAureolab.js` - Script ejecutable para correr el seed

## Datos Creados

### Tenant: Aureolab Innovación S.A.

- **RUT**: 78.555.123-4
- **Slug**: aureolab
- **Plan**: Enterprise
- **Licencias**: 200 (8 en uso)

### Usuarios Creados

| Email                           | Password     | Rol          | Departamento      |
| ------------------------------- | ------------ | ------------ | ----------------- |
| directora@aureolab.cl           | Admin123!    | Tenant Admin | Dirección General |
| diego.morales@aureolab.cl       | Password123! | RRHH         | Recursos Humanos  |
| elena.investigadora@aureolab.cl | Password123! | Investigador | Compliance        |
| roberto.dev@aureolab.cl         | Password123! | Empleado     | Tecnología        |
| carmen.design@aureolab.cl       | Password123! | Empleado     | Diseño UX/UI      |
| fernando.analista@aureolab.cl   | Password123! | Investigador | Compliance        |
| patricia.marketing@aureolab.cl  | Password123! | Empleado     | Marketing Digital |
| miguel.gerente@aureolab.cl      | Password123! | Manager      | Proyectos         |

### Denuncias Creadas

1. **Presión laboral excesiva y ambiente tóxico** (investigating)

   - Denunciante: Roberto (Desarrollador)
   - Acusado: Miguel (Manager)
   - Investigador: Elena

2. **Discriminación de género en asignación de proyectos** (under_review)

   - Denunciante: Carmen (Diseñadora)
   - Acusado: Patricia (Marketing)
   - Investigador: Fernando

3. **Conflicto de intereses y favoritismo** (submitted)

   - Denunciante: Diego (RRHH)
   - Acusado: Sofia (Directora)

4. **Comentarios inapropiados y acoso** (investigating)

   - Denunciante: Patricia (Marketing)
   - Acusado: Roberto (Desarrollador)
   - Investigador: Elena

5. **Obstrucción a investigaciones internas** (under_review)
   - Denunciante: Fernando (Investigador)
   - Acusado: Miguel (Manager)

### Investigaciones Creadas

1. **Presión laboral excesiva** (evidence_review)

   - Investigador: Elena
   - Estado: Revisión de evidencia
   - Incluye: Entrevistas, evidencia documental, timeline

2. **Acoso sexual** (completed)
   - Investigador: Elena
   - Estado: Completada
   - Incluye: Conclusiones, recomendaciones, medidas disciplinarias

## Cómo Ejecutar

### Prerrequisitos

- MongoDB ejecutándose
- Variables de entorno configuradas (`.env`)
- `NODE_ENV=development`

### Ejecutar Seed de Aureolab

```bash
# Ejecutar solo el seed de Aureolab
node runSeedAureolab.js
```

### Ejecutar Seed Original

```bash
# Ejecutar el seed original (que incluye otros tenants)
node src/scripts/seedData.js
```

## Notas Importantes

- ⚠️ **Solo funciona en entorno development**
- ⚠️ **Si el tenant ya existe, se limpiarán sus datos relacionados**
- ⚠️ **Asegúrate de tener backup de datos importantes**
- ✅ **El seed de Aureolab es independiente y no afecta otros tenants**

## Estructura de Datos

El seed crea un ecosistema completo con:

- Relaciones entre usuarios, denuncias e investigaciones
- Timeline detallado de investigaciones
- Evidencia documentada
- Entrevistas con testimonios
- Hallazgos y recomendaciones
- Estados realistas de casos en diferentes fases

## Casos de Uso

Este seed es útil para:

- **Testing de la aplicación** con datos realistas
- **Demos** del sistema completo
- **Desarrollo** de nuevas funcionalidades
- **Training** de usuarios en un ambiente controlado
