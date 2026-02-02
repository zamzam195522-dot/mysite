import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

type NewCategoryRequest = {
  name: string;
  status?: 'ACTIVE' | 'INACTIVE';
};

export async function GET() {
  const pool = getDbPool();
  const result = await pool.query(
    `
    SELECT id, name, status
    FROM product_categories
    ORDER BY name ASC
    `,
  );
  return NextResponse.json({ success: true, categories: result.rows });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<NewCategoryRequest>;
    if (!body.name) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    const pool = getDbPool();
    const name = String(body.name).trim();
    const status = body.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';

    const result = await pool.query(
      `
      INSERT INTO product_categories (name, status)
      VALUES ($1, $2)
      RETURNING id, name, status
      `,
      [name, status],
    );

    return NextResponse.json({ success: true, category: result.rows[0] });
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body' }, { status: 400 });
  }
}

