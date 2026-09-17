export interface BiomechanicalEntry {
  tecnicaAplicada: string;
  impactoFisiologico: string[];
}

export const BIOMECHANICAL_DATABASE: Record<string, BiomechanicalEntry> = {
  "SUPINO": {
    tecnicaAplicada: "Posicione-se em decúbito dorsal com escápulas aduzidas e deprimidas e pés firmes no solo. Inicie a fase excêntrica flexionando cotovelos a ~45° a 70° em relação ao tronco até a altura do tórax inferior, estendendo os braços de forma potente na fase concêntrica sem perder a retração escapular.",
    impactoFisiologico: [
      "Ativação máxima das fibras esternocostais e claviculares do Peitoral Maior.",
      "Ação sinergista intensa do Deltoide Anterior e Tríceps Braquial.",
      "Estabilidade da cintura escapular com sobrecarga mecânica primária de compressão e empurrão."
    ]
  },
  "CRUCIFIXO": {
    tecnicaAplicada: "Deitado no banco com ligeira flexão fixa dos cotovelos (10° a 15°). Realize a abdução horizontal controlada dos braços sentindo o estiramento das fibras peitorais, e aduza horizontalmente até a linha média do peito, mantendo tensão muscular contínua sem colidir os pesos no topo.",
    impactoFisiologico: [
      "Isolamento pronunciado do Peitoral Maior com alto torque de estiramento excêntrico.",
      "Mínimo recrutamento do tríceps, preservando a tensão na articulação glenoumeral.",
      "Estímulo hipertrófico mediado por deformação mecânica sob alongamento."
    ]
  },
  "DESENVOLVIMENTO": {
    tecnicaAplicada: "Sentado ou em pé com coluna neutra e abdômen contraído. Posicione a carga na linha clavicular e empurre verticalmente no plano escapular (levemente à frente do plano coronal) até a extensão completa dos cotovelos, controlando a descida até o queixo.",
    impactoFisiologico: [
      "Recrutamento dominante das porções anterior e medial do Deltoide.",
      "Participação sinérgica do Tríceps Braquial e feixes superiores do Trapézio.",
      "Demanda de estabilização do complexo do manguito rotador e da musculatura do core."
    ]
  },
  "ELEVAÇÃO LATERAL": {
    tecnicaAplicada: "Em pé com ligeira inclinação anterior do tronco (10°). Eleve os braços no plano escapular (30° anterior ao plano frontal) até a linha dos ombros, mantendo punho e cotovelo alinhados com o deltoide medial e descendo com controle absoluto.",
    impactoFisiologico: [
      "Isolamento seletivo da cabeça medial do Deltoide, fundamental para largura biacromial.",
      "Ativação do Supraespinhal nos primeiros 30 graus de abdução.",
      "Baixo impacto na lombar com alta densidade de estresse metabólico."
    ]
  },
  "PUXADA": {
    tecnicaAplicada: "Sentado com coxas travadas sob os roletes. Inicie o movimento pela depressão e retração das escápulas antes de flexionar os cotovelos, tracionando a barra em direção ao terço superior do esterno com tronco estável.",
    impactoFisiologico: [
      "Ativação potente do Latíssimo do Dorso (Grande Dorsal) em adução no plano frontal.",
      "Recrutamento sinergista de Rombóides, Trapézio Médio/Inferior e Bíceps Braquial.",
      "Construção de estabilidade escapulotorácica e expansão da musculatura dorsal."
    ]
  },
  "REMADA": {
    tecnicaAplicada: "Com quadril flexionado e coluna lombar selada e neutra (ou peito apoiado no banco). Puxe o peso direcionando os cotovelos para trás junto às costelas, realizando adução escapular máxima no final do percurso e retornando com controle sem arredondar as costas.",
    impactoFisiologico: [
      "Espessura das costas com ênfase no Trapézio Médio, Rombóides e Redondo Maior.",
      "Ativação profunda do Latíssimo do Dorso e Deltoide Posterior.",
      "Alta solicitação isométrica dos eretores da espinha para sustentação postural."
    ]
  },
  "AGACHAMENTO": {
    tecnicaAplicada: "Pés na largura dos ombros e ligeiramente rodados para fora. Inicie o movimento pela flexão simultânea de quadril e joelhos, mantendo o peito ereto e os joelhos alinhados com as pontas dos pés até atingir pelo menos 90 graus de flexão.",
    impactoFisiologico: [
      "Co-ativação vigorosa do Quadríceps (Vasto Lateral, Medial, Intermédio e Reto Femoral).",
      "Poderosa extensão de quadril gerada pelo Glúteo Máximo na saída do ponto de reversão.",
      "Forte demanda neuromotora sobre a cadeia posterior e estabilizadores do tronco."
    ]
  },
  "LEG PRESS": {
    tecnicaAplicada: "Posicione os pés na plataforma na largura do quadril. Desça o carrinho de forma controlada flexionando joelhos e quadril sem permitir a retroversão da pelve do encosto, e empurre pelos calcanhares até estender sem travar/hiperextender os joelhos.",
    impactoFisiologico: [
      "Sobrecarga mecânica segura e de grande volume sobre Quadríceps e Glúteos.",
      "Redução da compressão axial sobre os discos intervertebrais em relação ao agachamento livre.",
      "Estímulo excelente para hipertrofia com controle de amplitude articular."
    ]
  },
  "AFUNDO": {
    tecnicaAplicada: "Dê um passo à frente mantendo a pelve nivelada. Flexione ambos os joelhos simultaneamente até o joelho traseiro quase tocar o solo em ângulo de 90°, com o tronco levemente inclinado para frente para enfatizar os glúteos e suba empurrando pelo calcanhar dianteiro.",
    impactoFisiologico: [
      "Ativação unilateral intensa do Glúteo Máximo, Glúteo Médio e Quadríceps.",
      "Correção de assimetrias bilaterais de força e equilíbrio proprioceptivo.",
      "Fortalecimento funcional dos estabilizadores do joelho e pelve."
    ]
  },
  "HIP THRUST": {
    tecnicaAplicada: "Apoie a linha inferior das escápulas na lateral do banco com a barra protegida no quadril. Com os pés na largura dos ombros e joelhos a 90° no topo, realize a extensão completa do quadril contraindo os glúteos no ponto mais alto com retroversão pélvica posterior.",
    impactoFisiologico: [
      "Pico máximo de tensão eletromiográfica do Glúteo Máximo sob encurtamento total.",
      "Participação sinergista dos Isquiotibiais e Adutores.",
      "Mínima sobrecarga compressiva sobre a coluna lombar."
    ]
  },
  "ELEVAÇÃO DE QUADRIL": {
    tecnicaAplicada: "Deitado no solo com pés apoiados próximos aos glúteos e joelhos flexionados a 90 graus. Empurre o chão com os calcanhares estendendo a pelve até formar uma linha reta entre joelhos, quadril e ombros, sustentando 1 a 2 segundos no topo.",
    impactoFisiologico: [
      "Excelente ativação e recrutamento neuromuscular do Glúteo Máximo.",
      "Estabilização da bacia e reforço dos Isquiotibiais e Paravertebrais.",
      "Trabalho de fortalecimento com zero impacto articular."
    ]
  },
  "STIFF": {
    tecnicaAplicada: "Pés paralelos na largura do quadril, joelhos semiflexionados e travados nesse ângulo. Inicie o movimento projetando o quadril para trás (hip hinge) e descendo a barra colada nas pernas com a coluna reta até sentir o estiramento posterior, voltando pela extensão do quadril.",
    impactoFisiologico: [
      "Grande sobrecarga de estiramento excêntrico nos Isquiotibiais (Bíceps Femoral, Semitendíneo, Semimembranoso).",
      "Alta ativação do Glúteo Máximo na fase de subida.",
      "Exigência isométrica protetora dos Paravertebrais e eretores da espinha."
    ]
  },
  "CADEIRA EXTENSORA": {
    tecnicaAplicada: "Ajuste o encosto de modo que o eixo da máquina coincida com a articulação do joelho. Estenda os joelhos de forma contínua até o alinhamento horizontal, sustentando a contração isométrica momentânea no topo e controlando a descida lenta.",
    impactoFisiologico: [
      "Isolamento analítico de todas as porções do Quadríceps, especialmente Reto Femoral.",
      "Indução de grande estresse metabólico e queima intracelular por oclusão transitória.",
      "Fortalecimento distal do tendão patelar em amplitudes seguras."
    ]
  },
  "MESA FLEXORA": {
    tecnicaAplicada: "Deitado em decúbito ventral com a almofada posicionada logo acima dos calcanhares. Flexione os joelhos trazendo o rolo em direção aos glúteos mantendo a pelve pressionada contra o banco para não hiperestender a lombar.",
    impactoFisiologico: [
      "Ação direta e isolada das cabeças longa e curta do Bíceps Femoral, Semitendíneo e Semimembranoso.",
      "Fortalecimento da flexão de joelho essencial para o equilíbrio de força joelho/quadril.",
      "Prevenção de lesões no ligamento cruzado anterior e estabilidade da marcha."
    ]
  },
  "ROSCA": {
    tecnicaAplicada: "Em pé ou sentado com cotovelos estáveis colados às laterais da caixa torácica. Realize a flexão dos cotovelos trazendo o peso em direção aos ombros com supinação gradual das mãos, descendo controladamente até a extensão quase completa.",
    impactoFisiologico: [
      "Foco primário nas cabeças longa e curta do Bíceps Braquial.",
      "Ativação do Braquial Anterior e Braquiorradial para volume e espessura do braço.",
      "Tensão constante no ventre muscular sem impulso lombar."
    ]
  },
  "TRÍCEPS": {
    tecnicaAplicada: "Mantenha o úmero fixo e estável ao longo de todo o trajeto. Estenda os cotovelos empurrando ou puxando a carga até o bloqueio articular controlado, concentrando a força na contração da parte posterior do braço e controlando o retorno excêntrico.",
    impactoFisiologico: [
      "Recrutamento seletivo das cabeças lateral, medial e longa do Tríceps Braquial.",
      "Aumento significativo da força de extensão e estabilidade do cotovelo.",
      "Estímulo hipertrófico de alta densidade."
    ]
  },
  "PANTURRILHA": {
    tecnicaAplicada: "Apoie a porção anterior dos pés na borda do degrau ou plataforma. Desça os calcanhares ao máximo para obter estiramento completo do tendão de Aquiles e empurre potente na ponta dos pés na fase concêntrica até a contração máxima no ápice.",
    impactoFisiologico: [
      "Ativação dos Gastrocnêmios (medial e lateral) em joelhos estendidos e Sóleo em joelhos flexionados.",
      "Aumento da densidade elástica tendínea e retorno venoso dos membros inferiores.",
      "Absorção de impacto e propulsão eficiente para corridas e saltos."
    ]
  },
  "PRANCHA": {
    tecnicaAplicada: "Apoie os antebraços e pontas dos pés no solo com cotovelos sob os ombros. Mantenha o corpo em uma linha reta ininterrupta da cabeça aos calcanhares, ativando glúteos e contraindo o abdômen sem deixar o quadril ceder ou subir em excesso.",
    impactoFisiologico: [
      "Ativação isométrica profunda do Transverso Abdominal e Reto do Abdômen.",
      "Fortalecimento do complexo lombo-pélvico com nula pressão cisalhante sobre a coluna.",
      "Base de estabilidade central (core) essencial para transmissão de forças."
    ]
  },
  "ABDOMINAL": {
    tecnicaAplicada: "Deitado com joelhos flexionados e pés apoiados. Flexione o tronco aproximando as costelas da pelve, expelindo o ar no topo do movimento e concentrando a força estritamente nos músculos abdominais sem tracionar o pescoço.",
    impactoFisiologico: [
      "Fortalecimento direto do Reto Abdominal e Oblíquos.",
      "Melhora do controle respiratório e da pressão intra-abdominal.",
      "Suporte anatômico para a coluna vertebral e prevenção de dores posturais."
    ]
  },
  "PERDIGUEIRO": {
    tecnicaAplicada: "Na posição de quatro apoios com mãos sob os ombros e joelhos sob o quadril. Estenda simultaneamente um braço à frente e a perna oposta para trás até a altura do tronco, mantendo a coluna alinhada e a pelve estável sem girar o corpo.",
    impactoFisiologico: [
      "Ativação cruzada dos Multifidios, Paravertebrais e Glúteo Máximo.",
      "Aumento expressivo do controle proprioceptivo e estabilidade da coluna.",
      "Exercício padrão ouro de baixo risco articular para saúde da lombar."
    ]
  }
};

