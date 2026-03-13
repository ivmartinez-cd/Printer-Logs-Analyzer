import type { ParseLogsResponse } from '../types/api';
import type { Incident } from '../types/api';
import { IncidentTable } from '../components/IncidentTable';

type Props = {
  result: ParseLogsResponse | null;
  incidents: Incident[];
  searchValue: string;
  onEditRule: (code: string) => void;
};

export function EventsTable({
  result,
  incidents,
  searchValue,
  onEditRule,
}: Props) {
  if (!result) return null;

  return (
    <section className="main-dashboard__section dashboard-table">
      <IncidentTable
        incidents={incidents}
        searchValue={searchValue}
        onEditRule={onEditRule}
      />
    </section>
  );
}
