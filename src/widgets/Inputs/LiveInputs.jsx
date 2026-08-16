import React, { useEffect, useState, useRef } from 'react';
import { useTelemetryStore as useLiveStore } from '../../context/TelemetryContext';

import { LoadingState } from '../../components/LoadingState';
import { ProgressBar } from '../../components/ProgressBar';
import { Gamepad2 } from 'lucide-react';

const MAX_HISTORY = 90; // 3 seconds at 30Hz

export function LiveInputs({ throttleMs = 33, isLocked = false }) {
  const liveStore = useLiveStore();
  const [inputs, setInputs] = useState({
    throttle: 0,
    brake: 0,
    clutch: 0,
    steering: 0,
    gear: 0,
    speed: 0
  });
  const [hasData, setHasData] = useState(false);

  const historyRef = useRef([]);
  const [history, setHistory] = useState([]);

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

      const newInputs = {
        throttle: latestData.Throttle || 0,
        brake: latestData.Brake || 0,
        clutch: latestData.Clutch !== undefined ? (1 - latestData.Clutch) : 0, // iRacing clutch is inverted
        steering: latestData.SteeringWheelAngle || 0, // rad
        gear: latestData.Gear || 0,
        speed: latestData.Speed || 0
      };

      setInputs(newInputs);

      // Normalize steering for the trace (assume +/- 180 degrees is the main visible range)
      const steerDeg = newInputs.steering * (180 / Math.PI);
      let normalizedSteering = 0.5 - (steerDeg / 360);
      normalizedSteering = Math.max(0, Math.min(1, normalizedSteering)); // Clamp 0 to 1

      historyRef.current.push({
        t: newInputs.throttle,
        b: newInputs.brake,
        c: newInputs.clutch,
        s: normalizedSteering
      });

      if (historyRef.current.length > MAX_HISTORY) {
        historyRef.current.shift();
      }
      
      setHistory([...historyRef.current]);
    });

    return () => unsubscribe();
  }, [liveStore, throttleMs]);

  // Format gear
  const displayGear = inputs.gear === 0 ? 'N' : inputs.gear === -1 ? 'R' : inputs.gear.toString();

  // Steering rotation (rad to deg)
  const steerDeg = inputs.steering * (180 / Math.PI);

  // Generate SVG points for polyline
  const generatePath = (key, height) => {
    if (history.length === 0) return '';
    const stepX = 100 / (MAX_HISTORY - 1);
    
    return history.map((point, index) => {
      const x = index * stepX;
      const y = height - (point[key] * height);
      return `${x},${y}`;
    }).join(' ');
  };

  if (!hasData) {
    return <LoadingState message="Waiting for Inputs" />;
  }

  return (
    <div 
      className={`w-full h-full flex flex-col pt-1 pb-[3px] pl-0.5 pr-0.5 gap-px font-sans overflow-hidden rounded-xl transition-all duration-300 ${
        isLocked ? 'border-transparent shadow-none' : 'border border-brand-60/60 shadow-xl backdrop-blur-sm'
      }`}
      style={{
        backgroundColor: 'var(--widget-bg-color, rgba(30, 30, 36, 0.6))'
      }}
    >
      <div className="flex-1 flex p-0 gap-0.5">
        
        {/* Left column: Gear & Speed */}
        <div className="flex flex-col max-h-[160px]:flex-row max-h-[160px]:gap-6 max-h-[160px]:justify-center items-center justify-around min-w-[64px] rounded-lg p-0 shrink-0">
          <div className="flex flex-col items-center">
            <span className={`text-6xl font-mono font-black leading-none drop-shadow-md ${inputs.gear <= 0 ? 'text-red-500' : 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]'}`}>
              {displayGear}
            </span>
          </div>

          <div className="flex flex-col items-center mt-0.5 lg:mt-0">
            <span className="text-lg font-mono font-bold text-brand-10/90 leading-none inline-block w-10 text-center">
              {Math.round(inputs.speed * 3.6)}
            </span>
            <span className="text-[8px] text-brand-10/40 uppercase tracking-widest mt-px">km/h</span>
          </div>
        </div>

        {/* Center column: Live Pedals */}
        <div className="flex gap-0.5 h-full py-1 shrink-0 px-0">
          {/* Clutch */}
          <div className="flex flex-col items-center h-full w-1.5 justify-end">
            <ProgressBar value={inputs.clutch} max={1} orientation="vertical" colorClass="bg-blue-500" showGlow={false} />
            <span className="text-[7px] font-bold text-blue-400/80 mt-1">C</span>
          </div>
          {/* Brake */}
          <div className="flex flex-col items-center h-full w-1.5 justify-end">
            <ProgressBar value={inputs.brake} max={1} orientation="vertical" colorClass="bg-red-500" showGlow={false} />
            <span className="text-[7px] font-bold text-red-400/80 mt-1">B</span>
          </div>
          {/* Throttle */}
          <div className="flex flex-col items-center h-full w-1.5 justify-end">
            <ProgressBar value={inputs.throttle} max={1} orientation="vertical" colorClass="bg-green-500" showGlow={false} />
            <span className="text-[7px] font-bold text-green-400/80 mt-1">T</span>
          </div>
        </div>

        {/* Right column: Trace Graph */}
        <div className="flex-1 bg-black/40 rounded-lg relative overflow-hidden border border-brand-60/30">
          {/* Background grid */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none py-3 opacity-20">
            <div className="w-full border-b border-brand-60 border-dashed"></div>
            <div className="w-full border-b border-brand-60 border-dashed"></div>
            <div className="w-full border-b border-brand-60 border-dashed"></div>
          </div>
          
          {/* Center line specifically for steering */}
          <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/10 pointer-events-none -translate-y-1/2"></div>
          
          <svg 
            className="absolute inset-0 w-full h-full overflow-visible"
            preserveAspectRatio="none"
            viewBox="0 0 100 100" 
          >
            {/* Steering Trace (Gray) */}
            <polyline
              points={generatePath('s', 100)}
              fill="none"
              stroke="rgba(156,163,175, 0.5)" /* Tailwind gray-400 */
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
            {/* Clutch Trace */}
            <polyline
              points={generatePath('c', 100)}
              fill="none"
              stroke="rgba(59,130,246, 0.4)"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
            {/* Brake Trace */}
            <polyline
              points={generatePath('b', 100)}
              fill="none"
              stroke="rgba(239,68,68, 0.8)"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
            {/* Throttle Trace */}
            <polyline
              points={generatePath('t', 100)}
              fill="none"
              stroke="rgba(34,197,94, 0.8)"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>

        {/* Far Right: Steering Wheel */}
        <div className="flex flex-col items-center justify-center w-16 rounded-lg p-0 shrink-0">
          <div className="w-12 h-12 rounded-full flex items-center justify-center">
            <svg width="48" height="48" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="17" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="6" />
              <g
                style={{ transform: `rotate(${-steerDeg}deg)`, transformOrigin: '20px 20px', transition: 'transform 50ms linear' }}
              >
                <line x1="20" y1="2" x2="20" y2="6" stroke="rgb(250,204,21)" strokeWidth="4" strokeLinecap="round" />
              </g>
            </svg>
          </div>
          <span className="text-[10px] text-brand-10/50 font-mono mt-2 text-center leading-none">{Math.abs(Math.round(steerDeg))}°</span>
        </div>

      </div>
    </div>
  );
}



