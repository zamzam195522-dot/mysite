import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

type NewVendorRequest = {
  name: string;
  contact?: string | null;
  address?: string | null;
  status?: 'ACTIVE' | 'INACTIVE';
};

export async function GET() {
  const pool = getDbPool();
  const result = await pool.query(
    `
    SELECT id, code, name, contact, address, status
    FROM vendors
    ORDER BY id DESC
    `,
  );
  return NextResponse.json({ success: true, vendors: result.rows });
}

export async function POST(request: Request) {
  let body: Partial<NewVendorRequest>;
  try {
    body = (await request.json()) as Partial<NewVendorRequest>;
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body' }, { status: 400 });
  }

  if (!body.name) {
    return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
  }

  const name = String(body.name).trim();
  if (!name) {
    return NextResponse.json({ success: false, message: 'Invalid name' }, { status: 400 });
  }

  const contact = body.contact === undefined || body.contact === null ? null : String(body.contact).trim();
  const address = body.address === undefined || body.address === null ? null : String(body.address).trim();
  const status = body.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';

  const pool = getDbPool();
  const seqRes = await pool.query(`SELECT pg_get_serial_sequence('vendors', 'id') AS seq`);
  const seq = String(seqRes.rows?.[0]?.seq ?? '').trim();
  if (!seq) {
    return NextResponse.json({ success: false, message: 'Could not resolve vendors id sequence' }, { status: 500 });
  }

  const result = await pool.query(
    `
    WITH nid AS (
      SELECT nextval($1::regclass) AS id
    )
    INSERT INTO vendors (id, code, name, contact, address, status)
    SELECT
      nid.id,
      ('VEND-' || lpad(nid.id::text, 3, '0')) AS code,
      $2, $3, $4, $5
    FROM nid
    RETURNING id, code, name, contact, address, status
    `,
    [seq, name, contact, address, status],
  );

  return NextResponse.json({ success: true, vendor: result.rows[0] });
}

