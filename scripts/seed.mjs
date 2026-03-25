#!/usr/bin/env node
// Run: node scripts/seed.js
// Seeds sample orders from uploaded documents

import { createClient } from '@libsql/client';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = `file:${path.join(__dirname, '..', 'data', 'sarorders.db')}`;

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
function now() { return new Date().toISOString().replace('T',' ').slice(0,19); }

const client = createClient({ url: dbPath });

async function main() {
  console.log('Seeding database...');

  // Check if already seeded
  const existing = await client.execute('SELECT COUNT(*) as cnt FROM orders');
  if ((existing.rows[0] as { cnt: number }).cnt > 0) {
    console.log('Database already has data. Skipping seed.');
    process.exit(0);
  }

  const orders = [
    {
      id: genId(), orderNumber: 'cccc/2568', orderDate: '2568-10-01', effectiveDate: '',
      type: 'คณะกรรมการ', status: 'ACTIVE',
      title: 'แต่งตั้งคณะกรรมการจัดงาน "วันธารน้ำใจสู่กาชาดจังหวัดสระบุรี" ประจำปี ๒๕๖๙',
      background: 'จังหวัดสระบุรีและเหล่ากาชาดจังหวัดสระบุรี กำหนดจัดงาน "วันธารน้ำใจสู่กาชาดจังหวัดสระบุรี" ประจำปี ๒๕๖๙ ในวันที่ ๑ ธันวาคม ๒๕๖๘ ณ จวนผู้ว่าราชการจังหวัดสระบุรี',
      signedBy: 'นายบัญชา เชาวรินทร์', signedByTitle: 'ผู้ว่าราชการจังหวัดสระบุรี',
    },
    {
      id: genId(), orderNumber: '4971/2568', orderDate: '2568-11-25', effectiveDate: '2568-11-25',
      type: 'คณะทำงาน', status: 'ACTIVE',
      title: 'แต่งตั้งคณะทำงานขับเคลื่อนการคุ้มครองข้อมูลส่วนบุคคลของจังหวัดสระบุรี',
      background: 'ด้วยพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. ๒๕๖๒',
      signedBy: 'นายบัญชา เชาวรินทร์', signedByTitle: 'ผู้ว่าราชการจังหวัดสระบุรี',
    },
    {
      id: genId(), orderNumber: '4981/2568', orderDate: '2568-11-25', effectiveDate: '2568-12-09',
      type: 'คณะทำงาน', status: 'ACTIVE',
      title: 'แต่งตั้งเจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล (Data Protection Officer : DPO)',
      background: 'ด้วยพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. ๒๕๖๒ กำหนดให้มีเจ้าหน้าที่ DPO',
      signedBy: 'นายบัญชา เชาวรินทร์', signedByTitle: 'ผู้ว่าราชการจังหวัดสระบุรี',
    },
    {
      id: genId(), orderNumber: '1114/2567', orderDate: '2567-03-29', effectiveDate: '2567-03-29',
      type: 'คณะกรรมการ', status: 'ACTIVE',
      title: 'แต่งตั้งคณะกรรมการพัฒนาคุณภาพชีวิตระดับจังหวัด',
      background: 'เพื่อให้เกิดการขับเคลื่อนและพัฒนาคุณภาพชีวิตของประชาชนในพื้นที่เป็นระบบและมีประสิทธิภาพ',
      signedBy: 'นายบัญชา เชาวรินทร์', signedByTitle: 'ผู้ว่าราชการจังหวัดสระบุรี',
    },
  ];

  const n = now();
  for (const o of orders) {
    await client.execute({
      sql: 'INSERT INTO orders (id,order_number,order_date,effective_date,type,title,background,signed_by,signed_by_title,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
      args: [o.id, o.orderNumber, o.orderDate, o.effectiveDate||null, o.type, o.title, o.background, o.signedBy, o.signedByTitle, o.status, n, n],
    });
    console.log(`  + ${o.orderNumber} - ${o.title.slice(0, 40)}...`);
  }

  console.log('\nSeed complete! Run `npm run dev` to start the app.');
}

main().catch(console.error).finally(() => process.exit(0));
