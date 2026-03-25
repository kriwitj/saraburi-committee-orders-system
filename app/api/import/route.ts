import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { createMember } from '@/db/queries';
import * as XLSX from 'xlsx';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role === 'VIEWER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const form = await req.formData();
    const file = form.get('file') as File | null;
    const scId = form.get('scId') as string | null;

    if (!file || !scId) return NextResponse.json({ error: 'Missing file or scId' }, { status: 400 });

    const buf = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buf, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' });

    if (!rows.length) return NextResponse.json({ error: 'ไม่พบข้อมูลในไฟล์' }, { status: 400 });

    const created = [];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const agencyPosition = r['ตำแหน่ง'] || r['agencyPosition'] || r['position'] || '';
      const agency = r['หน่วยงาน'] || r['agency'] || '';
      const role = r['บทบาท'] || r['role'] || 'กรรมการ';
      const name = r['ชื่อ'] || r['name'] || '';
      if (!agencyPosition && !name) continue;
      const m = await createMember(scId, { name: name || null, agencyPosition: agencyPosition || null, agency: agency || null, role, seq: i + 1 });
      created.push(m);
    }

    return NextResponse.json({ imported: created.length, members: created });
  } catch (e) { console.error(e); return NextResponse.json({ error: 'Server error' }, { status: 500 }); }
}

// Excel template download
export async function GET() {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    ['ชื่อ', 'ตำแหน่ง', 'หน่วยงาน', 'บทบาท'],
    ['', 'ผู้ว่าราชการจังหวัดสระบุรี', 'จังหวัดสระบุรี', 'ประธานกรรมการ'],
    ['นายตัวอย่าง ทดสอบ', 'ที่ปรึกษา', '', 'กรรมการ'],
  ]);
  XLSX.utils.book_append_sheet(wb, ws, 'รายชื่อ');
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': "attachment; filename*=UTF-8''template-members.xlsx",
    },
  });
}
