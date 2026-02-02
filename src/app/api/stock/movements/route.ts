import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

type NewStockMovementRequest = {
  occurredOn: string; // YYYY-MM-DD
  movementType: 'IN' | 'OUT' | 'RETURN' | 'FILLING' | 'DAMAGE';
  productId: number | string;
  qty: number;
  employeeId?: number | string | null; // for IN/OUT/RETURN
  remarks?: string | null;
};

async function getOrCreateWarehouseLocationId(client: any) {
  const existing = await client.query(
    `SELECT id FROM stock_locations WHERE location_type = 'WAREHOUSE' LIMIT 1`,
  );
  if (existing.rows[0]) return Number(existing.rows[0].id);
  const created = await client.query(
    `INSERT INTO stock_locations (code, name, location_type, status) VALUES ('WH-001', 'Warehouse', 'WAREHOUSE', 'ACTIVE') RETURNING id`,
  );
  return Number(created.rows[0].id);
}

async function getOrCreateDamagedLocationId(client: any) {
  const existing = await client.query(
    `SELECT id FROM stock_locations WHERE location_type = 'DAMAGED' LIMIT 1`,
  );
  if (existing.rows[0]) return Number(existing.rows[0].id);
  const created = await client.query(
    `INSERT INTO stock_locations (code, name, location_type, status) VALUES ('DMG-001', 'Damaged Stock', 'DAMAGED', 'ACTIVE') RETURNING id`,
  );
  return Number(created.rows[0].id);
}

async function getOrCreateEmployeeLocationId(client: any, employeeId: number) {
  const existing = await client.query(
    `SELECT id FROM stock_locations WHERE location_type = 'EMPLOYEE' AND employee_id = $1 LIMIT 1`,
    [employeeId],
  );
  if (existing.rows[0]) return Number(existing.rows[0].id);

  const emp = await client.query(`SELECT code, name FROM employees WHERE id = $1 LIMIT 1`, [employeeId]);
  if (!emp.rows[0]) throw new Error('Employee not found');

  const code = String(emp.rows[0].code ?? `EMP-${employeeId}`).trim();
  const name = String(emp.rows[0].name ?? '').trim();

  const created = await client.query(
    `
    INSERT INTO stock_locations (code, name, location_type, employee_id, status)
    VALUES ($1, $2, 'EMPLOYEE', $3, 'ACTIVE')
    RETURNING id
    `,
    [code, `Employee ${name || code}`, employeeId],
  );
  return Number(created.rows[0].id);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const movementType = url.searchParams.get('movementType');
  const employeeIdParam = url.searchParams.get('employeeId');
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const limitParam = url.searchParams.get('limit');

  const employeeId = employeeIdParam ? Number(employeeIdParam) : null;
  if (employeeId !== null && (!Number.isInteger(employeeId) || employeeId <= 0)) {
    return NextResponse.json({ success: false, message: 'Invalid employeeId' }, { status: 400 });
  }

  const hasFrom = from && /^\d{4}-\d{2}-\d{2}$/.test(from);
  const hasTo = to && /^\d{4}-\d{2}-\d{2}$/.test(to);
  if ((from && !hasFrom) || (to && !hasTo)) {
    return NextResponse.json({ success: false, message: 'Invalid date filter' }, { status: 400 });
  }

  const limit = limitParam ? Number(limitParam) : 100;
  const safeLimit = Number.isFinite(limit) && limit > 0 && limit <= 500 ? Math.floor(limit) : 100;

  const allowed = new Set(['IN', 'OUT', 'RETURN', 'FILLING', 'DAMAGE']);
  const mt = movementType ? String(movementType).toUpperCase() : null;
  if (mt !== null && !allowed.has(mt)) {
    return NextResponse.json({ success: false, message: 'Invalid movementType' }, { status: 400 });
  }

  const pool = getDbPool();
  const result = await pool.query(
    `
    SELECT
      sm.id,
      sm.occurred_on AS "date",
      sm.movement_type AS "movementType",
      sm.product_id AS "productId",
      p.name AS "productName",
      sm.qty,
      sm.remarks,
      sm.from_location_id AS "fromLocationId",
      sm.to_location_id AS "toLocationId",
      fr.location_type AS "fromLocationType",
      fr.employee_id AS "fromEmployeeId",
      er.name AS "fromEmployeeName",
      tr.location_type AS "toLocationType",
      tr.employee_id AS "toEmployeeId",
      et.name AS "toEmployeeName"
    FROM stock_movements sm
    JOIN products p ON p.id = sm.product_id
    LEFT JOIN stock_locations fr ON fr.id = sm.from_location_id
    LEFT JOIN employees er ON er.id = fr.employee_id
    LEFT JOIN stock_locations tr ON tr.id = sm.to_location_id
    LEFT JOIN employees et ON et.id = tr.employee_id
    WHERE ($1::text IS NULL OR sm.movement_type = $1::text)
      AND (
        $2::bigint IS NULL
        OR fr.employee_id = $2::bigint
        OR tr.employee_id = $2::bigint
      )
      AND ($3::date IS NULL OR sm.occurred_on >= $3::date)
      AND ($4::date IS NULL OR sm.occurred_on <= $4::date)
    ORDER BY sm.occurred_on DESC, sm.id DESC
    LIMIT $5
    `,
    [mt, employeeId, hasFrom ? from : null, hasTo ? to : null, safeLimit],
  );

  return NextResponse.json({ success: true, movements: result.rows });
}

