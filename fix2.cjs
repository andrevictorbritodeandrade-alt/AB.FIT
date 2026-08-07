const fs = require('fs');
let content = fs.readFileSync('components/GeraAi.tsx', 'utf-8');
content = content.replace(
  /    \}\n\n    \} finally \{\n      setIsGenerating\(false\);\n    \}/,
  `    }\n\n    setIsGenerating(false);`
);
fs.writeFileSync('components/GeraAi.tsx', content);
