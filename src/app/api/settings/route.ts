import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const settings = await prisma.appSetting.findMany();

    // Default fallback
    const defaultData: Record<string, any> = {
      master_categories: [],
      master_pics: [],
      master_statuses: [],
      master_priorities: [],
      master_colors: {},
      master_icons: {},
      master_status_progress: {},
      dept_name: 'Work Monitoring'
    };

    settings.forEach(setting => {
      if (setting.key === 'dept_name') {
        defaultData[setting.key] = setting.value;
      } else {
        try {
          const parsed = JSON.parse(setting.value);
          if (Array.isArray(parsed)) {
            if (parsed.length > 0) defaultData[setting.key] = parsed;
          } else if (parsed && typeof parsed === 'object') {
            defaultData[setting.key] = parsed;
          }
        } catch (e) {
          // ignore parse error
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
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    
    // body expects { master_categories: [...], master_pics: [...], master_statuses: [...], master_priorities: [...] }
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

    if (body.master_pics) {
      await prisma.appSetting.upsert({
        where: { key: 'master_pics' },
        update: { value: JSON.stringify(body.master_pics) },
        create: { key: 'master_pics', value: JSON.stringify(body.master_pics) }
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
