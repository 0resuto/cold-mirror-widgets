import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, RotateCcw, SlidersHorizontal, Sparkles, ChevronRight, Globe, Wrench } from 'lucide-react';

export const TRACK_SURFACE_VALUES = {
  NOT_IN_WORLD: -1,
  UNDEFINED: 0,
  OFF_TRACK: 1,
  IN_PIT_STALL: 2,
  APPROACHING_PITS: 3,
  ON_TRACK: 4,
};

function isCarRadarVisible(playerSurface, carSurface) {
  if (playerSurface <= 0 || carSurface <= 0) return false;
  if (playerSurface === TRACK_SURFACE_VALUES.APPROACHING_PITS || carSurface === TRACK_SURFACE_VALUES.APPROACHING_PITS) return true;
  const isPlayerInPit = playerSurface === TRACK_SURFACE_VALUES.IN_PIT_STALL;
  const isCarInPit = carSurface === TRACK_SURFACE_VALUES.IN_PIT_STALL;
  if (isPlayerInPit || isCarInPit) return isPlayerInPit && isCarInPit;
  const isPlayerOnTrack = playerSurface === TRACK_SURFACE_VALUES.OFF_TRACK || playerSurface === TRACK_SURFACE_VALUES.ON_TRACK;
  const isCarOnTrack = carSurface === TRACK_SURFACE_VALUES.OFF_TRACK || carSurface === TRACK_SURFACE_VALUES.ON_TRACK;
  return isPlayerOnTrack && isCarOnTrack;
}

/**
 * A resilient number input with local text draft state.
 * Allows backspacing, empty states, and typing without premature validation or cursor jumps.
 */
