import React from 'react';

interface ProgressProps {
  label: string;
  atual: number;
  totalFase: number;
  totalGlobal: number;
}

const ProgressBarABFIT: React.FC<ProgressProps> = ({ label, atual, totalFase, totalGlobal }) => {
  const porcentagem = Math.min((atual / totalFase) * 100, 100);

  return (
    <div className="bg-zinc-900/40 p-5 rounded-[2.5rem] border border-zinc-800/50 space-y-4 shadow-xl">
      <div className="flex justify-between items-center px-1">
        <span className="text-sm font-black uppercase italic tracking-wider text-white">{label}</span>
        <span className="text-red-600 font-black italic tracking-widest text-sm">{atual} / {totalFase}</span>
      </div>

      <div className="w-full h-3 bg-black rounded-full overflow-hidden border border-zinc-800 p-0.5">
        <div 
          className="h-full bg-red-600 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(220,38,38,0.4)]"
          style={{ width: `${porcentagem}%` }}
        />
      </div>

      <div className="flex justify-end px-1">
        <span className="text-[9px] font-black uppercase italic tracking-[0.2em] text-zinc-600">
          Histórico Total: <span className="text-zinc-400">{totalGlobal}</span> treinos
        </span>
      </div>
    </div>
  );
};

export default ProgressBarABFIT;
