#!/bin/bash
# Aplicar parche a Next.js para resolver bug de generateBuildId
node -e "
const fs = require('fs');
const file = 'node_modules/next/dist/build/generate-build-id.js';
if (!fs.existsSync(file)) {
  console.log('Next.js no encontrado');
  process.exit(1);
}
let content = fs.readFileSync(file, 'utf8');
if (content.includes('let buildId = generate ? await generate() : null;')) {
  console.log('Parche ya aplicado');
  process.exit(0);
}
content = content.replace(
  'let buildId = await generate();',
  'let buildId = generate ? await generate() : null;'
);
fs.writeFileSync(file, content);
console.log('✓ Parche aplicado exitosamente');
"
