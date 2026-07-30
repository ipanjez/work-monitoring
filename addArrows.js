const fs = require('fs');
let content = fs.readFileSync('src/app/(dashboard)/BoardClient.tsx', 'utf8');

const regex = /<span \{\.\.\.getDynamicBadgeStyle\('priority', task\.prioritas \|\| 'Medium', 'badge badge-medium', masterColors\)\}>\s*\{task\.prioritas \|\| 'Medium'\}\s*<\/span>/;

const replacement = `<div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                {sortBy === 'Manual' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginRight: '4px' }}>
                    <ChevronUp 
                      size={14} 
                      color="var(--text-secondary)" 
                      style={{ cursor: 'pointer' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveUp(col, task.id);
                      }} 
                    />
                    <ChevronDown 
                      size={14} 
                      color="var(--text-secondary)" 
                      style={{ cursor: 'pointer' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveDown(col, task.id);
                      }} 
                    />
                  </div>
                )}
                <span {...getDynamicBadgeStyle('priority', task.prioritas || 'Medium', 'badge badge-medium', masterColors)}>
                  {task.prioritas || 'Medium'}
                </span>
              </div>`;

content = content.replace(regex, replacement);

// We need to implement handleMoveUp and handleMoveDown
const funcRegex = /const handleDropCard = async \(e: React\.DragEvent, newStatus: string, draggedId: number\) => \{/;
const funcReplacement = `const handleMoveUp = async (status: string, taskId: number) => {
    let colTasks = tasks.filter(t => t.status === status).sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
    const idx = colTasks.findIndex(t => t.id === taskId);
    if (idx > 0) {
      const temp = colTasks[idx];
      colTasks[idx] = colTasks[idx - 1];
      colTasks[idx - 1] = temp;
      const updated = colTasks.map((t, i) => ({ ...t, orderIndex: i }));
      const newTasks = tasks.map(t => updated.find(u => u.id === t.id) || t);
      setTasks(newTasks);
      await saveReorder(updated);
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
      await saveReorder(updated);
    }
  };

  const handleDropCard = async (e: React.DragEvent, newStatus: string, draggedId: number) => {`;

content = content.replace(funcRegex, funcReplacement);

fs.writeFileSync('src/app/(dashboard)/BoardClient.tsx', content);
console.log('Added up/down arrows and logic');
