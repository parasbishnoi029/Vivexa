const fs = require('fs');
let code = fs.readFileSync('src/components/ui/project-wizard.tsx', 'utf8');
code = code.replace(
  /  };\n    if \(step < 3\) setStep\(step \+ 1\);\n    else onComplete\(formData\);\n  };/,
  '  };'
);
fs.writeFileSync('src/components/ui/project-wizard.tsx', code);
