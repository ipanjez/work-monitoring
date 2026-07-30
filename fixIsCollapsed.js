const fs = require('fs');
let content = fs.readFileSync('src/app/(dashboard)/BoardClient.tsx', 'utf8');

content = content.replace(/width:\s*isCollapsed\s*\?\s*'60px'\s*:\s*'320px',/g, "width: '320px',");
content = content.replace(/minWidth:\s*isCollapsed\s*\?\s*'60px'\s*:\s*'320px',/g, "minWidth: '320px',");

fs.writeFileSync('src/app/(dashboard)/BoardClient.tsx', content);
console.log('Fixed isCollapsed');
