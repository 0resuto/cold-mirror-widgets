import React, { useEffect, useState } from 'react';
import { useTelemetryStore as useLiveStore } from '../../context/TelemetryContext';

import { Fuel } from 'lucide-react';
import { LoadingState } from '../../components/LoadingState';
import { ProgressBar } from '../../components/ProgressBar';

export function LiveFuel({
  maxFuel = 100,
  lowFuelThreshold = 15,
  criticalFuelThreshold = 5,
  throttleMs = 200
}) {
  const liveStore = useLiveStore();
  const [fuelData, setFuelData] = useState({ level: 0, usage: 0, lapsRemaining: 0 });
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    let lastUpdateTime = 0;

    const unsubscribe = liveStore.subscribe((state) => {
      const now = performance.now();
      if (now - lastUpdateTime < throttleMs) return;
      lastUpdateTime = now;

      const latestData = state.latestTelemetry;
      if (!latestData) {
        setHasData(false);
        return;
      }
      setHasData(true);

      const level = Number(latestData.FuelLevel) || 0;
      const usage = Number(latestData.FuelUsePerHour) || 0;
      
      const lapsRemaining = usage > 0.1 ? (level / (usage / 60)) : 0;

      setFuelData({
        level,
        usage,
        lapsRemaining
      });
    });

    return () => unsubscribe();
  }, [liveStore, throttleMs]);

  if (!hasData) {
    return <LoadingState message="Waiting for Fuel Data" />;
  }

  const fuelPct = Math.min(100, Math.max(0, (fuelData.level / maxFuel) * 100));

  return (
    <div className="flex flex-col h-full w-full font-sans overflow-hidden">
      <div className="flex-1 flex flex-col justify-center p-4 gap-4">
        
        <div className="flex justify-between items-end">
          <div className="flex items-center gap-2">
            <span className="text-xs text-brand-10/50 uppercase font-semibold">Remaining</span>
            <Fuel size={14} className="text-brand-30 mb-0.5" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-mono font-black text-brand-10 leading-none">
              {fuelData.level.toFixed(1)}
            </span>
            <span className="text-sm font-bold text-brand-10/50">L</span>
          </div>
        </div>

        <ProgressBar 
          value={fuelData.level}
          max={maxFuel}
          colorClass={fuelData.level < lowFuelThreshold ? 'bg-accent-yellow' : 'bg-brand-30'}
          warningColorClass="bg-accent-red animate-pulse"
          isWarning={fuelData.level < criticalFuelThreshold}
        />

        <div className="flex justify-between items-center mt-2 pt-3 border-t border-brand-60/30">
          <span className="text-xs text-brand-10/50 uppercase font-semibold">Usage (L/hr)</span>
          <span className="text-lg font-mono font-bold text-brand-10/90 leading-none">
            {fuelData.usage.toFixed(1)}
          </span>
        </div>

      </div>
    </div>
  );
}



