import { ReactNode } from 'react';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return <div className="main-layout">{children}</div>;
}
