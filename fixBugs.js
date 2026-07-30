const fs = require('fs');

// Fix TasksClient.tsx
let tasksContent = fs.readFileSync('src/app/(dashboard)/tasks/TasksClient.tsx', 'utf8');
const tasksRegex = /<BulkEditModal[\s\S]*?\/>\s*formStatusOptions=\{masterStatuses\}/;
const tasksReplacement = `        <BulkEditModal
          isOpen={!!bulkEditField}
          onClose={() => setBulkEditField(null)}
          selectedTaskIds={Array.from(selectedTasks)}
          field={bulkEditField}
          masterStatuses={masterStatuses}
          masterCats={masterCats}
          masterPics={masterPics}
          masterStatusProgress={masterStatusProgress}
          onSuccess={() => {
            setSelectedTasks(new Set());
            fetch('/api/tasks').then(r => r.json()).then(setTasks);
            refreshData();
          }}
        />
        <TaskAddEditModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          task={editingTask}
          onSave={handleSaveModal}
          formCategoryOptions={formCategoryOptions}
          formPicOptions={formPicOptions}
          formStatusOptions={masterStatuses}`;

if (tasksContent.match(tasksRegex)) {
  tasksContent = tasksContent.replace(tasksRegex, tasksReplacement);
  fs.writeFileSync('src/app/(dashboard)/tasks/TasksClient.tsx', tasksContent);
  console.log('Fixed TasksClient JSX');
} else {
  console.log('Could not find TasksClient JSX pattern');
}

// Fix CalendarClient.tsx
let calContent = fs.readFileSync('src/app/(dashboard)/calendar/CalendarClient.tsx', 'utf8');
const calTarget = "background: activeFilter === filterValue ? color : 'var(--surface-color)',\n                  color: activeFilter === filterValue ? 'white' : color,\n                  border: `1px solid ${color}`,";
const calReplacement = "background: activeFilter === filterValue ? bgColor : 'var(--surface-color)',\n                  color: activeFilter === filterValue ? color : bgColor,\n                  border: `1px solid ${bgColor}`,";

if (calContent.includes(calTarget)) {
    calContent = calContent.replace(calTarget, calReplacement);
    fs.writeFileSync('src/app/(dashboard)/calendar/CalendarClient.tsx', calContent);
    console.log('Fixed CalendarClient button colors');
} else {
    console.log('CalendarClient target not found');
}
