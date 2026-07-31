const fs = require('fs');

function updateFile(filepath, isBoard) {
  let content = fs.readFileSync(filepath, 'utf8');
  
  if (!content.includes("FilePreviewModal")) {
    if (content.includes("import TaskDetailModal")) {
      content = content.replace("import TaskDetailModal", "import FilePreviewModal from '@/components/FilePreviewModal';\nimport TaskDetailModal");
    } else {
      console.log("Cannot find import location in", filepath);
    }
  }

  if (isBoard && !content.includes("const [previewFile, setPreviewFile] = useState")) {
    content = content.replace("const [selectedTask, setSelectedTask] = useState<any | null>(null);", "const [previewFile, setPreviewFile] = useState<any | null>(null);\n  const [selectedTask, setSelectedTask] = useState<any | null>(null);");
  }

  content = content.replace(/setPreviewFile=\{.*window\.open.*\}/g, "setPreviewFile={setPreviewFile}");

  const inlineModalRegex = /\{previewFile && \(\s*<div[^>]*>\s*<div[^>]*onClick=\{\(\) => setPreviewFile\(null\)\}[^>]*>[\s\S]*?<FileViewer url=\{previewFile\.url\}[^>]*>[\s\S]*?<\/div>\s*\)\}/g;
  content = content.replace(inlineModalRegex, "");

  const inlineModalWithAnimateRegex = /\{\/\* In-App File Preview Modal \*\/\}\s*<AnimatePresence>\s*\{previewFile && \(\s*<div className="modal-overlay">[\s\S]*?<FileViewer url=\{previewFile\.url\}[^>]*>[\s\S]*?<\/div>\s*\)\}\s*<\/AnimatePresence>/g;
  content = content.replace(inlineModalWithAnimateRegex, "");

  if (!content.includes("<FilePreviewModal previewFile={previewFile}")) {
    content = content.replace(/(<\/[a-zA-Z.]+>\s*)\);\s*\}\s*$/, "  <FilePreviewModal previewFile={previewFile} setPreviewFile={setPreviewFile} />\n    $1);\n}");
  }

  fs.writeFileSync(filepath, content, 'utf8');
}

const base = 'c:/Users/Farhans-WINDOWS/OneDrive - m365/Learn/Coding/Dashboard Monitoring Pekerjaan/dashboard-app/src/app/(dashboard)';
updateFile(base + '/BoardClient.tsx', true);
updateFile(base + '/dashboard/DashboardClient.tsx', false);
updateFile(base + '/tasks/TasksClient.tsx', false);
updateFile(base + '/team/TeamClient.tsx', false);
updateFile(base + '/calendar/CalendarClient.tsx', false);
console.log('Done!');
