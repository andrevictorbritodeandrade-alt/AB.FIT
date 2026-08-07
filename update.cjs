const fs = require('fs');
const content = fs.readFileSync('components/GeraAi.tsx', 'utf-8');
const newContent = content.replace(
  /const imgPrompt = `A highly detailed, professional fitness photography.*?ultra-realistic, photorealistic.`;/s,
  `const imgPrompt = \`A highly detailed, professional fitness photography of a muscular Black athlete perfectly demonstrating the gym exercise: "\${exerciseName}". Target muscle group: \${muscle}. The athlete is wearing all-black Adidas workout gear, including a black athletic top, black training pants or shorts with the signature three white stripes, and black Adidas sneakers. Ensure the athlete's body positioning and equipment are strictly accurate for the requested exercise, avoiding any awkward twisting or physically impossible postures. \${positionInstructions}The image should show peak muscle contraction with perfect biomechanical form. Professional modern gym environment, dramatic cinematic lighting, 8k resolution, ultra-realistic, photorealistic.\`;`
);
fs.writeFileSync('components/GeraAi.tsx', newContent);
