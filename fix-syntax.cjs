const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

// I want to clean everything between:
// `              ]
//             },
//             ]
//             },`
// and 
// `            {
//               id: 'treino-rodagem-marcelly',`

const startMarker = `              ]
            },
            ]
            },
            ,
                { id: 'ex-b1-2-m', name: 'Bloco 1: Corrida Moderada/Forte / Caminhada', sets: '4', reps: '1:30 min / 1:30 min', rest: '0s', executionType: 'Simples', description: 'Ritmo deve ser desafiador, dificultando a fala durante o tiro.' },
                { id: 'ex-tr-2-m', name: 'Transição: Caminhada', sets: '1', reps: '8:30 min', rest: '0s', executionType: 'Simples' },
                { id: 'ex-b2-2-m', name: 'Bloco 2: Corrida Moderada/Forte / Caminhada', sets: '4', reps: '1:30 min / 2:00 min', rest: '0s', executionType: 'Simples', description: 'Ritmo deve ser desafiador, dificultando a fala durante o tiro.' },
                { id: 'ex-dq-2-m', name: 'Desaquecimento: Caminhada', sets: '1', reps: '8:30 min', rest: '0s', executionType: 'Simples' }
              ]
            },
            {
              id: 'treino-rodagem-marcelly',
              title: 'RODAGEM - Ter/Qui',
              projectedSessions: 20,
              frequencyWeekly: 2,
              status: 'published',
              exercises: [
                { id: 'ex-rod-1-m', name: 'Caminhada Contínua a 5,5 km/h', sets: '1', reps: '60 min', rest: '0s', executionType: 'Simples' }
              ]
            }`;

const correctClosing = `              ]
            }`;

code = code.replace(startMarker, correctClosing);
fs.writeFileSync('App.tsx', code);
