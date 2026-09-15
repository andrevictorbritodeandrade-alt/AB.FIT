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
    name: 'PAGODÃO BAIANO',
    description: 'Swingueira pesada, metralhadora e groove acelerado para elevar sua frequência cardíaca.',
    color: '#dc2626',
    gradient: 'from-red-600 to-amber-600',
    songs: [
      { id: 'T7RsHot9MBU', title: 'Léo Santana - Promo Outubro 2026 (Repertório Atualizado)', artist: 'Léo Santana' },
      { id: 'AljJx6atPDg', title: 'Igor Kannário Ao Vivão - Copa Vela 2026', artist: 'Igor Kannário' },
      { id: '4iFfuyOUM1Q', title: 'Tony Salles Ao Vivo - Repertório Atualizado', artist: 'Tony Salles' },
      { id: 'mju1KPxhO8I', title: 'Tony Salles em Guanambi - Arrastão do Pai', artist: 'Tony Salles' },
      { id: 'GsJuSSxmz30', title: 'Léo Santana - Dale Pagodão Atualizado', artist: 'Léo Santana' },
      { id: 'AOSAE_AebgA', title: 'É O Tchan - 30 Anos Só Sucessos', artist: 'É O Tchan' }
    ]
  },
  {
    id: 'lgbtqiapn',
    name: 'LGBTQIAPN+',
    description: 'Pop acelerado, batidas eletrônicas e hinos cheios de energia e representatividade.',
    color: '#ec4899',
    gradient: 'from-pink-600 via-purple-600 to-indigo-600',
    songs: [
      { id: 'QIgym0tzrMw', title: 'Gloria Groove - A Fantástica Máquina do Groove', artist: 'Gloria Groove' },
      { id: 'jmTjugfL_pU', title: 'Gloria Groove - Serenata Da GG, Vol. 2 (Ao Vivo)', artist: 'Gloria Groove' },
      { id: '0uo9YF-fRFM', title: 'Ludmilla - Bloco Numanice (Ao Vivo)', artist: 'Ludmilla' },
      { id: 'M2-MZz1k8Ew', title: 'NATHYsteps - Pra Gays e Garotas (Pop Workout)', artist: 'NathySteps' }
    ]
  },
  {
    id: 'deep-house',
    name: 'DEEP HOUSE',
    description: 'Linhas de baixo contínuas, bpm constante e atmosfera imersiva para foco absoluto.',
    color: '#3b82f6',
    gradient: 'from-blue-600 to-indigo-800',
    songs: [
      { id: 'edtPzxsRMi0', title: 'Deep House Vibes - Berlin After Hours & Neon Echoes', artist: 'Pink Noir' },
      { id: 'QBC0KZ7ZQro', title: 'Alok Mix - Melhores Músicas Eletrônicas (Alive Set)', artist: 'Alok / Nova Records' },
      { id: 'b3XJ4qwIFjM', title: 'Summer Eletrohits Remixes - Sequência Mixada Especial', artist: 'DJ MorpheuZ' },
      { id: 'nO67YZitN3g', title: 'Vintage Culture & Friends - Só Track Boa (As Melhores do Verão)', artist: 'Vintage Culture, Liu & Dubdogz' }
    ]
  },
  {
    id: 'amapiano',
    name: 'AMAPIANO & AFROBEATS',
    description: 'Log drums profundos, batidas africanas, pianos envolventes e o melhor do Afrobeat.',
    color: '#f59e0b',
    gradient: 'from-amber-600 to-orange-700',
    songs: [
      { id: 'O1sU1F6dZNk', title: 'DJ Phaphane - Amapiano To The World (Paris Nights)', artist: 'DJ Phaphane' },
      { id: 'ewLGbGqXdpY', title: 'Afrobeats, Reggae & Caribbean Vibes DJ Set', artist: 'DJ Lonely Star' },
      { id: 'UxXoVc5DT44', title: 'Tems Best of Rumba & Chill Afrobeats', artist: 'Tems' },
      { id: '0zQnScWo3Ww', title: 'Black Stage Session II', artist: 'BlackStageBand' },
      { id: 'YpFZZKF85aw', title: 'R&B, Afrobeats & Hip Hop Playlist', artist: 'Mike O\'Leary' },
      { id: 'GSq7DYZMBZA', title: 'Tems & Chill | Soulful Afrobeat & R&B Mix', artist: 'DJ Webaba' },
      { id: 'AiKyuf9z0dE', title: 'Africanize Sessions | Afrobeats, Amapiano & Afrohouse', artist: 'DJ Shine' },
      { id: 'NzBXWH8Ve4Y', title: 'Africanize Sessions | Amapiano, Afrobeats & Afrohouse', artist: 'DJ Shine' }
    ]
  },
  {
    id: 'pagode',
    name: 'PAGODE',
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
    id: 'tiny-desk',
    name: 'TINY DESK',
    description: 'Sessões ao vivo intimistas e envolventes do Tiny Desk Concert e Tiny Desk Brasil com alta vibração orgânica.',
    color: '#8b5cf6',
    gradient: 'from-purple-600 via-indigo-700 to-zinc-950',
    songs: [
      { id: 'R2eOU7c7G_4', title: 'Mon Rovîa: Tiny Desk Concert', artist: 'Mon Rovîa' },
      { id: 'SG0ifZpDswg', title: 'E.U.: Tiny Desk Concert', artist: 'E.U.' },
      { id: 'kVzaq0RRYPQ', title: 'Isaiah Rashad: Tiny Desk Concert', artist: 'Isaiah Rashad' },
      { id: '2Szdo6fRc5c', title: 'The War and Treaty: Tiny Desk Concert', artist: 'The War and Treaty' },
      { id: 'mbRycM-xgxo', title: 'Vince Staples: Tiny Desk Concert', artist: 'Vince Staples' },
      { id: 'fEqGjypP5qY', title: 'Shaboozey: Tiny Desk Concert', artist: 'Shaboozey' },
      { id: 'AzgbNvW793Q', title: 'Bow Wow: Tiny Desk Concert', artist: 'Bow Wow' },
      { id: 'gQXf0PNreCo', title: '8Ball & MJG: Tiny Desk Concert', artist: '8Ball & MJG' },
      { id: 'CymCVrKpLzw', title: 'Eve: Tiny Desk Concert', artist: 'Eve' },
      { id: 'YCbFsAwwyyg', title: 'Joe: Tiny Desk Concert', artist: 'Joe' },
      { id: 'h4JVg4JDxMU', title: 'Ayra Starr: Tiny Desk Concert', artist: 'Ayra Starr' },
      { id: 'XYhtkxR5sV8', title: 'GENA: Tiny Desk Concert', artist: 'GENA' },
      { id: 'KsCV94MQs34', title: 'Floetry: Tiny Desk Concert', artist: 'Floetry' },
      { id: '3azRJPBhZLU', title: 'Cure For Paranoia: 2026 Contest Winner', artist: 'Cure For Paranoia' },
      { id: 'YUhWCGUVp4A', title: 'Annahstasia: Tiny Desk Concert', artist: 'Annahstasia' },
      { id: 'p7YpVl35pac', title: 'Milo J: Tiny Desk Concert', artist: 'Milo J' },
      { id: 'wdeWKd9rjt4', title: 'Infinity Song: Tiny Desk Concert', artist: 'Infinity Song' },
      { id: '5AVYDHTOixU', title: 'De La Soul: Tiny Desk Concert', artist: 'De La Soul' },
      { id: 'm5XxOLdMSS8', title: 'Buddy Guy: Tiny Desk Concert', artist: 'Buddy Guy' },
      { id: 'KcOweHh_DMI', title: 'Immanuel Wilkins: Tiny Desk Concert', artist: 'Immanuel Wilkins' },
      { id: 'kP3cAAU-AHk', title: 'John P. Kee & New Life: Tiny Desk Concert', artist: 'John P. Kee & New Life' },
      { id: 'Br7beKBJFLE', title: 'Coco Jones: Tiny Desk Concert', artist: 'Coco Jones' },
      { id: 'rMWjbb2l5BE', title: 'Daniel Caesar: Tiny Desk Concert', artist: 'Daniel Caesar' },
      { id: 'DISMiACmkeA', title: 'Tiny Desk Brasil: João Gomes', artist: 'João Gomes' },
      { id: 'j22KzIF34Xo', title: 'GIVĒON: Tiny Desk Concert', artist: 'GIVĒON' },
      { id: 'vTx1ITE67g4', title: 'Odeal: Tiny Desk Concert', artist: 'Odeal' },
      { id: 'Xcv0O44zfeU', title: 'Kokoroko: Tiny Desk Concert', artist: 'Kokoroko' },
      { id: '_p8T7JT8LK0', title: 'Bloc Party: Tiny Desk Concert', artist: 'Bloc Party' },
      { id: 'f7gIBB7jKc0', title: 'Clipse: Tiny Desk Concert', artist: 'Clipse' },
      { id: 'kfUcI82SZv4', title: 'Rico Nasty: Tiny Desk Concert', artist: 'Rico Nasty' },
      { id: 'bzAI4F_ks5s', title: 'Living Colour: Tiny Desk Concert', artist: 'Living Colour' },
      { id: 'Uap53lFWEJw', title: 'Beenie Man: Tiny Desk Concert', artist: 'Beenie Man' },
      { id: 't4p20PsP3cw', title: 'CeCe Winans: Tiny Desk Concert', artist: 'CeCe Winans' },
      { id: 'grWRQ0cONXA', title: 'Wiz Khalifa: Tiny Desk Concert', artist: 'Wiz Khalifa' },
      { id: 'ouuPSxE1hK4', title: 'Bad Bunny: Tiny Desk Concert', artist: 'Bad Bunny' },
      { id: 'QWhezn3nB_M', title: 'REBOLU: Tiny Desk x globalFEST', artist: 'REBOLU' },
      { id: 'kIzhoZAf6QQ', title: 'Elida Almeida: Tiny Desk x globalFEST', artist: 'Elida Almeida' },
      { id: 'oakGqyUPK0c', title: 'IZA: Tiny Desk Brasil', artist: 'IZA' },
      { id: 's3w6Qst7ee4', title: 'Gloria Groove: Tiny Desk Brasil', artist: 'Gloria Groove' },
      { id: 'X0yHGC0ChrI', title: 'Duquesa: Tiny Desk Brasil', artist: 'Duquesa' },
      { id: 'IiE7MAFu2Kw', title: 'Gilberto Gil, Flor e Bento: Tiny Desk Brasil', artist: 'Gilberto Gil' },
      { id: 'T1ycoaPqRhM', title: 'Alceu Valença: Tiny Desk Brasil', artist: 'Alceu Valença' },
      { id: 'mB64XGyZFv8', title: 'Liniker: Tiny Desk Brasil', artist: 'Liniker' },
      { id: '5XVLtuMtH74', title: 'Sandra Sá: Tiny Desk Brasil', artist: 'Sandra Sá' },
      { id: 'axeUDhmIieg', title: 'Tássia Reis: Tiny Desk Brasil', artist: 'Tássia Reis' },
      { id: 'yvG_sA6DTdU', title: 'Ney Matogrosso: Tiny Desk Brasil', artist: 'Ney Matogrosso' },
      { id: 'JwvHyWfMm_U', title: 'Péricles: Tiny Desk Brasil', artist: 'Péricles' },
      { id: 'kKk1_ZKedXE', title: 'Metá Metá & Negro Leo: Tiny Desk Brasil', artist: 'Metá Metá & Negro Leo' }
    ]
  },
  {
    id: 'mpb',
    name: 'MÚSICA POPULAR BRASILEIRA',
    description: 'Harmonias sofisticadas, poesia, soul brasileiro, afrobeat e ritmos tropicais da MPB.',
    color: '#10b981',
    gradient: 'from-emerald-600 via-teal-700 to-zinc-950',
    songs: [
      { id: 'jrVyJnR-mHI', title: 'Tiago Iorc - Acústico MTV (Ao Vivo)', artist: 'Tiago Iorc' },
      { id: 'zZ1V8B98WkU', title: 'Alpha Sessions: Luedji Luna (Ao Vivo Completo)', artist: 'Luedji Luna' },
      { id: '8cX2xEmsAd4', title: 'Luedji Luna, Céu, Larissa Luz e Joyce Alane - Cantam Cazuza', artist: 'Prêmio Música Brasileira' },
      { id: 'a6thqDb8-us', title: 'Pedro Nass - O Puro Suco do Djavan', artist: 'Pedro Nass / Djavan' },
      { id: 'Gw9M3KaRKRM', title: 'Anitta - EQUILIBRIVM (Ao Vivo)', artist: 'Anitta' },
      { id: 'E0sTBHZeGvQ', title: 'Medley Fat Family - Tali 2026', artist: 'Tali / Fat Family' },
      { id: 'jUj_cIP0bJQ', title: 'Lilás (Djavan) - Marcela Reis (Sala do Groove V)', artist: 'Marcela Reis' },
      { id: 'BE6BnSPoGts', title: 'Gilsons - Beijo Na Boca (Clipe Oficial)', artist: 'Gilsons' },
      { id: 'H-Yrgs_OMio', title: 'Groove Brasileiro Mix - Caetano Veloso, Tim Maia, Gilberto Gil', artist: 'Pantaleao Music' },
      { id: 'xX-q3drj7lo', title: 'Afrobeat Brasil - IZA, Ludmilla, Xamã, Rael', artist: 'DJ Sidaum' },
      { id: '_KW4hB4Frsg', title: 'Bebeto Rei do Swing - Especial Samba Rock', artist: 'DJ Fabio Vargas' },
      { id: 'kEw4URp6qFU', title: 'Bossa Nova Vibrant & Smooth - Foco & Ritmo', artist: 'ELIJAZZ' },
      { id: 'IryEziyPw5M', title: 'Rachel Reis - Divina Casca (Álbum Completo)', artist: 'Rachel Reis' }
    ]
  },
  {
    id: 'rnb-rhythm-and-blues',
    name: 'R&B - RHYTHM AND BLUES',
    description: 'Grooves sedutores, vocais aveludados, neo-soul e os maiores clássicos contemporâneos de R&B.',
    color: '#6366f1',
    gradient: 'from-indigo-600 via-purple-800 to-zinc-950',
    songs: [
      { id: 'PAFAfhod9TU', title: 'H.E.R. - Damage (Official Video)', artist: 'H.E.R.' },
      { id: 'rhXCNHOMp_8', title: 'Bela Maria - Difícil Lembrar, né?', artist: 'Bela Maria' },
      { id: 'u6hlObFT60A', title: 'Black Pumas – Amazon Music Songline (Full Concert)', artist: 'Black Pumas' },
      { id: 'AnSZs-22a7A', title: 'Coco Jones | The 1st TERRELL Show Concert (Full Show)', artist: 'Coco Jones' },
      { id: 'eUzar_3afCo', title: 'Top Hits, R&B & Afrobeats Mix Vol. 8', artist: 'DJ JC Llamas' },
      { id: '_2ugLP3nfKc', title: 'Héron Love | R&B Lovers (House Party Experience 2)', artist: 'Héron Love' },
      { id: 'dG4gjJVGJMw', title: 'R&B Essentials | A COLORS MIX', artist: 'A COLORS SHOW' },
      { id: 'L8W75wsLx3o', title: 'Os Garotin - Calor e Arrepio (Clipe Oficial)', artist: 'Os Garotin' },
      { id: 'cJyl5rc2Qvk', title: 'Os Garotin, Anchietx - Maldade (Live Session)', artist: 'Os Garotin' },
      { id: 'Qp80R3efukg', title: 'Os Garotin - Queda Livre (Live Session)', artist: 'Os Garotin' },
      { id: 'OGpSkX8VV5w', title: 'Os Garotin, Leo Guima - Coração de Lata (Live Session)', artist: 'Os Garotin' },
      { id: '3DMDo1nAILc', title: 'Os Garotin - Pouco a Pouco (Live Session)', artist: 'Os Garotin' },
      { id: 'VWHit-A3M-Y', title: 'Os Garotin - Hoje Eu Vou Me Dar Bem (Ao Vivo no Estúdio)', artist: 'Os Garotin' },
      { id: 'KkOnlUc7-bI', title: 'Os Garotin de São Gonçalo - Álbum Completo', artist: 'Os Garotin' },
      { id: 'rq_2gjb2d0A', title: 'Os Garotin - Calor do Momento (Clipe Oficial)', artist: 'Os Garotin' },
      { id: '1x40hmS6O74', title: 'Lucas - Anchietx, Os Garotin (Live Session)', artist: 'Os Garotin' }
    ]
  }
];
