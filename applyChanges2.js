const fs = require('fs');

// 1. DashboardClient.tsx
let dbContent = fs.readFileSync('src/app/(dashboard)/dashboard/DashboardClient.tsx', 'utf8');

// Add masterColors state
dbContent = dbContent.replace(
  `const [masterPriorities, setMasterPriorities] = useState<string[]>([]);`,
  `const [masterPriorities, setMasterPriorities] = useState<string[]>([]);\n  const [masterColors, setMasterColors] = useState<Record<string, string>>({});`
);

dbContent = dbContent.replace(
  `if (data.master_priorities) {\n            setMasterPriorities(data.master_priorities);\n          }`,
  `if (data.master_priorities) {\n            setMasterPriorities(data.master_priorities);\n          }\n          if (data.master_colors) {\n            setMasterColors(data.master_colors);\n          }`
);

// Update statusData colors
dbContent = dbContent.replace(
  `backgroundColor: (masterStatuses.length > 0 ? masterStatuses : Object.keys(statusCounts)).map((_, i) => defaultColors[i % defaultColors.length]),`,
  `backgroundColor: (masterStatuses.length > 0 ? masterStatuses : Object.keys(statusCounts)).map((s, i) => masterColors['status_' + s] || defaultColors[i % defaultColors.length]),`
);

// Update priorityData colors
dbContent = dbContent.replace(
  `backgroundColor: (masterPriorities.length > 0 ? masterPriorities : Object.keys(priorityCounts)).map((_, i) => priorityColors[i % priorityColors.length]),`,
  `backgroundColor: (masterPriorities.length > 0 ? masterPriorities : Object.keys(priorityCounts)).map((p, i) => masterColors['priority_' + p] || priorityColors[i % priorityColors.length]),`
);

// Update categoryData colors
dbContent = dbContent.replace(
  `backgroundColor: '#8b5cf6', // Purple`,
  `backgroundColor: Object.keys(categoryCounts).map(c => masterColors['category_' + c] || '#8b5cf6'),`
);

// Add import getDynamicBadgeStyle
if (!dbContent.includes('getDynamicBadgeStyle')) {
  dbContent = dbContent.replace(
    `import { Task } from '@/utils/taskUtils';`,
    `import { Task, getDynamicBadgeStyle } from '@/utils/taskUtils';`
  );
  if (!dbContent.includes('getDynamicBadgeStyle')) {
      dbContent = dbContent.replace(
          `import { format, startOfDay } from 'date-fns';`,
          `import { format, startOfDay } from 'date-fns';\nimport { getDynamicBadgeStyle } from '@/utils/taskUtils';`
      );
  }
}

// Update recent tasks badges
dbContent = dbContent.replace(
  /<span className={`badge \${t\.status === 'Done' \? 'badge-success' : t\.status === 'In Progress' \? 'badge-warning' : 'badge-todo'}`} style={{ alignSelf: 'flex-start' }}>/g,
  `<span {...getDynamicBadgeStyle('status', t.status, '', masterColors)} style={{ ...getDynamicBadgeStyle('status', t.status, '', masterColors).style, alignSelf: 'flex-start' }}>`
);

fs.writeFileSync('src/app/(dashboard)/dashboard/DashboardClient.tsx', dbContent);


// 2. QuickCommentModal.tsx
let qContent = fs.readFileSync('src/components/QuickCommentModal.tsx', 'utf8');

if (!qContent.includes('useNotifications')) {
  qContent = qContent.replace(
    `import { useRouter } from 'next/navigation';`,
    `import { useRouter } from 'next/navigation';\nimport { useNotifications } from '@/context/NotificationContext';`
  );
}

if (!qContent.includes('const { addActivityLog }')) {
  qContent = qContent.replace(
    `const router = useRouter();`,
    `const router = useRouter();\n  const { addActivityLog } = useNotifications();`
  );
}

qContent = qContent.replace(
  `toast.success('Komentar berhasil dikirim');`,
  `toast.success('Komentar berhasil dikirim');\n      if (addActivityLog) addActivityLog('NEW_COMMENT', 'Komentar Baru', \`Komentar ditambahkan oleh \${commentAuthor.trim()} pada pekerjaan "\${task!.nama}"\`, 'info');`
);

fs.writeFileSync('src/components/QuickCommentModal.tsx', qContent);


// 3. TaskDetailModal.tsx
let tContent = fs.readFileSync('src/components/TaskDetailModal.tsx', 'utf8');

if (!tContent.includes('useNotifications')) {
    tContent = tContent.replace(
        `import { useRouter } from 'next/navigation';`,
        `import { useRouter } from 'next/navigation';\nimport { useNotifications } from '@/context/NotificationContext';`
    );
}

if (!tContent.includes('const { addActivityLog }')) {
    tContent = tContent.replace(
        `const router = useRouter();`,
        `const router = useRouter();\n  const { addActivityLog } = useNotifications();`
    );
}

tContent = tContent.replace(
    `toast.success('Komentar berhasil ditambahkan');`,
    `toast.success('Komentar berhasil ditambahkan');\n      if (addActivityLog) addActivityLog('NEW_COMMENT', 'Komentar Baru', \`Komentar ditambahkan oleh \${commentAuthor.trim()} pada pekerjaan "\${task.nama}"\`, 'info');`
);

fs.writeFileSync('src/components/TaskDetailModal.tsx', tContent);
console.log('Modifications done.');
