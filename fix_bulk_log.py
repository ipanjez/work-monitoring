import os

path = r'src\app\api\tasks\bulk-status\route.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "title: Status diubah menjadi ,\n            message: Status pekerjaan diperbarui secara massal menjadi .",
    "title: Status pekerjaan \"\" diubah menjadi ,\n            message: Status pekerjaan \"\" diperbarui secara massal menjadi ."
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done bulk status')
