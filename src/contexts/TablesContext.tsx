'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useTables } from '@/hooks/useTables';

type TablesContextValue = ReturnType<typeof useTables>;

const TablesContext = createContext<TablesContextValue | null>(null);

export function TablesProvider({ children }: { children: ReactNode }) {
  const tablesData = useTables();
  return (
    <TablesContext.Provider value={tablesData}>
      {children}
    </TablesContext.Provider>
  );
}

export function useTablesContext() {
  const context = useContext(TablesContext);
  if (!context) {
    throw new Error('useTablesContext must be used within TablesProvider');
  }
  return context;
}