export async function POST(request: Request) {
  let body: Partial<NewStockMovementRequest>;
  try {
    body = (await request.json()) as Partial<NewStockMovementRequest>;
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body' }, { status: 400 });
  }

  if (!body.occurredOn || !body.movementType || body.productId === undefined || body.qty === undefined) {
    return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
  }

  const occurredOn = String(body.occurredOn).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(occurredOn)) {
    return NextResponse.json({ success: false, message: 'Invalid occurredOn' }, { status: 400 });
  }

  const movementType = String(body.movementType).toUpperCase() as NewStockMovementRequest['movementType'];
  const allowed = new Set(['IN', 'OUT', 'RETURN', 'FILLING', 'DAMAGE']);
  if (!allowed.has(movementType)) {
    return NextResponse.json({ success: false, message: 'Invalid movementType' }, { status: 400 });
  }

  const productId = Number(body.productId);
  if (!Number.isInteger(productId) || productId <= 0) {
    return NextResponse.json({ success: false, message: 'Invalid productId' }, { status: 400 });
  }

  const qty = Math.floor(Number(body.qty));
  if (!Number.isInteger(qty) || qty <= 0) {
    return NextResponse.json({ success: false, message: 'Invalid qty' }, { status: 400 });
  }

  const employeeIdRaw = body.employeeId;
  const employeeId =
    employeeIdRaw === undefined || employeeIdRaw === null || employeeIdRaw === ''
      ? null
      : Number(employeeIdRaw);
  if (employeeId !== null && (!Number.isInteger(employeeId) || employeeId <= 0)) {
    return NextResponse.json({ success: false, message: 'Invalid employeeId' }, { status: 400 });
  }

  const remarks = body.remarks === undefined || body.remarks === null ? null : String(body.remarks).trim();

  const pool = getDbPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const warehouseId = await getOrCreateWarehouseLocationId(client);
    const damagedId = await getOrCreateDamagedLocationId(client);

    let fromLocationId: number | null = null;
    let toLocationId: number | null = null;
    let fromState: 'FILLED' | 'EMPTY' | 'NA' = 'NA';
    let toState: 'FILLED' | 'EMPTY' | 'NA' = 'NA';

    if (movementType === 'FILLING') {
      // Convert EMPTY -> FILLED in warehouse
      fromLocationId = warehouseId;
      toLocationId = warehouseId;
      fromState = 'EMPTY';
      toState = 'FILLED';
    } else if (movementType === 'DAMAGE') {
      // Move FILLED from warehouse to damaged
      fromLocationId = warehouseId;
      toLocationId = damagedId;
      fromState = 'FILLED';
      toState = 'FILLED';
    } else {
      // IN/OUT/RETURN use employee location + warehouse
      if (!employeeId) {
        throw new Error('employeeId is required for IN/OUT/RETURN');
      }
      const empLocId = await getOrCreateEmployeeLocationId(client, employeeId);

      if (movementType === 'OUT') {
        // Warehouse -> Employee (FILLED)
        fromLocationId = warehouseId;
        toLocationId = empLocId;
        fromState = 'FILLED';
        toState = 'FILLED';
      } else if (movementType === 'IN') {
        // Employee -> Warehouse (FILLED)
        fromLocationId = empLocId;
        toLocationId = warehouseId;
        fromState = 'FILLED';
        toState = 'FILLED';
      } else if (movementType === 'RETURN') {
        // Employee -> Warehouse (EMPTY)
        fromLocationId = empLocId;
        toLocationId = warehouseId;
        fromState = 'EMPTY';
        toState = 'EMPTY';
      }
    }

    const insert = await client.query(
      `
      INSERT INTO stock_movements (
        occurred_on, movement_type, product_id, qty,
        from_location_id, to_location_id,
        from_state, to_state,
        remarks
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
      `,
      [occurredOn, movementType, productId, qty, fromLocationId, toLocationId, fromState, toState, remarks],
    );

    await client.query('COMMIT');
    return NextResponse.json({ success: true, movementId: insert.rows[0].id });
  } catch (e: any) {
    await client.query('ROLLBACK');
    return NextResponse.json(
      { success: false, message: e?.message ? String(e.message) : 'Failed to create stock movement' },
      { status: 400 },
    );
  } finally {
    client.release();
  }
}

