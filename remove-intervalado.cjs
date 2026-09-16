const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

// Replace everything from id: 'treino-intervalado-desconfortavel-marcelly' up to the end of that object which is '        }' right before '          ],'
const regex = /\{\s*id:\s*'treino-intervalado-desconfortavel-marcelly'.*?\}\s*/s;

code = code.replace(regex, '');
// I see there's a malformed bracket `] },` left over from my previous script, I'll need to clean it up carefully.
fs.writeFileSync('App.tsx', code);
