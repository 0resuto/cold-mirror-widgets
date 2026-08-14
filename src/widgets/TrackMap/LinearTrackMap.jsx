import React, { useEffect, useState } from 'react';
import { useTelemetryStore as useLiveStore } from '../../context/TelemetryContext';

import { Wrench, Timer } from 'lucide-react';
import { LoadingState } from '../../components/LoadingState';

export function LinearTrackMap({ throttleMs = 66 }) {
  const liveStore = useLiveStore();
  const [gridData, setGridData] = useState({});
  const [playerIdx, setPlayerIdx] = useState(null);
  const [hasData, setHasData] = useState(false);
  
  useEffect(() => {
    let lastUpdateTime = 0;
    
    const unsubscribe = liveStore.subscribe((state) => {
      const now = performance.now();
      if (now - lastUpdateTime < throttleMs) return; 
      lastUpdateTime = now;
      
      const latestData = state.latestTelemetry;
      if (!latestData || !latestData.grid) {
        setHasData(false);
        return;
      }
      setHasData(true);
      
      setGridData(latestData.grid || {});
      setPlayerIdx(state.driverCarIdx ?? latestData.playerCarIdx ?? null);
    });

    return () => unsubscribe();
  }, [liveStore, throttleMs]);

  const playerCar = playerIdx != null ? gridData[playerIdx] : null;
  const playerLap = playerCar?.Lap || 0;

  if (!hasData) {
    return <LoadingState message="Waiting for Track Map" />;
  }

  return (
    <div className="w-full h-full flex flex-col justify-center px-4">
      
      {/* The main track line */}
      <div className="relative w-full h-2 bg-brand-60/30 rounded-full my-auto shadow-inner border border-black/20">
        
        {/* Start/Finish Line Mark */}
        <div className="absolute top-0 bottom-0 left-0 w-1 bg-white/40 rounded-l-full"></div>
        <div className="absolute -top-3 left-0 text-[8px] font-mono text-white/50 uppercase tracking-widest">S/F</div>

        {/* Cars */}
        {Object.entries(gridData).map(([idx, car]) => {
          const isPlayer = parseInt(idx) === playerIdx;
          const leftPos = (car.LapDistPct * 100).toFixed(2);
          
          let ringColor = 'border-white/20 border-solid';
          let coreColor = 'bg-brand-60';
          let zIndex = 10;
          let size = 'w-4 h-4';

          if (isPlayer) {
            ringColor = 'border-brand-primary border-solid';
            coreColor = 'bg-white shadow-[0_0_12px_var(--brand-primary)]';
            zIndex = 50;
            size = 'w-5 h-5';
          } else {
            // Check lap diff
            if (car.Lap < playerLap) {
              // Lap down (blue dashed)
              ringColor = 'border-blue-500 border-dashed';
            } else if (car.Lap > playerLap) {
              // Lap ahead (red dashed)
              ringColor = 'border-red-500 border-dashed';
            }
          }

          return (
            <div 
              key={idx}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none transition-all duration-75"
              style={{ 
                left: `${leftPos}%`,
                zIndex
              }}
            >
              {/* Status Icons (above the car) */}
              {(car.OnPitRoad || car.HasDamage || car.IsFastestLap) && (
                <div className="absolute bottom-full mb-2.5 flex justify-center w-full">
                  {car.OnPitRoad ? (
                    <div className="bg-yellow-500 text-black text-[9px] font-bold px-1 rounded-sm">PIT</div>
                  ) : car.HasDamage ? (
                    <Wrench size={12} className="text-orange-500 drop-shadow-md" />
                  ) : car.IsFastestLap ? (
                    <Timer size={12} className="text-purple-400 drop-shadow-md" />
                  ) : null}
                </div>
              )}

              {/* The Car Dot */}
              <div 
                className={`rounded-full border-[2px] flex items-center justify-center ${size} ${ringColor} bg-brand-bg/90 backdrop-blur-md`}
              >
                <div className={`w-2 h-2 rounded-full ${coreColor}`}></div>
              </div>

              {/* Position Number Label (below the car) */}
              {!isPlayer && (
                 <div className="absolute top-full mt-2 text-[10px] font-mono font-bold text-white/60">
                   P{car.Position}
                 </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}



