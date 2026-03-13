import { ReactNode } from 'react';

interface DashboardGridProps {
  children: [ReactNode, ReactNode, ReactNode, ReactNode, ReactNode, ReactNode];
}

/**
 * Grid principal del dashboard.
 * 6 filas: header, input, kpis, timeline, toolbar, table.
 * Solo la fila de tabla (última) hace scroll.
 */
export function DashboardGrid({ children }: DashboardGridProps) {
  const [header, input, kpis, timeline, toolbar, table] = children;

  return (
    <div className="main-dashboard">
      {header}
      {input}
      {kpis}
      {timeline}
      {toolbar}
      <div className="main-dashboard__table-wrapper">{table}</div>
    </div>
  );
}
