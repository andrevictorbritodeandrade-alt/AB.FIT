const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

// Change revision string to trigger sync
code = code.replace(/18-sessoes-3x13-marcelly-exact-andre/g, '18-sessoes-marcelly-split-ab-v2');

// Fix Marcelly's workouts
const regex = /id:\s*'treino-a-marcelly'.*?id:\s*'treino-intervalado-confortavel-marcelly'/s;

const newWorkouts = `id: 'treino-a-marcelly',
              title: 'TREINO A (Membros Inferiores)',
              projectedSessions: 18,
              frequencyWeekly: 3,
              status: 'published',
              description: '18 treinos (6 semanas, 3x/semana). Ajustes de carga no treino 6 e 12.',
              exercises: [
                { id: 'm-a-1', name: 'Leg press horizontal/máquina', sets: '3', reps: '13', rest: '20s', executionType: 'Simples' },
                { id: 'm-a-2', name: 'Agachamento no aparelho hack machine', sets: '3', reps: '13', rest: '20s', executionType: 'Simples' },
                { id: 'm-a-3', name: 'Cadeira extensora', sets: '3', reps: '13', rest: '20s', executionType: 'Simples' },
                { id: 'm-a-4', name: 'Cadeira extensora unilateral', sets: '3', reps: '13', rest: '20s', executionType: 'Simples' },
                { id: 'm-b-1', name: 'Stiff em pé com HBC ou HBM', sets: '3', reps: '13', rest: '20s', executionType: 'Simples' },
                { id: 'm-b-2', name: 'Extensão de quadril na máquina', sets: '3', reps: '13', rest: '20s', executionType: 'Simples' },
                { id: 'm-b-3', name: 'Cadeira abdutora', sets: '3', reps: '13', rest: '20s', executionType: 'Simples' },
                { id: 'm-b-4', name: 'Cadeira flexora', sets: '3', reps: '13', rest: '20s', executionType: 'Simples' },
                { id: 'm-a-9', name: 'Abdominal na máquina crunch', sets: '3', reps: '13', rest: '20s', executionType: 'Simples' }
              ]
            },
            {
              id: 'treino-b-marcelly',
              title: 'TREINO B (Membros Superiores)',
              projectedSessions: 18,
              frequencyWeekly: 3,
              status: 'published',
              description: '18 treinos (6 semanas, 3x/semana). Ajustes de carga no treino 6 e 12.',
              exercises: [
                { id: 'm-a-5', name: 'Supino aberto na máquina', sets: '3', reps: '13', rest: '20s', executionType: 'Simples' },
                { id: 'm-a-6', name: 'Supino aberto no banco inclinado na máquina', sets: '3', reps: '13', rest: '20s', executionType: 'Simples' },
                { id: 'm-a-7', name: 'Desenvolvimento aberto máquina', sets: '3', reps: '13', rest: '20s', executionType: 'Simples' },
                { id: 'm-a-8', name: 'Tríceps em pé no Cross barra reta', sets: '3', reps: '13', rest: '20s', executionType: 'Simples' },
                { id: 'm-b-5', name: 'Remada aberta na máquina', sets: '3', reps: '13', rest: '20s', executionType: 'Simples' },
                { id: 'm-b-6', name: 'Remada fechada na máquina', sets: '3', reps: '13', rest: '20s', executionType: 'Simples' },
                { id: 'm-b-7', name: 'Puxada fechada com triângulo no pulley alto', sets: '3', reps: '13', rest: '20s', executionType: 'Simples' },
                { id: 'm-b-8', name: 'Bíceps em pé no cross barra reta', sets: '3', reps: '13', rest: '20s', executionType: 'Simples' },
                { id: 'm-b-9', name: 'Mata-borrão isométrico no solo', sets: '3', reps: '13', rest: '20s', executionType: 'Simples' }
              ]
            },
            {
              id: 'treino-intervalado-confortavel-marcelly'`;

code = code.replace(regex, newWorkouts);
fs.writeFileSync('App.tsx', code);
console.log('Workouts updated');
