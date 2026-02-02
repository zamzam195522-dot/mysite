import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

type NewAreaRequest = {
  name: string;
  status?: 'ACTIVE' | 'INACTIVE';
};

export async function GET() {
  const pool = getDbPool();
  const result = await pool.query(
    `
    SELECT id, name, status
    FROM areas
    ORDER BY name ASC
    `,
  );
  return NextResponse.json({ success: true, areas: result.rows });
}

export async function POST(request: Request) {
  let body: Partial<NewAreaRequest>;
  try {
    body = (await request.json()) as Partial<NewAreaRequest>;
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

  const status = body.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';

  const pool = getDbPool();
  const result = await pool.query(
    `
    INSERT INTO areas (name, status)
    VALUES ($1, $2)
    RETURNING id, name, status
    `,
    [name, status],
  );

  return NextResponse.json({ success: true, area: result.rows[0] });
}

