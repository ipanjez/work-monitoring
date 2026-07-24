import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const settings = await prisma.appSetting.findMany();
    
    // Default fallback
    const defaultData = {
      master_categories: [],
      master_pics: []
    };

    settings.forEach(setting => {
      try {
        (defaultData as any)[setting.key] = JSON.parse(setting.value);
      } catch (e) {
        // ignore parse error
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
