import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkServerPermission } from '@/lib/serverPermissions';

export async function GET() {
  try {
    const settings = await prisma.appSetting.findMany();

    // Default fallback
    const defaultData: Record<string, any> = {
      master_categories: [],
      master_pics: [],
      master_statuses: [],
      master_priorities: [],
      master_locations: [],
      master_colors: {},
      master_icons: {},
      master_status_progress: {},
      master_pic_avatars: {},
      dept_name: 'Work Monitoring',
      app_name: 'DeptMonitor',
      app_subtitle: 'MRK',
      app_logo: '',
      max_file_size_mb: 25,
      max_task_files_size_mb: 100,
      session_timeout_hours: 24,
      session_timeout: 10,
      backup_reminder_days: 0,
      last_backup_date: '',
      calendar_timezone: 'Asia/Makassar'
    };

    settings.forEach(setting => {
      if (setting.key === 'dept_name') {
        defaultData[setting.key] = setting.value;
      } else {
        try {
          const parsed = JSON.parse(setting.value);
          if (Array.isArray(parsed)) {
            if (parsed.length > 0) defaultData[setting.key] = parsed;
          } else if (parsed !== null && parsed !== undefined && typeof parsed === 'object') {
            defaultData[setting.key] = parsed;
          } else {
            defaultData[setting.key] = parsed;
          }
        } catch (e) {
          // If parse fails, assign raw value (useful for primitives that aren't valid JSON)
          defaultData[setting.key] = setting.value;
        }
      }
    });

    return NextResponse.json(defaultData);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role || '';
    const isAllowed = await checkServerPermission('master_data', userRole) || 
                      await checkServerPermission('system_config', userRole) ||
                      await checkServerPermission('database_backup', userRole);
    if (!isAllowed) {
      return NextResponse.json({ error: 'Akses ditolak: Anda tidak memiliki izin untuk mengubah pengaturan.' }, { status: 403 });
    }
    const body = await request.json();
    
    // body expects { master_categories: [...], master_pics: [...], master_statuses: [...], master_priorities: [...], master_locations: [...] }
    if (body.master_categories) {
      await prisma.appSetting.upsert({
        where: { key: 'master_categories' },
        update: { value: JSON.stringify(body.master_categories) },
        create: { key: 'master_categories', value: JSON.stringify(body.master_categories) }
      });
    }

    if (body.master_statuses) {
      await prisma.appSetting.upsert({
        where: { key: 'master_statuses' },
        update: { value: JSON.stringify(body.master_statuses) },
        create: { key: 'master_statuses', value: JSON.stringify(body.master_statuses) }
      });
    }

    if (body.master_priorities) {
      await prisma.appSetting.upsert({
        where: { key: 'master_priorities' },
        update: { value: JSON.stringify(body.master_priorities) },
        create: { key: 'master_priorities', value: JSON.stringify(body.master_priorities) }
      });
    }

    if (body.master_locations) {
      await prisma.appSetting.upsert({
        where: { key: 'master_locations' },
        update: { value: JSON.stringify(body.master_locations) },
        create: { key: 'master_locations', value: JSON.stringify(body.master_locations) }
      });
    }

    if (body.master_pics) {
      await prisma.appSetting.upsert({
        where: { key: 'master_pics' },
        update: { value: JSON.stringify(body.master_pics) },
        create: { key: 'master_pics', value: JSON.stringify(body.master_pics) }
      });
    }

    if (body.master_pic_avatars) {
      await prisma.appSetting.upsert({
        where: { key: 'master_pic_avatars' },
        update: { value: JSON.stringify(body.master_pic_avatars) },
        create: { key: 'master_pic_avatars', value: JSON.stringify(body.master_pic_avatars) }
      });
    }

    if (body.master_colors) {
      await prisma.appSetting.upsert({
        where: { key: 'master_colors' },
        update: { value: JSON.stringify(body.master_colors) },
        create: { key: 'master_colors', value: JSON.stringify(body.master_colors) }
      });
    }

    if (body.master_icons) {
      await prisma.appSetting.upsert({
        where: { key: 'master_icons' },
        update: { value: JSON.stringify(body.master_icons) },
        create: { key: 'master_icons', value: JSON.stringify(body.master_icons) }
      });
    }

    if (body.master_status_progress) {
      await prisma.appSetting.upsert({
        where: { key: 'master_status_progress' },
        update: { value: JSON.stringify(body.master_status_progress) },
        create: { key: 'master_status_progress', value: JSON.stringify(body.master_status_progress) }
      });
    }

    if (body.dept_name !== undefined) {
      await prisma.appSetting.upsert({
        where: { key: 'dept_name' },
        update: { value: body.dept_name },
        create: { key: 'dept_name', value: body.dept_name }
      });
    }

    if (body.app_name !== undefined) {
      await prisma.appSetting.upsert({
        where: { key: 'app_name' },
        update: { value: body.app_name },
        create: { key: 'app_name', value: body.app_name }
      });
    }

    if (body.app_subtitle !== undefined) {
      await prisma.appSetting.upsert({
        where: { key: 'app_subtitle' },
        update: { value: body.app_subtitle },
        create: { key: 'app_subtitle', value: body.app_subtitle }
      });
    }

    if (body.app_logo !== undefined) {
      await prisma.appSetting.upsert({
        where: { key: 'app_logo' },
        update: { value: body.app_logo },
        create: { key: 'app_logo', value: body.app_logo }
      });
    }

    if (body.max_file_size_mb !== undefined) {
      await prisma.appSetting.upsert({
        where: { key: 'max_file_size_mb' },
        update: { value: String(body.max_file_size_mb) },
        create: { key: 'max_file_size_mb', value: String(body.max_file_size_mb) }
      });
    }

    if (body.max_task_files_size_mb !== undefined) {
      await prisma.appSetting.upsert({
        where: { key: 'max_task_files_size_mb' },
        update: { value: String(body.max_task_files_size_mb) },
        create: { key: 'max_task_files_size_mb', value: String(body.max_task_files_size_mb) }
      });
    }

    if (body.session_timeout_hours !== undefined) {
      await prisma.appSetting.upsert({
        where: { key: 'session_timeout_hours' },
        update: { value: String(body.session_timeout_hours) },
        create: { key: 'session_timeout_hours', value: String(body.session_timeout_hours) }
      });
    }

    if (body.session_timeout !== undefined) {
      await prisma.appSetting.upsert({
        where: { key: 'session_timeout' },
        update: { value: String(body.session_timeout) },
        create: { key: 'session_timeout', value: String(body.session_timeout) }
      });
    }

    if (body.backup_reminder_days !== undefined) {
      await prisma.appSetting.upsert({
        where: { key: 'backup_reminder_days' },
        update: { value: String(body.backup_reminder_days) },
        create: { key: 'backup_reminder_days', value: String(body.backup_reminder_days) }
      });
    }

    if (body.calendar_timezone !== undefined) {
      await prisma.appSetting.upsert({
        where: { key: 'calendar_timezone' },
        update: { value: String(body.calendar_timezone).trim() },
        create: { key: 'calendar_timezone', value: String(body.calendar_timezone).trim() }
      });
    }

    if (body.global_password !== undefined && body.global_password.trim() !== '') {
      const hashedPassword = bcrypt.hashSync(body.global_password, 10);
      await prisma.appSetting.upsert({
        where: { key: 'global_password' },
        update: { value: hashedPassword },
        create: { key: 'global_password', value: hashedPassword }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
