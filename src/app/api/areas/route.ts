import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

type NewAreaRequest = {
  name: string;
  status?: 'ACTIVE' | 'INACTIVE';
};

type UpdateAreaRequest = NewAreaRequest & {
  id: number;
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

export async function PATCH(request: Request) {
  let body: Partial<UpdateAreaRequest>;
  try {
    body = (await request.json()) as Partial<UpdateAreaRequest>;
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body' }, { status: 400 });
  }

  if (!body.name || !body.id) {
    return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
  }

  const id = Number(body.id);
  const name = String(body.name).trim();
  if (!name || !Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ success: false, message: 'Invalid input' }, { status: 400 });
  }

  const status = body.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';

  const pool = getDbPool();
  const result = await pool.query(
    `
    UPDATE areas 
    SET name = $1, status = $2, updated_at = now()
    WHERE id = $3
    RETURNING id, name, status
    `,
    [name, status, id],
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ success: false, message: 'Area not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, area: result.rows[0] });
}

export async function DELETE(request: Request) {
  let body: { id: number };
  try {
    body = (await request.json()) as { id: number };
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body' }, { status: 400 });
  }

  const id = Number(body.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ success: false, message: 'Invalid id' }, { status: 400 });
  }

  const pool = getDbPool();

  try {
    const result = await pool.query(
      'UPDATE areas SET status = $1, updated_at = now() WHERE id = $2 RETURNING id, name, status',
      ['INACTIVE', id],
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Area not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Area deactivated successfully' });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, message: e?.message ? String(e.message) : 'Failed to delete area' },
      { status: 400 },
    );
  }
}

