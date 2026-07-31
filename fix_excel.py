import os

path = r'src\app\(dashboard)\tasks\TasksClient.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Template headers
old_columns = '''        // Tentukan Header
        worksheet.columns = [
          { header: 'Nama Pekerjaan', key: 'nama', width: 35 },
          { header: 'PIC Utama', key: 'pic', width: 25 },
          { header: 'PIC Tambahan', key: 'picTambahan', width: 30 },
          { header: 'Kategori', key: 'kategori', width: 20 },
          { header: 'Prioritas', key: 'prioritas', width: 15 },
          { header: 'Status', key: 'status', width: 15 },
          { header: 'Progress', key: 'progress', width: 12 },
          { header: 'Tanggal Mulai', key: 'startDate', width: 15 },
          { header: 'Tenggat Waktu', key: 'endDate', width: 15 },
          { header: 'Deskripsi', key: 'deskripsi', width: 40 },
          { header: 'Catatan', key: 'catatan', width: 40 },
          { header: 'Sub Pekerjaan', key: 'subPekerjaan', width: 50 },
        ];'''

new_columns = '''        // Tentukan Header
        worksheet.columns = [
          { header: 'Nama Pekerjaan', key: 'nama', width: 35 },
          { header: 'PIC Utama', key: 'pic', width: 25 },
          { header: 'PIC Tambahan', key: 'picTambahan', width: 30 },
          { header: 'Kategori', key: 'kategori', width: 20 },
          { header: 'Prioritas', key: 'prioritas', width: 15 },
          { header: 'Status', key: 'status', width: 15 },
          { header: 'Progress', key: 'progress', width: 12 },
          { header: 'Sepanjang Hari', key: 'isAllDay', width: 15 },
          { header: 'Jam Mulai', key: 'startTime', width: 15 },
          { header: 'Tanggal Mulai', key: 'startDate', width: 15 },
          { header: 'Jam Selesai', key: 'endTime', width: 15 },
          { header: 'Tenggat Waktu', key: 'endDate', width: 15 },
          { header: 'Repetisi', key: 'repetisi', width: 15 },
          { header: 'Deskripsi', key: 'deskripsi', width: 40 },
          { header: 'Catatan', key: 'catatan', width: 40 },
          { header: 'Sub Pekerjaan', key: 'subPekerjaan', width: 50 },
        ];'''

content = content.replace(old_columns, new_columns)

# 2. Update Template example row
old_example = '''          status: 'In Progress',
          progress: 50,
          startDate: format(new Date(), 'yyyy-MM-dd'),
          endDate: format(new Date(), 'yyyy-MM-dd'),
          deskripsi: 'Gunakan Alt+Enter untuk baris baru di dalam sel.',
          catatan: 'Contoh catatan',
          subPekerjaan: '[Done] Mengumpulkan data\\n[In Progress] Menganalisis data\\n[To Do] Membuat laporan akhir',
        });'''

new_example = '''          status: 'In Progress',
          progress: 50,
          isAllDay: 'Ya',
          startTime: '09:00',
          startDate: format(new Date(), 'yyyy-MM-dd'),
          endTime: '17:00',
          endDate: format(new Date(), 'yyyy-MM-dd'),
          repetisi: 'Tidak Berulang',
          deskripsi: 'Gunakan Alt+Enter untuk baris baru di dalam sel.',
          catatan: 'Contoh catatan',
          subPekerjaan: '[Done] Mengumpulkan data\\n[In Progress] Menganalisis data\\n[To Do] Membuat laporan akhir',
        });'''
content = content.replace(old_example, new_example)

