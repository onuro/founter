import { TablesProvider } from '@/contexts/TablesContext';

export default function TablesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TablesProvider>{children}</TablesProvider>;
}
