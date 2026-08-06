import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();
const SETTING_KEY = 'master_smart_add_templates';

const defaultTemplates = [
  {
    id: 'default-1',
    name: 'Template Agenda MRK (Default)',
    content: `📌AGENDA \n🌟Hari, DD MMMM YYYY\n\n1. Agenda 1\n⏰️ : XX:XX WITA\n🏩 : Lokasi Agenda 1\n\n2. Agenda 2\n⏰️ : XX:XX WITA\n🏩 : Lokasi Agenda 2`,
    isDefault: true,
    orderIndex: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdByName: 'System',
    lastUpdatedByName: 'System'
  },
  {
    id: 'default-2',
    name: 'Template Korporat PKT (Default)',
    content: `Kepada Yth. \n- Direktur Manajemen Risiko\n- SVP TKMR\nPT Pupuk Kalimantan Timur (Persero)\n\nDimohon kehadirannya pada\n📆 : Jumat, 7 Agustus 2026\n⏰️ : 09.00 WIB / 10.00 WITA\n🗒️ : Kick Off Meeting Penilaian Indeks Kematangan Risiko/Risk Maturity Index (RMI) Pupuk Indonesia Group Tahun Buku 2025\n🏩 : Online Meeting\n        \nhttps://pupuk-indonesia.zoom.us/j/6450000645\nMeeting ID: 6450000645 | Passcode: -\n\nAtas perhatiannya kami ucapkan terima kasih.\n\nPT Pupuk Indonesia\nNinis Kesuma Adriani\nDirektur Manajemen Risiko`,
    isDefault: true,
    orderIndex: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdByName: 'System',
    lastUpdatedByName: 'System'
  }
];

export async function GET() {
  try {
    const setting = await prisma.appSetting.findUnique({
      where: { key: SETTING_KEY }
    });

    let templates = [];
    if (setting) {
      try {
        templates = JSON.parse(setting.value);
      } catch (e) {
        templates = [...defaultTemplates];
      }
    } else {
      templates = [...defaultTemplates];
    }
    
    // Sort by orderIndex
    templates.sort((a: any, b: any) => (a.orderIndex || 0) - (b.orderIndex || 0));
    
    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching smart add templates:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { templates } = body;
    
    if (!Array.isArray(templates)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    await prisma.appSetting.upsert({
      where: { key: SETTING_KEY },
      update: { value: JSON.stringify(templates) },
      create: { key: SETTING_KEY, value: JSON.stringify(templates) }
    });

    return NextResponse.json({ success: true, templates });
  } catch (error) {
    console.error('Error saving smart add templates:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
