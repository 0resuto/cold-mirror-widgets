import { VehicleAgent } from './VehicleAgent.js';
import { DEFAULT_DRIVERS, MULTI_CLASS_CONFIG } from './DriverProfiles.js';

export class MultiClassFleet {
  constructor(trackModel, drivers = DEFAULT_DRIVERS) {
    this.trackModel = trackModel;
    this.drivers = drivers;
    this.agents = drivers.map(driver => new VehicleAgent(driver, trackModel));
    this.playerAgent = this.agents.find(a => a.isPlayer) || this.agents[0];
  }

  update(dt, sessionTime, globalFlags) {
    for (const agent of this.agents) {
      agent.update(dt, sessionTime, globalFlags);
    }
  }

  getPlayer() {
    return this.playerAgent;
  }

  getLeader() {
    let leader = this.agents[0];
    let maxProgress = -1;
    for (const agent of this.agents) {
      const progress = agent.lap + agent.lapDistPct;
      if (progress > maxProgress) {
        maxProgress = progress;
        leader = agent;
      }
    }
    return leader;
  }

  /**
   * Calculates standings, class positions, F2Time relative intervals, and spotter alerts
   */
  getGridTelemetry() {
    // 1. Sort all cars by total race progress (Overall Standings)
    const sortedAgents = [...this.agents].sort((a, b) => {
      const progA = a.lap + a.lapDistPct;
      const progB = b.lap + b.lapDistPct;
      return progB - progA; // Highest progress is P1
    });

    // 2. Class grouping counters for ClassPosition
    const classCounters = { GTP: 1, LMP2: 1, GT3: 1, GT4: 1 };
    const positionMap = new Map();
    const classPosMap = new Map();

    sortedAgents.forEach((agent, index) => {
      positionMap.set(agent.carIdx, index + 1);
      const cPos = classCounters[agent.carClass] || 1;
      classPosMap.set(agent.carIdx, cPos);
      classCounters[agent.carClass] = cPos + 1;
    });

    // 3. Find overall fastest lap in session
    let fastestLapTime = 9999;
    let fastestCarIdx = null;
    this.agents.forEach(agent => {
      if (agent.bestLapTime && agent.bestLapTime < fastestLapTime) {
        fastestLapTime = agent.bestLapTime;
        fastestCarIdx = agent.carIdx;
      }
    });

    // 4. Calculate relative gaps (F2Time) relative to player and adjacent cars
    const playerProgress = this.playerAgent.lap + this.playerAgent.lapDistPct;
    const playerLapDist = this.playerAgent.lapDistPct;
    const trkLen = this.trackModel.lengthMeters;

    let hasLeftSpotter = false;
    let hasRightSpotter = false;

    const grid = {};

    this.agents.forEach(agent => {
      const frame = agent.getTelemetryFrame();
      const pos = positionMap.get(agent.carIdx) || 1;
      const classPos = classPosMap.get(agent.carIdx) || 1;

      // Spatial delta relative to player on track
      let deltaPct = agent.lapDistPct - playerLapDist;
      if (deltaPct > 0.5) deltaPct -= 1.0;
      if (deltaPct < -0.5) deltaPct += 1.0;
      const distanceMeters = deltaPct * trkLen;

      // Approximate relative time gap in seconds (based on GT3 ~60m/s reference speed)
      const f2Time = parseFloat((distanceMeters / 60.0).toFixed(1));

      // Radar Spotter check (cars within +- 5.5 meters alongside player)
      if (!agent.isPlayer && Math.abs(distanceMeters) <= 5.5 && agent.trackSurface > 0 && this.playerAgent.trackSurface > 0) {
        if (agent.side === 'left') hasLeftSpotter = true;
        if (agent.side === 'right') hasRightSpotter = true;
      }

      grid[agent.carIdx] = {
        ...frame,
        Position: pos,
        ClassPosition: classPos,
        F2Time: f2Time,
        IsFastestLap: agent.carIdx === fastestCarIdx,
      };
    });

    // Spotter bitmask: 0: Clear, 2: CarLeft, 3: CarRight, 4: CarLeftRight
    let carLeftRight = 0;
    if (hasLeftSpotter && hasRightSpotter) carLeftRight = 4;
    else if (hasLeftSpotter) carLeftRight = 2;
    else if (hasRightSpotter) carLeftRight = 3;

    return {
      grid,
      carLeftRight,
      leaderProgress: this.getLeader().lap + this.getLeader().lapDistPct,
      leaderLap: this.getLeader().lap,
      playerLap: this.playerAgent.lap,
      playerLapDistPct: this.playerAgent.lapDistPct,
    };
  }
}
