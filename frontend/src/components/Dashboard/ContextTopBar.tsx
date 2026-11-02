import React, { useEffect, useState, useRef } from 'react';
import { DashboardContext, ViewMode } from './types';
import {
  Activity,
  MapPin,
  Calendar,
  LayoutTemplate,
  ChevronDown } from
'lucide-react';
import { Role } from '../../lib/rbac';
interface ContextTopBarProps {
  context: DashboardContext;
  setContext: React.Dispatch<React.SetStateAction<DashboardContext>>;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  role: Role;
}
interface DropdownProps {
  icon: React.ElementType;
  value: string;
  options: {
    value: string;
    label: string;
  }[];
  onChange: (value: string) => void;
  disabled?: boolean;
}
function CustomDropdown({
  icon: Icon,
  value,
  options,
  onChange,
  disabled
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node))
      {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const selectedOption = options.find((opt) => opt.value === value);
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex items-center bg-background border border-border rounded-lg px-3 py-2 hover:border-primary/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[160px]">
        
        <Icon size={16} className="text-text-secondary mr-2 flex-shrink-0" />
        <span className="text-[13px] font-medium text-text-primary flex-1 text-left truncate">
          {selectedOption?.label}
        </span>
        <ChevronDown
          size={14}
          className={`text-text-secondary ml-2 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        
      </button>

      {isOpen &&
      <div className="absolute top-full left-0 mt-1 w-full bg-surface-2 border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          {options.map((option) =>
        <button
          key={option.value}
          onClick={() => {
            onChange(option.value);
            setIsOpen(false);
          }}
          className={`w-full text-left px-3 py-2 text-[13px] font-medium transition-colors ${option.value === value ? 'bg-primary/10 text-primary' : 'text-text-primary hover:bg-hover'}`}>
          
              {option.label}
            </button>
        )}
        </div>
      }
    </div>);

}
export function ContextTopBar({
  context,
  setContext,
  viewMode,
  setViewMode,
  role
}: ContextTopBarProps) {
  const isAllDiseases = viewMode === 'strategic_priority';
  const diseaseOptions = [
  {
    value: 'all',
    label: 'All Active Diseases'
  },
  {
    value: 'Ebola',
    label: 'Ebola'
  },
  {
    value: 'Marburg',
    label: 'Marburg'
  }];

  const locationOptions = [
  {
    value: 'National',
    label: 'National Overview'
  },
  {
    value: 'Kigali City',
    label: 'Kigali City'
  },
  {
    value: 'Western Province',
    label: 'Western Province'
  },
  {
    value: 'Eastern Province',
    label: 'Eastern Province'
  },
  {
    value: 'Northern Province',
    label: 'Northern Province'
  },
  {
    value: 'Southern Province',
    label: 'Southern Province'
  }];

  const timeRangeOptions = [
  {
    value: '7d',
    label: 'Next 7 Days'
  },
  {
    value: '30d',
    label: 'Next 30 Days'
  },
  {
    value: '90d',
    label: 'Next 90 Days'
  },
  {
    value: '180d',
    label: 'Next 180 Days'
  },
  {
    value: '365d',
    label: 'Next 365 Days'
  }];

  const viewModeOptions = [
  {
    value: 'disease_specific',
    label: 'Disease-Specific View'
  },
  {
    value: 'district_focus',
    label: 'District Focus View'
  },
  {
    value: 'strategic_priority',
    label: 'Strategic Priority View'
  },
  {
    value: 'admin_overview',
    label: 'System Monitoring View'
  },
  {
    value: 'scenario_comparison',
    label: 'Scenario Comparison'
  }];

  return (
    <div className="bg-surface border border-border rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-card">
      <div className="flex flex-wrap items-center gap-3 flex-1">
        <CustomDropdown
          icon={Activity}
          value={isAllDiseases ? 'all' : context.disease}
          options={diseaseOptions}
          onChange={(value) =>
          setContext({
            ...context,
            disease: value
          })
          }
          disabled={isAllDiseases} />
        

        <CustomDropdown
          icon={MapPin}
          value={context.location}
          options={locationOptions}
          onChange={(value) =>
          setContext({
            ...context,
            location: value
          })
          } />
        

        <CustomDropdown
          icon={Calendar}
          value={context.timeRange}
          options={timeRangeOptions}
          onChange={(value) =>
          setContext({
            ...context,
            timeRange: value
          })
          } />
        
      </div>

      <div className="flex items-center border-l border-border pl-4">
        <CustomDropdown
          icon={LayoutTemplate}
          value={viewMode}
          options={viewModeOptions}
          onChange={(value) => setViewMode(value as ViewMode)} />
        
      </div>
    </div>);

}