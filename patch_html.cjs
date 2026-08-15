const fs = require('fs');
let code = fs.readFileSync('src/pages/workspace/ExecutiveReports.tsx', 'utf8');

const replacement = `    <div class="watermark">Vivexa</div>
  </div>
</body>
</html>\`;`;

code = code.replace(/  <\/div>\n<\/body>\n<\/html>\`;/, replacement);

const cssReplacement = `    th { background-color: #0f172a; color: #94a3b8; text-transform: uppercase; font-size: 10px; }
    .watermark { text-align: right; margin-top: 40px; font-size: 14px; font-weight: bold; font-style: italic; color: #64748b; }
  </style>`;

code = code.replace(/    th \{ background-color: #0f172a; color: #94a3b8; text-transform: uppercase; font-size: 10px; \}\n  <\/style>/, cssReplacement);

fs.writeFileSync('src/pages/workspace/ExecutiveReports.tsx', code);
