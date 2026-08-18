import React, { useEffect, useState } from 'react';
import { useTelemetryStore as useLiveStore } from '../../context/TelemetryContext';

import { LoadingState } from '../../components/LoadingState';

const RADAR_RANGE_METERS = 30; // Zoomed in to show cars within 30 meters ahead/behind

export function LiveRadar({ rangeMeters = 30, throttleMs = 33, isLocked = false }) {
  const liveStore = useLiveStore();
  const [radarState, setRadarState] = useState({
    carLeftRight: 0,
    nearbyCars: []
  });
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

      const driverCarIdx = state.driverCarIdx ?? latestData?.playerCarIdx ?? null;
      let trackLengthMeters = 4000;
      if (typeof state.trackLength === 'number') {
        trackLengthMeters = state.trackLength;
      } else if (typeof state.trackLength === 'string') {
        const parsed = parseFloat(state.trackLength);
        if (!isNaN(parsed)) {
          trackLengthMeters = state.trackLength.includes('km') ? parsed * 1000 : parsed;
        }
      }

      const grid = latestData.grid || {};
      const player = driverCarIdx !== null ? grid[driverCarIdx] : null;
      
      const nearbyCars = [];

      if (player) {
        Object.keys(grid).forEach(idx => {
          if (parseInt(idx) === driverCarIdx) return;
          
          const car = grid[idx];
          if (!car.LapDistPct && car.LapDistPct !== 0) return;
          if (car.OnPitRoad) return;

          let delta = car.LapDistPct - player.LapDistPct;
          
          if (delta > 0.5) delta -= 1;
          if (delta < -0.5) delta += 1;

          const distanceMeters = delta * trackLengthMeters;

          if (Math.abs(distanceMeters) <= rangeMeters) {
            nearbyCars.push({
              id: idx,
              distance: distanceMeters,
              position: car.Position
            });
          }
        });
      }

      setRadarState({
        carLeftRight: latestData.CarLeftRight || 0,
        nearbyCars
      });

    });

    return () => unsubscribe();
  }, [liveStore, rangeMeters, throttleMs]);

  const { carLeftRight, nearbyCars } = radarState;

  const isLeft = carLeftRight === 2 || carLeftRight === 4 || carLeftRight === 5;
  const isRight = carLeftRight === 3 || carLeftRight === 4 || carLeftRight === 6;

  // Convert distance in meters to a Y percentage (-50% to 50%)
  const getYPos = (distanceMeters) => {
    const normalized = distanceMeters / rangeMeters; // -1 to 1
    return 50 - (normalized * 50); // 0% to 100%
  };

  const isActive = nearbyCars.length > 0;

  if (!hasData) {
    return <LoadingState message="Waiting for Radar Data" />;
  }

  return (
    <div 
      className={`w-full h-full flex flex-col items-center justify-center relative overflow-hidden p-2 rounded-xl transition-all duration-500 ${
        isLocked ? 'border-transparent shadow-none' : 'border border-brand-60/60 shadow-xl backdrop-blur-sm'
      }`}
      style={{
        backgroundColor: 'var(--widget-bg-color, rgba(30, 30, 36, 0.6))',
        opacity: isActive ? 1 : 'var(--inactive-opacity, 1)'
      }}
    >
      
      {/* Track Background Line */}
      <div className="absolute top-0 bottom-0 w-20 bg-brand-60/10 rounded-full"></div>
      
      {/* Distance Markers (just visual flair) */}
      <div className="absolute top-[25%] w-16 border-b border-brand-60/20"></div>
      <div className="absolute top-[75%] w-16 border-b border-brand-60/20"></div>

      {/* Central car indicator (Player) */}
      <div 
        className="w-10 rounded-md border-2 border-brand-30 shadow-[0_0_12px_rgba(230,57,70,0.4)] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-20"
        style={{ height: '20%' }} // 20% of 25m range = 5 meters exact
      >
        <span className="text-[9px] text-white font-black tracking-widest">YOU</span>
      </div>

      {/* Nearby Cars */}
      {nearbyCars.map((car, i) => {
        const topPct = getYPos(car.distance);
        
        // Pseudo-logic for lateral position:
        let leftOffset = '50%';
        let translateX = '-50%';
        let isDanger = false;

        // Since cars are 20% height (5m), they visually touch at exactly 5m center-to-center
        if (Math.abs(car.distance) < 5) {
          if (isLeft && isRight) {
            leftOffset = i % 2 === 0 ? '20%' : '80%';
            isDanger = true;
          } else if (isLeft) {
            leftOffset = '20%';
            isDanger = true;
          } else if (isRight) {
            leftOffset = '80%';
            isDanger = true;
          }
        } else {
          // Add a tiny random offset so cars don't perfectly overlap
          const hash = parseInt(car.id) % 3;
          if (hash === 1) leftOffset = '40%';
          if (hash === 2) leftOffset = '60%';
        }

        return (
          <div 
            key={car.id}
            className={`absolute w-9 rounded-md border flex items-center justify-center transition-all duration-75 z-10 ${
              isDanger 
                ? 'bg-yellow-500/80 border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.8)]' 
                : 'bg-white/20 border-white/30 backdrop-blur-sm'
            }`}
            style={{ 
              height: '20%', // 5 meters exact
              top: `${topPct}%`, 
              left: leftOffset,
              transform: `translate(${translateX}, -50%)`,
              opacity: 1 - Math.abs(car.distance) / (RADAR_RANGE_METERS * 1.2) // Fade out at edges
            }}
          >
            <span className="text-[10px] text-black font-bold opacity-90 leading-none">{car.position}</span>
          </div>
        );
      })}

      {/* Left Danger Zone Glow */}
      <div 
        className={`absolute left-0 top-0 bottom-0 w-12 transition-all duration-300 pointer-events-none ${
          isLeft ? 'bg-gradient-to-r from-yellow-500/40 to-transparent opacity-100' : 'opacity-0'
        }`}
      ></div>

      {/* Right Danger Zone Glow */}
      <div 
        className={`absolute right-0 top-0 bottom-0 w-12 transition-all duration-300 pointer-events-none ${
          isRight ? 'bg-gradient-to-l from-yellow-500/40 to-transparent opacity-100' : 'opacity-0'
        }`}
      ></div>
      
      {/* Header/Status */}
      <div className="absolute top-3 left-0 w-full flex justify-center z-30 pointer-events-none">
        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full transition-colors ${
          (isLeft || isRight) ? 'bg-yellow-500 text-black shadow-lg' : 'text-brand-10/40'
        }`}>
          {(isLeft || isRight) ? 'BLIND SPOT' : 'CLEAR'}
        </span>
      </div>
    </div>
  );
}




