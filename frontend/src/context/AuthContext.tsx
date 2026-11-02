import React, { useState, createContext, useContext, ReactNode } from 'react';
import { useScreenInit } from '../useScreenInit.js';
import { Role, ROLE_DEMO_NAMES } from '../lib/rbac';
interface AuthContextType {
  role: Role;
  setRole: (role: Role) => void;
  userName: string;
  setUserName: (name: string) => void;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export function AuthProvider({ children }: {children: ReactNode;}) {
  const screenInit = useScreenInit() as {role?: Role;};
  const [role, setRole] = useState<Role>(screenInit.role ?? 'analyst');
  const [userName, setUserName] = useState<string>(
    ROLE_DEMO_NAMES[screenInit.role ?? 'analyst']
  );
  return (
    <AuthContext.Provider
      value={{
        role,
        setRole,
        userName,
        setUserName
      }}>
      
      {children}
    </AuthContext.Provider>);

}
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}