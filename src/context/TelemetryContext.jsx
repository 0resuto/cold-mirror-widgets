import React, { createContext, useContext, useState, useRef, useEffect, useSyncExternalStore } from 'react';

const TelemetryContext = createContext(null);

export function TelemetryProvider({ children, telemetry, sessionDrivers = [], sessionData = null, trackLength = 0 }) {
  const [store] = useState(() => {
    let state = {
      latestTelemetry: telemetry,
      sessionDrivers,
      sessionData,
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

  useEffect(() => {
    store.setState({ latestTelemetry: telemetry, sessionDrivers, sessionData, trackLength });
  }, [telemetry, sessionDrivers, sessionData, trackLength, store]);

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
