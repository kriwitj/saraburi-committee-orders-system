import type { Order } from '../types';
import { formatThDate } from './utils';

export function generatePrintHtml(order: Order): string {
  const sorted = [...order.subCommittees].sort((a, b) => (a.seq || 0) - (b.seq || 0));
  const thNums = ['','๑','๒','๓','๔','๕','๖','๗','๘','๙','๑๐','๑๑','๑๒','๑๓','๑๔','๑๕','๑๖','๑๗','๑๘','๑๙','๒๐'];

  const scHtml = sorted.map((sc, si) => {
    const membersHtml = sc.members.map((m, i) => `
      <tr>
        <td class="c">${i + 1}</td>
        <td>${[m.name, m.agencyPosition].filter(Boolean).join(' ') || '-'}</td>
        <td>${m.agency || '-'}</td>
        <td>${m.role || '-'}</td>
      </tr>`).join('');

    return `
      <div class="sc">
        <p class="sc-title"><b>${thNums[si + 1] || si + 1}. ${sc.name}</b> ประกอบด้วย</p>
        ${sc.members.length ? `
        <table>
          <thead><tr><th style="width:5%">ลำดับ</th><th style="width:48%">ชื่อ / ตำแหน่ง</th><th style="width:27%">หน่วยงาน</th><th style="width:20%">บทบาท</th></tr></thead>
          <tbody>${membersHtml}</tbody>
        </table>` : ''}
        ${sc.duties ? `<p class="duties"><b>มีหน้าที่</b><br>${sc.duties.replace(/\n/g, '<br>')}</p>` : ''}
      </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>คำสั่งจังหวัดสระบุรี ที่ ${order.orderNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Sarabun', 'TH Sarabun New', serif; font-size: 16pt; line-height: 1.8;
           color: #000; background: #fff; }
    .page { max-width: 210mm; margin: 0 auto; padding: 25mm 30mm 25mm 35mm; }
    .header { text-align: center; margin-bottom: 24pt; }
    .header h1 { font-size: 18pt; font-weight: 700; margin-bottom: 4pt; }
    .header h2 { font-size: 16pt; font-weight: 400; }
    .sep { text-align: center; border-bottom: 1px solid #000; margin: 12pt 0 20pt; }
    .background { text-indent: 2em; margin-bottom: 16pt; text-align: justify; }
    .sc { margin-bottom: 20pt; }
    .sc-title { text-indent: 2em; margin-bottom: 8pt; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 12pt; font-size: 14pt; }
    th, td { border: 1px solid #333; padding: 5pt 8pt; vertical-align: top; }
    th { background: #f0f0f0; font-weight: 700; text-align: center; }
    td.c { text-align: center; }
    .duties { margin-top: 8pt; text-indent: 2em; font-size: 14pt; color: #111; }
    .signature { text-align: center; margin-top: 40pt; }
    .signature .date { margin-bottom: 30pt; }
    .signature .name { margin-top: 30pt; font-size: 15pt; }
    .status-cancelled { background: #fee2e2; padding: 8pt 12pt; border-radius: 4pt;
                        border: 1px solid #fca5a5; color: #991b1b; margin-bottom: 16pt;
                        text-align: center; font-size: 14pt; }
    @media print {
      body { font-size: 14pt; }
      @page { size: A4; margin: 20mm 25mm 20mm 30mm; }
      .no-print { display: none !important; }
    }
    .print-btn { position: fixed; top: 16px; right: 16px; background: #1d4ed8; color: white;
                 border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;
                 font-size: 14pt; font-family: inherit; box-shadow: 0 2px 8px rgba(0,0,0,.2); }
    .print-btn:hover { background: #1e40af; }
  </style>
</head>
<body>
<button class="print-btn no-print" onclick="window.print()">🖨️ พิมพ์ / บันทึก PDF</button>
<div class="page">
  ${order.status === 'CANCELLED' ? `<div class="status-cancelled">⚠️ คำสั่งนี้ถูกยกเลิกแล้ว${order.cancelReason ? ` — ${order.cancelReason}` : ''}</div>` : ''}
  <div class="header">
    <h1>คำสั่งจังหวัดสระบุรี</h1>
    <h1>ที่ ${order.orderNumber}</h1>
    <h2>เรื่อง  ${order.title}</h2>
  </div>
  <div class="sep"></div>
  ${order.background ? `<p class="background">${order.background}</p>` : ''}
  ${scHtml}
  <div class="signature">
    <p class="date">สั่ง ณ วันที่  ${formatThDate(order.orderDate || '')}</p>
    <p>&nbsp;</p><p>&nbsp;</p>
    <p class="name">(${order.signedBy || '......................................'})</p>
    <p>${order.signedByTitle || 'ผู้ว่าราชการจังหวัดสระบุรี'}</p>
  </div>
</div>
</body>
</html>`;
}
