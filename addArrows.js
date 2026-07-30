const fs = require('fs');
let content = fs.readFileSync('src/app/(dashboard)/BoardClient.tsx', 'utf8');

if (!content.includes('ChevronUp')) {
  content = content.replace(/Minimize2,\s*Maximize2\s*\}\s*from\s*'lucide-react';/, "ChevronUp, ChevronDown } from 'lucide-react';");
}

content = content.replace(/const\s+\[collapsedColumns,\s*setCollapsedColumns\]\s*=\s*useState<string\[\]>\(\[\]\);\n?/g, '');
content = content.replace(/const\s+toggleCollapse\s*=\s*\([^)]+\)\s*=>\s*\{[^}]+\};\n?/g, '');
content = content.replace(/const\s+isCollapsed\s*=\s*collapsedColumns\.includes\(col\);\n?/g, '');
content = content.replace(/!\s*isCollapsed\s*\?\s*handleDragOverColumn\(e,\s*col\)\s*:\s*undefined/g, 'handleDragOverColumn(e, col)');
content = content.replace(/!\s*isCollapsed\s*\?\s*handleDragLeave\s*:\s*undefined/g, 'handleDragLeave');
content = content.replace(/!\s*isCollapsed\s*\?\s*handleDropColumn\(e,\s*col\)\s*:\s*undefined/g, 'handleDropColumn(e, col)');
content = content.replace(/flexDirection:\s*isCollapsed\s*\?\s*'column'\s*:\s*'row'/g, "flexDirection: 'row'");
content = content.replace(/writingMode:\s*isCollapsed\s*\?\s*'vertical-rl'\s*:\s*'horizontal-tb'/g, "writingMode: 'horizontal-tb'");
content = content.replace(/transform:\s*isCollapsed\s*\?\s*'rotate\(180deg\)'\s*:\s*'none'/g, "transform: 'none'");
content = content.replace(/margin:\s*isCollapsed\s*\?\s*'8px 0'\s*:\s*'0'/g, "margin: '0'");
content = content.replace(/!\s*isCollapsed\s*&&\s*columnTasks\.map/g, 'columnTasks.map');

content = content.replace(/<button[^>]+onClick=\{\(\)\s*=>\s*toggleCollapse\(col\)\}[^>]*>[\s\S]*?<\/button>/g, '');

const handleMove = `
  const handleMoveTask = (task: any, direction: 'up' | 'down', currentColumnTasks: any[]) => {
    if (sortBy !== 'Manual') {
      toast.error('Pengurutan manual hanya bisa dilakukan jika filter Urutkan diset ke Manual');
      return;
    }
    const currentIndex = currentColumnTasks.findIndex(t => t.id === task.id);
    if (direction === 'up' && currentIndex > 0) {
      const newTasks = [...currentColumnTasks];
      const temp = newTasks[currentIndex - 1];
      newTasks[currentIndex - 1] = newTasks[currentIndex];
      newTasks[currentIndex] = temp;
      newTasks.forEach((t, i) => t.orderIndex = i);
      setTasks(prev => prev.map(p => newTasks.find(n => n.id === p.id) || p));
      saveReorder(newTasks);
    } else if (direction === 'down' && currentIndex < currentColumnTasks.length - 1) {
      const newTasks = [...currentColumnTasks];
      const temp = newTasks[currentIndex + 1];
      newTasks[currentIndex + 1] = newTasks[currentIndex];
      newTasks[currentIndex] = temp;
      newTasks.forEach((t, i) => t.orderIndex = i);
      setTasks(prev => prev.map(p => newTasks.find(n => n.id === p.id) || p));
      saveReorder(newTasks);
    }
  };

  return (
`;
content = content.replace(/\s*return\s*\(\s*<div\s+className="h-full"/, handleMove + '\n    <div className="h-full"');

content = content.replace(/(<div[^>]*className="kanban-card[^>]*>)/g, `$1\n<div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '-10px', position: 'relative', zIndex: 10 }}><div style={{ display: 'flex', gap: '4px' }}><button onClick={(e) => { e.stopPropagation(); handleMoveTask(task, 'up', columnTasks); }} style={{ background: 'var(--background)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', padding: '2px', display: sortBy === 'Manual' ? 'block' : 'none' }} title="Geser ke Atas"><ChevronUp size={14} color="var(--text-secondary)" /></button><button onClick={(e) => { e.stopPropagation(); handleMoveTask(task, 'down', columnTasks); }} style={{ background: 'var(--background)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', padding: '2px', display: sortBy === 'Manual' ? 'block' : 'none' }} title="Geser ke Bawah"><ChevronDown size={14} color="var(--text-secondary)" /></button></div></div>\n`);

fs.writeFileSync('src/app/(dashboard)/BoardClient.tsx', content);
console.log('Script done');
