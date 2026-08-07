const fs = require('fs');
let content = fs.readFileSync('components/GeraAi.tsx', 'utf-8');
content = content.replace(
  /Sintetizando \{select.*?<\/h2>/s,
  `Sintetizando {selectedExercise.name}...
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-6 sm:p-10 flex flex-col gap-8">
                    <div>
                      <h2 className="text-3xl sm:text-5xl font-black font-display italic tracking-tight text-white max-w-4xl uppercase leading-[1.1]">
                        {selectedExercise.name}
                      </h2>`
);
fs.writeFileSync('components/GeraAi.tsx', content);
