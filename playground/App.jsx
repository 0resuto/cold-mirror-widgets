import React, { useState, useEffect, useRef } from 'react';
import { SlidersHorizontal, Lock, Unlock, Eye, EyeOff, Layers } from 'lucide-react';
import { TelemetryProvider } from '../src/context/TelemetryContext';

import { LiveFuel } from '../src/widgets/Fuel/LiveFuel';
import { LiveInputs } from '../src/widgets/Inputs/LiveInputs';
import { LiveWeather } from '../src/widgets/Weather/LiveWeather';
import { DigitalDash } from '../src/widgets/Dashboard/DigitalDash';
import { PitHelper } from '../src/widgets/PitHelper/PitHelper';
import { LiveRadar } from '../src/widgets/Radar/LiveRadar';
import { LiveStandings } from '../src/widgets/Standings/LiveStandings';
import { LiveRelative } from '../src/widgets/Relative/LiveRelative';
import { LinearTrackMap } from '../src/widgets/TrackMap/LinearTrackMap';

import { createSimulator } from '../simulator';
import { BottomPlayerBar } from './components/BottomPlayerBar';
import { RadarMockDrawer } from './drawers/RadarMockDrawer';

const WidgetBox = ({ 
  children, 
  title, 
  isLocked, 
  widgetOpacity, 
  bgOpacity, 
  width = "w-[300px]", 
  height = "h-[200px]", 
  onOpenSettings, 
  isSettingsActive, 
  badge 
}) => (
  <div className="flex flex-col gap-2">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className={`text-xs font-bold text-brand-10 uppercase tracking-widest transition-opacity ${isLocked ? 'opacity-0' : 'opacity-100'}`}>{title}</span>
        {badge && !isLocked && (
          <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border leading-none ${
            badge === 'MANUAL' 
              ? 'bg-brand-30/20 text-brand-30 border-brand-30/40' 
              : 'bg-white/10 text-white/50 border-white/10'
          }`}>
            {badge}
          </span>
        )}
      </div>
      {onOpenSettings && !isLocked && (
        <button
          onClick={onOpenSettings}
          title={`Configure ${title} Mock Data`}
          className={`p-1 rounded-md transition-all cursor-pointer ${
            isSettingsActive 
              ? 'text-brand-30 bg-white/10 ring-1 ring-brand-30/40' 
              : 'text-brand-10/50 hover:text-brand-30 hover:bg-white/10'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
    <div 
      className={`${width} ${height} ${isLocked ? '' : 'resize'} rounded-lg relative flex items-center justify-center min-w-[100px] min-h-[50px] transition-colors duration-300 ${
        !isLocked 
          ? 'border border-brand-60/50 bg-brand-bg/80 backdrop-blur-md shadow-2xl' 
          : 'border border-transparent bg-transparent'
      } overflow-hidden`}
    >
      <div 
        className="w-full h-full transition-opacity duration-75"
        style={{ 
          opacity: widgetOpacity / 100,
          '--widget-bg-color': `rgba(30, 30, 36, ${bgOpacity / 100})` 
        }}
      >
        {children}
      </div>
    </div>
  </div>
);

const defaultRadarCustomTelemetry = {
  CarLeftRight: 0,
  playerCarIdx: 9,
  grid: {
    9: { LapDistPct: 0.5, Position: 3, ClassPosition: 1, Lap: 10, TrackSurface: 4, IsFastestLap: true, BestLapTime: 136.5, LastLapTime: 136.5 },
    10: { LapDistPct: 0.5036, Position: 4, ClassPosition: 2, Lap: 10, TrackSurface: 4, side: 'left', F2Time: 1.2, BestLapTime: 136.8, LastLapTime: 137.1 },
    11: { LapDistPct: 0.497, Position: 5, ClassPosition: 3, Lap: 10, TrackSurface: 4, side: 'right', HasDamage: true, F2Time: -1.5, BestLapTime: 137.2, LastLapTime: 142.1 },
  }
};

export function App() {
  const simulatorRef = useRef(null);

  if (!simulatorRef.current) {
    simulatorRef.current = createSimulator();
  }
  const simulator = simulatorRef.current;

  const [telemetry, setTelemetry] = useState(() => simulator.getTelemetry());
  const [sessionDrivers] = useState(() => simulator.getSessionDrivers());
  const [sessionData] = useState(() => simulator.getSessionData());
  const [trackLength] = useState(() => simulator.getTrackLength());

  // Radar Isolated Custom Mock State
  const [radarMode, setRadarMode] = useState('auto'); // 'auto' | 'manual'
  const [radarCustomTelemetry, setRadarCustomTelemetry] = useState(defaultRadarCustomTelemetry);
  const [radarCustomTrackLength, setRadarCustomTrackLength] = useState(7004);
  const [isRadarDrawerOpen, setIsRadarDrawerOpen] = useState(false);

  // Layout & UI Controls
  const [isLocked, setIsLocked] = useState(false);
  const [groupByClass, setGroupByClass] = useState(true);
  const [showClassName, setShowClassName] = useState(false);
  const [widgetOpacity, setWidgetOpacity] = useState(100);
  const [inactiveOpacity, setInactiveOpacity] = useState(30);
  const [bgOpacity, setBgOpacity] = useState(60);

  // Subscribe to live simulation ticks
  useEffect(() => {
    simulator.start();

    const unsubscribe = simulator.subscribe((frame) => {
      setTelemetry({ ...frame });
    });

    return () => {
      unsubscribe();
      simulator.stop();
    };
  }, [simulator]);

  const handleRestartSession = () => {
    simulator.seek(0);
    simulator.clearIncident();
    simulator.play();
  };

  const handleToggleRadarDrawer = () => {
    setIsRadarDrawerOpen((prev) => !prev);
  };

  return (
    <TelemetryProvider 
      telemetry={telemetry} 
      sessionDrivers={sessionDrivers}
      sessionData={sessionData}
      trackLength={trackLength}
    >
      <div className="min-h-screen bg-[url('/bg.webp')] bg-cover bg-center bg-fixed p-10 pb-28 font-sans text-white">
        
        {/* Playground Top Bar */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-brand-10 tracking-tight">Cold Mirror Widgets Playground</h1>
            <p className="text-xs text-white/50 mt-0.5">Realistic Multi-Class Telemetry Simulation Engine</p>
          </div>

          {/* Quick Settings Floating Control Panel */}
          <div className="fixed top-4 right-4 z-[9990] flex flex-col gap-3 bg-brand-bg/95 backdrop-blur-md p-4 rounded-xl border border-brand-60/50 shadow-2xl min-w-[220px]">
            <div className="flex items-center justify-between pb-2 border-b border-brand-60/30">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-10">Display Controls</span>
              <button 
                onClick={() => setIsLocked(!isLocked)}
                className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isLocked 
                    ? 'bg-brand-30/20 text-brand-30 border border-brand-30/40' 
                    : 'bg-white/10 text-white/60 hover:text-white'
                }`}
              >
                {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                <span>{isLocked ? 'Locked' : 'Edit'}</span>
              </button>
            </div>

            {/* Standings Group Class Toggle */}
            <label className="flex items-center justify-between cursor-pointer text-xs font-semibold text-white/80">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-brand-30" />
                Group By Class
              </span>
              <input 
                type="checkbox" 
                checked={groupByClass} 
                onChange={(e) => setGroupByClass(e.target.checked)}
                className="w-4 h-4 accent-brand-30 rounded cursor-pointer"
              />
            </label>

            {/* Show Class Name Toggle */}
            <label className="flex items-center justify-between cursor-pointer text-xs font-semibold text-white/80">
              <span>Show Class Label</span>
              <input 
                type="checkbox" 
                checked={showClassName} 
                onChange={(e) => setShowClassName(e.target.checked)}
                className="w-4 h-4 accent-brand-30 rounded cursor-pointer"
              />
            </label>

            {/* Opacity Sliders */}
            <div className="space-y-2 pt-1 border-t border-brand-60/20">
              <div>
                <div className="flex justify-between text-[11px] text-white/60 mb-0.5">
                  <span>Widget Opacity</span>
                  <span className="font-mono">{widgetOpacity}%</span>
                </div>
                <input 
                  type="range" 
                  min="10" 
                  max="100" 
                  value={widgetOpacity}
                  onChange={(e) => setWidgetOpacity(Number(e.target.value))}
                  className="w-full h-1 bg-brand-60/40 rounded-lg appearance-none cursor-pointer accent-brand-30"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-white/60 mb-0.5">
                  <span>Background Opacity</span>
                  <span className="font-mono">{bgOpacity}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={bgOpacity}
                  onChange={(e) => setBgOpacity(Number(e.target.value))}
                  className="w-full h-1 bg-brand-60/40 rounded-lg appearance-none cursor-pointer accent-brand-30"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-white/60 mb-0.5">
                  <span>Inactive Opacity</span>
                  <span className="font-mono">{inactiveOpacity}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={inactiveOpacity}
                  onChange={(e) => setInactiveOpacity(Number(e.target.value))}
                  className="w-full h-1 bg-brand-60/40 rounded-lg appearance-none cursor-pointer accent-brand-30"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Widgets Grid */}
        <div 
          className="flex gap-8 flex-wrap items-start"
          style={{ '--inactive-opacity': inactiveOpacity / 100 }}
        >
          <WidgetBox title="Fuel" width="w-[160px]" height="h-[140px]" isLocked={isLocked} widgetOpacity={widgetOpacity} bgOpacity={bgOpacity}>
            <LiveFuel isLocked={isLocked} />
          </WidgetBox>

          <WidgetBox title="Pit Helper" width="w-[310px]" height="h-[150px]" isLocked={isLocked} widgetOpacity={widgetOpacity} bgOpacity={bgOpacity}>
            <PitHelper isLocked={isLocked} />
          </WidgetBox>

          <WidgetBox title="Weather" width="w-[420px]" height="h-[120px]" isLocked={isLocked} widgetOpacity={widgetOpacity} bgOpacity={bgOpacity}>
            <LiveWeather isLocked={isLocked} />
          </WidgetBox>

          <WidgetBox title="Live Standings" width="w-[900px]" height="h-[300px]" isLocked={isLocked} widgetOpacity={widgetOpacity} bgOpacity={bgOpacity}>
            <LiveStandings 
              isLocked={isLocked} 
              groupByClass={groupByClass}
              showClassName={showClassName}
              columns={{ pos: true, num: true, driver: true, carClass: true, carName: true, classPos: true, srating: true, irating: true, gap: true, bestLap: true, lastLap: true, trackPct: true, laps: true }} 
            />
          </WidgetBox>

          <WidgetBox title="Live Relative" width="w-[580px]" height="h-[300px]" isLocked={isLocked} widgetOpacity={widgetOpacity} bgOpacity={bgOpacity}>
            <LiveRelative isLocked={isLocked} showClassName={showClassName} />
          </WidgetBox>

          <WidgetBox 
            title="Radar" 
            width="w-[200px]" 
            height="h-[280px]" 
            isLocked={isLocked} 
            widgetOpacity={widgetOpacity} 
            bgOpacity={bgOpacity}
            onOpenSettings={handleToggleRadarDrawer}
            isSettingsActive={isRadarDrawerOpen}
            badge={radarMode === 'manual' ? 'MANUAL' : undefined}
          >
            {radarMode === 'manual' ? (
              <TelemetryProvider
                telemetry={radarCustomTelemetry}
                sessionDrivers={sessionDrivers}
                sessionData={sessionData}
                trackLength={radarCustomTrackLength}
              >
                <LiveRadar isLocked={isLocked} />
              </TelemetryProvider>
            ) : (
              <LiveRadar isLocked={isLocked} />
            )}
          </WidgetBox>

        </div>
        
        <div 
          className="mt-8 flex flex-col gap-8"
          style={{ '--inactive-opacity': inactiveOpacity / 100 }}
        >
           <WidgetBox title="Linear Track Map" width="w-full max-w-[1200px]" height="h-[70px]" isLocked={isLocked} widgetOpacity={widgetOpacity} bgOpacity={bgOpacity}>
            <LinearTrackMap isLocked={isLocked} />
          </WidgetBox>

          <WidgetBox title="Input Trace" width="w-full max-w-[1200px]" height="h-[135px]" isLocked={isLocked} widgetOpacity={widgetOpacity} bgOpacity={bgOpacity}>
            <LiveInputs isLocked={isLocked} />
          </WidgetBox>
        </div>

        <div 
          className="mt-8 flex gap-8 flex-wrap items-start"
          style={{ '--inactive-opacity': inactiveOpacity / 100 }}
        >
          <WidgetBox title="Digital Dash" width="w-[600px]" height="h-[250px]" isLocked={isLocked} widgetOpacity={widgetOpacity} bgOpacity={bgOpacity}>
            <DigitalDash isLocked={isLocked} />
          </WidgetBox>
        </div>

        {/* Radar Mock Settings Side Drawer */}
        <RadarMockDrawer
          isOpen={isRadarDrawerOpen}
          onClose={() => setIsRadarDrawerOpen(false)}
          mode={radarMode}
          onModeChange={setRadarMode}
          telemetry={radarCustomTelemetry}
          onUpdateTelemetry={setRadarCustomTelemetry}
          trackLength={radarCustomTrackLength}
          onUpdateTrackLength={setRadarCustomTrackLength}
          onResetDefault={() => {
            setRadarCustomTelemetry(defaultRadarCustomTelemetry);
            setRadarCustomTrackLength(7004);
          }}
        />

        {/* Fixed Bottom Player Bar */}
        <BottomPlayerBar 
          simulator={simulator}
          telemetry={telemetry}
          onReset={handleRestartSession}
        />

      </div>
    </TelemetryProvider>
  );
}

export default App;
