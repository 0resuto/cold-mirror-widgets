import React, { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { TelemetryProvider } from './context/TelemetryContext';

import { LiveFuel } from './widgets/Fuel/LiveFuel';
import { LiveInputs } from './widgets/Inputs/LiveInputs';
import { LiveWeather } from './widgets/Weather/LiveWeather';
import { DigitalDash } from './widgets/Dashboard/DigitalDash';
import { PitHelper } from './widgets/PitHelper/PitHelper';
import { LiveRadar } from './widgets/Radar/LiveRadar';
import { LiveStandings } from './widgets/Standings/LiveStandings';
import { LiveRelative } from './widgets/Relative/LiveRelative';
import { LinearTrackMap } from './widgets/TrackMap/LinearTrackMap';
import { RadarMockDrawer } from './playground/RadarMockDrawer';

// Comprehensive mock data so all widgets can render at least something
const mockTelemetry = {
  // Fuel
  FuelLevel: 45.2,
  FuelUsePerHour: 12.5,
  // Inputs & Dash
  Speed: 17.7778, // m/s, equals ~64 km/h
  RPM: 6500,
  Gear: 4,
  SteeringWheelAngle: 0.1,
  Brake: 0.2,
  Throttle: 0.8,
  Clutch: 0,
  ShiftGrindRPM: 8000,
  ShiftIndicatorPct: 0.7,
  // Timing
  SessionBestLapTime: 83.9,
  // Weather
  AirTemp: 22.5,
  TrackTemp: 28.3,
  WindDir: 1.5,
  WindVel: 2.1,
  Skies: 0,
  // Pit
  PitSvFlags: 0,
  PitSvFuel: 0,
  PitSvTireSetupLeft: 1,
  PitSvTireSetupRight: 1,
  // Radar / Grid
  CarLeftRight: 4,
  playerCarIdx: 1,
  grid: {
    1: { LapDistPct: 0.5, Position: 3, ClassPosition: 1, Lap: 10, TrackSurface: 4, IsFastestLap: true, BestLapTime: 83.9, LastLapTime: 83.9 }, // Player (GT3) - OnTrack
    2: { LapDistPct: 0.504, Position: 4, ClassPosition: 2, Lap: 10, TrackSurface: 4, F2Time: 1.2, BestLapTime: 84.2, LastLapTime: 84.5 }, // GT3 (~20m ahead) - OnTrack
    3: { LapDistPct: 0.496, Position: 6, ClassPosition: 3, Lap: 10, TrackSurface: 4, HasDamage: true, F2Time: -1.5, BestLapTime: 84.3, LastLapTime: 102.1 }, // GT3 (~20m behind) - OnTrack
    4: { LapDistPct: 0.1, Position: 8, ClassPosition: 2, Lap: 9, TrackSurface: 4, BestLapTime: 89.1, LastLapTime: 90.2 }, // GT4
    5: { LapDistPct: 0.85, Position: 1, ClassPosition: 1, Lap: 12, TrackSurface: 4, BestLapTime: 76.5, LastLapTime: 77.0 }, // GTP
    6: { LapDistPct: 0.70, Position: 2, ClassPosition: 1, Lap: 11, TrackSurface: 4, BestLapTime: 79.8, LastLapTime: 80.2 }, // LMP2
    7: { LapDistPct: 0.98, Position: 5, ClassPosition: 2, Lap: 11, TrackSurface: 2, OnPitRoad: true, BestLapTime: 80.1, LastLapTime: 95.2 }, // LMP2 (Pitting) - InPitStall
    8: { LapDistPct: 0.35, Position: 7, ClassPosition: 1, Lap: 9, TrackSurface: 4, BestLapTime: 88.5, LastLapTime: 89.0 } // GT4
  }
};

const mockSessionDrivers = [
  { CarIdx: 1, UserName: "Max Verstappen", CarNumber: "1", IRating: 6200, SR: 4.5, LicLevel: 4, LicString: 'A 4.5', CarClassShortName: "GT3", CarClassColor: 0x34c759, CarScreenNameShort: "Porsche 911 GT3", ClassPosition: 1, Position: 3 },
  { CarIdx: 2, UserName: "Yuki Tsunoda 角田 裕毅", CarNumber: "22", IRating: 3800, SR: 3.2, LicLevel: 3, LicString: 'B 3.2', CarClassShortName: "GT3", CarClassColor: 0x34c759, CarScreenNameShort: "Ferrari 296 GT3", ClassPosition: 2, Position: 4 },
  { CarIdx: 3, UserName: "Zhou Guanyu 周冠宇", CarNumber: "24", IRating: 1400, SR: 2.8, LicLevel: 1, LicString: 'D 2.8', CarClassShortName: "GT3", CarClassColor: 0x34c759, CarScreenNameShort: "BMW M4 GT3", ClassPosition: 3, Position: 6 },
  { CarIdx: 4, UserName: "Алексей Смирнов", CarNumber: "14", IRating: 1900, SR: 2.5, LicLevel: 2, LicString: 'C 2.5', CarClassShortName: "GT4", CarClassColor: 0xff9500, CarScreenNameShort: "Aston Martin GT4", ClassPosition: 2, Position: 8 },
  { CarIdx: 5, UserName: "Lewis Hamilton", CarNumber: "44", IRating: 7100, SR: 4.9, LicLevel: 4, LicString: 'A 4.9', CarClassShortName: "GTP", CarClassColor: 0xff3b30, CarScreenNameShort: "Cadillac V-Series.R", ClassPosition: 1, Position: 1 },
  { CarIdx: 6, UserName: "Fernando Alonso", CarNumber: "14", IRating: 6800, SR: 4.8, LicLevel: 4, LicString: 'A 4.8', CarClassShortName: "LMP2", CarClassColor: 0x007aff, CarScreenNameShort: "Dallara P217", ClassPosition: 1, Position: 2 },
  { CarIdx: 7, UserName: "Oscar Piastri", CarNumber: "81", IRating: 3600, SR: 3.0, LicLevel: 3, LicString: 'B 3.0', CarClassShortName: "LMP2", CarClassColor: 0x007aff, CarScreenNameShort: "Dallara P217", ClassPosition: 2, Position: 5 },
  { CarIdx: 8, UserName: "Lando Norris", CarNumber: "4", IRating: 4900, SR: 3.8, LicLevel: 3, LicString: 'B 3.8', CarClassShortName: "GT4", CarClassColor: 0xff9500, CarScreenNameShort: "McLaren Artura GT4", ClassPosition: 1, Position: 7 },
];

const mockSessionData = {
  data: {
    WeekendInfo: {
      TrackPitSpeedLimit: "60.00 kph"
    }
  }
};

const WidgetBox = ({ children, title, isLocked, widgetOpacity, bgOpacity, width = "w-[300px]", height = "h-[200px]", onOpenSettings, isSettingsActive, badge }) => (
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

// Dedicated default mock telemetry for Radar manual mode
const defaultRadarMockTelemetry = {
  CarLeftRight: 0,
  playerCarIdx: 1,
  grid: {
    1: { LapDistPct: 0.5, Position: 3, ClassPosition: 1, Lap: 10, TrackSurface: 4, IsFastestLap: true, BestLapTime: 83.9, LastLapTime: 83.9 },
    2: { LapDistPct: 0.5036, Position: 2, ClassPosition: 1, Lap: 10, TrackSurface: 4, side: 'left', F2Time: 1.2, BestLapTime: 84.2, LastLapTime: 84.5 }, // ~18m ahead
    3: { LapDistPct: 0.497, Position: 4, ClassPosition: 2, Lap: 10, TrackSurface: 4, side: 'right', HasDamage: true, F2Time: -1.5, BestLapTime: 84.3, LastLapTime: 102.1 }, // ~15m behind
  }
};

function App() {
  const [useMockData, setUseMockData] = useState(false);
  
  // Isolated Radar Mock State
  const [radarMode, setRadarMode] = useState('manual'); // 'auto' (Global Sim) | 'manual' (Custom Mock)
  const [radarTelemetry, setRadarTelemetry] = useState(defaultRadarMockTelemetry);
  const [radarTrackLength, setRadarTrackLength] = useState(5000);
  const [isRadarDrawerOpen, setIsRadarDrawerOpen] = useState(false);

  const [isLocked, setIsLocked] = useState(false);
  const [groupByClass, setGroupByClass] = useState(false);
  const [showClassName, setShowClassName] = useState(false);
  const [widgetOpacity, setWidgetOpacity] = useState(100);
  const [inactiveOpacity, setInactiveOpacity] = useState(30);
  const [bgOpacity, setBgOpacity] = useState(60);

  const globalTelemetry = useMockData ? mockTelemetry : null;

  const handleToggleRadarDrawer = () => {
    if (!useMockData && !isRadarDrawerOpen) {
      setUseMockData(true);
    }
    setIsRadarDrawerOpen((prev) => !prev);
  };

  return (
    <TelemetryProvider 
      telemetry={globalTelemetry} 
      sessionDrivers={useMockData ? mockSessionDrivers : []}
      sessionData={useMockData ? mockSessionData : null}
      trackLength={useMockData ? 5000 : 0}
    >
      <div className="min-h-screen bg-[url('/bg.webp')] bg-cover bg-center bg-fixed p-10 font-sans text-white">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-black text-brand-10">Cold Mirror Widgets Playground</h1>
          
          <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-4 bg-brand-bg/95 backdrop-blur-md p-4 rounded-xl border border-brand-60/50 shadow-2xl min-w-[200px]">
            {/* Mock Data */}
            <label className="flex items-center justify-between cursor-pointer gap-4 hover:opacity-80 transition-opacity">
              <span className="text-sm font-bold text-brand-10 uppercase tracking-wider">Mock Data</span>
              <div className="relative">
                <input type="checkbox" className="sr-only" checked={useMockData} onChange={(e) => setUseMockData(e.target.checked)} />
                <div className={`block w-10 h-5 rounded-full transition-colors border ${useMockData ? 'bg-brand-30 border-brand-30' : 'bg-brand-bg border-brand-60'}`}></div>
                <div className={`absolute left-1 top-1 w-3 h-3 rounded-full transition-transform ${useMockData ? 'translate-x-5 bg-brand-10' : 'bg-brand-60 translate-x-0'}`}></div>
              </div>
            </label>

            {/* Lock Widgets */}
            <label className="flex items-center justify-between cursor-pointer gap-4 hover:opacity-80 transition-opacity">
              <span className="text-sm font-bold text-brand-10 uppercase tracking-wider" title="Эмуляция блокировки виджетов (isLocked)">Locked</span>
              <div className="relative">
                <input type="checkbox" className="sr-only" checked={isLocked} onChange={(e) => setIsLocked(e.target.checked)} />
                <div className={`block w-10 h-5 rounded-full transition-colors border ${isLocked ? 'bg-brand-30 border-brand-30' : 'bg-brand-bg border-brand-60'}`}></div>
                <div className={`absolute left-1 top-1 w-3 h-3 rounded-full transition-transform ${isLocked ? 'translate-x-5 bg-brand-10' : 'bg-brand-60 translate-x-0'}`}></div>
              </div>
            </label>

            {/* Group by Class */}
            <label className="flex items-center justify-between cursor-pointer gap-4 hover:opacity-80 transition-opacity">
              <span className="text-sm font-bold text-brand-10 uppercase tracking-wider">Group Class</span>
              <div className="relative">
                <input type="checkbox" className="sr-only" checked={groupByClass} onChange={(e) => setGroupByClass(e.target.checked)} />
                <div className={`block w-10 h-5 rounded-full transition-colors border ${groupByClass ? 'bg-brand-30 border-brand-30' : 'bg-brand-bg border-brand-60'}`}></div>
                <div className={`absolute left-1 top-1 w-3 h-3 rounded-full transition-transform ${groupByClass ? 'translate-x-5 bg-brand-10' : 'bg-brand-60 translate-x-0'}`}></div>
              </div>
            </label>

            {/* Show Class Name */}
            <label className="flex items-center justify-between cursor-pointer gap-4 hover:opacity-80 transition-opacity">
              <span className="text-sm font-bold text-brand-10 uppercase tracking-wider">Class Name</span>
              <div className="relative">
                <input type="checkbox" className="sr-only" checked={showClassName} onChange={(e) => setShowClassName(e.target.checked)} />
                <div className={`block w-10 h-5 rounded-full transition-colors border ${showClassName ? 'bg-brand-30 border-brand-30' : 'bg-brand-bg border-brand-60'}`}></div>
                <div className={`absolute left-1 top-1 w-3 h-3 rounded-full transition-transform ${showClassName ? 'translate-x-5 bg-brand-10' : 'bg-brand-60 translate-x-0'}`}></div>
              </div>
            </label>

            <div className="w-full h-[1px] bg-brand-60/30"></div>

            {/* Widget Opacity */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="text-xs font-bold text-brand-10/80 uppercase tracking-wider">Widget Opacity</span>
                <span className="text-xs font-mono text-brand-30">{widgetOpacity}%</span>
              </div>
              <input type="range" min="10" max="100" value={widgetOpacity} onChange={e => setWidgetOpacity(e.target.value)} className="w-full h-1 bg-brand-60/40 rounded-lg appearance-none cursor-pointer accent-brand-30" />
            </div>

            {/* Inactive Opacity */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="text-xs font-bold text-brand-10/80 uppercase tracking-wider">Inactive Opacity</span>
                <span className="text-xs font-mono text-brand-30">{inactiveOpacity}%</span>
              </div>
              <input type="range" min="0" max="100" value={inactiveOpacity} onChange={e => setInactiveOpacity(e.target.value)} className="w-full h-1 bg-brand-60/40 rounded-lg appearance-none cursor-pointer accent-brand-30" />
            </div>

            {/* BG Opacity */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="text-xs font-bold text-brand-10/80 uppercase tracking-wider">BG Opacity</span>
                <span className="text-xs font-mono text-brand-30">{bgOpacity}%</span>
              </div>
              <input type="range" min="0" max="100" value={bgOpacity} onChange={e => setBgOpacity(e.target.value)} className="w-full h-1 bg-brand-60/40 rounded-lg appearance-none cursor-pointer accent-brand-30" />
            </div>
          </div>
        </div>
        
        <div 
          className="flex gap-8 flex-wrap items-start"
          style={{ '--inactive-opacity': inactiveOpacity / 100 }}
        >
          
          <WidgetBox title="Fuel Calculator" width="w-[280px]" height="h-[150px]" isLocked={isLocked} widgetOpacity={widgetOpacity} bgOpacity={bgOpacity}>
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
                telemetry={useMockData ? radarTelemetry : null}
                sessionDrivers={useMockData ? mockSessionDrivers : []}
                sessionData={useMockData ? mockSessionData : null}
                trackLength={useMockData ? radarTrackLength : 0}
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
          telemetry={radarTelemetry}
          onUpdateTelemetry={setRadarTelemetry}
          trackLength={radarTrackLength}
          onUpdateTrackLength={setRadarTrackLength}
          onResetDefault={() => {
            setRadarTelemetry(defaultRadarMockTelemetry);
            setRadarTrackLength(5000);
          }}
        />

      </div>
    </TelemetryProvider>
  );
}

export default App;
