'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface Config {
  name: string;
  address: string;
  dns: string;
}

interface ConfigsContextType {
  configs: Config[];
  fetchConfigs: () => void;
}

const ConfigsContext = createContext<ConfigsContextType | undefined>(undefined);

export function useConfigs() {
  const ctx = useContext(ConfigsContext);
  if (!ctx) throw new Error('useConfigs must be used within ConfigsProvider');
  return ctx;
}

export function ConfigsProvider({ children }: { children: ReactNode }) {
  const [configs, setConfigs] = useState<Config[]>([]);

  const fetchConfigs = useCallback(async () => {
    try {
      const res = await fetch('/api/servers', { cache: 'no-store' });
      if (res.ok) setConfigs(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    fetchConfigs();
    const interval = setInterval(fetchConfigs, 10000);
    return () => clearInterval(interval);
  }, [fetchConfigs]);

  return (
    <ConfigsContext.Provider value={{ configs, fetchConfigs }}>
      {children}
    </ConfigsContext.Provider>
  );
}
