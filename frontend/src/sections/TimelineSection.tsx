import type { ParseLogsResponse } from '../types/api';
import { EventTimeline } from '../components/EventTimeline';

type Props = {
  result: ParseLogsResponse | null;
};

export function TimelineSection({ result }: Props) {
  if (!result) return null;

  return (
    <section className="main-dashboard__section dashboard-timeline">
      <EventTimeline events={result.events} />
    </section>
  );
}
