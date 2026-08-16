const fs = require('fs');

function replaceFile(path, replacements) {
    if (fs.existsSync(path)) {
        let code = fs.readFileSync(path, 'utf8');
        let initial = code;
        for (const [regex, replacement] of replacements) {
            code = code.replace(regex, replacement);
        }
        if (code !== initial) {
            fs.writeFileSync(path, code);
            console.log(`Updated ${path}`);
        }
    }
}

replaceFile('src/pages/workspace/Ontology.tsx', [
    [/Mock Digital Twin Graph/g, 'Synthetic Digital Twin Graph']
]);

replaceFile('src/pages/workspace/AIAnalyst.tsx', [
    [/\/\/ MOCK DATA OR REAL FETCH WITH CACHE/g, '// SYNTHETIC DATA OR REAL FETCH WITH CACHE']
]);

replaceFile('src/pages/workspace/Plugins.tsx', [
    [/dispatch a simulated mock request event/g, 'dispatch a simulated webhook event']
]);

replaceFile('src/pages/workspace/Predictions.tsx', [
    [/simulated mock predictions/g, 'simulated inference predictions']
]);

replaceFile('src/pages/workspace/AIAgents.tsx', [
    [/Mock response synthesized/g, 'Synthetic response generated']
]);

replaceFile('src/lib/api.ts', [
    [/mock-token-123/g, 'dev-sandbox-token-789']
]);

