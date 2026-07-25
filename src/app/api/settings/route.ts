import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const defaultCategories = ['Umum', 'IT', 'HR', 'Finance', 'Logistik', 'Operasional', 'Marketing', 'Produksi'];

    const settings = await prisma.appSetting.findMany();

    // Default fallback
    const defaultData: Record<string, any> = {
      master_categories: defaultCategories,
      master_pics: [],
      dept_name: 'Work Monitoring'
    };

    settings.forEach(setting => {
      if (setting.key === 'dept_name') {
        defaultData[setting.key] = setting.value;
      } else {
        try {
          const parsed = JSON.parse(setting.value);
          if (Array.isArray(parsed) && parsed.length > 0) {
            defaultData[setting.key] = parsed;
          }
        } catch (e) {
          // ignore parse error
        }
      }
    });

    // Auto-seed: if no master_categories in DB yet, save the defaults
    const hasCatSetting = settings.find(s => s.key === 'master_categories');
    if (!hasCatSetting) {
      await prisma.appSetting.create({
        data: { key: 'master_categories', value: JSON.stringify(defaultCategories) }
      }).catch(() => {}); // ignore if race condition
    }

    return NextResponse.json(defaultData);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // body expects { master_categories: [...], master_pics: [...] }
    if (body.master_categories) {
      await prisma.appSetting.upsert({
        where: { key: 'master_categories' },
        update: { value: JSON.stringify(body.master_categories) },
        create: { key: 'master_categories', value: JSON.stringify(body.master_categories) }
      });
    }

    if (body.master_pics) {
      await prisma.appSetting.upsert({
        where: { key: 'master_pics' },
        update: { value: JSON.stringify(body.master_pics) },
        create: { key: 'master_pics', value: JSON.stringify(body.master_pics) }
      });
    }

    if (body.dept_name !== undefined) {
      await prisma.appSetting.upsert({
        where: { key: 'dept_name' },
        update: { value: body.dept_name },
        create: { key: 'dept_name', value: body.dept_name }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
