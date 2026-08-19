import { SimulationClock } from './core/SimulationClock.js';
import { TrackModel, SPA_TRACK_CONFIG } from './core/TrackModel.js';
import { SessionStateMachine, FLAG_TYPES } from './core/SessionStateMachine.js';
import { MultiClassFleet } from './fleet/MultiClassFleet.js';
import { DEFAULT_DRIVERS, MULTI_CLASS_CONFIG } from './fleet/DriverProfiles.js';
import { InputSynthesizer } from './telemetry/InputSynthesizer.js';
import { FuelModel } from './telemetry/FuelModel.js';
import { WeatherModel } from './telemetry/WeatherModel.js';
import { PitEngine } from './telemetry/PitEngine.js';

export { FLAG_TYPES, MULTI_CLASS_CONFIG, SPA_TRACK_CONFIG };

export class TelemetrySimulator {
  constructor(options = {}) {
    const totalDurationSeconds = options.durationSeconds || 1800; // 30 minutes
    const totalLaps = options.totalLaps || 15;

    this.clock = new SimulationClock({ targetFps: 60, totalDurationSeconds });
    this.trackModel = new TrackModel(options.trackConfig || SPA_TRACK_CONFIG);
    this.sessionState = new SessionStateMachine({ totalLaps, totalTimeSeconds: totalDurationSeconds });
    this.fleet = new MultiClassFleet(this.trackModel, options.drivers || DEFAULT_DRIVERS);
    this.inputSynthesizer = new InputSynthesizer(this.trackModel);
    this.fuelModel = new FuelModel();
    this.weatherModel = new WeatherModel();
    this.pitEngine = new PitEngine();

    this.listeners = new Set();
    this.currentTelemetry = this.computeTelemetry(0);

    // Bind clock step to simulator update
    this.clock.subscribe(({ currentTime, delta }) => {
      this.step(delta, currentTime);
    });
  }

  start() {
    this.clock.start();
  }

  stop() {
    this.clock.stop();
  }

  step(dt, sessionTime = this.clock.currentTime) {
    const globalFlags = {
      isSafetyCarActive: this.sessionState.isSafetyCarActive,
      incidentSector: this.sessionState.incidentSector,
    };

    // 1. Advance multi-class fleet physics
    this.fleet.update(dt, sessionTime, globalFlags);
    const player = this.fleet.getPlayer();
    const leader = this.fleet.getLeader();

    // 2. Advance session state & flags
    this.sessionState.update(sessionTime, leader.lapDistPct, leader.lap);

    // 3. Synthesize player controls & inputs
    const inputs = this.inputSynthesizer.update(player.speedKph, player.lapDistPct);

    // 4. Update fuel & weather
    this.fuelModel.update(dt, player.speedMps, this.trackModel.lengthMeters);
    this.weatherModel.update(dt, sessionTime);

    // 5. Build full telemetry frame
    this.currentTelemetry = this.computeTelemetry(sessionTime, inputs, player);
    this.notify();
  }

  computeTelemetry(sessionTime, inputs = null, player = null) {
    const activePlayer = player || this.fleet.getPlayer();
    const activeInputs = inputs || this.inputSynthesizer.update(activePlayer.speedKph, activePlayer.lapDistPct);
    const gridData = this.fleet.getGridTelemetry();
    const fuelData = this.fuelModel.getTelemetryFrame();
    const weatherData = this.weatherModel.getTelemetryFrame();
    const pitData = this.pitEngine.getTelemetryFrame(activePlayer);
    const sessionData = this.sessionState.getSessionData();

    return {
      // Driver identification
      playerCarIdx: activePlayer.carIdx,

      // Vehicle Controls & Dynamics
      ...activeInputs,

      // Spotter & Radar
      CarLeftRight: gridData.carLeftRight,

      // Fuel
      ...fuelData,

      // Weather
      ...weatherData,

      // Pit & Service
      ...pitData,

      // Session & Flags
      ...sessionData,
      SessionBestLapTime: gridData.grid[activePlayer.carIdx]?.BestLapTime || 136.5,

      // Full Grid Multi-Class Standings
      grid: gridData.grid,
    };
  }

  // --- External Controls & Events ---

  triggerIncident(sector = 2) {
    this.sessionState.triggerIncident(sector);
    this.step(0);
  }

  clearIncident() {
    this.sessionState.clearIncident();
    this.step(0);
  }

  toggleSafetyCar() {
    this.sessionState.toggleSafetyCar();
    this.step(0);
  }

  toggleRain() {
    this.weatherModel.toggleRain();
    this.step(0);
  }

  setFlag(flagKey) {
    this.sessionState.setFlag(flagKey);
    this.step(0);
  }

  seek(targetTimeSeconds) {
    this.clock.seek(targetTimeSeconds);
  }

  seekPercent(pct) {
    this.clock.seekPercent(pct);
  }

  setSpeed(multiplier) {
    this.clock.setSpeed(multiplier);
  }

  play() {
    this.clock.play();
  }

  pause() {
    this.clock.pause();
  }

  togglePlay() {
    this.clock.togglePlay();
  }

  stepForward() {
    this.clock.stepForward();
  }

  stepBackward() {
    this.clock.stepBackward();
  }

  // --- Accessors ---

  getTelemetry() {
    return this.currentTelemetry;
  }

  getSessionDrivers() {
    return this.fleet.drivers;
  }

  getSessionData() {
    return this.pitEngine.getSessionData();
  }

  getTrackLength() {
    return this.trackModel.lengthMeters;
  }

  getTrackName() {
    return this.trackModel.config.name;
  }

  getPlayerLapMarkers() {
    return this.fleet.getPlayer().lapCompletionTimes || [];
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      try {
        listener(this.currentTelemetry);
      } catch (err) {
        console.error('TelemetrySimulator subscriber error:', err);
      }
    }
  }

  destroy() {
    this.clock.stop();
    this.listeners.clear();
  }
}

export function createSimulator(options) {
  return new TelemetrySimulator(options);
}
