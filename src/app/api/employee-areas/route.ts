import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const employee_id = searchParams.get('employee_id');

  const pool = getDbPool();

  if (employee_id) {

    // First, let's check if the employee exists and is a salesman
    const employeeCheck = await pool.query(
      'SELECT id, code, name, designation, status FROM employees WHERE id = $1',
      [employee_id]
    );


    // Get assigned areas for a specific employee with customer counts
    const result = await pool.query(
      `
      SELECT 
        a.id,
        a.name as area_name,
        COUNT(c.id) as customer_count
      FROM employee_areas ea
      JOIN areas a ON a.id = ea.area_id
      LEFT JOIN customers c ON c.area_id = a.id AND c.status = 'ACTIVE'
      WHERE ea.employee_id = $1 AND a.status = 'ACTIVE'
      GROUP BY a.id, a.name
      ORDER BY a.name
      `,
      [employee_id],
    );


    const assignedAreas = result.rows.map(row => ({
      id: row.id,
      areaName: row.area_name,
      customerCount: parseInt(row.customer_count) || 0
    }));

    // Also return just the area IDs for checkbox selection
    const assignedAreaIds = result.rows.map(row => row.id.toString());


    return NextResponse.json({ success: true, assignedAreas, assignedAreaIds });
  } else {
    // Get all employee-area assignments
    const result = await pool.query(
      `
      SELECT 
        ea.employee_id,
        ea.area_id,
        e.name as employee_name,
        e.code as employee_code,
        a.name as area_name
      FROM employee_areas ea
      JOIN employees e ON e.id = ea.employee_id
      JOIN areas a ON a.id = ea.area_id
      WHERE e.status = 'ACTIVE' AND a.status = 'ACTIVE'
      ORDER BY e.name, a.name
      `,
    );

    return NextResponse.json({ success: true, assignments: result.rows });
  }
}

export async function POST(request: Request) {
  let body: { employee_id: string; area_id: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body' }, { status: 400 });
  }


  if (!body.employee_id || !body.area_id) {
    return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
  }

  const pool = getDbPool();

  try {
    // Check if assignment already exists
    const existingAssignment = await pool.query(
      'SELECT 1 FROM employee_areas WHERE employee_id = $1 AND area_id = $2',
      [body.employee_id, body.area_id],
    );


    if (existingAssignment.rows.length > 0) {
      return NextResponse.json({ success: false, message: 'Area already assigned to this employee' }, { status: 400 });
    }

    // Create the assignment
    const result = await pool.query(
      'INSERT INTO employee_areas (employee_id, area_id) VALUES ($1, $2) RETURNING *',
      [body.employee_id, body.area_id],
    );


    return NextResponse.json({ success: true, assignment: result.rows[0] });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, message: e?.message ? String(e.message) : 'Failed to assign area' },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const employee_id = searchParams.get('employee_id');
  const area_id = searchParams.get('area_id');

  if (!employee_id || !area_id) {
    return NextResponse.json({ success: false, message: 'Missing employee_id or area_id' }, { status: 400 });
  }

  const pool = getDbPool();

  try {
    const result = await pool.query(
      'DELETE FROM employee_areas WHERE employee_id = $1 AND area_id = $2',
      [employee_id, area_id],
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ success: false, message: 'Assignment not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Assignment removed successfully' });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, message: e?.message ? String(e.message) : 'Failed to remove assignment' },
      { status: 400 },
    );
  }
}
