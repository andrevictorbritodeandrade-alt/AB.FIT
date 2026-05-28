import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Flame, Timer, TrendingUp, Activity, Dumbbell } from 'lucide-react';

const data = [
  { name: 'Seg', kcal: 240 },
  { name: 'Ter', kcal: 320 },
  { name: 'Qua', kcal: 450 },
  { name: 'Qui', kcal: 290 },
  { name: 'Sex', kcal: 510 },
  { name: 'Sab', kcal: 380 },
  { name: 'Dom', kcal: 420 },
];

const Dashboard: React.FC = () => {
  return (
    <div className="p-6 space-y-8 animate-fade-in">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-white">Olá, Atleta</h2>
        <p className="text-zinc-400 text-sm">Pronto para superar seus limites hoje?</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard 
            icon={<Flame className="text-orange-500" />}
            value="2,450"
            label="Kcal Queimadas"
            subLabel="+12% essa semana"
        />
        <StatCard 
            icon={<Timer className="text-blue-500" />}
            value="5h 20m"
            label="Tempo de Treino"
            subLabel="Média diária 45m"
        />
        <StatCard 
            icon={<TrendingUp className="text-green-500" />}
            value="85 kg"
            label="Peso Atual"
            subLabel="-1.2kg do objetivo"
        />
        <StatCard 
            icon={<Activity className="text-red-500" />}
            value="142"
            label="BPM Médio"
            subLabel="Pico de 178"
        />
      </div>

      <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800">
        <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg">Atividade Semanal</h3>
            <span className="text-xs font-medium px-2 py-1 bg-red-600/10 text-red-500 rounded-md">Intenso</span>
        </div>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorKcal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 12}} />
              <Tooltip 
                contentStyle={{backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fff'}}
                itemStyle={{color: '#dc2626'}}
              />
              <Area type="monotone" dataKey="kcal" stroke="#dc2626" strokeWidth={3} fillOpacity={1} fill="url(#colorKcal)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-900 to-black border border-red-900/50 p-6">
          <div className="relative z-10">
              <h3 className="text-lg font-bold text-white mb-2">Próximo Treino: Superiores</h3>
              <p className="text-red-200 text-sm mb-4">Foco em hipertrofia de peito e tríceps.</p>
              <button className="bg-white text-black font-bold py-2 px-6 rounded-full text-sm hover:bg-zinc-200 transition">
                  Começar Agora
              </button>
          </div>
          <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4">
             <Dumbbell className="w-48 h-48" />
          </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, value, label, subLabel }: any) => (
  <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 flex flex-col gap-2">
    <div className="p-2 bg-zinc-800/50 w-fit rounded-lg mb-1">{icon}</div>
    <div>
        <h4 className="text-2xl font-bold text-white">{value}</h4>
        <p className="text-xs text-zinc-400 font-medium">{label}</p>
        <p className="text-[10px] text-zinc-600 mt-1">{subLabel}</p>
    </div>
  </div>
);

export default Dashboard;