# 3. Update Import Data handling
old_import = '''          return {
            nama: row['nama pekerjaan'] || row['nama'] || 'Tanpa Nama',
            pic: row['pic utama'] || row['pic'] || 'Unassigned',
            status: row['status'] || 'To Do',
            prioritas: row['prioritas'] || 'Medium',
            kategori: row['kategori'] || 'Umum',
            progress: p,
            deskripsi: row['deskripsi'] || '',
            catatan: row['catatan'] || '',
            startDate: row['tanggal mulai'] || row['startdate'] || new Date().toISOString(),
            endDate: row['tenggat waktu'] || row['enddate'] || new Date().toISOString(),
            ...(subTasksJson ? { subTasksJson } : {}),
            ...(additionalPicsJson ? { additionalPics: additionalPicsJson } : {}),
          };'''

new_import = '''          const isAllDayStr = (row['sepanjang hari'] || row['isallday'] || 'Ya').toString().toLowerCase();
          const isAllDay = isAllDayStr === 'ya' || isAllDayStr === 'true' || isAllDayStr === '1' || isAllDayStr === 'yes';

          return {
            nama: row['nama pekerjaan'] || row['nama'] || 'Tanpa Nama',
            pic: row['pic utama'] || row['pic'] || 'Unassigned',
            status: row['status'] || 'To Do',
            prioritas: row['prioritas'] || 'Medium',
            kategori: row['kategori'] || 'Umum',
            progress: p,
            isAllDay,
            startTime: row['jam mulai'] || row['starttime'] || null,
            endTime: row['jam selesai'] || row['endtime'] || null,
            repetisi: row['repetisi'] || 'Tidak Berulang',
            deskripsi: row['deskripsi'] || '',
            catatan: row['catatan'] || '',
            startDate: row['tanggal mulai'] || row['startdate'] || new Date().toISOString(),
            endDate: row['tenggat waktu'] || row['enddate'] || new Date().toISOString(),
            ...(subTasksJson ? { subTasksJson } : {}),
            ...(additionalPicsJson ? { additionalPics: additionalPicsJson } : {}),
          };'''

content = content.replace(old_import, new_import)


# 4. Update Export Excel data
old_export = '''      return {
        'Nama Pekerjaan': t.nama,
        'PIC Utama': t.pic,
        'PIC Tambahan': getAdditionalPics(t).join(', '),
        'Kategori': t.kategori || 'Umum',
        'Prioritas': t.prioritas || 'Medium',
        'Status': t.status,
        'Progress (%)': t.progress || 0,
        'Sub Pekerjaan': subPekerjaanStr,
        'Diedit (kali)': t.editCount || 0,
        'Terakhir Diedit': t.lastEditedAt ? format(new Date(t.lastEditedAt), 'yyyy-MM-dd HH:mm') : '-',
        'Tanggal Mulai': format(new Date(t.startDate), 'yyyy-MM-dd'),
        'Tenggat Waktu': format(new Date(t.endDate), 'yyyy-MM-dd'),
      };'''

new_export = '''      return {
        'Nama Pekerjaan': t.nama,
        'PIC Utama': t.pic,
        'PIC Tambahan': getAdditionalPics(t).join(', '),
        'Kategori': t.kategori || 'Umum',
        'Prioritas': t.prioritas || 'Medium',
        'Status': t.status,
        'Progress (%)': t.progress || 0,
        'Sepanjang Hari': t.isAllDay ? 'Ya' : 'Tidak',
        'Jam Mulai': t.startTime || '',
        'Tanggal Mulai': format(new Date(t.startDate), 'yyyy-MM-dd'),
        'Jam Selesai': t.endTime || '',
        'Tenggat Waktu': format(new Date(t.endDate), 'yyyy-MM-dd'),
        'Repetisi': t.repetisi || 'Tidak Berulang',
        'Sub Pekerjaan': subPekerjaanStr,
        'Diedit (kali)': t.editCount || 0,
        'Terakhir Diedit': t.lastEditedAt ? format(new Date(t.lastEditedAt), 'yyyy-MM-dd HH:mm') : '-',
        'Deskripsi': t.deskripsi || '',
        'Catatan': t.catatan || ''
      };'''

content = content.replace(old_export, new_export)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated TasksClient.tsx")
