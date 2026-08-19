import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Zap, 
  AlertTriangle, 
  ShieldAlert, 
  CloudRain, 
  Flag,
  RotateCcw
} from 'lucide-react';
import { FLAG_TYPES } from '../../simulator/core/SessionStateMachine.js';

function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function BottomPlayerBar({
  simulator,
  telemetry,
  onReset
}) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(1800);
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [hoverTime, setHoverTime] = useState(null);
  const [hoverX, setHoverX] = useState(0);

  const scrubberRef = useRef(null);

  useEffect(() => {
    if (!simulator) return;

    const unsubClock = simulator.clock.subscribe((clockState) => {
      if (!isScrubbing) {
        setCurrentTime(clockState.currentTime);
      }
      setTotalDuration(clockState.totalDuration);
      setIsPlaying(clockState.isPlaying);
      setSpeedMultiplier(clockState.speedMultiplier);
    });

    return () => unsubClock();
  }, [simulator, isScrubbing]);

  const handlePlayPause = () => {
    if (!simulator) return;
    simulator.togglePlay();
  };

  const handleSpeedChange = (mult) => {
    if (!simulator) return;
    simulator.setSpeed(mult);
  };

  const handleScrubberMouseDown = (e) => {
    setIsScrubbing(true);
    updateScrubPosition(e);

    const handleMouseMove = (moveEvent) => {
      updateScrubPosition(moveEvent);
    };

    const handleMouseUp = (upEvent) => {
      updateScrubPosition(upEvent);
      setIsScrubbing(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const updateScrubPosition = (e) => {
    if (!scrubberRef.current || !simulator) return;
    const rect = scrubberRef.current.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const pct = clickX / rect.width;
    const targetSec = pct * totalDuration;
    setCurrentTime(targetSec);
    simulator.seekPercent(pct);
  };

  const handleScrubberMouseMove = (e) => {
    if (!scrubberRef.current) return;
    const rect = scrubberRef.current.getBoundingClientRect();
    const posX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, posX / rect.width));
    setHoverX(posX);
    setHoverTime(pct * totalDuration);
  };

  const handleScrubberMouseLeave = () => {
    setHoverTime(null);
  };

  const progressPct = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;
  const currentFlag = telemetry?.currentFlag || FLAG_TYPES.GREEN;
  const isSafetyCar = telemetry?.isSafetyCarActive || false;
  const isIncident = telemetry?.incidentSector !== null && telemetry?.incidentSector !== undefined;
  const isRain = telemetry?.Skies === 3;
  const playerLap = telemetry?.grid?.[telemetry?.playerCarIdx]?.Lap || 1;
  const totalLaps = telemetry?.totalLaps || 15;
  const lapMarkers = simulator ? simulator.getPlayerLapMarkers() : [];

  const speeds = [0.25, 0.5, 1.0, 2.0, 5.0, 10.0, 25.0];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[10000] bg-brand-bg/95 backdrop-blur-2xl border-t border-brand-60/50 text-white font-sans shadow-2xl select-none">
      
      {/* Top Timeline Scrubber with Lap Markers */}
      <div 
        ref={scrubberRef}
        onMouseDown={handleScrubberMouseDown}
        onMouseMove={handleScrubberMouseMove}
        onMouseLeave={handleScrubberMouseLeave}
        className="group relative w-full h-3.5 bg-black/50 cursor-pointer flex items-center"
      >
        {/* Track Background */}
        <div className="w-full h-1 bg-white/10 group-hover:h-2 transition-all relative">
          
          {/* Progress Bar Fill */}
          <div 
            className="h-full bg-brand-30 relative transition-all"
            style={{ width: `${progressPct}%` }}
          >
            {/* Scrubber Knob */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md scale-0 group-hover:scale-100 transition-transform" />
          </div>

          {/* Lap Completion Notch Markers */}
          {lapMarkers.map((marker, idx) => {
            const markerPct = totalDuration > 0 ? (marker.sessionTime / totalDuration) * 100 : 0;
            if (markerPct > 100) return null;
            return (
              <div
                key={idx}
                className="absolute top-0 bottom-0 w-[2px] bg-yellow-400/80 z-10 pointer-events-none"
                style={{ left: `${markerPct}%` }}
                title={`Lap ${marker.lap} completed at ${formatTime(marker.sessionTime)}`}
              >
                <span className="absolute -top-3.5 -translate-x-1/2 text-[9px] font-mono font-bold text-yellow-300/80 opacity-0 group-hover:opacity-100 transition-opacity">
                  L{marker.lap}
                </span>
              </div>
            );
          })}
        </div>

        {/* Hover Tooltip */}
        {hoverTime !== null && (
          <div 
            className="absolute -top-8 px-2 py-0.5 rounded bg-brand-bg border border-white/20 text-[10px] font-mono text-brand-10 shadow-lg pointer-events-none -translate-x-1/2"
            style={{ left: `${hoverX}px` }}
          >
            {formatTime(hoverTime)}
          </div>
        )}
      </div>

      {/* Main Controls Row */}
      <div className="flex items-center justify-between px-6 py-3 max-w-[1920px] mx-auto gap-4">
        
        {/* Left: Track & Session Status info */}
        <div className="flex items-center gap-4 min-w-[280px]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-brand-10 tracking-wide">Circuit de Spa-Francorchamps</span>
              <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-white/10 text-white/60">7004m</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-white/50 font-mono mt-0.5">
              <span>{formatTime(currentTime)} / {formatTime(totalDuration)}</span>
              <span>•</span>
              <span className="text-brand-30 font-bold">Lap {playerLap} of {totalLaps}</span>
            </div>
          </div>

          {/* Current Flag Badge */}
          <div 
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition-all shadow-sm"
            style={{
              backgroundColor: `${currentFlag.color}15`,
              borderColor: `${currentFlag.color}40`,
              color: currentFlag.color,
            }}
          >
            <Flag className="w-3.5 h-3.5" />
            <span>{currentFlag.label}</span>
          </div>
        </div>

        {/* Center: Playback Transport & Speeds */}
        <div className="flex items-center gap-5">
          
          {/* Step Back / Play / Step Forward */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => simulator && simulator.stepBackward()}
              className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Step Backward (1 frame)"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={handlePlayPause}
              className="p-2.5 rounded-xl bg-brand-30 hover:bg-brand-30/90 text-white shadow-lg transition-transform active:scale-95 cursor-pointer"
              title={isPlaying ? "Pause Simulation" : "Play Simulation"}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>

            <button
              onClick={() => simulator && simulator.stepForward()}
              className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Step Forward (1 frame)"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Speed Multiplier Segmented Buttons */}
          <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/10 gap-0.5">
            {speeds.map((spd) => (
              <button
                key={spd}
                onClick={() => handleSpeedChange(spd)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold transition-all cursor-pointer ${
                  speedMultiplier === spd
                    ? 'bg-brand-30 text-white shadow'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

        </div>

        {/* Right: Event Injection Triggers */}
        <div className="flex items-center gap-2 min-w-[280px] justify-end">
          
          {/* Yellow Flag Caution Trigger */}
          <button
            onClick={() => {
              if (!simulator) return;
              if (isIncident) simulator.clearIncident();
              else simulator.triggerIncident(2);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
              isIncident
                ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50 shadow-md ring-1 ring-yellow-500/30'
                : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white'
            }`}
            title="Toggle Sector 2 Incident / Yellow Flag"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{isIncident ? 'Clear Caution' : 'Caution S2'}</span>
          </button>

          {/* Safety Car Trigger */}
          <button
            onClick={() => simulator && simulator.toggleSafetyCar()}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
              isSafetyCar
                ? 'bg-orange-500/20 text-orange-400 border-orange-500/50 shadow-md ring-1 ring-orange-500/30'
                : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white'
            }`}
            title="Deploy / Recall Safety Car"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{isSafetyCar ? 'SC In' : 'Safety Car'}</span>
          </button>

          {/* Rain Trigger */}
          <button
            onClick={() => simulator && simulator.toggleRain()}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
              isRain
                ? 'bg-blue-500/20 text-blue-400 border-blue-500/50 shadow-md ring-1 ring-blue-500/30'
                : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white'
            }`}
            title="Toggle Rain / Wet Track"
          >
            <CloudRain className="w-3.5 h-3.5" />
            <span>{isRain ? 'Clear Skies' : 'Rain'}</span>
          </button>

          {/* Reset Session */}
          <button
            onClick={() => onReset && onReset()}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Restart Session from Lap 1"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

        </div>

      </div>

    </div>
  );
}
