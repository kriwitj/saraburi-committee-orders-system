import { NextRequest, NextResponse } from 'next/server';
import { getSettings, updateSettings } from '@/db/queries';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  try {
    return NextResponse.json(await getSettings());
  } catch (e) { console.error(e); return NextResponse.json({ error: 'Server error' }, { status: 500 }); }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const data = await req.json();
    return NextResponse.json(await updateSettings(data));
  } catch (e) { console.error(e); return NextResponse.json({ error: 'Server error' }, { status: 500 }); }
}
