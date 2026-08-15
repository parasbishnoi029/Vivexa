const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Move #initial-loader before #root
const loaderRegex = /<style>[\s\S]*?<\/div>\s*<\/div>/;
const match = html.match(loaderRegex);

if (match) {
    const loaderContent = match[0];
    html = html.replace(loaderRegex, '');
    // Insert loaderContent right after <body ...>
    const bodyMatch = html.match(/<body[^>]*>/);
    if (bodyMatch) {
        html = html.replace(bodyMatch[0], bodyMatch[0] + '\n    ' + loaderContent);
        fs.writeFileSync('index.html', html);
        console.log('index.html patched');
    }
}
