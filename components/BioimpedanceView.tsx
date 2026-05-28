import React, { useState } from 'react';
import { Card } from './Layout';
import { ArrowLeft, Monitor, RefreshCw, X, ChevronRight, Activity, Bone, Droplets, Target, Weight, HeartPulse } from 'lucide-react';
import { PhysicalAssessment } from '../types';

export function BioimpedanceView({ assessment, allAssessments = [], onBack }: { assessment: PhysicalAssessment, allAssessments?: PhysicalAssessment[], onBack: () => void }) {
  const [tab, setTab] = useState<'METRICAS' | 'ANALISE' | 'COMPARATIVO'>('METRICAS');

  const getColorClass = (color: string) => {
    switch (color) {
      case 'red': return 'text-red-500 border-red-500/30 bg-red-500/10';
      case 'yellow': return 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10';
      case 'green': return 'text-green-500 border-green-500/30 bg-green-500/10';
      case 'blue': return 'text-blue-500 border-blue-500/30 bg-blue-500/10';
      case 'orange': return 'text-orange-500 border-orange-500/30 bg-orange-500/10';
      default: return 'text-zinc-400 border-zinc-700 bg-zinc-800';
    }
  };

  const sortedAssessments = [...allAssessments].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  const currentIndex = sortedAssessments.findIndex(a => a.id === assessment.id);
  const previousAssessment = currentIndex >= 0 && currentIndex + 1 < sortedAssessments.length ? sortedAssessments[currentIndex + 1] : null;

  // Helper constants for calculations
  const age = parseFloat(assessment.idadeReal?.toString() ?? '36');
  const peso = parseFloat(assessment.peso?.toString() ?? '98.7');

  // 1. Bioimpedância (Balança)
  const scaleBF = parseFloat(assessment.gordura?.value?.toString() ?? assessment.gordura?.toString() ?? assessment.bio_percentual_gordura?.toString() ?? '0');
  const scaleMMPercent = parseFloat(assessment.percentualMassaMuscularEsqueletica?.value?.toString() ?? assessment.percentualMassaMuscularEsqueletica?.toString() ?? assessment.registroMassaMuscular?.value?.toString() ?? assessment.registroMassaMuscular?.toString() ?? '0');
  const scaleMMWeight = parseFloat(assessment.pesoMassaMuscularEsqueletica?.value?.toString() ?? assessment.pesoMassaMuscularEsqueletica?.toString() ?? assessment.pesoMassaMuscular?.value?.toString() ?? assessment.pesoMassaMuscular?.toString() ?? '0');
  const scaleWater = parseFloat(assessment.aguaPercentual?.toString() ?? '0');

  // 2. Galaxy Watch (Relógio)
  const watchBF = parseFloat(assessment.galaxyWatch?.gorduraCorporalPercentual?.toString() ?? '0');
  const watchMMWeight = parseFloat(assessment.galaxyWatch?.musculoEsqueletico?.toString() ?? '0');
  const watchMMPercent = peso > 0 && watchMMWeight > 0 ? (watchMMWeight / peso) * 100 : 0;
  const watchWater = peso > 0 && assessment.galaxyWatch?.aguaCorporal ? (parseFloat(assessment.galaxyWatch.aguaCorporal.toString()) / peso) * 100 : 0;

  // 3. Dobras Cutâneas (Adipômetro)
  const peitoral = parseFloat(assessment.dobraPeitoral?.toString() ?? '0');
  const abdominal = parseFloat(assessment.dobraAbdominal?.toString() ?? '0');
  const coxa = parseFloat(assessment.dobraCoxa?.toString() ?? '0');
  const subescapular = parseFloat(assessment.dobraSubescapular?.toString() ?? '0');

  let dobrasSoma = 0;
  let dobrasDensity = 0;
  let dobrasBF = 0;
  let dobrasMMPercent = 0;
  let dobrasMMWeight = 0;

  if (peitoral > 0 || abdominal > 0 || coxa > 0 || subescapular > 0) {
    const chestFold = peitoral > 0 ? peitoral : subescapular;
    if (chestFold > 0 && abdominal > 0 && coxa > 0) {
      dobrasSoma = chestFold + abdominal + coxa;
      dobrasDensity = 1.10938 - (0.0008267 * dobrasSoma) + (0.0000016 * dobrasSoma * dobrasSoma) - (0.0002574 * age);
      dobrasBF = (4.95 / dobrasDensity) - 4.5;
      dobrasBF = dobrasBF * 100;
      
      const lbmPercent = 100 - dobrasBF;
      dobrasMMPercent = lbmPercent * 0.52; // standard bone/viscera factor for skeletal muscle
      dobrasMMWeight = (dobrasMMPercent / 100) * peso;
    }
  }

  // Averages for Analise
  const bfSources = [scaleBF, watchBF, dobrasBF].filter(v => v > 0);
  const bfAverage = bfSources.length > 0 ? bfSources.reduce((a, b) => a + b, 0) / bfSources.length : 0;

  const mmPercentSources = [scaleMMPercent, watchMMPercent, dobrasMMPercent].filter(v => v > 0);
  const mmPercentAverage = mmPercentSources.length > 0 ? mmPercentSources.reduce((a, b) => a + b, 0) / mmPercentSources.length : 0;

  const waterSources = [scaleWater, watchWater].filter(v => v > 0);
  const waterAverage = waterSources.length > 0 ? waterSources.reduce((a, b) => a + b, 0) / waterSources.length : 0;

  const renderComparativeRow = (label: string, field: string, alternativeField: string, unit: string) => {
    let currValRaw = assessment[field]?.value ?? assessment[field] ?? assessment[alternativeField]?.value ?? assessment[alternativeField];
    let prevValRaw = previousAssessment ? (previousAssessment[field]?.value ?? previousAssessment[field] ?? previousAssessment[alternativeField]?.value ?? previousAssessment[alternativeField]) : null;
    
    const currVal = parseFloat(currValRaw) || 0;
    const prevVal = parseFloat(prevValRaw) || 0;
    
    if (!previousAssessment || prevValRaw == null || isNaN(prevVal)) {
      return (
        <div className="flex justify-between items-center py-4 border-b border-white/5 last:border-0">
           <div>
             <span className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em]">{label}</span><br />
             <span className="text-zinc-600 text-xs font-bold italic">Sem dados</span>
           </div>
           <span className="text-zinc-600">---</span>
        </div>
      );
    }

    const diff = currVal - prevVal;
    const isPositive = diff > 0;
    const percentDiff = prevVal > 0 ? (diff / prevVal) * 100 : 0;
    
    let colorClass = 'text-zinc-400';
    if (field === 'peso' || field === 'gordura' || field === 'gorduraVisceral' || field === 'obesidade' || alternativeField === 'bio_percentual_gordura') {
        colorClass = isPositive ? 'text-red-500' : 'text-emerald-500';
    } else {
        colorClass = isPositive ? 'text-emerald-500' : 'text-red-500';
    }
    
    return (
        <div className="flex justify-between items-center py-4 border-b border-white/5 last:border-0">
           <div>
             <span className="text-[10px] text-zinc-400 font-black uppercase tracking-[0.2em]">{label}</span><br />
             <span className="text-white flex items-baseline gap-1 font-black italic tracking-tighter text-sm">
                 {currVal.toFixed(1)} <span className="text-[9px] tracking-widest text-zinc-500 lowercase">{unit}</span>
             </span>
           </div>
           <div className={`text-right ${colorClass}`}>
             <div className="flex items-center justify-end gap-1">
               <span className="font-black italic text-[13px] tracking-tighter">{isPositive ? '+' : ''}{diff.toFixed(2)} {unit}</span>
               {isPositive ? <Activity size={12} className="mb-0.5" /> : <Activity size={12} className="mb-0.5 rotate-180" />}
             </div>
             <span className="text-[8px] font-black uppercase tracking-widest opacity-80 block mt-0.5">{isPositive ? '+' : ''}{percentDiff.toFixed(1)}% vs anterior</span>
           </div>
        </div>
    );
  };

  const getMetricIcon = (key: string) => {
    if (key.includes('Agua') || key.includes('agua') || key.includes('Água') || key.includes('água')) return <Droplets size={16} className="text-blue-400" />;
    if (key.includes('Ossos') || key.includes('ossos')) return <Bone size={16} className="text-zinc-400" />;
    if (key.includes('Metabolismo') || key.includes('Proteina') || key.includes('lbm') || key.includes('Idade')) return <Activity size={16} className="text-green-400" />;
    if (key.includes('Gordura') || key.includes('gordura') || key.includes('Obesidade')) return <HeartPulse size={16} className="text-red-400" />;
    return <Weight size={16} className="text-zinc-400" />;
  };

  const renderMetric = (label: string, data: any, unit: string) => {
    if (data === undefined || data === null) return null;
    const value = typeof data === 'object' ? data.value : data;
    
    // Status Logic
    let status = typeof data === 'object' ? data.status : null;
    let color = typeof data === 'object' ? data.color : 'default';

    // Se o status não vier no 'data', tentamos inferir do analiseComposicao do assessment
    if (!status) {
      const lowerLabel = label.toLowerCase();
      if (lowerLabel.includes('gordura')) {
        status = assessment.analiseComposicao?.gordura;
        color = status === 'Baixo' ? 'blue' : status === 'Saudável' ? 'green' : (status === 'Alto' || status === 'Obeso') ? 'red' : 'default';
      } else if (lowerLabel.includes('músculo') || lowerLabel.includes('muscular') || lowerLabel.includes('massa muscular')) {
        status = 'Excelente'; // Mock or based on registry
        color = 'green';
      } else if (lowerLabel.includes('água')) {
        status = assessment.analiseComposicao?.agua;
        color = status === 'Saudável' ? 'green' : 'blue';
      } else if (lowerLabel.includes('osso')) {
        status = assessment.analiseComposicao?.ossos;
        color = 'green';
      } else if (lowerLabel.includes('proteína')) {
        status = assessment.analiseComposicao?.proteina;
        color = 'green';
      } else if (lowerLabel.includes('obesidade')) {
        status = assessment.obesidade > 10 ? 'Alto' : 'Saudável';
        color = status === 'Alto' ? 'red' : 'green';
      } else if (lowerLabel.includes('imc')) {
        status = assessment.imc > 25 ? 'Alto' : 'Saudável';
        color = status === 'Alto' ? 'red' : 'green';
      }
    }

    return (
      <div className="flex justify-between items-center py-4 border-b border-zinc-800 last:border-0 hover:bg-zinc-900/50 transition-colors px-2 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800 shrink-0">
            {getMetricIcon(label)}
          </div>
          <span className="text-xs font-black text-zinc-300 italic uppercase tracking-wider">{label}</span>
        </div>
        <div className="flex flex-col items-end gap-1 text-right">
          <div className="flex items-center gap-2">
            {status && (
              <span className={`text-[8px] px-1.5 py-0.5 rounded uppercase font-black tracking-widest border shrink-0 ${getColorClass(color)}`}>
                {status}
              </span>
            )}
            <span className="text-lg font-black text-white italic tracking-tighter shrink-0">{value}<span className="text-[10px] text-zinc-500 ml-0.5">{unit}</span></span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black text-white overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="sticky top-0 bg-black/90 backdrop-blur-md z-40 border-b border-zinc-800 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="w-10 h-10 bg-zinc-900 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors shadow-lg active:scale-95">
              <X size={18} className="text-white" />
            </button>
            <div className="flex flex-col">
              <h2 className="text-lg font-black italic uppercase tracking-tighter leading-none">AVALIAÇÃO FISICA</h2>
              <span className="text-[10px] text-white font-black uppercase tracking-[0.2em]">Bioimpedância</span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-zinc-500">
             <Monitor size={18} className="hover:text-white cursor-pointer transition-colors" />
             <RefreshCw size={18} className="hover:text-white cursor-pointer transition-colors" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-zinc-900 rounded-3xl p-1 border border-zinc-800">
          <button 
            onClick={() => setTab('METRICAS')}
            className={`flex-1 py-3 px-4 rounded-full text-xs font-black uppercase tracking-widest transition-all ${tab === 'METRICAS' ? 'bg-blue-600 shadow-lg shadow-blue-500/20 text-white' : 'text-zinc-500 hover:text-white'}`}
          >
            Métricas
          </button>
          <button 
            onClick={() => setTab('ANALISE')}
            className={`flex-1 py-3 px-4 rounded-full text-xs font-black uppercase tracking-widest transition-all ${tab === 'ANALISE' ? 'bg-blue-600 shadow-lg shadow-blue-500/20 text-white' : 'text-zinc-500 hover:text-white'}`}
          >
            Análise
          </button>
          <button 
            onClick={() => setTab('COMPARATIVO')}
            className={`flex-1 py-3 px-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${tab === 'COMPARATIVO' ? 'bg-blue-600 shadow-lg shadow-blue-500/20 text-white' : 'text-zinc-500 hover:text-white'}`}
          >
            Comparativo
          </button>
        </div>
      </div>

      <div className="p-6 pb-24">
        {tab === 'METRICAS' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black italic uppercase tracking-tighter">Métricas corporais</h3>
              <span className={`${assessment.analiseTipoCorpo?.tipo === 'Saudável' || assessment.analiseTipoCorpo?.tipo === 'Atleta' ? 'bg-green-500/10 text-green-500 border-green-500/30' : 'bg-red-500/10 text-red-500 border-red-500/30'} border px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest mr-2`}>
                {assessment.analiseTipoCorpo?.tipo || 'N/A'}
              </span>
            </div>

            <div className="flex flex-col items-center justify-center py-6 bg-zinc-900/40 rounded-[2rem] border border-zinc-800">
               <h1 className="text-6xl font-black italic tracking-tighter text-white drop-shadow-lg">{assessment.peso}</h1>
               <span className="text-[11px] text-zinc-500 font-black uppercase tracking-[0.3em] mt-1">Kilogramas</span>
               <span className="text-[10px] text-zinc-600 font-bold mt-2">{new Date(assessment.data).toLocaleDateString('pt-BR')}</span>
            </div>

            {/* Comparativo de Métodos Card */}
            <Card className="p-5 bg-zinc-900/80 border-zinc-800 rounded-3xl shadow-xl space-y-4">
              <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
                <Activity size={16} className="text-red-500 animate-pulse" />
                <h4 className="text-xs font-black uppercase tracking-wider italic">Composição Corporal por Método de Medição</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Bioimpedância (Balança) */}
                <div className="p-4 bg-zinc-950/60 rounded-2xl border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Bioimpedância (Balança)</span>
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[10px] font-bold text-zinc-400">Gordura Corporal</span>
                      <span className="text-base font-black italic text-white">{scaleBF > 0 ? `${scaleBF.toFixed(1)}%` : 'N/A'}</span>
                    </div>
                    {scaleMMPercent > 0 && (
                      <div className="flex justify-between items-baseline">
                        <span className="text-[10px] font-bold text-zinc-400">Massa Muscular</span>
                        <span className="text-base font-black italic text-white">
                          {scaleMMPercent.toFixed(1)}%
                          {scaleMMWeight > 0 && <span className="text-[10px] text-zinc-500 ml-1">({scaleMMWeight.toFixed(1)}kg)</span>}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Galaxy Watch (Relógio) */}
                <div className="p-4 bg-zinc-950/60 rounded-2xl border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Galaxy Watch (Relógio)</span>
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[10px] font-bold text-zinc-400">Gordura Corporal</span>
                      <span className="text-base font-black italic text-white">{watchBF > 0 ? `${watchBF.toFixed(1)}%` : 'N/A'}</span>
                    </div>
                    {watchMMWeight > 0 && (
                      <div className="flex justify-between items-baseline">
                        <span className="text-[10px] font-bold text-zinc-400">Massa Muscular</span>
                        <span className="text-base font-black italic text-white">
                          {watchMMPercent > 0 ? `${watchMMPercent.toFixed(1)}%` : 'N/A'}
                          <span className="text-[10px] text-zinc-500 ml-1">({watchMMWeight.toFixed(1)}kg)</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Dobras Cutâneas (Adipômetro) */}
                <div className="p-4 bg-zinc-950/60 rounded-2xl border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Dobras Cutâneas (Adipômetro)</span>
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[10px] font-bold text-zinc-400">Gordura Corporal</span>
                      <span className="text-base font-black italic text-white">{dobrasBF > 0 ? `${dobrasBF.toFixed(1)}%` : 'N/A'}</span>
                    </div>
                    {dobrasMMPercent > 0 && (
                      <div className="flex justify-between items-baseline">
                        <span className="text-[10px] font-bold text-zinc-400">Massa Muscular (SMM Est.)</span>
                        <span className="text-base font-black italic text-white">
                          {dobrasMMPercent.toFixed(1)}%
                          <span className="text-[10px] text-zinc-500 ml-1">({dobrasMMWeight.toFixed(1)}kg)</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. Média dos Métodos */}
                <div className="p-4 bg-blue-900/20 rounded-2xl border border-blue-500/30 space-y-2 shadow-inner">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-widest text-blue-400">Média Geral (Entre Metodologias)</span>
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[10px] font-bold text-blue-300">Gordura Corporal</span>
                      <span className="text-base font-black italic text-blue-100">{bfAverage > 0 ? `${bfAverage.toFixed(1)}%` : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-[10px] font-bold text-blue-300">Massa Muscular</span>
                      <span className="text-base font-black italic text-blue-100">
                        {mmPercentAverage > 0 ? `${mmPercentAverage.toFixed(1)}%` : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-zinc-900/60 border-zinc-800 rounded-3xl shadow-xl flex flex-col pt-2">
               {renderMetric('Peso', assessment.peso, 'Kg')}
               {renderMetric('IMC', assessment.imc, '')}
               {renderMetric('Gordura (%)', assessment.gordura, '%')}
               {renderMetric('Peso da gordura', assessment.pesoGordura, 'Kg')}
               {renderMetric('Percentual da massa muscular esquelética (%)', assessment.percentualMassaMuscularEsqueletica, '%')}
               {renderMetric('Peso da massa muscular esquelética', assessment.pesoMassaMuscularEsqueletica, 'Kg')}
               {renderMetric('Registro de massa muscular (%)', assessment.registroMassaMuscular, '%')}
               {renderMetric('Peso da massa muscular', assessment.pesoMassaMuscular, 'Kg')}
               {renderMetric('Água (%)', assessment.aguaPercentual, '%')}
               {renderMetric('Peso da água', assessment.pesoAgua, 'Kg')}
               {renderMetric('Gordura visceral', assessment.gorduraVisceral, '')}
               {renderMetric('Ossos', assessment.ossos, 'Kg')}
               {renderMetric('Metabolismo', assessment.metabolismo, '')}
               {renderMetric('Proteína (%)', assessment.proteina, '%')}
               {renderMetric('Obesidade (%)', assessment.obesidade, '%')}
               {renderMetric('Idade metabólica', assessment.idadeMetabolica, '')}
               {renderMetric('LBM', assessment.lbm, 'Kg')}
               {renderMetric('Idade real', assessment.idadeReal, '')}
               {renderMetric('Altura', assessment.altura, 'cm')}
            </Card>

            {/* Antropometria Section */}
            {(assessment.torax || assessment.dobraAbdominal || assessment.pescoco || assessment.ombro || assessment.dobraPeitoral) && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
                <h3 className="text-xl font-black italic uppercase tracking-tighter mt-10">Perímetros e Dobras</h3>
                <Card className="p-4 bg-zinc-900/60 border-zinc-800 rounded-3xl shadow-xl flex flex-col pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                    <div className="space-y-0 text-left">
                       <h4 className="text-[10px] font-black uppercase text-red-600 tracking-[0.3em] mt-4 mb-2 px-2">Perímetros (cm)</h4>
                       {renderMetric('Pescoço', assessment.pescoco, 'cm')}
                       {renderMetric('Ombro', assessment.ombro, 'cm')}
                       {renderMetric('Tórax', assessment.torax, 'cm')}
                       {renderMetric('Cintura', assessment.cintura, 'cm')}
                       {renderMetric('Abdômen', assessment.abdomen, 'cm')}
                       {renderMetric('Quadril', assessment.quadril, 'cm')}
                       {renderMetric('coxa proximal esquerda', assessment.coxaProximalEsquerda, 'cm')}
                        {renderMetric('coxa proximal direita', assessment.coxaProximalDireita, 'cm')}
                       {renderMetric('coxa distal direita', assessment.coxaDistalDireita, 'cm')}
                        {renderMetric('coxa distal esquerda', assessment.coxaDistalEsquerda, 'cm')}
                       {renderMetric('panturrilha esquerda', assessment.panturrilhaEsquerda, 'cm')}
                        {renderMetric('panturrilha direita', assessment.panturrilhaDireita, 'cm')}
                       {renderMetric('braço direito', assessment.bracoDireito, 'cm')}
                        {renderMetric('braço esquerdo', assessment.bracoEsquerdo, 'cm')}
                       {renderMetric('antebraço direito', assessment.antebracoDireito, 'cm')}
                        {renderMetric('antebraço esquerdo', assessment.antebracoEsquerdo, 'cm')}
                    </div>
                    <div className="space-y-0 text-left">
                       <h4 className="text-[10px] font-black uppercase text-red-600 tracking-[0.3em] mt-4 mb-2 px-2">Dobras Cutâneas (mm)</h4>
                       {renderMetric('Subescapular', assessment.dobraSubescapular, 'mm')}
                       {renderMetric('Peitoral', assessment.dobraPeitoral, 'mm')}
                       {renderMetric('Abdominal', assessment.dobraAbdominal, 'mm')}
                       {renderMetric('Coxa', assessment.dobraCoxa, 'mm')}
                        {dobrasSoma > 0 && renderMetric('Soma das dobras', dobrasSoma.toFixed(1), 'mm')}
                        {dobrasDensity > 0 && renderMetric('Densidade Corporal', dobrasDensity.toFixed(4), 'g/ml')}
                        {dobrasBF > 0 && renderMetric('Gordura Corporal (Dobras)', dobrasBF.toFixed(1), '%')}
                        {dobrasMMPercent > 0 && renderMetric('Massa Muscular (Dobras Est.)', dobrasMMPercent.toFixed(1), '%')}
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}

        {tab === 'ANALISE' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                        <section>
              <h3 className="text-lg font-black italic uppercase tracking-tighter mb-4 text-white">Análise de Composição Corporal (Médias entre Métodos)</h3>
              
              <Card className="p-5 bg-zinc-900/60 border-zinc-800 rounded-3xl space-y-6">
                {/* Gordura Corporal Section */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-black italic uppercase tracking-widest px-1">
                    <span className="text-zinc-400">Gordura Corporal</span>
                    <span className="text-red-500 font-black">Média: {bfAverage > 0 ? `${bfAverage.toFixed(2)}%` : assessment.analiseComposicao?.gordura || '---'}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                    <div className="bg-zinc-950 p-2 rounded-xl">
                      <span className="text-zinc-500 block uppercase font-black tracking-widest text-[8px]">Balança</span>
                      <span className="font-black italic text-zinc-300 text-base">{scaleBF > 0 ? `${scaleBF.toFixed(1)}%` : '---'}</span>
                    </div>
                    <div className="bg-zinc-950 p-2 rounded-xl">
                      <span className="text-zinc-500 block uppercase font-black tracking-widest text-[8px]">Relógio</span>
                      <span className="font-black italic text-zinc-300 text-base">{watchBF > 0 ? `${watchBF.toFixed(1)}%` : '---'}</span>
                    </div>
                    <div className="bg-zinc-950 p-2 rounded-xl">
                      <span className="text-zinc-500 block uppercase font-black tracking-widest text-[8px]">Dobras</span>
                      <span className="font-black italic text-zinc-300 text-base">{dobrasBF > 0 ? `${dobrasBF.toFixed(1)}%` : '---'}</span>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/20 p-2 rounded-xl">
                      <span className="text-red-400 block uppercase font-black tracking-widest text-[8px] italic">Resultado</span>
                      <span className="font-black italic text-red-400 text-lg">{bfAverage > 0 ? `${bfAverage.toFixed(2)}%` : '---'}</span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden flex">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: bfAverage > 0 ? `${Math.min(bfAverage, 50) * 2}%` : '50%' }} />
                  </div>
                  <div className="flex justify-between text-[8px] font-bold text-zinc-500 uppercase tracking-widest px-1">
                    <span>Saudável (10-20%)</span>
                    <span>Acima (20-25%)</span>
                    <span>Obeso (&gt;25%)</span>
                  </div>
                </div>

                {/* Massa Muscular Section */}
                <div className="space-y-3 pt-4 border-t border-zinc-800/60">
                  <div className="flex justify-between items-center text-[10px] font-black italic uppercase tracking-widest px-1">
                    <span className="text-zinc-400">Massa Muscular</span>
                    <span className="text-green-500 font-black">Média: {mmPercentAverage > 0 ? `${mmPercentAverage.toFixed(2)}%` : '---'}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                    <div className="bg-zinc-950 p-2 rounded-xl">
                      <span className="text-zinc-500 block uppercase font-black tracking-widest text-[8px]">Balança</span>
                      <span className="font-black italic text-zinc-300 text-base">{scaleMMPercent > 0 ? `${scaleMMPercent.toFixed(1)}%` : '---'}</span>
                    </div>
                    <div className="bg-zinc-950 p-2 rounded-xl">
                      <span className="text-zinc-500 block uppercase font-black tracking-widest text-[8px]">Relógio</span>
                      <span className="font-black italic text-zinc-300 text-base">{watchMMPercent > 0 ? `${watchMMPercent.toFixed(1)}%` : '---'}</span>
                    </div>
                    <div className="bg-zinc-950 p-2 rounded-xl">
                      <span className="text-zinc-500 block uppercase font-black tracking-widest text-[8px]">Dobras</span>
                      <span className="font-black italic text-zinc-300 text-base">{dobrasMMPercent > 0 ? `${dobrasMMPercent.toFixed(1)}%` : '---'}</span>
                    </div>
                    <div className="bg-green-500/10 border border-green-500/20 p-2 rounded-xl">
                      <span className="text-green-400 block uppercase font-black tracking-widest text-[8px] italic">Resultado</span>
                      <span className="font-black italic text-green-400 text-lg">{mmPercentAverage > 0 ? `${mmPercentAverage.toFixed(2)}%` : '---'}</span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden flex">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: mmPercentAverage > 0 ? `${Math.min(mmPercentAverage, 60) * 1.6}%` : '50%' }} />
                  </div>
                  <div className="flex justify-between text-[8px] font-bold text-zinc-500 uppercase tracking-widest px-1">
                    <span>Baixo (&lt;33%)</span>
                    <span>Saudável (33-39%)</span>
                    <span>Excelente (&gt;39%)</span>
                  </div>
                </div>

                {/* Água Corporal Section */}
                <div className="space-y-3 pt-4 border-t border-zinc-800/60">
                  <div className="flex justify-between items-center text-[10px] font-black italic uppercase tracking-widest px-1">
                    <span className="text-zinc-400">Água Corporal</span>
                    <span className="text-blue-500 font-black">Média: {waterAverage > 0 ? `${waterAverage.toFixed(2)}%` : assessment.analiseComposicao?.agua || '---'}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                    <div className="bg-zinc-950 p-2 rounded-xl">
                      <span className="text-zinc-500 block uppercase font-black tracking-widest text-[8px]">Balança</span>
                      <span className="font-black italic text-zinc-300">{scaleWater > 0 ? `${scaleWater.toFixed(1)}%` : '---'}</span>
                    </div>
                    <div className="bg-zinc-950 p-2 rounded-xl">
                      <span className="text-zinc-500 block uppercase font-black tracking-widest text-[8px]">Relógio</span>
                      <span className="font-black italic text-zinc-300">{watchWater > 0 ? `${watchWater.toFixed(1)}%` : '---'}</span>
                    </div>
                    <div className="bg-zinc-950 p-2 rounded-xl col-span-2 flex items-center justify-center">
                      <span className="text-zinc-600 block uppercase font-black tracking-widest text-[8px] italic">Dobras: N/A</span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden flex">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: waterAverage > 0 ? `${Math.min(waterAverage, 100)}%` : '50%' }} />
                  </div>
                  <div className="flex justify-between text-[8px] font-bold text-zinc-500 uppercase tracking-widest px-1">
                    <span>Mínimo (45%)</span>
                    <span>Saudável (50-65%)</span>
                    <span>Atleta (&gt;65%)</span>
                  </div>
                </div>

                {/* Static Indicators like Proteina and Ossos */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-zinc-800/60">
                  <div className="p-3 bg-zinc-950 rounded-2xl flex justify-between items-center">
                    <div>
                      <span className="text-[8px] uppercase font-black text-zinc-500 tracking-wider">Proteína</span>
                      <span className="text-xs font-black italic text-white block mt-0.5">
                        {(() => {
                          const val = assessment.proteina;
                          if (!val) return assessment.analiseComposicao?.proteina || 'Excl.';
                          const rawVal = typeof val === 'object' ? val.value : val;
                          return typeof rawVal === 'number' ? `${rawVal}%` : String(rawVal);
                        })()}
                      </span>
                    </div>
                    <span className="text-[7px] font-black uppercase bg-green-500/10 border border-green-500/20 text-green-500 px-1.5 py-0.5 rounded">Saudável</span>
                  </div>
                  <div className="p-3 bg-zinc-950 rounded-2xl flex justify-between items-center">
                    <div>
                      <span className="text-[8px] uppercase font-black text-zinc-500 tracking-wider">Ossos</span>
                      <span className="text-xs font-black italic text-white block mt-0.5">
                        {(() => {
                          const val = assessment.ossos;
                          if (!val) return assessment.analiseComposicao?.ossos || 'Excl.';
                          const rawVal = typeof val === 'object' ? val.value : val;
                          return typeof rawVal === 'number' ? `${rawVal}kg` : String(rawVal);
                        })()}
                      </span>
                    </div>
                    <span className="text-[7px] font-black uppercase bg-green-500/10 border border-green-500/20 text-green-500 px-1.5 py-0.5 rounded">Saudável</span>
                  </div>
                </div>
              </Card>
            </section>

            <section>
              <h3 className="text-lg font-black italic uppercase tracking-tighter mb-4 text-white mt-10">Análise do Tipo de Corpo</h3>
              <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-3xl space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  {['Atleta', 'Obeso Muscular', 'Obesidade', 'Muscular', 'Saudável', 'Acima do Peso', 'Magro', 'Magro Esq.', 'Oculta'].map(type => (
                    <div key={type} className={`p-4 rounded-2xl flex items-center justify-center text-[9px] font-black uppercase text-center border transition-all leading-tight tracking-widest ${assessment.analiseTipoCorpo?.tipo === type ? 'border-red-500/50 bg-red-500/10 text-red-500 shadow-lg shadow-red-500/20' : 'border-zinc-800 bg-zinc-900 text-zinc-500'}`}>
                      {type}
                    </div>
                  ))}
                </div>
                {assessment.analiseTipoCorpo?.descricao && (
                   <div className="mt-4 p-5 bg-zinc-950 border border-zinc-800 rounded-2xl text-[11px] font-bold text-zinc-400 leading-relaxed italic border-l-4 border-l-red-500 tracking-wide text-center">
                     {assessment.analiseTipoCorpo.descricao}
                   </div>
                )}
              </div>
            </section>

            <section>
              <h3 className="text-lg font-black italic uppercase tracking-tighter mb-4 text-white mt-10">Dicas de Controle de Peso</h3>
              <Card className="p-5 bg-zinc-900/60 border-zinc-800 rounded-3xl space-y-6">
                <div>
                  <div className="flex justify-between items-center text-[10px] font-black italic uppercase tracking-widest mb-3 px-1">
                    <span className="text-zinc-500">Peso (Kg)</span>
                    <span className="flex items-center gap-1 text-blue-500">
                      {assessment.dicasControlePeso?.pesoDiff > 0 ? '+' : ''}{assessment.dicasControlePeso?.pesoDiff}
                    </span>
                  </div>
                  <div className="relative pt-2 pb-6 px-1">
                    <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden flex">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: '70%' }} />
                    </div>
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase tracking-[0.2em] text-blue-400/60 select-none">Peso ideal {assessment.dicasControlePeso?.pesoIdeal}kg</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 pt-6 border-t border-zinc-800/50">
                  <div className="flex justify-between items-center p-4 bg-zinc-950 border border-zinc-800/50 rounded-2xl">
                    <span className="text-[10px] font-black uppercase tracking-widest italic text-zinc-400">Massa muscular</span>
                    <span className="font-black text-blue-500 text-sm italic">+{assessment.dicasControlePeso?.massaMuscularDiff}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-zinc-950 border border-zinc-800/50 rounded-2xl">
                    <span className="text-[10px] font-black uppercase tracking-widest italic text-zinc-400">Gordura</span>
                    <span className="font-black text-blue-500 text-sm italic">{assessment.dicasControlePeso?.gorduraDiff}</span>
                  </div>
                </div>
              </Card>
            </section>
          </div>
        )}

        {tab === 'COMPARATIVO' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
             {previousAssessment ? (
               <div className="space-y-6">
                 <div className="flex items-center gap-2 text-[10px] font-black uppercase text-blue-500 tracking-widest bg-blue-500/10 p-3 rounded-xl border border-blue-500/20">
                    <Activity size={14} />
                    <span>Comparativo: {new Date(previousAssessment.data).toLocaleDateString('pt-BR')} &rarr; {new Date(assessment.data).toLocaleDateString('pt-BR')}</span>
                 </div>
                 
                 <Card className="p-4 bg-zinc-900/60 border-zinc-800 rounded-3xl shadow-xl flex flex-col pt-2">
                    {renderComparativeRow('Peso', 'peso', 'peso', 'Kg')}
                    {renderComparativeRow('Gordura Corporal', 'gordura', 'bio_percentual_gordura', '%')}
                    {renderComparativeRow('Massa Muscular', 'pesoMassaMuscular', 'pesoMassaMuscular', 'Kg')}
                    {renderComparativeRow('Água', 'aguaPercentual', 'aguaPercentual', '%')}
                    {renderComparativeRow('Gordura Visceral', 'gorduraVisceral', 'gorduraVisceral', '')}
                    {renderComparativeRow('Metabolismo', 'metabolismo', 'metabolismo', 'kcal')}
                     {renderComparativeRow('coxa proximal esquerda', 'coxaProximalEsquerda', 'coxaProximalEsquerda', 'cm')}
                     {renderComparativeRow('coxa proximal direita', 'coxaProximalDireita', 'coxaProximalDireita', 'cm')}
                     {renderComparativeRow('coxa distal direita', 'coxaDistalDireita', 'coxaDistalDireita', 'cm')}
                     {renderComparativeRow('coxa distal esquerda', 'coxaDistalEsquerda', 'coxaDistalEsquerda', 'cm')}
                     {renderComparativeRow('panturrilha esquerda', 'panturrilhaEsquerda', 'panturrilhaEsquerda', 'cm')}
                     {renderComparativeRow('panturrilha direita', 'panturrilhaDireita', 'panturrilhaDireita', 'cm')}
                     {renderComparativeRow('braço direito', 'bracoDireito', 'bracoDireito', 'cm')}
                     {renderComparativeRow('braço esquerdo', 'bracoEsquerdo', 'bracoEsquerdo', 'cm')}
                     {renderComparativeRow('antebraço direito', 'antebracoDireito', 'antebracoDireito', 'cm')}
                     {renderComparativeRow('antebraço esquerdo', 'antebracoEsquerdo', 'antebracoEsquerdo', 'cm')}
                 </Card>

                 {assessment.veredictoPeriodizacao && (
                   <Card className="p-5 bg-blue-600 rounded-3xl text-white shadow-xl shadow-blue-600/20 border-0">
                     <h4 className="text-[10px] font-black uppercase tracking-widest mb-3 opacity-90">Veredito da Periodização</h4>
                     <p className="text-sm font-medium leading-relaxed">{assessment.veredictoPeriodizacao}</p>
                   </Card>
                 )}
               </div>
             ) : (
               <div className="text-center py-12 px-6 border-2 border-dashed border-zinc-800 rounded-[3rem]">
                 <p className="text-[13px] font-black italic uppercase tracking-widest text-zinc-600">Sem Avaliação Anterior</p>
                 <p className="text-xs text-zinc-500 mt-2">Esta é a primeira avaliação bioimpedanciométrica registrada.</p>
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
}
