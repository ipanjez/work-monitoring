import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
const SETTING_KEY = 'master_smart_add_templates';

const defaultTemplates = [
  {
    id: 'default-1',
    name: 'Template Agenda MRK (Default)',
    content: `📌AGENDA \n🌟Hari, 10 s.d. 13 Agustus 2026\n\n1. Judul Agenda 1\n⏰️ : 09:00 - 11:00 WITA\n🏩 : Lokasi atau Link Zoom\nPIC: [Nama PIC Utama], [Nama PIC Tambahan]\nPrioritas: High\nKategori: Umum\n\n2. Judul Agenda 2\n⏰️ : 13:00 - 15:00 WITA\n🏩 : Lokasi Agenda 2\n[Nama PIC Lengkap]\nPrioritas: Medium\nKategori: Umum`,
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
        // Force update default templates in case their name/content changed in code
        templates = templates.map((tpl: any) => {
          if (tpl.isDefault) {
            const defTpl = defaultTemplates.find(d => d.id === tpl.id);
            if (defTpl) {
              return { ...tpl, name: defTpl.name, content: defTpl.content };
            }
          }
          return tpl;
        });
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
