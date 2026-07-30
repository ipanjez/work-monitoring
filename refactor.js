const fs = require('fs');

const processFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');

  if (!content.includes('useMaster')) {
    if (content.includes('import { useTheme } from')) {
      content = content.replace(/(import .* useTheme .* from '@\/context\/ThemeContext';?)/, "$1\nimport { useMaster } from '@/context/MasterContext';");
    } else {
      content = "import { useMaster } from '@/context/MasterContext';\n" + content;
    }
    
    // Also, find the component definition and insert const { masterColors } = useMaster();
    content = content.replace(/(export default function [a-zA-Z0-9_]+\([^)]*\)\s*\{)/, "$1\n  const { masterColors } = useMaster();");
  }

  // Update getDynamicBadgeStyle calls
  content = content.replace(/getDynamicBadgeStyle\(([^,]+),\s*([^,]+),\s*([^)]+)\)/g, 'getDynamicBadgeStyle($1, $2, $3, masterColors)');
  
  fs.writeFileSync(filePath, content);
  console.log('Updated ' + filePath);
};

processFile('src/app/(dashboard)/tasks/TasksClient.tsx');
processFile('src/app/(dashboard)/calendar/CalendarClient.tsx');
processFile('src/app/(dashboard)/BoardClient.tsx');
processFile('src/components/TaskDetailModal.tsx');
