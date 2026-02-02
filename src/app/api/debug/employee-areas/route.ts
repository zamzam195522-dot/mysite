import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

export async function GET() {
  const pool = getDbPool();
  
  try {
    // Check if employee_areas table has any data
    const employeeAreasResult = await pool.query(`
      SELECT COUNT(*) as count FROM employee_areas
    `);
    
    // Get all employee-area assignments
    const allAssignmentsResult = await pool.query(`
      SELECT 
        ea.employee_id,
        ea.area_id,
        e.name as employee_name,
        e.code as employee_code,
        a.name as area_name,
        ea.assigned_at
      FROM employee_areas ea
      JOIN employees e ON e.id = ea.employee_id
      JOIN areas a ON a.id = ea.area_id
      ORDER BY ea.assigned_at DESC
      LIMIT 10
    `);
    
    // Check employees and areas tables
    const employeesResult = await pool.query(`
      SELECT id, code, name, designation, status FROM employees 
      WHERE designation = 'SALESMAN' AND status = 'ACTIVE'
      ORDER BY code
    `);
    
    const areasResult = await pool.query(`
      SELECT id, name, status FROM areas 
      WHERE status = 'ACTIVE'
      ORDER BY name
    `);
    
    return NextResponse.json({
      success: true,
      employeeAreasCount: employeeAreasResult.rows[0].count,
      assignments: allAssignmentsResult.rows,
      salesmen: employeesResult.rows,
      areas: areasResult.rows
    });
    
  } catch (e: any) {
    return NextResponse.json(
      { success: false, message: e?.message ? String(e.message) : 'Debug query failed' },
      { status: 500 }
    );
  }
}
