import React from 'react';
import { ChevronRight, Clock, Play } from 'lucide-react';

const Workouts: React.FC = () => {
    const workouts = [
        { title: "Peito Explosivo", duration: "45 min", level: "Avançado", muscles: "Peitoral, Tríceps" },
        { title: "Costas em V", duration: "50 min", level: "Intermediário", muscles: "Dorsal, Bíceps" },
        { title: "Pernas de Aço", duration: "60 min", level: "Avançado", muscles: "Quadríceps, Posterior" },
        { title: "Ombros 3D", duration: "40 min", level: "Intermediário", muscles: "Deltóides" },
        { title: "HIIT Cardio", duration: "25 min", level: "Todos", muscles: "Corpo todo" },
    ];

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Treinos Disponíveis</h2>
                <span className="text-xs font-bold text-red-500 uppercase tracking-widest">ABFIT Series</span>
            </div>

            <div className="space-y-4">
                {workouts.map((workout, index) => (
                    <div key={index} className="group relative overflow-hidden bg-zinc-900 border border-zinc-800 rounded-xl p-1 transition-all hover:border-red-600/50">
                        <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative p-4 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-white group-hover:text-red-500 transition-colors">{workout.title}</h3>
                                <div className="flex items-center gap-3 mt-2">
                                    <div className="flex items-center gap-1 text-xs text-zinc-400">
                                        <Clock className="w-3 h-3" />
                                        {workout.duration}
                                    </div>
                                    <div className="w-1 h-1 bg-zinc-700 rounded-full"></div>
                                    <span className="text-xs text-zinc-400">{workout.level}</span>
                                </div>
                                <p className="text-xs text-zinc-500 mt-1">{workout.muscles}</p>
                            </div>
                            <button className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center group-hover:bg-red-600 transition-all">
                                <Play className="w-4 h-4 text-white fill-current" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 p-6 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 text-center">
                <p className="text-zinc-500 text-sm">Mais treinos desbloqueados semanalmente com o plano Pro.</p>
            </div>
        </div>
    );
};

export default Workouts;