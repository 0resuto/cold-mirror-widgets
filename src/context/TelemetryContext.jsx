import React, { createContext, useContext, useState, useRef, useSyncExternalStore } from 'react';

const TelemetryContext = createContext(null);

export function TelemetryProvider({ children, telemetry, sessionDrivers = [], trackLength = 0 }) {
  const [store] = useState(() => {
    let state = {
      latestTelemetry: telemetry,
      sessionDrivers,
      trackLength,
    };
    
    const listeners = new Set();
    
    return {
      getState: () => state,
      setState: (newState) => {
        state = { ...state, ...newState };
        Array.from(listeners).forEach(listener => listener(state));
      },
      subscribe: (listener) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      }
    };
  });

  // Render-phase sync to prevent one-frame layout tearing
  const prevProps = useRef({ telemetry, sessionDrivers, trackLength });
  if (
    prevProps.current.telemetry !== telemetry ||
    prevProps.current.sessionDrivers !== sessionDrivers ||
    prevProps.current.trackLength !== trackLength
  ) {
    prevProps.current = { telemetry, sessionDrivers, trackLength };
    store.setState({ latestTelemetry: telemetry, sessionDrivers, trackLength });
  }

  return (
    <TelemetryContext.Provider value={store}>
      {children}
    </TelemetryContext.Provider>
  );
}

export function useTelemetryStore(selector) {
  const store = useContext(TelemetryContext);
  if (!store) {
    throw new Error('useTelemetryStore must be used within a TelemetryProvider');
  }
  
  if (selector) {
    return useSyncExternalStore(store.subscribe, () => selector(store.getState()));
  }
  
  return store;
}
