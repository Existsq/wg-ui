'use client';

import { ServerCard } from "@/components/dashboard/servers/server-card";
import { useConfigs } from "@/components/general/configs-context";

export default function HomePage() {
  const { configs, fetchConfigs } = useConfigs();

  return (
    <div className="min-h-screen">
      <div className="px-6 pt-4 pb-16 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {configs.map((config) => (
          <ServerCard
            key={config.name}
            name={config.name}
            address={config.address}
            dns={config.dns}
            onUpdate={fetchConfigs}
          />
        ))}
      </div>
    </div>
  );
}
