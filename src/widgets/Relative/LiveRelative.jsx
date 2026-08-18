import React, { useEffect, useState } from 'react';
import { useTelemetryStore as useLiveStore } from '../../context/TelemetryContext';

import { LoadingState } from '../../components/LoadingState';
import { TableContainer, TableHead, TableBody, TableRow, TableHeadCell, TableCell, PosCell, DriverCell, GapCell, IratingCell, ClassCell, SafetyRatingCell } from '../../components/Table';

const defaultRelativeColumns = { pos: true, num: true, driver: true, classBadge: true, carName: true, irating: true, srating: true };

export function LiveRelative({ columns = defaultRelativeColumns, isLocked = false, throttleMs = 66, showClassName = false }) {
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
        if (!driverInfo || driverInfo.IsPaceCar || driverInfo.IsSpectator) return null;

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
          carName: driverInfo.CarScreenNameShort || driverInfo.CarScreenName || driverInfo.CarPath || 'Unknown',
          pos: driverGrid?.Position || 0,
          irating: driverInfo.iRating ?? driverInfo.IRating,
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
    <TableContainer isLocked={isLocked}>
      <TableHead isLocked={isLocked}>
        {columns.pos && <TableHeadCell width="w-px" align="text-center">Pos</TableHeadCell>}
        {columns.num && <TableHeadCell width="w-8" align="text-center">#</TableHeadCell>}
        {columns.driver && <TableHeadCell width="w-full">Driver</TableHeadCell>}
        {columns.classBadge && <TableHeadCell width={showClassName ? 'w-12' : 'w-[9px]'} className={showClassName ? '' : 'px-[3px]'} align="text-center">{showClassName ? 'Class' : ''}</TableHeadCell>}
        {columns.carName && <TableHeadCell width="w-24" align="text-left">Car</TableHeadCell>}
        {columns.srating && <TableHeadCell width="w-14" align="text-center">SR</TableHeadCell>}
        {columns.irating && <TableHeadCell width="w-12" align="text-center">IR</TableHeadCell>}
        <TableHeadCell width="w-14" align="text-right">Delta</TableHeadCell>
      </TableHead>
      <TableBody>
        {relativeDrivers.map((driver) => {
          const isPlayer = driver.isPlayer;

          return (
            <TableRow key={driver.carIdx} isPlayer={isPlayer}>
              {columns.pos && <PosCell pos={driver.pos} isPlayer={isPlayer} />}
              {columns.num && (
                <TableCell align="text-center" className={`font-bold italic ${isPlayer ? 'text-white' : 'text-brand-30'}`}>
                  {driver.carNumber}
                </TableCell>
              )}
              {columns.driver && <DriverCell name={driver.name} isPlayer={isPlayer} />}
              {columns.classBadge && <ClassCell colorInt={driver.carClassColor} shortName={driver.carClassShortName} showName={showClassName} />}
              {columns.carName && (
                <TableCell align="text-left">
                  <span className={`text-[10px] truncate max-w-[120px] inline-block align-middle leading-tight ${isPlayer ? 'text-brand-10' : 'text-brand-10/80'}`} title={driver.carName}>
                    {driver.carName}
                  </span>
                </TableCell>
              )}
              {columns.srating && <SafetyRatingCell licLevel={driver.licLevel} licString={driver.license} />}
              {columns.irating && <IratingCell irating={driver.irating} isPlayer={isPlayer} />}
              <GapCell gap={driver.gap} isPlayer={isPlayer} />
            </TableRow>
          );
        })}
      </TableBody>
    </TableContainer>
  );
}



