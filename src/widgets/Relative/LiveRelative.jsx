import React, { useEffect, useState } from 'react';
import { useTelemetryStore as useLiveStore } from '../../context/TelemetryContext';

import { LoadingState } from '../../components/LoadingState';
import { motion } from 'framer-motion';
import { ClassBadge, SafetyRatingBadge } from '../../components/DriverBadges';

const defaultRelativeColumns = { classBadge: true, num: true, driver: true, irating: true, srating: true };

export function LiveRelative({ columns = defaultRelativeColumns, isLocked = false, throttleMs = 66 }) {
  const liveStore = useLiveStore();
  const [relativeDrivers, setRelativeDrivers] = useState([]);
  const [hasSessionData, setHasSessionData] = useState(false);

  useEffect(() => {
    let lastUpdateTime = 0;

    const unsubscribe = liveStore.subscribe((state) => {
      const now = performance.now();
      if (now - lastUpdateTime < throttleMs) return;
      lastUpdateTime = now;

      const latestData = state.latestTelemetry;
      const grid = latestData?.grid || {};
      const sessionDrivers = state.sessionDrivers || [];
      const driverCarIdx = state.driverCarIdx ?? latestData?.playerCarIdx ?? null;

      if (sessionDrivers.length > 0) {
        setHasSessionData(true);
      }

      if (Object.keys(grid).length === 0 || sessionDrivers.length === 0 || driverCarIdx === null) return;

      const playerGrid = grid[driverCarIdx];
      if (!playerGrid) return; // Player not on track

      const playerPct = playerGrid.LapDistPct ?? 0;

      const relative = Object.keys(grid).map(carIdx => {
        const driverGrid = grid[carIdx];
        const driverInfo = sessionDrivers.find(d => d.CarIdx === Number(carIdx));
        if (!driverInfo) return null;

        let pctDiff = (driverGrid?.LapDistPct ?? 0) - playerPct;
        if (pctDiff > 0.5) pctDiff -= 1;
        if (pctDiff < -0.5) pctDiff += 1;

        // Use F2Time if provided by telemetry, else estimate from pctDiff and track length / speed
        const estTimeGap = driverGrid.F2Time !== undefined && driverGrid.F2Time !== -1 
          ? driverGrid.F2Time 
          : pctDiff * 100;

        return {
          carIdx: Number(carIdx),
          name: driverInfo.UserName,
          carNumber: driverInfo.CarNumberRaw || driverInfo.CarNumber || '0',
          irating: driverInfo.iRating,
          license: driverInfo.LicString,
          licLevel: driverInfo.LicLevel,
          carClassColor: driverInfo.CarClassColor,
          carClassShortName: driverInfo.CarClassShortName,
          isPlayer: Number(carIdx) === driverCarIdx,
          pctDiff,
          gap: estTimeGap,
        };
      }).filter(Boolean);

      relative.sort((a, b) => b.gap - a.gap);

      const playerIndex = relative.findIndex(d => d.isPlayer);
      if (playerIndex === -1) return;

      const startIndex = Math.max(0, playerIndex - 3);
      const endIndex = Math.min(relative.length, playerIndex + 4);
      setRelativeDrivers(relative.slice(startIndex, endIndex));
    });

    return () => unsubscribe();
  }, [liveStore, throttleMs]);

  if (!hasSessionData) {
    return <LoadingState message="Waiting for Telemetry..." />;
  }

  if (relativeDrivers.length === 0) {
    return <LoadingState message="Player not on track" />;
  }

  return (
    <div className={`flex flex-col w-full h-full rounded-xl overflow-hidden transition-all duration-300 ${
      isLocked ? 'bg-transparent border-transparent' : 'bg-brand-bg/60 border border-brand-60/60 shadow-xl backdrop-blur-sm'
    }`}>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className={`sticky top-0 z-10 shadow-sm transition-colors ${isLocked ? 'bg-brand-60/95 backdrop-blur-md' : 'bg-brand-60/80'}`}>
            <tr>
              {columns.classBadge && <th className="py-1 px-3 text-[10px] font-bold text-brand-10/60 uppercase tracking-wider w-12 text-center">Class</th>}
              {columns.num && <th className="py-1 px-3 text-[10px] font-bold text-brand-10/60 uppercase tracking-wider w-8 text-center">#</th>}
              {columns.driver && <th className="py-1 px-3 text-[10px] font-bold text-brand-10/60 uppercase tracking-wider w-full">Driver</th>}
              {columns.srating && <th className="py-1 px-3 text-[10px] font-bold text-brand-10/60 uppercase tracking-wider w-14 text-center">SR</th>}
              {columns.irating && <th className="py-1 px-3 text-[10px] font-bold text-brand-10/60 uppercase tracking-wider w-12 text-right">IR</th>}
              <th className="py-1 px-3 text-[10px] font-bold text-brand-10/60 uppercase tracking-wider w-14 text-right">Delta</th>
            </tr>
          </thead>
          <tbody className="text-xs font-mono">
            {relativeDrivers.map((driver) => {
              const isPlayer = driver.isPlayer;

              return (
                <motion.tr 
                  layout
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  key={driver.carIdx} 
                  className={`border-b transition-colors ${
                    isPlayer ? 'bg-brand-bg bg-gradient-to-r from-white/20 to-white/5 border-white/30 shadow-[0_3px_8px_rgba(0,0,0,0.4),0_1px_0_#2b2d34,0_-1px_0_#2b2d34,inset_0_1px_0_rgba(255,255,255,0.15)] relative z-20' : 
                    'bg-brand-bg border-brand-60/20 hover:bg-brand-60/30'
                  }`}
                >
                  {columns.classBadge && (
                    <td className="py-1 px-3 text-center">
                      <ClassBadge colorInt={driver.carClassColor} shortName={driver.carClassShortName} />
                    </td>
                  )}
                  {columns.num && (
                    <td className={`py-1 px-3 text-center font-bold italic ${isPlayer ? 'text-white' : 'text-brand-30'}`}>
                      {driver.carNumber}
                    </td>
                  )}
                  {columns.driver && (
                    <td className="py-1 px-3">
                      <span className={`font-sans truncate inline-block max-w-[140px] align-middle ${isPlayer ? 'font-black text-white text-[13px] drop-shadow-md' : 'font-semibold text-brand-10'}`}>
                        {driver.name || 'Unknown'}
                      </span>
                    </td>
                  )}
                  {columns.srating && (
                    <td className="py-1 px-3 text-center">
                      <SafetyRatingBadge licLevel={driver.licLevel} licString={driver.license} />
                    </td>
                  )}
                  {columns.irating && (
                    <td className={`py-1 px-3 text-right font-semibold ${isPlayer ? 'text-brand-30' : 'text-brand-30'}`}>
                      {driver.irating > 0 ? (driver.irating / 1000).toFixed(1) + 'k' : '-'}
                    </td>
                  )}
                  <td className={`py-1 px-3 text-right font-mono font-bold text-[11px] ${
                    isPlayer ? 'text-white' : driver.gap > 0 ? 'text-accent-red' : 'text-accent-green'
                  }`}>
                    {isPlayer ? '0.0' : `${driver.gap > 0 ? '+' : ''}${Math.abs(driver.gap).toFixed(1)}`}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}



