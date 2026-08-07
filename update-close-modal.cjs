const fs = require('fs');
let content = fs.readFileSync('components/GeraAi.tsx', 'utf-8');

content = content.replace(
  /const closeModal = \(\) => \{\n    setSelectedExercise\(null\);\n    setGeneratedImage\(null\);\n    setAnalysis\(null\);\n    setIsGenerating\(false\);\n  \};/,
  `const closeModal = () => {
    if (initialExerciseName && onBack) {
      onBack();
      return;
    }
    setSelectedExercise(null);
    setGeneratedImage(null);
    setAnalysis(null);
    setIsGenerating(false);
  };`
);

content = content.replace(
  /<ImageIcon className="w-6 h-6 text-red-500 drop-shadow-\[0_0_8px_rgba\(239,68,68,0\.5\)\]" \/>/g,
  `<Zap className="w-6 h-6 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />`
);

fs.writeFileSync('components/GeraAi.tsx', content);
