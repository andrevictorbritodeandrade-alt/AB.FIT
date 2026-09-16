const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

code = code.replace(
  "id: 'a-b-9', name: 'Mata-borrão isométrico no solo', sets: '3', reps: '13', rest: '20s', executionType: 'Simples'",
  "id: 'a-b-9', name: 'Abdominal na máquina crunch', sets: '3', reps: '13', rest: '20s', executionType: 'Simples'"
);

code = code.replace(/'18-sessoes-3x13-v20s'/g, "'18-sessoes-3x13-v21-crunch'");

fs.writeFileSync('App.tsx', code);
