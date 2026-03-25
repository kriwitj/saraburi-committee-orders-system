import { NextRequest, NextResponse } from 'next/server';
import { getAgencies, createAgency, deleteAgency } from '@/db/queries';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  try {
    return NextResponse.json(await getAgencies());
  } catch (e) { console.error(e); return NextResponse.json({ error: 'Server error' }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { name } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: 'กรุณากรอกชื่อหน่วยงาน' }, { status: 400 });
    const agency = await createAgency(name.trim());
    return NextResponse.json(agency, { status: 201 });
  } catch (e: unknown) {
    if ((e as NodeJS.ErrnoException)?.message?.includes('unique')) {
      return NextResponse.json({ error: 'หน่วยงานนี้มีอยู่แล้ว' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    await deleteAgency(id);
    return NextResponse.json({ ok: true });
  } catch (e) { console.error(e); return NextResponse.json({ error: 'Server error' }, { status: 500 }); }
}
