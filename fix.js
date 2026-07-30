const fs = require('fs');

const processFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');

  // Move 'use client'; to the very top if it exists
  if (content.includes("'use client';")) {
    content = content.replace(/'use client';\s*/g, '');
    content = "'use client';\n" + content;
  }
  
  fs.writeFileSync(filePath, content);
  console.log('Fixed ' + filePath);
};

processFile('src/app/(dashboard)/tasks/TasksClient.tsx');
processFile('src/app/(dashboard)/calendar/CalendarClient.tsx');
processFile('src/app/(dashboard)/BoardClient.tsx');
processFile('src/components/TaskDetailModal.tsx');
