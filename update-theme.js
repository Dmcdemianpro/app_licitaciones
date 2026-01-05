const fs = require('fs');
const path = require('path');

// List of files to update
const files = [
  'app/tickets/page.tsx',
  'app/licitaciones/page.tsx',
  'app/citas/page.tsx',
  'app/notificaciones/page.tsx',
  'app/reportes/page.tsx',
  'app/configuracion/page.tsx',
  'app/usuarios/nuevo/page.tsx',
  'app/licitaciones/[id]/page.tsx',
  'app/usuarios/[id]/page.tsx',
  'app/tickets/[id]/page.tsx',
  'app/citas/[id]/page.tsx',
  'app/citas/[id]/editar/page.tsx'
];

// Replacements to apply
const replacements = [
  // Main container backgrounds
  {
    from: /className="([^"]*\s)?bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900([^"]*)/g,
    to: 'className="$1bg-gradient-to-b from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900$2'
  },
  {
    from: /className="([^"]*\s)?bg-gradient-to-b from-white\/5 via-white\/0 to-white\/0([^"]*)/g,
    to: 'className="$1bg-gradient-to-b from-purple-50/50 via-transparent to-transparent dark:from-white/5 dark:via-white/0 dark:to-white/0$2'
  },
  // Text colors
  {
    from: / text-slate-50(["\s])/g,
    to: ' text-slate-900 dark:text-slate-50$1'
  },
  {
    from: / text-white(["\s])/g,
    to: ' text-slate-900 dark:text-white$1'
  },
  {
    from: / text-slate-200(["\s])/g,
    to: ' text-slate-600 dark:text-slate-200$1'
  },
  {
    from: / text-slate-300(["\s])/g,
    to: ' text-slate-600 dark:text-slate-300$1'
  },
  {
    from: / text-indigo-200(["\s])/g,
    to: ' text-indigo-600 dark:text-indigo-200$1'
  },
  // Borders
  {
    from: / border-white\/10(["\s])/g,
    to: ' border-slate-200 dark:border-white/10$1'
  },
  {
    from: / border-white\/20(["\s])/g,
    to: ' border-slate-300 dark:border-white/20$1'
  },
  // Backgrounds
  {
    from: / bg-white\/5(["\s])/g,
    to: ' bg-white/80 dark:bg-white/5$1'
  },
  {
    from: / bg-white\/10(["\s])/g,
    to: ' bg-white/90 dark:bg-white/10$1'
  },
  {
    from: / bg-slate-900\/70(["\s])/g,
    to: ' bg-white/90 dark:bg-slate-900/70$1'
  }
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  replacements.forEach(({ from, to }) => {
    if (from.test(content)) {
      content = content.replace(from, to);
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated: ${file}`);
  } else {
    console.log(`⏭️  No changes needed: ${file}`);
  }
});

console.log('\n✨ Theme update complete!');
