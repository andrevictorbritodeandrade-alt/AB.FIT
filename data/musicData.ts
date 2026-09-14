// ==============================================
// ABFIT MUSIC - DADOS MUSICAIS
// ==============================================
// INSTRUÇÕES PARA ADICIONAR NOVOS ESTILOS OU MÚSICAS:
//
// 1. Para adicionar um novo estilo, copie o bloco abaixo e cole no final do array:
//    {
//      id: 'identificador-unico',        // use letras minúsculas e hífens, sem espaços
//      name: 'Nome do Estilo',           // nome que aparecerá no card
//      description: 'Descrição do estilo',
//      color: '#dc2626',
//      songs: [
//        { id: 'ID_DO_VIDEO_YOUTUBE', title: 'Título da música' }
//        // Adicione mais músicas separadas por vírgula
//      ]
//    }
//
// 2. Para adicionar uma música a um estilo existente, localize o objeto do estilo
//    e adicione um novo objeto no array `songs`, seguindo o formato:
//    { id: 'ID_DO_VIDEO_YOUTUBE', title: 'Título da música' }
//
// 3. O ID do vídeo é a parte após "v=" na URL do YouTube. Exemplo:
//    URL: https://youtu.be/AljJx6atPDg?si=...
//    ID: AljJx6atPDg
//
// 4. O título pode ser qualquer texto descritivo. Se não souber, deixe como 'Música X'
//    e depois edite.
// ==============================================

export interface Song {
  id: string;
  title: string;
  artist?: string;
  duration?: string;
}

export interface MusicCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
  gradient?: string;
  songs: Song[];
}

export const musicCategories: MusicCategory[] = [
  {
    id: 'pagodao-baiano',
    name: 'Pagodão Baiano',
    description: 'Swingueira pesada, metralhadora e groove acelerado para elevar sua frequência cardíaca.',
    color: '#dc2626',
    gradient: 'from-red-600 to-amber-600',
    songs: [
      { id: 'AljJx6atPDg', title: 'Pagodão Baiano 1', artist: 'ABFIT Seleção Bahia' },
      { id: '4iFfuyOUM1Q', title: 'Pagodão Baiano 2', artist: 'ABFIT Seleção Bahia' },
      { id: 'mju1KPxhO8I', title: 'Pagodão Baiano 3', artist: 'ABFIT Seleção Bahia' },
      { id: 'GsJuSSxmz30', title: 'Pagodão Baiano 4', artist: 'ABFIT Seleção Bahia' },
      { id: 'AOSAE_AebgA', title: 'Pagodão Baiano 5', artist: 'ABFIT Seleção Bahia' }
    ]
  },
  {
    id: 'lgbtqiapn',
    name: 'LGBTQIAPN+',
    description: 'Pop acelerado, batidas eletrônicas e hinos cheios de energia e representatividade.',
    color: '#ec4899',
    gradient: 'from-pink-600 via-purple-600 to-indigo-600',
    songs: [
      { id: 'M2-MZz1k8Ew', title: 'LGBTQIAPN+ 1', artist: 'ABFIT Pride Beats' }
    ]
  },
  {
    id: 'brasilidades',
    name: 'Brasilidades',
    description: 'O melhor do samba, MPB dançante, afrobeat e ritmos tropicais do Brasil.',
    color: '#059669',
    gradient: 'from-emerald-600 to-yellow-600',
    songs: [
      { id: 'H-Yrgs_OMio', title: 'Brasilidades 1', artist: 'ABFIT Tropical' },
      { id: 'xX-q3drj7lo', title: 'Brasilidades 2', artist: 'ABFIT Tropical' },
      { id: '_KW4hB4Frsg', title: 'Brasilidades 3', artist: 'ABFIT Tropical' },
      { id: 'kEw4URp6qFU', title: 'Brasilidades 4', artist: 'ABFIT Tropical' },
      { id: 'IryEziyPw5M', title: 'Brasilidades 5', artist: 'ABFIT Tropical' }
    ]
  },
  {
    id: 'deep-house',
    name: 'Deep House',
    description: 'Linhas de baixo contínuas, bpm constante e atmosfera imersiva para foco absoluto.',
    color: '#3b82f6',
    gradient: 'from-blue-600 to-indigo-800',
    songs: [
      { id: 'edtPzxsRMi0', title: 'Deep House 1', artist: 'ABFIT Electronic' }
    ]
  },
  {
    id: 'amapiano',
    name: 'Amapiano & Afrobeats',
    description: 'Log drums profundos, batidas africanas, pianos envolventes e o melhor do Afrobeat.',
    color: '#f59e0b',
    gradient: 'from-amber-600 to-orange-700',
    songs: [
      { id: 'T7RsHot9MBU', title: 'Amapiano 1', artist: 'ABFIT Afro Vibe' },
      { id: '0zQnScWo3Ww', title: 'Amapiano & Afrobeats 2', artist: 'ABFIT Afro Vibe' },
      { id: 'UxXoVc5DT44', title: 'Amapiano & Afrobeats 3', artist: 'ABFIT Afro Vibe' },
      { id: 'ewLGbGqXdpY', title: 'Amapiano & Afrobeats 4', artist: 'ABFIT Afro Vibe' },
      { id: 'YpFZZKF85aw', title: 'Amapiano & Afrobeats 5', artist: 'ABFIT Afro Vibe' },
      { id: 'O1sU1F6dZNk', title: 'Amapiano & Afrobeats 6', artist: 'ABFIT Afro Vibe' }
    ]
  },
  {
    id: 'pagode',
    name: 'Pagode',
    description: 'Cavaquinho, pandeiro e aquele pagode de responsa para embalar seu treino de força.',
    color: '#ef4444',
    gradient: 'from-red-600 to-rose-700',
    songs: [
      { id: 'hoIROKL1bB8', title: 'Pagode 1', artist: 'ABFIT Roda de Samba' },
      { id: '9f7AcEXNZyE', title: 'Pagode 2', artist: 'ABFIT Roda de Samba' },
      { id: 'CQryy5dBz2s', title: 'Pagode 3', artist: 'ABFIT Roda de Samba' },
      { id: 'QBYn1-0GNWE', title: 'Pagode 4', artist: 'ABFIT Roda de Samba' }
    ]
  },
  {
    id: 'npr-music',
    name: 'NPR MUSIC',
    description: 'Sessões ao vivo acústicas e envolventes do NPR Tiny Desk Concert para um treino com alta vibe e ritmo orgânico.',
    color: '#8b5cf6',
    gradient: 'from-purple-600 via-indigo-700 to-zinc-950',
    songs: [
      { id: 'enAyZlFjKss', title: 'NPR Tiny Desk Concert 1', artist: 'NPR Music Live' }
    ]
  }
];
