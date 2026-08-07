const fs = require('fs');
const content = fs.readFileSync('components/GeraAi.tsx', 'utf-8');
const updatedConditionals = content.replace(
  /\} else if \(upperName.includes\("AGACHAMENTO"\)/,
  `} else if (upperName.includes("LEG PRESS HORIZONTAL")) {
      positionInstructions = "CRITICAL POSTURE REQUIREMENT: This is a Seated Horizontal Leg Press (Leg Press Horizontal). The athlete is seated upright with a slight recline on a padded gym machine seat. Their feet are placed flat on a large vertical push-plate in front of them, pushing it away horizontally. Their knees are bent towards their chest or extending horizontally to push the weight. Their hands are gripping the support handles by the sides of the seat. Do NOT draw a 45-degree angle leg press where the athlete is lying on their back.";
    } else if (upperName.includes("AGACHAMENTO")`
);

const newContent = updatedConditionals.replace(
  /const imgPrompt = \`A highly detailed, professional fitness photography.*?ultra-realistic, photorealistic.\`;/s,
  `const imgPrompt = \`A highly detailed, professional fitness photography of a tall, athletic Black man with curly hair, perfectly demonstrating the gym exercise: "\${exerciseName}". Target muscle group: \${muscle}. The athlete is wearing a black Adidas shirt, black Adidas shorts with the signature three white stripes, and white Adidas Superstar sneakers. Ensure the athlete's body positioning and equipment are strictly accurate for the requested exercise, avoiding any awkward twisting or physically impossible postures. \${positionInstructions}The image should show peak muscle contraction with perfect biomechanical form. Professional modern gym environment, dramatic cinematic lighting, 8k resolution, ultra-realistic, photorealistic.\`;`
);
fs.writeFileSync('components/GeraAi.tsx', newContent);
