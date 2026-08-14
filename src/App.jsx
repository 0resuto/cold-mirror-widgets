import React, { useState } from 'react';
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

// Comprehensive mock data so all widgets can render at least something
const mockTelemetry = {
  // Fuel
  FuelLevel: 45.2,
  FuelUsePerHour: 12.5,
  // Inputs & Dash
  Speed: 152.4,
  RPM: 6500,
  Gear: 4,
  SteeringWheelAngle: 0.1,
  Brake: 0.2,
  Throttle: 0.8,
  Clutch: 0,
  ShiftGrindRPM: 8000,
  ShiftIndicatorPct: 0.7,
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
  CarLeftRight: 0,
  playerCarIdx: 1,
  grid: {
    1: { LapDistPct: 0.5, Position: 1, Lap: 10, IsFastestLap: true }, // Player (Middle)
    2: { LapDistPct: 0.75, Position: 2, Lap: 10, F2Time: 12.5 }, // Ahead
    3: { LapDistPct: 0.25, Position: 3, Lap: 10, HasDamage: true, F2Time: -15.2 }, // Behind with damage
    4: { LapDistPct: 0.1, Position: 20, Lap: 9 }, // Lapped car
    5: { LapDistPct: 0.85, Position: 1, Lap: 11 }, // Ahead by a lap
    6: { LapDistPct: 0.98, Position: 15, Lap: 10, OnPitRoad: true } // Pitting
  }
};

const mockSessionDrivers = [
  { CarIdx: 1, UserName: "Max Verstappen", CarNumber: "1", IRating: 5000, SR: 4.5, LicLevel: 4, LicString: 'A 4.5', CarClassShortName: "GT3", ClassPosition: 1, Position: 1 },
  { CarIdx: 2, UserName: "Lando Norris", CarNumber: "4", IRating: 4800, SR: 4.2, LicLevel: 4, LicString: 'A 4.2', CarClassShortName: "GT3", ClassPosition: 2, Position: 2 },
  { CarIdx: 3, UserName: "Charles Leclerc", CarNumber: "16", IRating: 4900, SR: 4.8, LicLevel: 4, LicString: 'A 4.8', CarClassShortName: "GT3", ClassPosition: 3, Position: 3 },
  { CarIdx: 4, UserName: "Fernando Alonso", CarNumber: "14", IRating: 4500, SR: 3.5, LicLevel: 3, LicString: 'B 3.5', CarClassShortName: "GT3", ClassPosition: 20, Position: 20 },
  { CarIdx: 5, UserName: "Lewis Hamilton", CarNumber: "44", IRating: 5100, SR: 4.9, LicLevel: 4, LicString: 'A 4.9', CarClassShortName: "LMP2", ClassPosition: 1, Position: 1 },
  { CarIdx: 6, UserName: "Oscar Piastri", CarNumber: "81", IRating: 4600, SR: 4.0, LicLevel: 4, LicString: 'A 4.0', CarClassShortName: "GT3", ClassPosition: 15, Position: 15 },
];

function App() {
  const [useMockData, setUseMockData] = useState(false);
  const telemetry = useMockData ? mockTelemetry : null;

  const WidgetBox = ({ children, title, width = "w-[300px]", height = "h-[200px]" }) => (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{title}</span>
      <div className={`${width} ${height} resize rounded-lg overflow-hidden border border-brand-60/50 bg-brand-bg/80 backdrop-blur-md shadow-2xl relative flex items-center justify-center min-w-[200px] min-h-[100px]`}>
        {children}
      </div>
    </div>
  );

  return (
    <TelemetryProvider 
      telemetry={telemetry} 
      sessionDrivers={useMockData ? mockSessionDrivers : []} 
      trackLength={useMockData ? 5000 : 0}
    >
      <div className="min-h-screen bg-[url('/bg.webp')] bg-cover bg-center bg-fixed p-10 font-sans text-white">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-black text-gray-400">Cold Mirror Widgets Playground</h1>
          
          <label className="fixed top-4 right-4 z-[9999] flex items-center cursor-pointer gap-3 bg-[#111] p-3 rounded-xl border border-gray-700 shadow-2xl hover:bg-[#1a1a1a] transition-all">
            <span className="text-sm font-bold text-white uppercase tracking-wider">Mock Data</span>
            <div className="relative">
              <input 
                type="checkbox" 
                className="sr-only" 
                checked={useMockData}
                onChange={(e) => setUseMockData(e.target.checked)}
              />
              <div className={`block w-12 h-6 rounded-full transition-colors ${useMockData ? 'bg-orange-500' : 'bg-gray-800 border border-gray-600'}`}></div>
              <div className={`absolute left-1 top-1 w-4 h-4 rounded-full transition-transform ${useMockData ? 'translate-x-6 bg-white' : 'bg-gray-400 translate-x-0'}`}></div>
            </div>
          </label>
        </div>
        
        <div className="flex gap-8 flex-wrap items-start">
          
          <WidgetBox title="Fuel Calculator" width="w-[280px]" height="h-[180px]">
            <LiveFuel />
          </WidgetBox>

          <WidgetBox title="Input Trace" width="w-[320px]" height="h-[180px]">
            <LiveInputs />
          </WidgetBox>

          <WidgetBox title="Weather" width="w-[320px]" height="h-[180px]">
            <LiveWeather />
          </WidgetBox>

          <WidgetBox title="Pit Helper" width="w-[280px]" height="h-[180px]">
            <PitHelper />
          </WidgetBox>

          <WidgetBox title="Radar" width="w-[280px]" height="h-[280px]">
            <LiveRadar />
          </WidgetBox>

          <WidgetBox title="Digital Dash" width="w-[600px]" height="h-[250px]">
            <DigitalDash />
          </WidgetBox>

          <WidgetBox title="Live Relative" width="w-[400px]" height="h-[300px]">
            <LiveRelative />
          </WidgetBox>

          <WidgetBox title="Live Standings" width="w-[600px]" height="h-[350px]">
            <LiveStandings />
          </WidgetBox>

        </div>
        
        <div className="mt-8">
           <WidgetBox title="Linear Track Map" width="w-full max-w-[1200px]" height="h-[120px]">
            <LinearTrackMap />
          </WidgetBox>
        </div>

      </div>
    </TelemetryProvider>
  );
}

export default App;
