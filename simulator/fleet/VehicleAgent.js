import { MULTI_CLASS_CONFIG } from './DriverProfiles.js';

export class VehicleAgent {
  constructor(driver, trackModel) {
    this.driver = driver;
    this.trackModel = trackModel;
    this.carIdx = driver.CarIdx;
    this.carClass = driver.CarClassShortName;
    this.classConfig = MULTI_CLASS_CONFIG[this.carClass] || MULTI_CLASS_CONFIG.GT3;
    this.isPlayer = driver.isPlayer || false;

    // Movement & Track state
    this.lapDistPct = driver.initialLapDistPct || 0.0;
    this.lap = 1;
    this.speedKph = 0;
    this.speedMps = 0;
    this.trackSurface = 4; // OnTrack
    this.onPitRoad = false;
    this.hasDamage = false;

    // Lap timing
    this.lapStartTime = 0;
    this.bestLapTime = this.classConfig.baseLapTime * (1 / (driver.speedVariance || 1.0));
    this.lastLapTime = this.bestLapTime + 0.4;
    this.lapCompletionTimes = []; // Array of { lap, sessionTime, lapTime }

    // Pit state
    this.isPitting = false;
    this.pitStallDwellRemaining = 0;
    this.pitStopCount = 0;
    this.scheduledPitLap = this.isPlayer ? 8 : (6 + (this.carIdx % 4));

    // Lateral side for radar (when alongside another car)
    this.side = this.carIdx % 2 === 0 ? 'left' : 'right';
  }

  update(dt, sessionTime, globalFlags) {
    if (dt <= 0) return;

    const baseClassModifier = (this.classConfig.speedModifier || 1.0) * (this.driver.speedVariance || 1.0);
    let speedModifier = baseClassModifier;

    // Caution/Safety Car speed restriction
    if (globalFlags.isSafetyCarActive) {
      speedModifier = Math.min(speedModifier, 0.45); // Safety car pace (~100-120 km/h)
    } else if (globalFlags.incidentSector === this.trackModel.getSector(this.lapDistPct)) {
      speedModifier *= 0.65; // Local yellow flag speed penalty
    }

    // Damage penalty
    if (this.hasDamage) {
      speedModifier *= 0.70;
    }

    // Check Pit Stop trigger
    if (this.lap === this.scheduledPitLap && this.lapDistPct > 0.90 && this.lapDistPct < 0.95 && !this.isPitting) {
      this.isPitting = true;
    }

    // Pit Lane handling
    if (this.isPitting) {
      const { entryPct, pitRoadStartPct, pitStallsCenterPct, exitMergePct } = this.trackModel.config.pitLane;

      if (this.lapDistPct >= entryPct && this.lapDistPct < pitRoadStartPct) {
        this.trackSurface = 3; // AproachingPits
        this.onPitRoad = true;
      } else if (this.trackModel.isInPitRoad(this.lapDistPct)) {
        this.trackSurface = 2; // InPitStall
        this.onPitRoad = true;

        // Pit Box Stop & Service
        if (Math.abs(this.lapDistPct - pitStallsCenterPct) < 0.005) {
          if (this.pitStallDwellRemaining > 0) {
            this.pitStallDwellRemaining -= dt;
            this.speedKph = 0;
            this.speedMps = 0;
            return; // Stationary in box
          } else if (this.pitStallDwellRemaining === 0) {
            this.pitStallDwellRemaining = 8.0 + (this.isPlayer ? 0 : (this.carIdx % 3)); // 8-10 seconds pit service
            this.pitStopCount++;
            this.hasDamage = false; // Repairs done
            return;
          }
        }
      }

      // Max pit road speed 60 km/h
      this.speedKph = Math.min(this.trackModel.config.pitSpeedLimitKph, this.trackModel.getBaseSpeedKph(this.lapDistPct, speedModifier));
      
      // Exit pit lane
      if (this.lapDistPct > exitMergePct && this.lapDistPct < 0.20 && this.pitStallDwellRemaining <= 0) {
        this.isPitting = false;
        this.onPitRoad = false;
        this.trackSurface = 4; // Back OnTrack
        this.scheduledPitLap += 8; // Next window in 8 laps
      }
    } else {
      this.trackSurface = 4;
      this.onPitRoad = false;
      this.speedKph = this.trackModel.getBaseSpeedKph(this.lapDistPct, speedModifier);
    }

    this.speedMps = (this.speedKph * 1000) / 3600;

    // Distance step
    const distMeters = this.speedMps * dt;
    const deltaPct = distMeters / this.trackModel.lengthMeters;
    let nextPct = this.lapDistPct + deltaPct;

    // Lap Crossing Detection (1.0 -> 0.0)
    if (nextPct >= 1.0) {
      nextPct -= 1.0;
      this.lap += 1;
      
      const lapDuration = sessionTime - this.lapStartTime;
      this.lapStartTime = sessionTime;

      if (lapDuration > 40 && lapDuration < 300) {
        this.lastLapTime = parseFloat(lapDuration.toFixed(3));
        if (!this.bestLapTime || this.lastLapTime < this.bestLapTime) {
          this.bestLapTime = this.lastLapTime;
        }
      }

      this.lapCompletionTimes.push({
        lap: this.lap - 1,
        sessionTime,
        lapTime: this.lastLapTime
      });
    }

    this.lapDistPct = nextPct;
  }

  getTelemetryFrame() {
    return {
      CarIdx: this.carIdx,
      LapDistPct: parseFloat(this.lapDistPct.toFixed(5)),
      Lap: this.lap,
      TrackSurface: this.trackSurface,
      OnPitRoad: this.onPitRoad,
      HasDamage: this.hasDamage,
      BestLapTime: this.bestLapTime,
      LastLapTime: this.lastLapTime,
      SpeedKph: this.speedKph,
      side: this.side
    };
  }
}
