const fs = require('fs');
let content = fs.readFileSync('components/GeraAi.tsx', 'utf-8');
content = content.replace(/ase leading-\[1\.1\]\">\s*\{selectedExercise\.name\}\s*<\/h2>/s, "");
fs.writeFileSync('components/GeraAi.tsx', content);
