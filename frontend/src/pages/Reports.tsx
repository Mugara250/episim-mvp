import { PolicyReports } from './PolicyReports';

/**
 * Fallback Reports page for roles without a role-specific page. Every current role has its own
 * page (see App.tsx), so this simply shows the API-backed list of approved reports. The prototype's
 * template gallery used mock simulations and was retired with the client-side engine.
 */
export function Reports(_props: {focusedReportId?: string | null;}) {
  return <PolicyReports />;
}
