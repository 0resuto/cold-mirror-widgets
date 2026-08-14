# Cold Mirror Widgets

Standalone, high-performance React widget library for iRacing telemetry and overlays.

## Features

- **Decoupled Architecture**: Fully decoupled from Electron or desktop window state.
- **`TelemetryProvider` Context**: Wrap your app once and feed telemetry from any data source (Shared Memory, WebSockets, Mock data).
- **High Performance**: Optimized update loop with `useSyncExternalStore` and configurable throttling.
- **TailwindCSS**: Styled with modern Tailwind v4.

## Installation

```bash
npm install file:../cold-mirror-widgets
```

## Quick Start

```jsx
import React from 'react';
import { TelemetryProvider, LiveFuel, DigitalDash, LiveRelative, LiveStandings } from 'cold-mirror-widgets';
import 'cold-mirror-widgets/style.css';

function App() {
  const telemetryData = { ... }; // From WebSocket or SDK

  return (
    <TelemetryProvider telemetry={telemetryData} sessionDrivers={[]} trackLength={4000}>
      <div className="grid grid-cols-2 gap-4">
        <LiveFuel maxFuel={120} />
        <DigitalDash units="kph" />
        <LiveRelative />
        <LiveStandings />
      </div>
    </TelemetryProvider>
  );
}
```

## Widgets & Configurable Props

- **`<DigitalDash />`**: `units` ('kph' | 'mph'), `shiftPctThreshold`, `totalLeds`, `throttleMs`
- **`<LiveFuel />`**: `maxFuel`, `lowFuelThreshold`, `criticalFuelThreshold`, `throttleMs`
- **`<LiveInputs />`**: `throttleMs`
- **`<LiveRadar />`**: `rangeMeters`, `throttleMs`
- **`<LiveRelative />`**: `columns`, `isLocked`, `throttleMs`
- **`<LiveStandings />`**: `columns`, `isLocked`, `throttleMs`
- **`<PitHelper />`**: `units`, `throttleMs`
- **`<LinearTrackMap />`**: `throttleMs`
- **`<LiveWeather />`**: `tempUnit` ('C' | 'F'), `speedUnit` ('ms' | 'kmh' | 'mph'), `throttleMs`

## Local Development Playground

Run the interactive dev playground to test widgets locally:

```bash
npm run dev
```

