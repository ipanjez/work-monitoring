const fs = require('fs');
let content = fs.readFileSync('src/app/(dashboard)/BoardClient.tsx', 'utf8');

const regex = /const handleDropCard = async \(e: React\.DragEvent, newStatus: string, targetCardId: number\) => \{/;
const replacement = `const handleMoveUp = async (status: string, taskId: number) => {
    let colTasks = tasks.filter(t => t.status === status).sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
    const idx = colTasks.findIndex(t => t.id === taskId);
    if (idx > 0) {
      const temp = colTasks[idx];
      colTasks[idx] = colTasks[idx - 1];
      colTasks[idx - 1] = temp;
      const updated = colTasks.map((t, i) => ({ ...t, orderIndex: i }));
      const newTasks = tasks.map(t => updated.find(u => u.id === t.id) || t);
      setTasks(newTasks);
      saveReorder(updated);
    }
  };

  const handleMoveDown = async (status: string, taskId: number) => {
    let colTasks = tasks.filter(t => t.status === status).sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
    const idx = colTasks.findIndex(t => t.id === taskId);
    if (idx !== -1 && idx < colTasks.length - 1) {
      const temp = colTasks[idx];
      colTasks[idx] = colTasks[idx + 1];
      colTasks[idx + 1] = temp;
      const updated = colTasks.map((t, i) => ({ ...t, orderIndex: i }));
      const newTasks = tasks.map(t => updated.find(u => u.id === t.id) || t);
      setTasks(newTasks);
      saveReorder(updated);
    }
  };

  const handleDropCard = async (e: React.DragEvent, newStatus: string, targetCardId: number) => {`;

content = content.replace(regex, replacement);
fs.writeFileSync('src/app/(dashboard)/BoardClient.tsx', content);
console.log('Functions added.');
