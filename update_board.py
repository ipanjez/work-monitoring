import os
import re

def update_file(path, replacements):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for old, new in replacements:
        content = content.replace(old, new)
        
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

update_file('src/app/(dashboard)/BoardClient.tsx', [
    ("{new Date(task.endDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}", "{new Date(task.endDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}{!task.isAllDay && task.endTime ? ,  : ''}")
])

print('Done')