function NumericDraftInput({
  value,
  onChange,
  min,
  max,
  className = '',
  formatter = (v) => String(v ?? ''),
  parser = (s) => parseFloat(s),
  ...props
}) {
  const [draft, setDraft] = useState(() => formatter(value));
  const isFocusedRef = useRef(false);

  // Sync draft from outside only when not actively typing
  useEffect(() => {
    if (!isFocusedRef.current) {
      setDraft(formatter(value));
    }
  }, [value, formatter]);

  const handleChange = (e) => {
    const raw = e.target.value;
    setDraft(raw);

    if (raw.trim() === '' || raw === '-' || raw === '+') {
      return; // allow user to clear the field or start typing a sign
    }

    const parsed = parser(raw);
    if (!isNaN(parsed)) {
      if (min !== undefined && parsed < min) return;
      if (max !== undefined && parsed > max) return;
      onChange(parsed);
    }
  };

  const handleFocus = () => {
    isFocusedRef.current = true;
  };

  const handleBlur = () => {
    isFocusedRef.current = false;
    const parsed = parser(draft);
    if (isNaN(parsed) || (min !== undefined && parsed < min) || (max !== undefined && parsed > max)) {
      setDraft(formatter(value));
    } else {
      setDraft(formatter(parsed));
      onChange(parsed);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={draft}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={className}
      {...props}
    />
  );
}

export function RadarMockDrawer({
  isOpen,
  onClose,
  mode = 'auto',
  onModeChange,
  telemetry,
  onUpdateTelemetry,
  trackLength,
  onUpdateTrackLength,
  onResetDefault
}) {
  const [isAutoSpotter, setIsAutoSpotter] = useState(true);
  const [currentScenario, setCurrentScenario] = useState('custom');

  const playerIdx = telemetry?.playerCarIdx ?? 1;
  const grid = telemetry?.grid || {};
  const player = grid[playerIdx] || { LapDistPct: 0.5, Position: 1, TrackSurface: 4 };
  const carLeftRight = telemetry?.CarLeftRight ?? 0;
  const currentTrackLength = trackLength || 5000;

  // Calculates spotter CarLeftRight automatically based on cars within < 5m side-by-side
  const computeAutoSpotter = (gridObj, playerObj, trkLen) => {
    const pSurface = playerObj?.TrackSurface ?? 4;
    if (pSurface <= 0) return 0;

    let hasLeft = false;
    let hasRight = false;

    Object.entries(gridObj).forEach(([id, car]) => {
      if (Number(id) === playerIdx) return;
      const cSurface = car.TrackSurface ?? 4;
      if (!isCarRadarVisible(pSurface, cSurface)) return;

      let delta = (car.LapDistPct ?? 0) - (playerObj.LapDistPct ?? 0);
      if (delta > 0.5) delta -= 1;
      if (delta < -0.5) delta += 1;
      const distanceMeters = Math.abs(delta * trkLen);

      if (distanceMeters < 5) {
        const side = car.side || (Number(id) % 2 === 0 ? 'left' : 'right');
        if (side === 'left') hasLeft = true;
        if (side === 'right') hasRight = true;
        if (side === 'both') { hasLeft = true; hasRight = true; }
      }
    });

    if (hasLeft && hasRight) return 4;
    if (hasLeft) return 2;
    if (hasRight) return 3;
    return 0;
  };

  const syncTelemetry = (newGrid, newPlayer = player, trkLen = currentTrackLength) => {
    const newCarLeftRight = isAutoSpotter 
      ? computeAutoSpotter(newGrid, newPlayer, trkLen)
      : carLeftRight;

    onUpdateTelemetry({
      ...telemetry,
      CarLeftRight: newCarLeftRight,
      grid: newGrid
    });
  };

  const updatePlayer = (patch) => {
    setCurrentScenario('custom');
    const updatedPlayer = { ...player, ...patch };
    const updatedGrid = {
      ...grid,
      [playerIdx]: updatedPlayer
    };
    syncTelemetry(updatedGrid, updatedPlayer);
  };

  const updateCar = (idx, patch) => {
    setCurrentScenario('custom');
    const targetCar = grid[idx];
    if (!targetCar) return;

    const updatedGrid = {
      ...grid,
      [idx]: {
        ...targetCar,
        ...patch
      }
    };
    syncTelemetry(updatedGrid);
  };

  const updateCarDistance = (idx, distanceMeters) => {
    setCurrentScenario('custom');
    const targetCar = grid[idx];
    if (!targetCar) return;

    let targetPct = player.LapDistPct + (distanceMeters / currentTrackLength);
    if (targetPct > 1) targetPct -= 1;
    if (targetPct < 0) targetPct += 1;

    updateCar(idx, { LapDistPct: parseFloat(targetPct.toFixed(5)) });
  };

  const handleTrackLengthChange = (newLength) => {
    setCurrentScenario('custom');
    if (!newLength || newLength <= 0) return;
    
    // Preserve relative distance in meters for all cars when track length changes
    const updatedGrid = { ...grid };
    Object.keys(updatedGrid).forEach(idx => {
      if (Number(idx) === playerIdx) return;
      const car = updatedGrid[idx];
      let delta = (car.LapDistPct ?? 0) - (player.LapDistPct ?? 0);
      if (delta > 0.5) delta -= 1;
      if (delta < -0.5) delta += 1;
      const distanceMeters = delta * currentTrackLength;

      let newPct = (player.LapDistPct ?? 0.5) + (distanceMeters / newLength);
      if (newPct > 1) newPct -= 1;
      if (newPct < 0) newPct += 1;
      updatedGrid[idx] = { ...car, LapDistPct: parseFloat(newPct.toFixed(5)) };
    });

    syncTelemetry(updatedGrid, player, newLength);
    onUpdateTrackLength && onUpdateTrackLength(newLength);
  };

  const removeCar = (idx) => {
    setCurrentScenario('custom');
    const updatedGrid = { ...grid };
    delete updatedGrid[idx];
    syncTelemetry(updatedGrid);
  };

  const addCar = () => {
    setCurrentScenario('custom');
    const existingKeys = Object.keys(grid).map(Number);
    let newIdx = 2;
    while (existingKeys.includes(newIdx)) {
      newIdx++;
    }
    const defaultDist = 15; // 15m ahead
    let targetPct = player.LapDistPct + (defaultDist / currentTrackLength);
    if (targetPct > 1) targetPct -= 1;

    const updatedGrid = {
      ...grid,
      [newIdx]: {
        LapDistPct: parseFloat(targetPct.toFixed(4)),
        Position: Object.keys(grid).length + 1,
        TrackSurface: 4,
        side: newIdx % 2 === 0 ? 'left' : 'right',
        BestLapTime: 85.0,
        LastLapTime: 85.5
      }
    };
    syncTelemetry(updatedGrid);
  };

  // Quick Scenario Presets
  const applyPreset = (presetKey) => {
    if (mode !== 'manual') {
      onModeChange && onModeChange('manual');
    }
    setCurrentScenario(presetKey);
    setIsAutoSpotter(true);
    let newGrid = {};

    switch (presetKey) {
      case 'on_track':
        newGrid = {
          1: { LapDistPct: 0.5, Position: 3, TrackSurface: 4 },
          2: { LapDistPct: 0.5 + (18 / currentTrackLength), Position: 2, TrackSurface: 4, side: 'left' },
          3: { LapDistPct: 0.5 - (15 / currentTrackLength), Position: 4, TrackSurface: 4, side: 'right' },
          4: { LapDistPct: 0.5 + (10 / currentTrackLength), Position: 1, TrackSurface: 2, OnPitRoad: true, side: 'right' },
        };
        break;

      case 'pit_lane':
        newGrid = {
          1: { LapDistPct: 0.5, Position: 3, TrackSurface: 2, OnPitRoad: true },
          2: { LapDistPct: 0.5 + (12 / currentTrackLength), Position: 4, TrackSurface: 2, OnPitRoad: true, side: 'left' },
          3: { LapDistPct: 0.5 - (10 / currentTrackLength), Position: 5, TrackSurface: 4, side: 'right' },
          4: { LapDistPct: 0.5 + (20 / currentTrackLength), Position: 2, TrackSurface: 3, side: 'right' },
        };
        break;

      case 'approaching_pits':
        newGrid = {
          1: { LapDistPct: 0.5, Position: 3, TrackSurface: 3 },
          2: { LapDistPct: 0.5 + (15 / currentTrackLength), Position: 2, TrackSurface: 4, side: 'left' },
          3: { LapDistPct: 0.5 - (12 / currentTrackLength), Position: 4, TrackSurface: 2, OnPitRoad: true, side: 'right' },
        };
        break;

      case 'blind_spot':
        newGrid = {
          1: { LapDistPct: 0.5, Position: 3, TrackSurface: 4 },
          2: { LapDistPct: 0.5 + (1.5 / currentTrackLength), Position: 2, TrackSurface: 4, side: 'left' },
          3: { LapDistPct: 0.5 - (2 / currentTrackLength), Position: 4, TrackSurface: 4, side: 'right' },
        };
        break;

      case 'garage_not_in_world':
        newGrid = {
          1: { LapDistPct: 0.5, Position: 3, TrackSurface: -1 },
          2: { LapDistPct: 0.504, Position: 2, TrackSurface: 4, side: 'left' },
        };
        break;

      default:
        return;
    }

    const calculatedCLR = computeAutoSpotter(newGrid, newGrid[playerIdx], currentTrackLength);
    onUpdateTelemetry({
      ...telemetry,
      CarLeftRight: calculatedCLR,
      grid: newGrid
    });
  };

  const otherCarEntries = Object.entries(grid).filter(([id]) => Number(id) !== playerIdx);

  return (
    <>
      {/* Sliding Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-[440px] max-w-[95vw] z-[10001] bg-brand-bg/95 backdrop-blur-2xl border-l border-brand-60/50 shadow-2xl flex flex-col text-white font-sans transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-60/30 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-30/20 text-brand-30">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wide uppercase text-brand-10">Radar Mock Settings</h2>
              <p className="text-[11px] text-white/50">Dedicated controls for Radar widget</p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Close sidebar"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Content Scroll */}
        <div className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar p-5 space-y-4">
          
          {/* Main Mode Switcher: Auto / Manual */}
          <div className="flex items-center justify-start">
            <div className="inline-flex bg-black/40 p-1 rounded-xl border border-white/10 gap-1">
              <button
                onClick={() => onModeChange && onModeChange('auto')}
                className={`flex items-center gap-1.5 py-1 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mode === 'auto'
                    ? 'bg-brand-30 text-white shadow-md'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Auto</span>
              </button>

              <button
                onClick={() => onModeChange && onModeChange('manual')}
                className={`flex items-center gap-1.5 py-1 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mode === 'manual'
                    ? 'bg-brand-30 text-white shadow-md'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Manual</span>
              </button>
            </div>
          </div>

          {/* Manual controls container - dimmed when in auto mode */}
          <div className={`space-y-4 transition-opacity duration-200 ${mode === 'auto' ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
            
            {/* Test Scenario Dropdown */}
            <div className="space-y-2 bg-white/[0.02] border border-brand-60/20 rounded-xl p-3.5">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-30" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-10/80">Test Scenario</span>
              </div>
              <select
                value={currentScenario}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'custom') {
                    setCurrentScenario('custom');
                  } else {
                    applyPreset(val);
                  }
                }}
                className="w-full bg-brand-bg border border-brand-60/40 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:border-brand-30 text-white cursor-pointer"
              >
                <option value="custom">🛠️ Custom</option>
                <option value="on_track">🏎️ On Track (Racing Line)</option>
                <option value="pit_lane">⛽ In Pit Lane</option>
                <option value="approaching_pits">🔀 Pit Transition</option>
                <option value="blind_spot">⚠️ Blind Spot (Overlap)</option>
                <option value="garage_not_in_world">🚫 In Garage (Not In World)</option>
              </select>
            </div>

            {/* Settings */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-10/80 block">Settings</span>
              
              <div className="space-y-3 bg-white/[0.02] border border-brand-60/20 rounded-xl p-3.5">
                {/* Player TrackSurface */}
                <div>
                  <label className="block text-[11px] font-semibold text-white/70 mb-1">Player Track Surface</label>
                  <select 
                    value={player.TrackSurface ?? 4}
                    onChange={(e) => updatePlayer({ TrackSurface: Number(e.target.value) })}
                    className="w-full bg-brand-bg border border-brand-60/40 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:border-brand-30 text-white cursor-pointer"
                  >
                    <option value={4}>4: OnTrack (Racing line)</option>
                    <option value={3}>3: AproachingPits (Transition)</option>
                    <option value={2}>2: InPitStall (Pit Lane)</option>
                    <option value={1}>1: OffTrack (Grass/Runoff)</option>
                    <option value={0}>0: Undefined</option>
                    <option value={-1}>-1: NotInWorld (In Garage)</option>
                  </select>
                </div>

                {/* Spotter CarLeftRight */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-semibold text-white/70">Spotter Blindspot (CarLeftRight)</label>
                    <button 
                      onClick={() => {
                        const next = !isAutoSpotter;
                        setIsAutoSpotter(next);
                        if (next) {
                          const clr = computeAutoSpotter(grid, player, currentTrackLength);
                          onUpdateTelemetry({ ...telemetry, CarLeftRight: clr });
                        }
                      }}
                      className={`text-[10px] px-2 py-0.5 rounded font-bold transition-colors cursor-pointer ${
                        isAutoSpotter 
                          ? 'bg-brand-30/20 text-brand-30 border border-brand-30/40' 
                          : 'bg-white/10 text-white/50 border border-white/10'
                      }`}
                    >
                      {isAutoSpotter ? 'Auto Sync: ON' : 'Manual Override'}
                    </button>
                  </div>
                  
                  <select 
                    value={carLeftRight}
                    disabled={isAutoSpotter}
                    onChange={(e) => onUpdateTelemetry({ ...telemetry, CarLeftRight: Number(e.target.value) })}
                    className={`w-full bg-brand-bg border border-brand-60/40 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:border-brand-30 text-white ${
                      isAutoSpotter ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  >
                    <option value={0}>0: Clear</option>
                    <option value={2}>2: Car Left (Blindspot)</option>
                    <option value={3}>3: Car Right (Blindspot)</option>
                    <option value={4}>4: Cars on Both Sides</option>
                    <option value={5}>5: 2 Cars Left</option>
                    <option value={6}>6: 2 Cars Right</option>
                  </select>
                  {isAutoSpotter && (
                    <p className="text-[10px] text-white/40 mt-1">
                      Auto-updates based on cars within ±5m. Clears automatically when cars move away.
                    </p>
                  )}
                </div>

                {/* Lap Progress */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-semibold text-white/70">Player Lap Progress</label>
                    <div className="flex items-center gap-1">
                      <NumericDraftInput
                        value={((player.LapDistPct ?? 0.5) * 100).toFixed(1)}
                        onChange={(val) => updatePlayer({ LapDistPct: Math.max(0, Math.min(100, val)) / 100 })}
                        min={0}
                        max={100}
                        className="w-12 bg-white/10 border border-brand-60/40 rounded px-1.5 py-0.5 text-right font-mono text-[11px] text-brand-30 focus:outline-none focus:border-brand-30"
                      />
                      <span className="text-[11px] text-white/50">%</span>
                    </div>
                  </div>
                  <input 
                    type="range"
                    min="0"
                    max="1"
                    step="0.005"
                    value={player.LapDistPct ?? 0.5}
                    onChange={(e) => updatePlayer({ LapDistPct: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-brand-60/40 rounded-lg appearance-none cursor-pointer accent-brand-30"
                  />
                </div>

                {/* Track Length */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-semibold text-white/70">Track Length (m)</label>
                    <span className="text-[10px] text-white/40">500m - 25,000m</span>
                  </div>
                  <div className="relative">
                    <NumericDraftInput 
                      value={currentTrackLength}
                      onChange={(val) => handleTrackLengthChange(val)}
                      min={100}
                      max={50000}
                      className="w-full bg-brand-bg border border-brand-60/40 rounded-lg px-2.5 py-1.5 text-xs font-mono font-medium focus:outline-none focus:border-brand-30 text-white"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-white/40 pointer-events-none">m</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Surrounding Cars */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-10/80">Surrounding Cars ({otherCarEntries.length})</span>
                <button 
                  onClick={addCar}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-30/20 text-brand-30 hover:bg-brand-30/30 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Car
                </button>
              </div>

              <div className="space-y-2.5">
                {otherCarEntries.length === 0 && (
                  <div className="text-center py-6 text-xs text-white/40 border border-dashed border-white/10 rounded-xl">
                    No cars in grid. Click "Add Car".
                  </div>
                )}

                {otherCarEntries.map(([idx, car]) => {
                  let delta = (car.LapDistPct ?? 0) - (player.LapDistPct ?? 0);
                  if (delta > 0.5) delta -= 1;
                  if (delta < -0.5) delta += 1;
                  const distanceMeters = Math.round(delta * currentTrackLength);
                  const carSide = car.side || (Number(idx) % 2 === 0 ? 'left' : 'right');

                  return (
                    <div 
                      key={idx} 
                      className="p-3 bg-white/[0.02] border border-brand-60/30 rounded-xl flex flex-col gap-2.5 hover:border-brand-60/60 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-white/10 text-white">#{idx}</span>
                          <span className="text-[11px] text-white/60 font-semibold">P{car.Position ?? '-'}</span>
                          
                          {/* Lateral side toggle */}
                          <div className="flex items-center bg-black/40 rounded p-0.5 border border-white/10 ml-1">
                            <button 
                              onClick={() => updateCar(idx, { side: 'left' })}
                              className={`px-1.5 py-0.5 text-[9px] font-bold rounded cursor-pointer transition-colors ${
                                carSide === 'left' ? 'bg-brand-30 text-white' : 'text-white/40 hover:text-white'
                              }`}
                            >
                              L
                            </button>
                            <button 
                              onClick={() => updateCar(idx, { side: 'right' })}
                              className={`px-1.5 py-0.5 text-[9px] font-bold rounded cursor-pointer transition-colors ${
                                carSide === 'right' ? 'bg-brand-30 text-white' : 'text-white/40 hover:text-white'
                              }`}
                            >
                              R
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] font-mono font-bold ${
                            Math.abs(distanceMeters) <= 30 ? 'text-green-400' : 'text-white/40'
                          }`}>
                            {distanceMeters > 0 ? `+${distanceMeters}m ahead` : `${distanceMeters}m behind`}
                          </span>
                          <button 
                            onClick={() => removeCar(idx)}
                            className="p-1 rounded text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
                            title="Remove car"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        {/* Distance Slider & Editable Numeric Input */}
                        <div>
                          <div className="flex justify-between items-center text-[10px] text-white/60 mb-1">
                            <span>Distance:</span>
                            <div className="flex items-center gap-1">
                              <NumericDraftInput
                                value={distanceMeters}
                                onChange={(val) => updateCarDistance(idx, val)}
                                className="w-14 bg-white/10 border border-brand-60/40 rounded px-1.5 py-0.5 text-right font-mono font-bold text-[11px] text-white focus:outline-none focus:border-brand-30"
                              />
                              <span className="text-[10px] text-white/50">m</span>
                            </div>
                          </div>
                          <input 
                            type="range"
                            min="-40"
                            max="40"
                            step="1"
                            value={Math.max(-40, Math.min(40, distanceMeters))}
                            onChange={(e) => updateCarDistance(idx, Number(e.target.value))}
                            className="w-full h-1.5 bg-brand-60/40 rounded-lg appearance-none cursor-pointer accent-brand-30"
                          />
                        </div>

                        {/* Surface Select */}
                        <div>
                          <div className="text-[10px] text-white/60 mb-0.5">Track Surface:</div>
                          <select 
                            value={car.TrackSurface ?? 4}
                            onChange={(e) => updateCar(idx, { TrackSurface: Number(e.target.value) })}
                            className="w-full bg-brand-bg border border-brand-60/40 rounded-lg px-2 py-1 text-[11px] focus:outline-none focus:border-brand-30 text-white cursor-pointer"
                          >
                            <option value={4}>4: OnTrack</option>
                            <option value={3}>3: AproachingPits</option>
                            <option value={2}>2: InPitStall</option>
                            <option value={1}>1: OffTrack</option>
                            <option value={0}>0: Undefined</option>
                            <option value={-1}>-1: NotInWorld</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-brand-60/30 bg-white/[0.02] flex items-center justify-between">
          <button 
            onClick={onResetDefault}
            disabled={mode === 'auto'}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors ${
              mode === 'auto'
                ? 'opacity-40 cursor-not-allowed text-white/40'
                : 'text-white/60 hover:text-white hover:bg-white/10 cursor-pointer'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>
          
          <button 
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-brand-30 hover:bg-brand-30/90 text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </>
  );
}
