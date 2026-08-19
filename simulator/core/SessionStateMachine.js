/**
 * SessionStateMachine - Manages race session phases, timers, flags, and incident states.
 */

export const FLAG_TYPES = {
  GREEN: { code: 'green', label: 'Green Flag', color: '#34c759', raw: 0x00000004 },
  YELLOW: { code: 'yellow', label: 'Yellow Flag (Caution)', color: '#ffcc00', raw: 0x00000008 },
  SAFETY_CAR: { code: 'safety_car', label: 'Safety Car Deployed', color: '#ff9500', raw: 0x00000010 },
  BLUE: { code: 'blue', label: 'Blue Flag (Faster Car Approaching)', color: '#007aff', raw: 0x00000020 },
  WHITE: { code: 'white', label: 'White Flag (Final Lap)', color: '#ffffff', raw: 0x00000040 },
  CHECKERED: { code: 'checkered', label: 'Checkered Flag (Session Finished)', color: '#e5e5ea', raw: 0x00000080 },
  RED: { code: 'red', label: 'Red Flag (Session Stopped)', color: '#ff3b30', raw: 0x00000001 },
};

export class SessionStateMachine {
  constructor({ totalLaps = 15, totalTimeSeconds = 1800 } = {}) {
    this.totalLaps = totalLaps;
    this.totalTimeSeconds = totalTimeSeconds;

    this.currentFlag = FLAG_TYPES.GREEN;
    this.isSafetyCarActive = false;
    this.incidentSector = null; // null or 1, 2, 3
    this.sessionState = 'RACING'; // 'COUNTDOWN', 'RACING', 'SAFETY_CAR', 'FINISHED'
    this.leaderLap = 1;
    this.timeRemaining = totalTimeSeconds;
  }

  update(sessionTime, leaderLapDistPct, leaderLap) {
    this.leaderLap = leaderLap;
    this.timeRemaining = Math.max(0, this.totalTimeSeconds - sessionTime);

    // Auto flag transitions based on race progress
    if (this.sessionState !== 'FINISHED') {
      if (this.isSafetyCarActive) {
        this.currentFlag = FLAG_TYPES.SAFETY_CAR;
      } else if (this.incidentSector !== null) {
        this.currentFlag = FLAG_TYPES.YELLOW;
      } else if (leaderLap >= this.totalLaps) {
        this.currentFlag = FLAG_TYPES.CHECKERED;
        this.sessionState = 'FINISHED';
      } else if (leaderLap === this.totalLaps - 1 && leaderLapDistPct > 0.9) {
        this.currentFlag = FLAG_TYPES.WHITE;
      } else {
        this.currentFlag = FLAG_TYPES.GREEN;
      }
    }
  }

  triggerIncident(sector = 2) {
    this.incidentSector = sector;
    this.currentFlag = FLAG_TYPES.YELLOW;
  }

  clearIncident() {
    this.incidentSector = null;
    if (!this.isSafetyCarActive) {
      this.currentFlag = FLAG_TYPES.GREEN;
    }
  }

  toggleSafetyCar() {
    this.isSafetyCarActive = !this.isSafetyCarActive;
    if (this.isSafetyCarActive) {
      this.currentFlag = FLAG_TYPES.SAFETY_CAR;
    } else {
      this.currentFlag = this.incidentSector ? FLAG_TYPES.YELLOW : FLAG_TYPES.GREEN;
    }
  }

  setFlag(flagKey) {
    if (FLAG_TYPES[flagKey]) {
      this.currentFlag = FLAG_TYPES[flagKey];
    }
  }

  getRawSessionFlags() {
    return this.currentFlag.raw || 0x00000004;
  }

  getSessionData() {
    return {
      SessionTime: this.totalTimeSeconds - this.timeRemaining,
      SessionTimeRemain: this.timeRemaining,
      SessionLapsRemainEx: Math.max(0, this.totalLaps - this.leaderLap),
      SessionFlags: this.getRawSessionFlags(),
      currentFlag: this.currentFlag,
      isSafetyCarActive: this.isSafetyCarActive,
      incidentSector: this.incidentSector,
      totalLaps: this.totalLaps,
    };
  }
}
