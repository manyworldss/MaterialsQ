const fs = require('fs');
let code = fs.readFileSync('src/engine/score.ts', 'utf8');
code = code.replace(/    rubricVersion: RUBRIC_VERSION,\n    analyzedMs: Math\.max\(1, Math\.round\(performance\.now\(\) - t0\)\),\n  };\n}\n    overall,[\s\S]*?\n  };\n}/, 
`    careAndFlags,
    rubricVersion: RUBRIC_VERSION,
    analyzedMs: Math.max(1, Math.round(performance.now() - t0)),
  };
}`);
fs.writeFileSync('src/engine/score.ts', code);
