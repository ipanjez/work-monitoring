import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Resend } from 'resend';

// Initialize Resend with key from env
const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId } = await req.json();
    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    const task = await prisma.task.findUnique({
      where: { id: Number(taskId) }
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Get email map of active users
    const users = await prisma.user.findMany({
      where: { status: 'ACTIVE' },
      select: { name: true, email: true }
    });

    const emailMap: Record<string, string> = {};
    users.forEach(u => {
      if (u.name && u.email) emailMap[u.name] = u.email;
    });

    // Resolve PICS
    const pics = new Set<string>();
    if (task.pic) pics.add(task.pic);

    if (task.additionalPics) {
      try {
        const arr = JSON.parse(task.additionalPics);
        if (Array.isArray(arr)) arr.forEach((p: string) => pics.add(p));
      } catch (e) { }
    }

    if (task.subTasksJson) {
      try {
        const arr = JSON.parse(task.subTasksJson);
        if (Array.isArray(arr)) {
          arr.forEach((st: any) => {
            if (st.pic) pics.add(st.pic);
          });
        }
      } catch (e) { }
    }

    const allPics = Array.from(pics);
    const emailsTo = allPics.map(p => emailMap[p]).filter(Boolean);

    if (emailsTo.length === 0) {
      return NextResponse.json({ error: `Tidak ada data email untuk PIC: ${allPics.join(', ') || '-'}` }, { status: 400 });
    }

    // Check for API key
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY is not defined in environment variables.');
      return NextResponse.json({
        error: 'RESEND_API_KEY belum dikonfigurasi di file .env. Harap hubungi administrator.'
      }, { status: 500 });
    }

    const subject = `Informasi Pekerjaan: [${task.kategori || 'Umum'}] ${task.nama}`;

    // Formatting subtasks
    let subTasksHtml = '';
    if (task.subTasksJson) {
      try {
        const subTasks = JSON.parse(task.subTasksJson);
        if (Array.isArray(subTasks) && subTasks.length > 0) {
          subTasksHtml = `
            <h3 style="color: #1e293b; font-size: 15px; margin-top: 20px; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">Sub-Pekerjaan:</h3>
            <ul style="padding-left: 20px; color: #475569; font-size: 14px; line-height: 1.6; margin-top: 0;">
              ${subTasks.map((st: any) => `
                <li style="margin-bottom: 4px;"><strong>[${st.status}]</strong> ${st.text} (PIC: ${st.pic || '-'})</li>
              `).join('')}
            </ul>
          `;
        }
      } catch (e) { }
    }

    // Constructing premium HTML body
    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
        <div style="background-color: #3b82f6; padding: 16px; text-align: center; border-radius: 6px 6px 0 0;">
          <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600;">Detail Penugasan Pekerjaan</h2>
        </div>
        <div style="padding: 20px;">
          <p style="color: #334155; font-size: 15px; line-height: 1.5; margin-top: 0;">Berikut adalah detail informasi mengenai pekerjaan yang ditugaskan kepada Anda:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 14px;">
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; color: #64748b; font-weight: 500; width: 140px;">Nama Pekerjaan</td>
              <td style="padding: 10px 0; color: #1e293b; font-weight: 600;">${task.nama}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; color: #64748b; font-weight: 500;">Kategori</td>
              <td style="padding: 10px 0; color: #1e293b;">${task.kategori || 'Umum'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; color: #64748b; font-weight: 500;">Status</td>
              <td style="padding: 10px 0; color: #1e293b;">
                <span style="background-color: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;">${task.status}</span>
              </td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; color: #64748b; font-weight: 500;">Prioritas</td>
              <td style="padding: 10px 0; color: #1e293b;">${task.prioritas || 'Medium'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; color: #64748b; font-weight: 500;">Lokasi</td>
              <td style="padding: 10px 0; color: #1e293b;">${task.lokasi || '-'}</td>
            </tr>
          </table>

          <div style="margin-top: 20px;">
            <h3 style="color: #1e293b; font-size: 15px; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">Deskripsi:</h3>
            <div style="background-color: #f8fafc; padding: 12px; border-radius: 6px; border-left: 4px solid #3b82f6; font-size: 14px; color: #334155; white-space: pre-wrap; line-height: 1.6;">${task.deskripsi ? task.deskripsi.replace(/<[^>]*>?/gm, '') : '-'}</div>
          </div>

          ${subTasksHtml}

          <div style="margin-top: 30px; text-align: center;">
            <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/tasks" style="background-color: #3b82f6; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: 500; font-size: 14px; display: inline-block;">Lihat di Dashboard</a>
          </div>
        </div>
        <div style="border-top: 1px solid #f1f5f9; padding-top: 15px; margin-top: 20px; text-align: center; color: #94a3b8; font-size: 11px;">
          Ini adalah email otomatis dari Aplikasi Monitoring Pekerjaan. Harap jangan membalas email ini.
        </div>
      </div>
    `;

    const sender = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    const data = await resend.emails.send({
      from: `Monitoring System <${sender}>`,
      to: emailsTo,
      subject: subject,
      html: htmlBody,
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error sending email:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
