import os
import re

def update_file(path, replacements):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for old, new in replacements:
        content = content.replace(old, new)
        
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

# 1. TaskAddEditModal.tsx
# Remove default '08:00' and '17:00'
update_file('src/components/TaskAddEditModal.tsx', [
    ("value={editingTask.startTime || '08:00'}", "value={editingTask.startTime || ''}"),
    ("value={editingTask.endTime || '17:00'}", "value={editingTask.endTime || ''}")
])

# 2. TaskDetailModal.tsx
# Add time to startDate and endDate
update_file('src/components/TaskDetailModal.tsx', [
    ("{format(new Date(task.startDate), 'dd MMM yyyy')}</p>", "{format(new Date(task.startDate), 'dd MMM yyyy')}{!task.isAllDay && task.startTime ? ,  : ''}</p>"),
    ("{format(new Date(task.endDate), 'dd MMM yyyy')}</p>", "{format(new Date(task.endDate), 'dd MMM yyyy')}{!task.isAllDay && task.endTime ? ,  : ''}</p>")
])

# 3. CalendarClient.tsx
update_file('src/app/(dashboard)/calendar/CalendarClient.tsx', [
    ("startTime: task.startTime || '08:00',", "startTime: task.startTime || '',"),
    ("endTime: task.endTime || '17:00',", "endTime: task.endTime || '',"),
    ("startTime: '08:00',", "startTime: '',"),
    ("endTime: '17:00',", "endTime: '',"),
    ("{format(new Date(selectedTask.startDate), 'dd MMM yyyy')}</p>", "{format(new Date(selectedTask.startDate), 'dd MMM yyyy')}{!selectedTask.isAllDay && selectedTask.startTime ? ,  : ''}</p>"),
    ("{format(new Date(selectedTask.endDate), 'dd MMM yyyy')}</p>", "{format(new Date(selectedTask.endDate), 'dd MMM yyyy')}{!selectedTask.isAllDay && selectedTask.endTime ? ,  : ''}</p>"),
    ("<FullCalendar", "<FullCalendar\n          eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}\n          slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}")
])

# 4. TasksClient.tsx
# Table already has {!task.isAllDay && task.startTime && ( ... )} but we need to update the default values.
update_file('src/app/(dashboard)/tasks/TasksClient.tsx', [
    ("startTime: '08:00',", "startTime: '',"),
    ("endTime: '17:00',", "endTime: '',"),
    ("startTime: task.startTime || '08:00',", "startTime: task.startTime || '',"),
    ("endTime: task.endTime || '17:00',", "endTime: task.endTime || '',")
])

# 5. DashboardClient.tsx
update_file('src/app/(dashboard)/dashboard/DashboardClient.tsx', [
    ("'Tanggal Mulai': format(new Date(t.startDate), 'dd MMM yyyy'),", "'Tanggal Mulai': format(new Date(t.startDate), 'dd MMM yyyy') + (!t.isAllDay && t.startTime ? ,  : ''),"),
    ("'Tenggat Waktu': format(new Date(t.endDate), 'dd MMM yyyy')", "'Tenggat Waktu': format(new Date(t.endDate), 'dd MMM yyyy') + (!t.isAllDay && t.endTime ? ,  : '')"),
    ("format(new Date(t.endDate), 'dd MMM yyyy'),", "format(new Date(t.endDate), 'dd MMM yyyy') + (!t.isAllDay && t.endTime ? ,  : ''),")
])

# 6. ReportsClient.tsx
update_file('src/app/(dashboard)/reports/ReportsClient.tsx', [
    ("'Tanggal Mulai': format(new Date(t.startDate), 'yyyy-MM-dd'),", "'Tanggal Mulai': format(new Date(t.startDate), 'yyyy-MM-dd') + (!t.isAllDay && t.startTime ?   : ''),"),
    ("'Tenggat Waktu': format(new Date(t.endDate), 'yyyy-MM-dd'),", "'Tenggat Waktu': format(new Date(t.endDate), 'yyyy-MM-dd') + (!t.isAllDay && t.endTime ?   : ''),")
])

# 7. TeamClient.tsx
update_file('src/app/(dashboard)/team/TeamClient.tsx', [
    ("{format(new Date(t.endDate), 'dd MMM yyyy')}</td>", "{format(new Date(t.endDate), 'dd MMM yyyy')}{!t.isAllDay && t.endTime ? ,  : ''}</td>")
])

print('Done')
