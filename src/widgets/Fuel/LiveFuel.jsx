import React, { useEffect, useState } from 'react';
import { useTelemetryStore as useLiveStore } from '../../context/TelemetryContext';

import { Fuel } from 'lucide-react';
import { LoadingState } from '../../components/LoadingState';

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
      <div className="bg-brand-60/10 px-4 py-2 border-b border-brand-60/30 flex items-center gap-2">
        <Fuel size={14} className="text-brand-30" />
        <span className="text-xs font-black text-brand-10/90 uppercase tracking-widest">Fuel Calc</span>
      </div>
      <div className="flex-1 flex flex-col justify-center p-4 gap-4">
        
        <div className="flex justify-between items-end">
          <span className="text-xs text-brand-10/50 uppercase font-semibold">Remaining</span>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-mono font-black text-brand-10 leading-none">
              {fuelData.level.toFixed(1)}
            </span>
            <span className="text-sm font-bold text-brand-10/50">L</span>
          </div>
        </div>

        <div
          className="w-full h-2 bg-brand-60/30 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={fuelData.level}
          aria-valuemin={0}
          aria-valuemax={maxFuel}
        >
          <div 
            className={`h-full transition-all duration-300 ${fuelData.level < criticalFuelThreshold ? 'bg-accent-red animate-pulse' : fuelData.level < lowFuelThreshold ? 'bg-accent-yellow' : 'bg-brand-30'}`}
            style={{ width: `${fuelPct}%` }}
          />
        </div>

        <div className="flex justify-between items-end mt-2 pt-3 border-t border-brand-60/30">
          <span className="text-xs text-brand-10/50 uppercase font-semibold">Usage (L/hr)</span>
          <span className="text-lg font-mono font-bold text-brand-10/90">
            {fuelData.usage.toFixed(1)}
          </span>
        </div>

      </div>
    </div>
  );
}



