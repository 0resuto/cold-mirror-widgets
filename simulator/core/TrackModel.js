/**
 * TrackModel - Circuit de Spa-Francorchamps (7004 meters)
 * Defines sector splits, corner braking zones, speed envelopes, and pit lane topology.
 */

export const SPA_TRACK_CONFIG = {
  name: 'Circuit de Spa-Francorchamps',
  shortName: 'Spa',
  lengthMeters: 7004,
  pitSpeedLimitKph: 60.0,
  sectors: [
    { id: 1, startPct: 0.0, endPct: 0.31, name: 'Sector 1 (La Source -> Kemmel)' },
    { id: 2, startPct: 0.31, endPct: 0.77, name: 'Sector 2 (Les Combes -> Stavelot)' },
    { id: 3, startPct: 0.77, endPct: 1.0, name: 'Sector 3 (Blanchimont -> Bus Stop)' },
  ],
  pitLane: {
    entryPct: 0.95,       // Approaching Pits (TrackSurface: 3)
    pitRoadStartPct: 0.965, // In Pit Lane speed limit begins (TrackSurface: 2)
    pitStallsCenterPct: 0.985, // Pit boxes area
    pitRoadEndPct: 0.065,  // Pit lane limiter ends
    exitMergePct: 0.08,   // Merges back into race track (TrackSurface: 4)
  },
  // Key corner speed milestones for realistic telemetry generation (Pct 0.0 -> 1.0)
  keyWaypoints: [
    { pct: 0.00, speedKph: 220, turn: 0, name: 'Start/Finish Straight' },
    { pct: 0.04, speedKph: 75, turn: 1, name: 'Turn 1 - La Source (Hairpin Right)', brake: 0.95, steering: 0.7 },
    { pct: 0.08, speedKph: 160, turn: 0, name: 'Downhill to Eau Rouge' },
    { pct: 0.12, speedKph: 245, turn: 2, name: 'Turn 2-4 - Eau Rouge / Raidillon', brake: 0.0, steering: -0.3 },
    { pct: 0.22, speedKph: 275, turn: 0, name: 'Kemmel Straight (Flat out)', brake: 0.0, steering: 0.0 },
    { pct: 0.31, speedKph: 125, turn: 5, name: 'Turn 5-6 - Les Combes (Chicane)', brake: 0.85, steering: 0.6 },
    { pct: 0.37, speedKph: 155, turn: 7, name: 'Turn 7 - Malmedy', brake: 0.3, steering: -0.4 },
    { pct: 0.44, speedKph: 105, turn: 8, name: 'Turn 8 - Bruxelles (Hairpin Right)', brake: 0.75, steering: 0.65 },
    { pct: 0.49, speedKph: 140, turn: 9, name: 'Turn 9 - Speaker Corner', brake: 0.4, steering: -0.5 },
    { pct: 0.58, speedKph: 195, turn: 10, name: 'Turn 10-11 - Double Gauche / Pouhon', brake: 0.25, steering: -0.6 },
    { pct: 0.66, speedKph: 135, turn: 12, name: 'Turn 12-13 - Fagnes / Campus', brake: 0.7, steering: 0.5 },
    { pct: 0.73, speedKph: 180, turn: 14, name: 'Turn 14-15 - Stavelot / Paul Frere', brake: 0.2, steering: 0.4 },
    { pct: 0.84, speedKph: 270, turn: 16, name: 'Turn 16-17 - Blanchimont (Flat out Left)', brake: 0.0, steering: -0.25 },
    { pct: 0.94, speedKph: 70, turn: 18, name: 'Turn 18-19 - Bus Stop Chicane', brake: 0.95, steering: 0.75 },
    { pct: 0.98, speedKph: 150, turn: 0, name: 'Main Straight Acceleration' },
  ]
};

