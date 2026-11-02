import React, { useState } from 'react';
import { Megaphone, Plus, Edit2, Trash2, Clock } from 'lucide-react';
export function AdminAnnouncements() {
  const [showForm, setShowForm] = useState(false);
  const announcements = [
  {
    title: 'Scheduled Maintenance This Weekend',
    msg: 'The system will be down for 2 hours on Sunday at 2:00 AM CAT for database upgrades.',
    target: 'All Users',
    date: 'Jun 15, 2026',
    expiry: 'Jun 22, 2026',
    status: 'Active'
  },
  {
    title: 'New SEIHFR Parameters Available for Marburg',
    msg: 'Updated provisional Marburg parameters have been loaded into the system for review.',
    target: 'Epidemiologists',
    date: 'Jun 10, 2026',
    expiry: 'Jul 10, 2026',
    status: 'Active'
  },
  {
    title: 'System Outage Resolved',
    msg: 'The simulation engine issue has been fixed. All queued simulations are now processing.',
    target: 'All Users',
    date: 'Jun 01, 2026',
    expiry: 'Jun 05, 2026',
    status: 'Expired'
  }];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-text-primary">
          System Announcements
        </h1>
        {!showForm &&
        <button
          onClick={() => setShowForm(true)}
          className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-[13px] font-medium flex items-center transition-colors">
          
            <Plus size={16} className="mr-2" /> Create Announcement
          </button>
        }
      </div>

      {showForm ?
      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-background">
            <h2 className="text-[15px] font-semibold text-text-primary">
              Create New Announcement
            </h2>
          </div>
          <div className="p-6 space-y-5">
            <div>
              <label className="block text-[13px] font-medium text-text-secondary mb-1">
                Announcement Title
              </label>
              <input
              type="text"
              placeholder="e.g. Scheduled Maintenance"
              className="w-full border border-border bg-background rounded-lg px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:border-primary" />
            
            </div>
            <div>
              <label className="block text-[13px] font-medium text-text-secondary mb-1">
                Message Body
              </label>
              <textarea
              rows={4}
              placeholder="Enter the announcement details..."
              className="w-full border border-border bg-background rounded-lg px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:border-primary resize-none">
            </textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-[13px] font-medium text-text-secondary mb-2">
                  Target Audience
                </label>
                <div className="space-y-2">
                  <label className="flex items-center text-[13px] text-text-secondary">
                    <input
                    type="checkbox"
                    defaultChecked
                    className="mr-2 rounded text-primary focus:ring-primary" />
                  {' '}
                    All Users
                  </label>
                  <label className="flex items-center text-[13px] text-text-secondary">
                    <input
                    type="checkbox"
                    className="mr-2 rounded text-primary focus:ring-primary" />
                  {' '}
                    Epidemiologists
                  </label>
                  <label className="flex items-center text-[13px] text-text-secondary">
                    <input
                    type="checkbox"
                    className="mr-2 rounded text-primary focus:ring-primary" />
                  {' '}
                    Health Officers
                  </label>
                  <label className="flex items-center text-[13px] text-text-secondary">
                    <input
                    type="checkbox"
                    className="mr-2 rounded text-primary focus:ring-primary" />
                  {' '}
                    Policy Makers
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-text-secondary mb-2">
                  Priority Level
                </label>
                <select className="w-full px-3 py-2 rounded-lg border border-border bg-background text-[13px] text-text-primary focus:outline-none focus:border-primary">
                  <option>Information (Blue)</option>
                  <option>Warning (Amber)</option>
                  <option>Critical (Red Banner)</option>
                </select>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-medium text-text-secondary mb-1">
                    Publish Date
                  </label>
                  <input
                  type="date"
                  className="w-full border border-border bg-background rounded-lg px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:border-primary" />
                
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-text-secondary mb-1">
                    Expiry Date
                  </label>
                  <input
                  type="date"
                  className="w-full border border-border bg-background rounded-lg px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:border-primary" />
                
                </div>
              </div>
            </div>
          </div>
          <div className="px-6 py-4 border-t border-border bg-background flex justify-end gap-3">
            <button
            onClick={() => setShowForm(false)}
            className="px-4 py-2 border border-border rounded-lg text-[13px] font-medium text-text-primary hover:bg-surface">
            
              Cancel
            </button>
            <button className="px-4 py-2 bg-hover text-text-primary rounded-lg text-[13px] font-medium hover:bg-background border border-border">
              Preview
            </button>
            <button className="px-4 py-2 bg-primary text-white rounded-lg text-[13px] font-medium hover:bg-primary-dark">
              Publish Announcement
            </button>
          </div>
        </div> :

      <div className="space-y-4">
          {announcements.map((ann, i) =>
        <div
          key={i}
          className="bg-surface rounded-xl border border-border shadow-sm p-5 flex flex-col md:flex-row gap-4">
          
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-[15px] font-semibold text-text-primary">
                    {ann.title}
                  </h3>
                  <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${ann.status === 'Active' ? 'bg-primary/10 text-primary' : 'bg-background text-text-secondary border border-border'}`}>
                
                    {ann.status}
                  </span>
                </div>
                <p className="text-[13px] text-text-secondary mb-3">
                  {ann.msg}
                </p>
                <div className="flex flex-wrap gap-4 text-[11px] text-text-secondary">
                  <span className="flex items-center">
                    <Megaphone size={12} className="mr-1" /> Target:{' '}
                    {ann.target}
                  </span>
                  <span className="flex items-center">
                    <Clock size={12} className="mr-1" /> Published: {ann.date}
                  </span>
                  <span className="flex items-center">
                    <Clock size={12} className="mr-1" /> Expires: {ann.expiry}
                  </span>
                </div>
              </div>
              <div className="flex md:flex-col justify-end gap-2 border-t md:border-t-0 md:border-l border-border pt-3 md:pt-0 md:pl-4">
                <button
              className="p-2 text-text-secondary hover:text-primary hover:bg-primary/5 rounded transition-colors"
              title="Edit">
              
                  <Edit2 size={16} />
                </button>
                <button
              className="p-2 text-text-secondary hover:text-accent hover:bg-accent/5 rounded transition-colors"
              title="Delete">
              
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
        )}
        </div>
      }
    </div>);

}