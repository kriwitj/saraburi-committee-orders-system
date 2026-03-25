import { NextRequest, NextResponse } from 'next/server';
import { getOrder } from '@/db/queries';
import { generateWordDoc } from '@/lib/exportWord';
import { generatePrintHtml } from '@/lib/exportPdf';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const fmt = req.nextUrl.searchParams.get('format') || 'pdf';
    const order = await getOrder(id);
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (fmt === 'word') {
      const buf = await generateWordDoc(order);
      const filename = encodeURIComponent(`คำสั่ง-${order.orderNumber}.docx`);
      return new NextResponse(buf as unknown as BodyInit, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename*=UTF-8''${filename}`,
        },
      });
    }

    // PDF = print-ready HTML
    const html = generatePrintHtml(order);
    return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  } catch (e) { console.error(e); return NextResponse.json({ error: 'Server error' }, { status: 500 }); }
}
