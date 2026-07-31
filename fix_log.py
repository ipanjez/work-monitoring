import os

path = r'src\app\api\tasks\[id]\route.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the first block (for progress status update)
content = content.replace(
    "'UPDATE_TASK_STATUS',\n                title: Status pekerjaan diubah menjadi ,\n                message: Status pekerjaan diubah dari  menjadi ",
    "'UPDATE_TASK_STATUS',\n                title: Status pekerjaan \"\" diubah menjadi ,\n                message: Status pekerjaan \"\" diubah dari  menjadi "
)

# Replace the second block (for full task update)
content = content.replace(
    "'UPDATE_TASK_STATUS',\n                  title: Status pekerjaan diubah menjadi ,\n                  message: Status pekerjaan diubah dari  menjadi ",
    "'UPDATE_TASK_STATUS',\n                  title: Status pekerjaan \"\" diubah menjadi ,\n                  message: Status pekerjaan \"\" diubah dari  menjadi "
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done task')

path2 = r'src\app\(dashboard)\settings\SettingsClient.tsx'
with open(path2, 'r', encoding='utf-8') as f:
    content2 = f.read()

content2 = content2.replace(
    "addActivityLog('SAVE_SETTINGS', 'Simpan Pengaturan', 'Pengaturan aplikasi berhasil disimpan', 'success');",
    "addActivityLog('SAVE_SETTINGS', 'Simpan Pengaturan Aplikasi', 'Pengaturan (departemen, kategori, status, prioritas, dll) berhasil disimpan dan diperbarui di seluruh aplikasi', 'success');"
)
with open(path2, 'w', encoding='utf-8') as f:
    f.write(content2)

print('Done settings')
