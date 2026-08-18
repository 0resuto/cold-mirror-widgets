import React, { useEffect, useState, useMemo } from 'react';

import { useTelemetryStore as useLiveStore } from '../../context/TelemetryContext';
import { LoadingState } from '../../components/LoadingState';
import { TableContainer, TableHead, TableBody, TableRow, TableHeadCell, TableCell, PosCell, DriverCell, GapCell, IratingCell, ClassCell, SafetyRatingCell, LapTimeCell } from '../../components/Table';
import { getTrackPctText } from '../../utils/tableFormatters';
import { intToHexColor } from '../../utils/colorUtils';

const defaultStandingsColumns = { pos: true, num: true, driver: true, carClass: true, carName: false, classPos: true, srating: true, irating: true, gap: true, bestLap: false, lastLap: true, trackPct: false, laps: false };

export const LiveStandings = ({ columns = defaultStandingsColumns, isLocked = false, throttleMs = 250, showClassName = false, groupByClass = false }) => {
  const liveStore = useLiveStore();
  const [standings, setStandings] = useState([]);
  
  useEffect(() => {
    let lastUpdateTime = 0;
    const unsubscribe = liveStore.subscribe((state) => {
      if (!state.latestTelemetry) {
        setStandings([]);
        return;
      }
      
      const now = Date.now();
      if (now - lastUpdateTime < throttleMs) return;
      lastUpdateTime = now;

      const latestData = state.latestTelemetry;
      if (!latestData) return;
      
      const grid = latestData?.grid || {};
      const sessionDrivers = state.sessionDrivers || [];
      const playerName = latestData?.player_name || '';
      
      const sessionBestLapTime = latestData?.sessionBestLapTime || latestData?.SessionBestLapTime || -1;

      const driverCarIdx = state.driverCarIdx ?? latestData?.playerCarIdx ?? null;

      if (Object.keys(grid).length === 0 || sessionDrivers.length === 0) return;

      const merged = [];
      for (const driver of sessionDrivers) {
        // Skip Pace Car and Spectators
        if (driver.IsPaceCar || driver.IsSpectator) continue;

        const idx = driver.CarIdx?.toString();
        const gridData = grid[idx];
        
        // Only show active cars in the grid
        if (gridData) {
          merged.push({
            ...driver,
            pos: gridData.Position || 0,
            classPos: gridData.ClassPosition || 0,
            num: driver.CarNumberRaw || driver.CarNumber || '0',
            pct: gridData.LapDistPct || 0,
            lap: gridData.Lap || 0,
            lastLapTime: gridData.LastLapTime || -1,
            bestLapTime: gridData.BestLapTime || -1,
            f2Time: gridData.F2Time || -1,
            trackSurface: gridData.TrackSurface,
            onPitRoad: gridData.OnPitRoad,
            isSessionBest: gridData.isSessionBest || (sessionBestLapTime > 0 && gridData.BestLapTime === sessionBestLapTime),
            isPlayer: driver.UserName === playerName || (driverCarIdx !== null && driver.CarIdx === driverCarIdx)
          });
        }
      }

      // Find best lap times in session
      let minBestLap = sessionBestLapTime > 0 ? sessionBestLapTime : Infinity;
      let minLastLap = Infinity;
      for (const d of merged) {
        if (d.bestLapTime > 0 && d.bestLapTime < minBestLap) minBestLap = d.bestLapTime;
        if (d.lastLapTime > 0 && d.lastLapTime < minLastLap) minLastLap = d.lastLapTime;
      }

      for (const d of merged) {
        d.isSessionBest = d.bestLapTime > 0 && d.bestLapTime === minBestLap;
        d.isBestLastLap = d.lastLapTime > 0 && d.lastLapTime === minLastLap;
      }

      setStandings(merged);
    });

    return () => unsubscribe();
  }, [liveStore, throttleMs]);

  const processedStandings = useMemo(() => {
    if (!standings || standings.length === 0) return [];

    if (groupByClass) {
      const groups = {};
      for (const driver of standings) {
        const className = driver.CarClassShortName || 'Default';
        if (!groups[className]) {
          groups[className] = {
            name: className,
            colorInt: driver.CarClassColor,
            drivers: [],
            minPos: driver.pos > 0 ? driver.pos : 999
          };
        }
        groups[className].drivers.push(driver);
        if (driver.pos > 0 && driver.pos < groups[className].minPos) {
          groups[className].minPos = driver.pos;
        }
      }

      const sortedGroups = Object.values(groups).sort((a, b) => a.minPos - b.minPos);
      for (const group of sortedGroups) {
        group.drivers.sort((a, b) => {
          const posA = a.classPos > 0 ? a.classPos : a.pos;
          const posB = b.classPos > 0 ? b.classPos : b.pos;
          return posA - posB;
        });
      }
      return sortedGroups;
    }

    // Default: Sort by position (ignoring 0 which is usually invalid/spectator)
    return [...standings].sort((a, b) => {
      if (a.pos === 0) return 1;
      if (b.pos === 0) return -1;
      return a.pos - b.pos;
    });
  }, [standings, groupByClass]);

  if (standings.length === 0) {
    return <LoadingState message="Waiting for Standings Data" />;
  }

  const renderDriverRow = (driver) => {
    const isPlayer = driver.isPlayer;

    return (
      <TableRow key={driver.CarIdx} isPlayer={isPlayer}>
        {columns.pos && <PosCell pos={driver.pos} isPlayer={isPlayer} />}
        {columns.classPos && (
          <TableCell align="text-center" className={`font-semibold ${isPlayer ? 'text-white' : 'text-brand-10/70'}`}>
            {driver.classPos > 0 ? driver.classPos : '-'}
          </TableCell>
        )}
        {columns.num && (
          <TableCell align="text-center" className={`font-bold italic ${isPlayer ? 'text-white' : 'text-brand-30'}`}>
            {driver.num}
          </TableCell>
        )}
        {columns.driver && <DriverCell name={driver.UserName} isPlayer={isPlayer} maxWidth="max-w-[150px]" />}
        {columns.carClass && <ClassCell colorInt={driver.CarClassColor} shortName={driver.CarClassShortName} showName={showClassName} />}
        {columns.carName && (
          <TableCell align="text-left">
            <span className={`text-[10px] truncate max-w-[120px] inline-block align-middle leading-tight ${isPlayer ? 'text-brand-10' : 'text-brand-10/80'}`} title={driver.CarScreenName || driver.CarScreenNameShort || driver.CarPath}>
              {driver.CarScreenNameShort || driver.CarScreenName || driver.CarPath || 'Unknown'}
            </span>
          </TableCell>
        )}
        {columns.srating && <SafetyRatingCell licLevel={driver.LicLevel} licString={driver.LicString} />}
        {columns.irating && <IratingCell irating={driver.IRating} isPlayer={isPlayer} />}
        {columns.gap && <GapCell gap={driver.f2Time} isPlayer={isPlayer} isStandings={true} />}
        {columns.bestLap && <LapTimeCell seconds={driver.bestLapTime} isPlayer={isPlayer} isSessionBest={driver.isSessionBest} />}
        {columns.lastLap && <LapTimeCell seconds={driver.lastLapTime} isPlayer={isPlayer} opacity="70" isSessionBest={driver.isBestLastLap} />}
        {columns.laps && (
          <TableCell align="text-right" className={`font-mono ${isPlayer ? 'text-white' : 'text-brand-10/70'}`}>
            {driver.lap}
          </TableCell>
        )}
        {columns.trackPct && (() => {
          const { text, color } = getTrackPctText(driver.pct, driver.trackSurface, driver.onPitRoad);
          return (
            <TableCell align="text-right" className={isPlayer ? 'text-white' : 'text-brand-10/50'}>
              {color ? <span className={`${color} font-sans text-[10px]`}>{text}</span> : text}
            </TableCell>
          );
        })()}
      </TableRow>
    );
  };

  const colSpanCount = Object.values(columns).filter(Boolean).length;

  return (
    <TableContainer isLocked={isLocked}>
      <TableHead isLocked={isLocked}>
        {columns.pos && <TableHeadCell width="w-px" align="text-center">Pos</TableHeadCell>}
        {columns.classPos && <TableHeadCell width="w-px" align="text-center" title="Class Position">C.Pos</TableHeadCell>}
        {columns.num && <TableHeadCell width="w-8" align="text-center">#</TableHeadCell>}
        {columns.driver && <TableHeadCell width="w-full" className="min-w-[120px]">Driver</TableHeadCell>}
        {columns.carClass && <TableHeadCell width={showClassName ? 'w-12' : 'w-[9px]'} className={showClassName ? '' : 'px-[3px]'} align="text-center">{showClassName ? 'Class' : ''}</TableHeadCell>}
        {columns.carName && <TableHeadCell width="w-24" align="text-left">Car</TableHeadCell>}
        {columns.srating && <TableHeadCell width="w-14" align="text-center">SR</TableHeadCell>}
        {columns.irating && <TableHeadCell width="w-14" align="text-center">IR</TableHeadCell>}
        {columns.gap && <TableHeadCell width="w-12" align="text-right">Gap</TableHeadCell>}
        {columns.bestLap && <TableHeadCell width="w-16" align="text-right">Best Lap</TableHeadCell>}
        {columns.lastLap && <TableHeadCell width="w-16" align="text-right">Last Lap</TableHeadCell>}
        {columns.laps && <TableHeadCell width="w-10" align="text-right">Laps</TableHeadCell>}
        {columns.trackPct && <TableHeadCell width="w-12" align="text-right">Track %</TableHeadCell>}
      </TableHead>
      <TableBody>
        {groupByClass
          ? processedStandings.map((group) => {
              const hexColor = intToHexColor(group.colorInt);
              return (
                <React.Fragment key={`group-${group.name}`}>
                  <tr className="bg-brand-60/25 border-y border-brand-60/30">
                    <td colSpan={colSpanCount} className="py-0.5 px-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span 
                            className="font-bold text-[10px] text-white tracking-wider uppercase font-sans border-b-2 pb-[1px] px-[1px]"
                            style={{ 
                              borderColor: hexColor,
                              filter: `drop-shadow(0 1px 4px ${hexColor}99)`
                            }}
                          >
                            {group.name}
                          </span>
                        </div>
                        <span className="text-brand-10/40 text-[9px] font-mono">{group.drivers.length} {group.drivers.length === 1 ? 'car' : 'cars'}</span>
                      </div>
                    </td>
                  </tr>
                  {group.drivers.map(renderDriverRow)}
                </React.Fragment>
              );
            })
          : processedStandings.map(renderDriverRow)}
      </TableBody>
    </TableContainer>
  );
};



