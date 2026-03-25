import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  BorderStyle, AlignmentType, WidthType,
} from 'docx';
import type { Order } from '../types';
import { formatThDate } from './utils';

export async function generateWordDoc(order: Order): Promise<Buffer> {
  const children: Paragraph[] = [];

  // Title
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [new TextRun({ text: 'คำสั่งจังหวัดสระบุรี', bold: true, size: 32, font: 'TH Sarabun New' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [new TextRun({ text: `ที่ ${order.orderNumber}`, bold: true, size: 28, font: 'TH Sarabun New' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [new TextRun({ text: `เรื่อง  ${order.title}`, bold: true, size: 28, font: 'TH Sarabun New' })],
    }),
  );

  // Separator
  children.push(new Paragraph({ text: '─────────────────────────────────────────────────────────────────', alignment: AlignmentType.CENTER, spacing: { after: 160 } }));

  // Background
  if (order.background) {
    children.push(
      new Paragraph({
        indent: { firstLine: 720 },
        spacing: { after: 160 },
        children: [new TextRun({ text: order.background, size: 28, font: 'TH Sarabun New' })],
      }),
    );
  }

  // Sub-committees
  const sorted = [...order.subCommittees].sort((a, b) => (a.seq || 0) - (b.seq || 0));
  const thNums = ['', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙', '๑๐', '๑๑', '๑๒', '๑๓', '๑๔', '๑๕'];

  sorted.forEach((sc, scIdx) => {
    children.push(
      new Paragraph({
        indent: { firstLine: 720 },
        spacing: { before: 200, after: 80 },
        children: [
          new TextRun({ text: `${thNums[scIdx + 1] || `${scIdx + 1}`}. ${sc.name}  `, bold: true, size: 28, font: 'TH Sarabun New' }),
          new TextRun({ text: 'ประกอบด้วย', size: 28, font: 'TH Sarabun New' }),
        ],
      }),
    );

    // Members table
    if (sc.members.length > 0) {
      const tableRows: TableRow[] = [
        new TableRow({
          tableHeader: true,
          children: [
            cell('ลำดับ', true, 8),
            cell('ชื่อ / ตำแหน่ง', true, 50),
            cell('หน่วยงาน', true, 25),
            cell('บทบาท', true, 17),
          ],
        }),
        ...sc.members.map((m, i) =>
          new TableRow({
            children: [
              cell(String(i + 1), false, 8, AlignmentType.CENTER),
              cell([m.name, m.agencyPosition].filter(Boolean).join(' ') || '-', false, 50),
              cell(m.agency || '-', false, 25),
              cell(m.role || '-', false, 17),
            ],
          })
        ),
      ];
      children.push(
        new Paragraph({ children: [] }),
        new Paragraph({
          children: [
            new TextRun({ text: '' }),
          ],
          indent: { left: 360 },
        }),
      );
      // We'll embed table inline by adding paragraph wrapping
      // Actually push directly:
      children.push(new Paragraph({ children: [], spacing: { after: 0 } }));

      const tbl = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: tableRows,
      });
      // docx Paragraph can't contain Table directly; store separately
      // We use a workaround by pushing as document child
      (children as unknown as (Paragraph | Table)[]).push(tbl);
    }

    // Duties
    if (sc.duties) {
      children.push(
        new Paragraph({
          indent: { firstLine: 720 },
          spacing: { before: 160, after: 80 },
          children: [new TextRun({ text: 'มีหน้าที่', bold: true, size: 28, font: 'TH Sarabun New' })],
        }),
        new Paragraph({
          indent: { left: 360 },
          spacing: { after: 160 },
          children: [new TextRun({ text: sc.duties, size: 28, font: 'TH Sarabun New' })],
        }),
      );
    }
  });

  // Signature block
  children.push(
    new Paragraph({ children: [], spacing: { before: 400 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [new TextRun({ text: `สั่ง ณ วันที่  ${formatThDate(order.orderDate || '')}`, size: 28, font: 'TH Sarabun New' })],
    }),
    new Paragraph({ children: [], spacing: { after: 480 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [new TextRun({ text: `(${order.signedBy || '...............................'})`, size: 28, font: 'TH Sarabun New' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: order.signedByTitle || 'ผู้ว่าราชการจังหวัดสระบุรี', size: 28, font: 'TH Sarabun New' })],
    }),
  );

  const doc = new Document({
    sections: [{
      properties: {
        page: { margin: { top: 1440, bottom: 1440, left: 1800, right: 1440 } },
      },
      children: children as (Paragraph | Table)[],
    }],
  });

  return Packer.toBuffer(doc);
}

function cell(text: string, bold: boolean, widthPct: number, align: typeof AlignmentType[keyof typeof AlignmentType] = AlignmentType.LEFT): TableCell {
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    children: [
      new Paragraph({
        alignment: align,
        children: [new TextRun({ text, bold, size: 24, font: 'TH Sarabun New' })],
      }),
    ],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1 },
      bottom: { style: BorderStyle.SINGLE, size: 1 },
      left: { style: BorderStyle.SINGLE, size: 1 },
      right: { style: BorderStyle.SINGLE, size: 1 },
    },
  });
}
