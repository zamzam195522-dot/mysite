import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

type NewBankRequest = {
  name: string;
  accountNumber: string;
  branch?: string | null;
  status?: 'ACTIVE' | 'INACTIVE';
};

export async function GET() {
  const pool = getDbPool();
  const result = await pool.query(
    `
    SELECT id, name, account_number AS "accountNumber", branch, status
    FROM banks
    ORDER BY name ASC, account_number ASC
    `,
  );
  return NextResponse.json({ success: true, banks: result.rows });
}

export async function POST(request: Request) {
  let body: Partial<NewBankRequest>;
  try {
    body = (await request.json()) as Partial<NewBankRequest>;
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body' }, { status: 400 });
  }

  if (!body.name || !body.accountNumber) {
    return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
  }

  const name = String(body.name).trim();
  const accountNumber = String(body.accountNumber).trim();
  const branch = body.branch === undefined || body.branch === null ? null : String(body.branch).trim();
  const status = body.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';

  if (!name || !accountNumber) {
    return NextResponse.json({ success: false, message: 'Invalid name or accountNumber' }, { status: 400 });
  }

  const pool = getDbPool();
  const result = await pool.query(
    `
    INSERT INTO banks (name, account_number, branch, status)
    VALUES ($1, $2, $3, $4)
    RETURNING id, name, account_number AS "accountNumber", branch, status
    `,
    [name, accountNumber, branch, status],
  );

  return NextResponse.json({ success: true, bank: result.rows[0] });
}