export function getBiomechanicalDetails(exerciseName: string, muscleGroup: string = ""): BiomechanicalEntry {
  const upper = (exerciseName || "").toUpperCase();
  const muscleUpper = (muscleGroup || "").toUpperCase();

  // Try matching by specific keywords in exercise name
  for (const [key, val] of Object.entries(BIOMECHANICAL_DATABASE)) {
    if (upper.includes(key)) {
      return val;
    }
  }

  // Fallback by muscle group keywords
  if (muscleUpper.includes("PEITORAL") || muscleUpper.includes("PEITO")) return BIOMECHANICAL_DATABASE["SUPINO"];
  if (muscleUpper.includes("DORSAL") || muscleUpper.includes("COSTAS")) return BIOMECHANICAL_DATABASE["PUXADA"];
  if (muscleUpper.includes("OMBRO") || muscleUpper.includes("DELTOIDE")) return BIOMECHANICAL_DATABASE["DESENVOLVIMENTO"];
  if (muscleUpper.includes("BÍCEPS") || muscleUpper.includes("BICEPS")) return BIOMECHANICAL_DATABASE["ROSCA"];
  if (muscleUpper.includes("TRÍCEPS") || muscleUpper.includes("TRICEPS")) return BIOMECHANICAL_DATABASE["TRÍCEPS"];
  if (muscleUpper.includes("QUADRÍCEPS") || muscleUpper.includes("COXA")) return BIOMECHANICAL_DATABASE["AGACHAMENTO"];
  if (muscleUpper.includes("GLÚTEO") || muscleUpper.includes("GLÚTEOS")) return BIOMECHANICAL_DATABASE["HIP THRUST"];
  if (muscleUpper.includes("POSTERIOR") || muscleUpper.includes("ISQUIOTIBIAIS")) return BIOMECHANICAL_DATABASE["STIFF"];
  if (muscleUpper.includes("PANTURRILHA")) return BIOMECHANICAL_DATABASE["PANTURRILHA"];
  if (muscleUpper.includes("ABDOMINAL") || muscleUpper.includes("ABDOMINAIS") || muscleUpper.includes("CORE")) return BIOMECHANICAL_DATABASE["PRANCHA"];
  if (muscleUpper.includes("PARAVERTEBRAIS") || muscleUpper.includes("LOMBAR")) return BIOMECHANICAL_DATABASE["PERDIGUEIRO"];

  // Universal master fallback
  return {
    tecnicaAplicada: `Para executar ${exerciseName}, posicione-se com postura anatômica alinhada, respiração controlada e abdômen estabilizado. Inicie o movimento na cadência recomendada, concentrando a contração nos músculos motores primários do grupo ${muscleGroup || 'especificado'}.`,
    impactoFisiologico: [
      `Ativação neuromuscular direcionada para o grupamento ${muscleGroup || 'alvo'}.`,
      "Estímulo à síntese de proteínas miofibrilares e reforço do controle motor.",
      "Preservação da integridade articular através do controle de velocidade excêntrica."
    ]
  };
}
