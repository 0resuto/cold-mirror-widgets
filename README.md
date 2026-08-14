<div align="center">
  <h1>Cold Mirror Widgets</h1>
  <p>A React widget library for iRacing telemetry and overlays.</p>

  <p>
    <img src="https://img.shields.io/github/license/0resuto/cold-mirror-widgets" alt="License" />
  </p>
  <p>
    <img src="https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white" alt="Vite" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  </p>
</div>

---

## Overview

Cold Mirror Widgets provides a set of UI components designed for iRacing telemetry data. 

## Features

- **Portability**: Independent from Electron and specific desktop window environments.
- **`TelemetryProvider` Context**: Wraps your application to supply telemetry from any data source (Shared Memory, WebSockets, or Mock data).
- **Update Loop**: Uses `useSyncExternalStore` for telemetry state updates with configurable throttling to manage rendering frequency.
- **Styling**: Uses TailwindCSS v4.

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
  const telemetryData = { /* Telemetry from WebSocket or SDK */ }; 

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

Run the development server to test widgets locally with mock data:

```bash
npm run dev
```
