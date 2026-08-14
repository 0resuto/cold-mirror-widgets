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
  Speed: 17.7778, // m/s, equals ~64 km/h
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
  CarLeftRight: 4,
  playerCarIdx: 1,
  grid: {
    1: { LapDistPct: 0.5, Position: 2, ClassPosition: 1, Lap: 10, IsFastestLap: true, BestLapTime: 83.9, LastLapTime: 83.9 }, // Player (Middle)
    2: { LapDistPct: 0.54, Position: 3, ClassPosition: 2, Lap: 10, F2Time: 12.5, BestLapTime: 84.2, LastLapTime: 84.5 }, // Right next to player ahead
    3: { LapDistPct: 0.46, Position: 5, ClassPosition: 4, Lap: 10, HasDamage: true, F2Time: -15.2, BestLapTime: 84.3, LastLapTime: 102.1 }, // Right next to player behind
    4: { LapDistPct: 0.1, Position: 6, ClassPosition: 5, Lap: 9, BestLapTime: 85.1, LastLapTime: 86.2 }, // Lapped car
    5: { LapDistPct: 0.85, Position: 1, ClassPosition: 1, Lap: 11, BestLapTime: 84.1, LastLapTime: 85.0 }, // Ahead by a lap
    6: { LapDistPct: 0.98, Position: 4, ClassPosition: 3, Lap: 10, OnPitRoad: true, BestLapTime: 84.5, LastLapTime: 95.2 } // Pitting
  }
};

const mockSessionDrivers = [
  { CarIdx: 1, UserName: "Max Verstappen", CarNumber: "1", IRating: 6200, SR: 4.5, LicLevel: 4, LicString: 'A 4.5', CarClassShortName: "GT3", CarScreenNameShort: "Porsche 911", ClassPosition: 1, Position: 2 },
  { CarIdx: 2, UserName: "Lando Norris", CarNumber: "4", IRating: 3800, SR: 3.2, LicLevel: 3, LicString: 'B 3.2', CarClassShortName: "GT3", CarScreenNameShort: "McLaren MP4", ClassPosition: 2, Position: 3 },
  { CarIdx: 3, UserName: "Charles Leclerc", CarNumber: "16", IRating: 1400, SR: 2.8, LicLevel: 1, LicString: 'D 2.8', CarClassShortName: "GT3", CarScreenNameShort: "Ferrari 296", ClassPosition: 4, Position: 5 },
  { CarIdx: 4, UserName: "Fernando Alonso", CarNumber: "14", IRating: 900, SR: 1.5, LicLevel: 0, LicString: 'R 1.5', CarClassShortName: "GT3", CarScreenNameShort: "Aston Martin", ClassPosition: 5, Position: 6 },
  { CarIdx: 5, UserName: "Lewis Hamilton", CarNumber: "44", IRating: 7100, SR: 4.9, LicLevel: 4, LicString: 'A 4.9', CarClassShortName: "LMP2", CarScreenNameShort: "Dallara P217", ClassPosition: 1, Position: 1 },
  { CarIdx: 6, UserName: "Oscar Piastri", CarNumber: "81", IRating: 2600, SR: 2.0, LicLevel: 2, LicString: 'C 2.0', CarClassShortName: "GT3", CarScreenNameShort: "McLaren MP4", ClassPosition: 3, Position: 4 },
];

const mockSessionData = {
  data: {
    WeekendInfo: {
      TrackPitSpeedLimit: "60.00 kph"
    }
  }
};

function App() {
  const [useMockData, setUseMockData] = useState(false);
  const telemetry = useMockData ? mockTelemetry : null;

  const WidgetBox = ({ children, title, width = "w-[300px]", height = "h-[200px]" }) => (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-bold text-brand-10 uppercase tracking-widest">{title}</span>
      <div className={`${width} ${height} resize rounded-lg overflow-hidden border border-brand-60/50 bg-brand-bg/80 backdrop-blur-md shadow-2xl relative flex items-center justify-center min-w-[100px] min-h-[50px]`}>
        {children}
      </div>
    </div>
  );

  return (
    <TelemetryProvider 
      telemetry={telemetry} 
      sessionDrivers={useMockData ? mockSessionDrivers : []}
      sessionData={useMockData ? mockSessionData : null}
      trackLength={useMockData ? 5000 : 0}
    >
      <div className="min-h-screen bg-[url('/bg.webp')] bg-cover bg-center bg-fixed p-10 font-sans text-white">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-black text-brand-10">Cold Mirror Widgets Playground</h1>
          
          <label className="fixed top-4 right-4 z-[9999] flex items-center cursor-pointer gap-3 bg-brand-bg p-3 rounded-xl border border-brand-60/50 shadow-2xl hover:bg-brand-60/20 transition-all">
            <span className="text-sm font-bold text-brand-10 uppercase tracking-wider">Mock Data</span>
            <div className="relative">
              <input 
                type="checkbox" 
                className="sr-only" 
                checked={useMockData}
                onChange={(e) => setUseMockData(e.target.checked)}
              />
              <div className={`block w-12 h-6 rounded-full transition-colors border ${useMockData ? 'bg-brand-30 border-brand-30' : 'bg-brand-bg border-brand-60'}`}></div>
              <div className={`absolute left-1 top-1 w-4 h-4 rounded-full transition-transform ${useMockData ? 'translate-x-6 bg-brand-10' : 'bg-brand-60 translate-x-0'}`}></div>
            </div>
          </label>
        </div>
        
        <div className="flex gap-8 flex-wrap items-start">
          
          <WidgetBox title="Fuel Calculator" width="w-[280px]" height="h-[150px]">
            <LiveFuel />
          </WidgetBox>

          <WidgetBox title="Pit Helper" width="w-[310px]" height="h-[150px]">
            <PitHelper />
          </WidgetBox>

          <WidgetBox title="Weather" width="w-[420px]" height="h-[120px]">
            <LiveWeather />
          </WidgetBox>

          <WidgetBox title="Live Standings" width="w-[900px]" height="h-[300px]">
            <LiveStandings columns={{ pos: true, num: true, driver: true, carName: true, carClass: true, classPos: true, srating: true, irating: true, gap: true, bestLap: true, lastLap: true, trackPct: true, laps: true }} />
          </WidgetBox>

          <WidgetBox title="Live Relative" width="w-[580px]" height="h-[300px]">
            <LiveRelative />
          </WidgetBox>

          <WidgetBox title="Radar" width="w-[200px]" height="h-[280px]">
            <LiveRadar />
          </WidgetBox>

        </div>
        
        <div className="mt-8 flex flex-col gap-8">
           <WidgetBox title="Linear Track Map" width="w-full max-w-[1200px]" height="h-[70px]">
            <LinearTrackMap />
          </WidgetBox>

          <WidgetBox title="Input Trace" width="w-full max-w-[1200px]" height="h-[135px]">
            <LiveInputs />
          </WidgetBox>
        </div>

        <div className="mt-8 flex gap-8 flex-wrap items-start">
          <WidgetBox title="Digital Dash" width="w-[600px]" height="h-[250px]">
            <DigitalDash />
          </WidgetBox>
        </div>

      </div>
    </TelemetryProvider>
  );
}

export default App;
