import type { ParseLogsResponse } from '../types/api';
import { KPIBar } from '../components/KPIBar';

type Props = {
  result: ParseLogsResponse | null;
};

export function KPIsRow({ result }: Props) {
  if (!result) return null;

  return (
    <section className="main-dashboard__section dashboard-kpis">
      <KPIBar
        incidents={result.incidents}
        events={result.events}
        globalSeverity={result.global_severity}
      />
    </section>
  );
}
