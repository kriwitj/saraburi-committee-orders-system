import { NextRequest, NextResponse } from 'next/server';
import { getOrders } from '@/db/queries';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const q       = searchParams.get('q')?.toLowerCase() || '';
    const type    = searchParams.get('type') || '';
    const year    = searchParams.get('year') || '';
    const agency  = searchParams.get('agency') || '';

    const orders = await getOrders('VIEWER');

    const active = orders.filter(o => o.status === 'ACTIVE' || o.status === 'DRAFT');

    const filtered = active.filter(o => {
      const matchQ = !q || (o.orderNumber || '').toLowerCase().includes(q)
        || (o.title || '').toLowerCase().includes(q)
        || (o.signedBy || '').toLowerCase().includes(q);
      const matchType = !type || o.type === type;
      const matchYear = !year || (o.orderDate || '').startsWith(year.length === 4 ? year : '');
      const matchAgency = !agency || o.agencyId === agency;
      return matchQ && matchType && matchYear && matchAgency;
    });

    // Return stripped-down data (no sub-committee members for performance)
    const slim = filtered.map(o => ({
      id: o.id,
      orderNumber: o.orderNumber,
      orderDate: o.orderDate,
      effectiveDate: o.effectiveDate,
      type: o.type,
      title: o.title,
      signedBy: o.signedBy,
      signedByTitle: o.signedByTitle,
      status: o.status,
      agencyId: o.agencyId,
      subCommitteesCount: o.subCommittees.length,
      membersCount: o.subCommittees.reduce((s, sc) => s + sc.members.length, 0),
      attachments: o.attachments,
    }));

    return NextResponse.json(slim, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
