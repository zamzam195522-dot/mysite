import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

type Params = { id: string };

type UpdateVendorRequest = {
  name?: string;
  contact?: string | null;
  address?: string | null;
  status?: 'ACTIVE' | 'INACTIVE';
};

function parseId(params: Params) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = parseId(resolvedParams);
  if (!id) return NextResponse.json({ success: false, message: 'Invalid id' }, { status: 400 });

  const pool = getDbPool();
  const result = await pool.query(`SELECT id, code, name, contact, address, status FROM vendors WHERE id = $1 LIMIT 1`, [id]);
  const vendor = result.rows[0];
  if (!vendor) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

  return NextResponse.json({ success: true, vendor });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = parseId(resolvedParams);
  if (!id) return NextResponse.json({ success: false, message: 'Invalid id' }, { status: 400 });

  let body: UpdateVendorRequest;
  try {
    body = (await request.json()) as UpdateVendorRequest;
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body' }, { status: 400 });
  }

  const name = body.name !== undefined ? String(body.name).trim() : undefined;
  const contact = body.contact === undefined ? undefined : body.contact === null ? null : String(body.contact).trim();
  const address = body.address === undefined ? undefined : body.address === null ? null : String(body.address).trim();
  const status = body.status === undefined ? undefined : body.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';

  if (name !== undefined && !name) {
    return NextResponse.json({ success: false, message: 'Invalid name' }, { status: 400 });
  }

  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (name !== undefined) {
    fields.push(`name = $${idx++}`);
    values.push(name);
  }
  if (contact !== undefined) {
    fields.push(`contact = $${idx++}`);
    values.push(contact);
  }
  if (address !== undefined) {
    fields.push(`address = $${idx++}`);
    values.push(address);
  }
  if (status !== undefined) {
    fields.push(`status = $${idx++}`);
    values.push(status);
  }

  if (fields.length === 0) {
    return NextResponse.json({ success: false, message: 'No fields to update' }, { status: 400 });
  }

  values.push(id);
  const pool = getDbPool();
  const result = await pool.query(
    `
    UPDATE vendors
    SET ${fields.join(', ')}
    WHERE id = $${idx}
    RETURNING id, code, name, contact, address, status
    `,
    values,
  );

  const vendor = result.rows[0];
  if (!vendor) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true, vendor });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = parseId(resolvedParams);
  if (!id) return NextResponse.json({ success: false, message: 'Invalid id' }, { status: 400 });

  const pool = getDbPool();
  const result = await pool.query(`UPDATE vendors SET status = 'INACTIVE' WHERE id = $1 RETURNING id`, [id]);
  if (result.rowCount === 0) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

  return NextResponse.json({ success: true });
}

