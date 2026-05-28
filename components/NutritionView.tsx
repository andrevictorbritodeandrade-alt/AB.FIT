import React, { useState, useMemo } from 'react';
import { ArrowLeft, ChefHat, Plus, Activity, Utensils, Zap, Loader2, Save } from 'lucide-react';
import { Card, AppFooter } from './Layout';
import { Student, NutritionProfile, MealPlan, MacroNutrients } from '../types';
import { generateAIMealPlan, estimateFoodMacros } from '../services/gemini';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface NutritionProps {
  student: Student;
  onBack: () => void;
  onSave: (id: string, data: any) => void;
}

const COLORS = ['#dc2626', '#3b82f6', '#10b981', '#f59e0b'];

export function NutritionView({ student, onBack, onSave }: NutritionProps) {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'PLAN' | 'LOG'>('DASHBOARD');
  const [profile, setProfile] = useState<NutritionProfile>(student.nutrition || {
    goal: 'Maintenance',
    restrictions: '',
    dailyTargets: { calories: 2000, protein: 150, carbs: 200, fat: 65 },
    logs: [],
    mealPlans: []
  });
  const [loading, setLoading] = useState(false);
  
  // Logging State
  const [foodInput, setFoodInput] = useState('');
  
  // Plan State
  const [planGoal, setPlanGoal] = useState(profile.goal);
  const [planRestrictions, setPlanRestrictions] = useState(profile.restrictions);

  // Derived Stats for Dashboard
  const today = new Date().toISOString().split('T')[0];
  const todayLogs = (profile.logs || []).filter(l => l.date === today);
  
  const totalMacros = useMemo(() => {
    return todayLogs.reduce((acc, log) => ({
      calories: acc.calories + (log.macros.calories || 0),
      protein: acc.protein + (log.macros.protein || 0),
      carbs: acc.carbs + (log.macros.carbs || 0),
      fat: acc.fat + (log.macros.fat || 0)
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }, [todayLogs]);

  const macroData = [
    { name: 'Protein', value: totalMacros.protein },
    { name: 'Carbs', value: totalMacros.carbs },
    { name: 'Fat', value: totalMacros.fat },
  ];

  const handleUpdateProfile = () => {
    onSave(student.id, { nutrition: profile });
  };

  const handleGeneratePlan = async () => {
    setLoading(true);
    const tempProfile = { ...profile, goal: planGoal, restrictions: planRestrictions };
    const plan = await generateAIMealPlan(tempProfile);
    if (plan) {
      const updatedProfile = { 
        ...profile, 
        mealPlans: [plan, ...(profile.mealPlans || [])],
        goal: planGoal,
        restrictions: planRestrictions
      };
      setProfile(updatedProfile);
      onSave(student.id, { nutrition: updatedProfile });
    }
    setLoading(false);
  };

  const handleLogFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodInput) return;
    setLoading(true);
    const macros = await estimateFoodMacros(foodInput);
    if (macros) {
      const newLog = {
        id: Date.now().toString(),
        name: foodInput,
        date: today,
        macros
      };
      const updatedProfile = { ...profile, logs: [newLog, ...(profile.logs || [])] };
      setProfile(updatedProfile);
      setFoodInput('');
      onSave(student.id, { nutrition: updatedProfile });
    }
    setLoading(false);
  };

  return (
    <div className="p-6 pb-48 animate-fadeIn text-white overflow-y-auto h-screen custom-scrollbar text-left">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-zinc-900 rounded-full shadow-lg text-white hover:bg-red-600 transition-colors"><ArrowLeft size={20}/></button>
          <h2 className="text-xl font-black italic uppercase tracking-tighter text-white">Nutrição ABFIT</h2>
        </div>
      </header>

      {/* TABS */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        <button onClick={() => setActiveTab('DASHBOARD')} className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'DASHBOARD' ? 'bg-red-600 text-white' : 'bg-zinc-900 text-zinc-500'}`}>Dashboard</button>
        <button onClick={() => setActiveTab('LOG')} className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'LOG' ? 'bg-red-600 text-white' : 'bg-zinc-900 text-zinc-500'}`}>Diário</button>
        <button onClick={() => setActiveTab('PLAN')} className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'PLAN' ? 'bg-red-600 text-white' : 'bg-zinc-900 text-zinc-500'}`}>Plano AI</button>
      </div>

      {activeTab === 'DASHBOARD' && (
        <div className="space-y-6">
          <Card className="p-6 bg-zinc-900/80 border-l-4 border-l-red-600">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black uppercase italic text-white">Consumo Hoje</h3>
                <span className="text-xs font-bold text-red-500">{totalMacros.calories} / {profile.dailyTargets.calories} kcal</span>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="h-48 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={macroData}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {macroData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '10px' }}
                        itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <Activity size={24} className="text-zinc-600 mb-1"/>
                    <span className="text-[10px] font-black uppercase text-zinc-500">Macros</span>
                  </div>
               </div>
               
               <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                       <div className="w-3 h-3 rounded-full bg-red-600"></div>
                       <span className="text-xs font-bold text-zinc-400">Proteína</span>
                    </div>
                    <span className="text-xs font-black">{totalMacros.protein}g / {profile.dailyTargets.protein}g</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-red-600" style={{ width: `${Math.min((totalMacros.protein / profile.dailyTargets.protein) * 100, 100)}%` }}></div>
                  </div>

                  <div className="flex justify-between items-center mt-2">
                    <div className="flex items-center gap-2">
                       <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                       <span className="text-xs font-bold text-zinc-400">Carbos</span>
                    </div>
                    <span className="text-xs font-black">{totalMacros.carbs}g / {profile.dailyTargets.carbs}g</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${Math.min((totalMacros.carbs / profile.dailyTargets.carbs) * 100, 100)}%` }}></div>
                  </div>

                  <div className="flex justify-between items-center mt-2">
                    <div className="flex items-center gap-2">
                       <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                       <span className="text-xs font-bold text-zinc-400">Gordura</span>
                    </div>
                    <span className="text-xs font-black">{totalMacros.fat}g / {profile.dailyTargets.fat}g</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${Math.min((totalMacros.fat / profile.dailyTargets.fat) * 100, 100)}%` }}></div>
                  </div>
               </div>
             </div>
          </Card>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-2">Metas & Configurações</h3>
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
                  <label className="text-[8px] font-black uppercase text-zinc-500 block mb-2">Objetivo</label>
                  <input type="text" value={profile.goal} onChange={e => setProfile({...profile, goal: e.target.value})} className="w-full bg-black rounded-lg p-2 text-xs font-bold text-white border border-white/10 focus:border-red-600 outline-none" />
               </div>
               <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
                  <label className="text-[8px] font-black uppercase text-zinc-500 block mb-2">Restrições</label>
                  <input type="text" value={profile.restrictions} onChange={e => setProfile({...profile, restrictions: e.target.value})} className="w-full bg-black rounded-lg p-2 text-xs font-bold text-white border border-white/10 focus:border-red-600 outline-none" />
               </div>
               <div className="col-span-2">
                 <button onClick={handleUpdateProfile} className="w-full py-3 bg-zinc-800 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-zinc-700 transition-colors"><Save size={12}/> Salvar Perfil</button>
               </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'LOG' && (
        <div className="space-y-6">
           <Card className="p-6 bg-zinc-900/80">
              <form onSubmit={handleLogFood} className="space-y-4">
                 <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Adicionar Refeição (IA)</label>
                 <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Ex: 2 ovos com torrada" 
                      value={foodInput}
                      onChange={e => setFoodInput(e.target.value)}
                      className="flex-1 bg-black p-4 rounded-2xl border border-zinc-800 text-sm font-bold text-white focus:border-red-600 outline-none placeholder:text-zinc-700"
                    />
                    <button type="submit" disabled={loading} className="bg-red-600 w-14 rounded-2xl flex items-center justify-center hover:bg-red-700 transition-colors disabled:opacity-50">
                       {loading ? <Loader2 className="animate-spin text-white" /> : <Plus className="text-white" />}
                    </button>
                 </div>
              </form>
           </Card>
           
           <div className="space-y-2">
             <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-2">Histórico de Hoje</h3>
             {todayLogs.length === 0 && <p className="text-center text-zinc-600 text-xs italic py-4">Nenhuma refeição registrada hoje.</p>}
             {todayLogs.map(log => (
               <div key={log.id} className="bg-zinc-900 p-4 rounded-2xl border border-white/5 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-sm text-white capitalize">{log.name}</p>
                    <p className="text-[10px] text-zinc-500">{log.macros.calories}kcal • P:{log.macros.protein} C:{log.macros.carbs} G:{log.macros.fat}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center"><Utensils size={12} className="text-zinc-500"/></div>
               </div>
             ))}
           </div>
        </div>
      )}

      {activeTab === 'PLAN' && (
        <div className="space-y-6">
           <Card className="p-6 bg-gradient-to-br from-zinc-900 to-black border-red-900/20">
              <div className="flex justify-between items-start mb-6">
                 <div>
                    <h3 className="text-lg font-black uppercase italic text-white">Plano Alimentar AI</h3>
                    <p className="text-[9px] text-zinc-500">Gerado pelo Mestre ABFIT</p>
                 </div>
                 <ChefHat className="text-red-600" />
              </div>
              
              <div className="space-y-3 mb-6">
                 <input type="text" value={planGoal} onChange={e => setPlanGoal(e.target.value)} placeholder="Objetivo (ex: Hipertrofia)" className="w-full bg-zinc-800 p-3 rounded-xl text-xs text-white outline-none" />
                 <input type="text" value={planRestrictions} onChange={e => setPlanRestrictions(e.target.value)} placeholder="Restrições (ex: Sem lactose)" className="w-full bg-zinc-800 p-3 rounded-xl text-xs text-white outline-none" />
                 <button onClick={handleGeneratePlan} disabled={loading} className="w-full py-3 bg-red-600 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-red-700 transition-colors disabled:opacity-50">
                    {loading ? <Loader2 className="animate-spin text-white" size={14}/> : <Zap className="text-white" size={14} />} Gerar Plano
                 </button>
              </div>
           </Card>

           {profile.mealPlans && profile.mealPlans.length > 0 && (
             <div className="space-y-4">
                {profile.mealPlans.slice(0, 1).map(plan => (
                  <div key={plan.id} className="space-y-4 animate-in slide-in-from-bottom-5">
                     <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-[2rem]">
                        <h4 className="text-red-500 text-[10px] font-black uppercase tracking-widest mb-2">Café da Manhã</h4>
                        <p className="text-sm text-zinc-300 leading-relaxed">{plan.breakfast}</p>
                     </div>
                     <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-[2rem]">
                        <h4 className="text-blue-500 text-[10px] font-black uppercase tracking-widest mb-2">Almoço</h4>
                        <p className="text-sm text-zinc-300 leading-relaxed">{plan.lunch}</p>
                     </div>
                     <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-[2rem]">
                        <h4 className="text-emerald-500 text-[10px] font-black uppercase tracking-widest mb-2">Jantar</h4>
                        <p className="text-sm text-zinc-300 leading-relaxed">{plan.dinner}</p>
                     </div>
                     <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-[2rem]">
                        <h4 className="text-amber-500 text-[10px] font-black uppercase tracking-widest mb-2">Snacks</h4>
                        <p className="text-sm text-zinc-300 leading-relaxed">{plan.snacks}</p>
                     </div>
                  </div>
                ))}
             </div>
           )}
        </div>
      )}
      <AppFooter />
    </div>
  );
}