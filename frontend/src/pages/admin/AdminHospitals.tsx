import React, { useState } from 'react';
import { Plus, Search, Edit2, AlertTriangle } from 'lucide-react';
import { HospitalFormModal } from '../../components/admin/HospitalFormModal';
import { useAdmin } from '../../context/AdminContext';
import { Hospital } from '../../types/admin';

export function AdminHospitals() {
  const { hospitals, officersAt } = useAdmin();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Hospital | 'new' | null>(null);

  const q = search.trim().toLowerCase();
  const rows = hospitals.filter((h) => !q || h.name.toLowerCase().includes(q) || h.district.toLowerCase().includes(q));
  const totalBeds = hospitals.reduce((s, h) => s + h.isolationBeds, 0);
  const unassigned = hospitals.filter((h) => officersAt(h.id).length === 0).length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Hospitals</h1>
          <p className="text-[13px] text-text-secondary mt-1">
            {hospitals.length} hospitals · {totalBeds} isolation beds registered
            {unassigned > 0 && ` · ${unassigned} without an officer`}
          </p>
        </div>
        <button onClick={() => setEditing('new')} className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-[13px] font-medium flex items-center transition-colors self-start md:self-auto">
          <Plus size={16} className="mr-2" /> Register hospital
        </button>
      </div>

      <label className="relative block max-w-md">
        <span className="sr-only">Search hospitals</span>
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or district"
          className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-[13px] focus:outline-none focus:border-primary bg-surface text-text-primary" />
        
      </label>

      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-background text-text-secondary border-b border-border">
              <tr>
                <th className="px-6 py-3.5 font-medium">Hospital</th>
                <th className="px-6 py-3.5 font-medium">District</th>
                <th className="px-6 py-3.5 font-medium text-right">Isolation beds</th>
                <th className="px-6 py-3.5 font-medium">Assigned officer</th>
                <th className="px-6 py-3.5 font-medium">Registered</th>
                <th className="px-6 py-3.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.length === 0 &&
              <tr><td colSpan={6} className="px-6 py-10 text-center text-text-secondary">No hospitals match your search.</td></tr>
              }
              {rows.map((h) => {
                const officers = officersAt(h.id);
                return (
                  <tr key={h.id}>
                    <td className="px-6 py-3.5 font-medium text-text-primary">{h.name}</td>
                    <td className="px-6 py-3.5 text-text-secondary">{h.district}</td>
                    <td className="px-6 py-3.5 text-right tabular-nums font-semibold text-text-primary">{h.isolationBeds}</td>
                    <td className="px-6 py-3.5">
                      {officers.length ?
                      <span className="text-text-primary">
                          {officers.map((o) => o.name).join(', ')}
                          {officers.some((o) => o.status === 'Inactive') && <span className="text-text-secondary"> (inactive)</span>}
                        </span> :

                      <span className="inline-flex items-center gap-1.5 text-warning">
                          <AlertTriangle size={13} /> No officer yet
                        </span>
                      }
                    </td>
                    <td className="px-6 py-3.5 text-text-secondary whitespace-nowrap">{h.registered}</td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={() => setEditing(h)}
                        className="p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-background transition-colors"
                        aria-label={`Edit ${h.name}`}
                        title="Edit">
                        
                        <Edit2 size={15} />
                      </button>
                    </td>
                  </tr>);

              })}
            </tbody>
          </table>
        </div>
      </div>

      {editing && <HospitalFormModal hospital={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </div>);

}