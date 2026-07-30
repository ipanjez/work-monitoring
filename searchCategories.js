const fs = require('fs');
const walk = (dir) => {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = dir + '/' + file;
    if (fs.statSync(fullPath).isDirectory()) {
      if (!fullPath.includes('node_modules') && !fullPath.includes('.git') && !fullPath.includes('.next')) {
        walk(fullPath);
      }
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('IT') || content.includes('HR')) {
        const lines = content.split('\n');
        lines.forEach((l, i) => {
          if (l.includes("'IT'") || l.includes('"IT"') || l.includes("'HR'") || l.includes('"HR"')) {
             console.log(fullPath + ':' + (i+1) + ': ' + l.trim());
          }
        });
      }
    }
  });
};
walk('src');
