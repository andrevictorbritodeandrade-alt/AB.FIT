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
    <div style={{ marginBottom: '20px', padding: '15px', background: '#1a1a1a', borderRadius: '12px', border: '1px solid #333' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
        <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '18px' }}>{label}</span>
        <span style={{ color: '#f1c40f', fontWeight: 'bold' }}>{atual} / {totalFase}</span>
      </div>

      {/* Barra de Fundo */}
      <div style={{ width: '100%', height: '12px', background: '#333', borderRadius: '10px', overflow: 'hidden' }}>
        {/* Barra de Preenchimento Animada */}
        <div style={{ 
          width: `${porcentagem}%`, 
          height: '100%', 
          background: 'linear-gradient(90deg, #2ecc71, #27ae60)', 
          transition: 'width 0.5s ease-in-out',
          borderRadius: '10px'
        }} />
      </div>

      <div style={{ marginTop: '6px', textAlign: 'right' }}>
        <small style={{ color: '#888', fontSize: '12px' }}>
          Histórico Total: <strong>{totalGlobal}</strong> treinos
        </small>
      </div>
    </div>
  );
};

export default ProgressBarABFIT;
