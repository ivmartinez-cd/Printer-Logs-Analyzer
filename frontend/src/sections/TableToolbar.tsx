import type { ParseLogsResponse } from '../types/api';
import { AnalyzeToolbar } from '../components/toolbar/AnalyzeToolbar';
import type { SeverityFilter } from '../components/toolbar/AnalyzeToolbar';

type Props = {
  result: ParseLogsResponse | null;
  searchValue: string;
  onSearchChange: (value: string) => void;
  severityValue: SeverityFilter;
  onSeverityChange: (value: SeverityFilter) => void;
  resultsCount: number;
};

export function TableToolbar({
  result,
  searchValue,
  onSearchChange,
  severityValue,
  onSeverityChange,
  resultsCount,
}: Props) {
  if (!result) return null;

  return (
    <section className="main-dashboard__section dashboard-toolbar">
      <AnalyzeToolbar
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        severityValue={severityValue}
        onSeverityChange={onSeverityChange}
        resultsCount={resultsCount}
      />
    </section>
  );
}
