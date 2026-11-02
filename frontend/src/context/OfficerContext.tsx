import React, { createContext, useContext, useState, ReactNode } from 'react';
import { hospitalEntries } from '../data/hospitalEntries';
import { instructions as initialInstructions } from '../data/instructions';
import { responsePlans } from '../data/responsePlans';
import { HospitalEntry, Instruction, ResponsePlan } from '../types/officer';

interface OfficerContextType {
  entries: HospitalEntry[];
  setEntries: React.Dispatch<React.SetStateAction<HospitalEntry[]>>;
  instructions: Instruction[];
  setInstructions: React.Dispatch<React.SetStateAction<Instruction[]>>;
  plans: ResponsePlan[];
  setPlans: React.Dispatch<React.SetStateAction<ResponsePlan[]>>;
}

const OfficerContext = createContext<OfficerContextType | undefined>(undefined);

export function OfficerProvider({ children }: {children: ReactNode;}) {
  const [entries, setEntries] = useState(hospitalEntries);
  const [instructions, setInstructions] = useState(initialInstructions);
  const [plans, setPlans] = useState(responsePlans);
  return (
    <OfficerContext.Provider value={{ entries, setEntries, instructions, setInstructions, plans, setPlans }}>
      {children}
    </OfficerContext.Provider>);

}

export function useOfficer() {
  const ctx = useContext(OfficerContext);
  if (!ctx) throw new Error('useOfficer must be used within an OfficerProvider');
  return ctx;
}