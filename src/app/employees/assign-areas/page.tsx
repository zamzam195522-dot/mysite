'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';

interface Employee {
  id: string;
  code: string;
  name: string;
  designation: string;
  status: string;
}

interface Area {
  id: string;
  name: string;
  status: string;
}

interface AssignedArea {
  id: string;
  areaName: string;
  customerCount: number;
}

export default function AssignAreasPage() {
  const [salesmen, setSalesmen] = useState<Array<{ id: string; label: string }>>([]);
  const [areas, setAreas] = useState<Array<{ id: string; name: string }>>([]);
  const [assignedAreas, setAssignedAreas] = useState<Array<{ id: string; areaName: string; customerCount: number }>>([]);
  const [selectedSalesman, setSelectedSalesman] = useState<string>('');
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch employees (salesmen)
      const employeesResponse = await fetch('/api/employees');
      if (!employeesResponse.ok) throw new Error('Failed to fetch employees');
      const employeesData = await employeesResponse.json();

      // Filter only salesmen and format for dropdown
      const salesmenList = employeesData.employees
        .filter((emp: Employee) => emp.designation === 'SALESMAN' && emp.status === 'ACTIVE')
        .map((emp: Employee) => ({
          id: emp.id,
          label: `${emp.code} - ${emp.name}`
        }));

      // Fetch areas
      const areasResponse = await fetch('/api/areas');
      if (!areasResponse.ok) throw new Error('Failed to fetch areas');
      const areasData = await areasResponse.json();

      const areasList = areasData.areas
        .filter((area: Area) => area.status === 'ACTIVE')
        .map((area: Area) => ({
          id: area.id,
          name: area.name
        }));

      setSalesmen(salesmenList);
      setAreas(areasList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignArea = async () => {
    if (!selectedSalesman || selectedAreas.length === 0) {
      setError('Please select a salesman and at least one area');
      return;
    }

    try {
      setError('');
      // For each selected area, create assignment
      for (const areaId of selectedAreas) {
        const response = await fetch('/api/employee-areas', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            employee_id: selectedSalesman,
            area_id: areaId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to assign area');
        }
      }

      // Refresh assigned areas and reset selections
      await fetchAssignedAreas(selectedSalesman);
      setSelectedAreas([]);
      setError('');
      alert('Areas assigned successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign areas');
    }
  };

  const fetchAssignedAreas = async (employeeId: string) => {
    try {
      const response = await fetch(`/api/employee-areas?employee_id=${employeeId}`);
      if (response.ok) {
        const data = await response.json();
        setAssignedAreas(data.assignedAreas || []);
        // Restore checkbox selections
        setSelectedAreas(data.assignedAreaIds || []);
      }
    } catch (err) {
      // Failed to fetch assigned areas
    }
  };

  const handleSalesmanChange = (employeeId: string) => {
    setSelectedSalesman(employeeId);
    setSelectedAreas([]);
    if (employeeId) {
      fetchAssignedAreas(employeeId);
    } else {
      setAssignedAreas([]);
    }
  };

  const handleAreaChange = (areaId: string) => {
    setSelectedAreas(prev =>
      prev.includes(areaId)
        ? prev.filter(id => id !== areaId)
        : [...prev, areaId]
    );
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <section className="py-10">
        <div className="container mx-auto px-4 space-y-6">
          <PageHeader title="Assign Areas" subtitle="Assign one or more areas to salesmen and view assigned customer counts." />

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <SectionCard title="Assign Area to Employee">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Salesman</label>
                  {loading ? (
                    <div className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-gray-50">
                      Loading...
                    </div>
                  ) : (
                    <select
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white"
                      value={selectedSalesman}
                      onChange={(e) => handleSalesmanChange(e.target.value)}
                    >
                      <option value="">SELECT EMPLOYEE</option>
                      {salesmen.map((s) => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Area(s)</label>
                  {loading ? (
                    <div className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-gray-50">
                      Loading...
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded p-2">
                      {areas.map((a) => (
                        <label key={a.id} className="flex items-center space-x-2 text-sm">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300"
                            value={a.id}
                            checked={selectedAreas.includes(a.id)}
                            onChange={() => handleAreaChange(a.id)}
                            disabled={!selectedSalesman}
                          />
                          <span>{a.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-3 pt-2">
                  <button
                    className="w-full bg-sky-900 text-white py-2 rounded text-sm font-semibold hover:bg-sky-800 disabled:bg-gray-400"
                    onClick={handleAssignArea}
                    disabled={loading || !selectedSalesman || selectedAreas.length === 0}
                  >
                    Assign Area
                  </button>
                  <button
                    className="w-full bg-red-600 text-white py-2 rounded text-sm font-semibold hover:bg-red-500 disabled:bg-gray-400"
                    onClick={fetchData}
                    disabled={loading}
                  >
                    Refresh
                  </button>
                </div>
              </div>
            </SectionCard>

            <div className="lg:col-span-2">
              <SectionCard title="Assigned Areas" description="List of areas assigned to the selected salesman with customer counts.">
                <div className="border border-gray-200 rounded overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-sky-900 text-white">
                      <tr>
                        <th className="px-3 py-2 text-left w-12">SNO</th>
                        <th className="px-3 py-2 text-left">Area Name</th>
                        <th className="px-3 py-2 text-left w-40">Assigned Customers Count</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {assignedAreas.length === 0 ? (
                        <tr>
                          <td className="px-3 py-6 text-center text-gray-500" colSpan={3}>
                            No assigned areas yet.
                          </td>
                        </tr>
                      ) : (
                        assignedAreas.map((a, idx) => (
                          <tr key={a.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2">{idx + 1}</td>
                            <td className="px-3 py-2">{a.areaName}</td>
                            <td className="px-3 py-2">{a.customerCount}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}

