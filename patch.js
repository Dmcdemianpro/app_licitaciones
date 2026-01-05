const fs = require('fs');
const file = 'node_modules/next/dist/build/generate-build-id.js';
let content = fs.readFileSync(file, 'utf8');

// Replace the function to handle undefined generate
content = content.replace(
  'async function generateBuildId(generate, fallback) {\n    let buildId = await generate();',
  'async function generateBuildId(generate, fallback) {\n    let buildId = generate ? await generate() : null;'
);

fs.writeFileSync(file, content);
console.log('Patched generate-build-id.js');