export class TrackModel {
  constructor(config = SPA_TRACK_CONFIG) {
    this.config = config;
    this.lengthMeters = config.lengthMeters;
    this.waypoints = [...config.keyWaypoints].sort((a, b) => a.pct - b.pct);
  }

  getSector(lapDistPct) {
    const pct = ((lapDistPct % 1) + 1) % 1;
    for (const sector of this.config.sectors) {
      if (pct >= sector.startPct && pct < sector.endPct) {
        return sector.id;
      }
    }
    return 3;
  }

  isApproachingPits(lapDistPct) {
    const pct = ((lapDistPct % 1) + 1) % 1;
    const { entryPct, pitRoadStartPct } = this.config.pitLane;
    return pct >= entryPct && pct < pitRoadStartPct;
  }

  isInPitRoad(lapDistPct) {
    const pct = ((lapDistPct % 1) + 1) % 1;
    const { pitRoadStartPct, exitMergePct } = this.config.pitLane;
    if (pitRoadStartPct > exitMergePct) {
      return pct >= pitRoadStartPct || pct <= exitMergePct;
    }
    return pct >= pitRoadStartPct && pct <= exitMergePct;
  }

  getTrackSurface(lapDistPct, isOnPitRoad) {
    if (!isOnPitRoad) {
      return 4; // OnTrack
    }
    if (this.isApproachingPits(lapDistPct)) {
      return 3; // AproachingPits
    }
    return 2; // InPitStall / InPitLane
  }

  /**
   * Interpolates base vehicle speed (km/h) at a given point on the track
   */
  getBaseSpeedKph(lapDistPct, classSpeedModifier = 1.0) {
    const pct = ((lapDistPct % 1) + 1) % 1;
    
    // Find adjacent waypoints
    let p1 = this.waypoints[this.waypoints.length - 1];
    let p2 = this.waypoints[0];

    for (let i = 0; i < this.waypoints.length; i++) {
      if (this.waypoints[i].pct <= pct) {
        p1 = this.waypoints[i];
        p2 = this.waypoints[(i + 1) % this.waypoints.length];
      }
    }

    let t = 0;
    if (p2.pct > p1.pct) {
      t = (pct - p1.pct) / (p2.pct - p1.pct);
    } else {
      const span = (1.0 - p1.pct) + p2.pct;
      const progress = pct >= p1.pct ? (pct - p1.pct) : (1.0 - p1.pct + pct);
      t = span > 0 ? progress / span : 0;
    }

    // Smoothstep interpolation
    const smoothT = t * t * (3 - 2 * t);
    const interpolatedSpeed = p1.speedKph + (p2.speedKph - p1.speedKph) * smoothT;

    return interpolatedSpeed * classSpeedModifier;
  }

  /**
   * Interpolates braking and steering curves at a given point
   */
  getCorneringDynamics(lapDistPct) {
    const pct = ((lapDistPct % 1) + 1) % 1;
    
    let p1 = this.waypoints[this.waypoints.length - 1];
    let p2 = this.waypoints[0];

    for (let i = 0; i < this.waypoints.length; i++) {
      if (this.waypoints[i].pct <= pct) {
        p1 = this.waypoints[i];
        p2 = this.waypoints[(i + 1) % this.waypoints.length];
      }
    }

    let t = 0;
    if (p2.pct > p1.pct) {
      t = (pct - p1.pct) / (p2.pct - p1.pct);
    } else {
      const span = (1.0 - p1.pct) + p2.pct;
      const progress = pct >= p1.pct ? (pct - p1.pct) : (1.0 - p1.pct + pct);
      t = span > 0 ? progress / span : 0;
    }

    const b1 = p1.brake || 0;
    const b2 = p2.brake || 0;
    const s1 = p1.steering || 0;
    const s2 = p2.steering || 0;

    return {
      brake: Math.max(0, Math.min(1, b1 + (b2 - b1) * t)),
      steering: s1 + (s2 - s1) * t,
      waypointName: p1.name
    };
  }
}
