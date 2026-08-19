/**
 * PitEngine - Manages pit service flags, tire change setup, and pit stop status for PitHelper.
 */

export class PitEngine {
  constructor() {
    this.pitSvFlags = 0x00000000;
    this.pitSvFuel = 35.0; // Liters requested
    this.pitSvTireSetupLeft = 1; // Change left tires
    this.pitSvTireSetupRight = 1; // Change right tires
    this.pitSpeedLimit = "60.00 kph";
  }

  getTelemetryFrame(playerAgent) {
    return {
      PitSvFlags: this.pitSvFlags,
      PitSvFuel: this.pitSvFuel,
      PitSvTireSetupLeft: this.pitSvTireSetupLeft,
      PitSvTireSetupRight: this.pitSvTireSetupRight,
      OnPitRoad: playerAgent ? playerAgent.onPitRoad : false,
      InPitStall: playerAgent ? playerAgent.trackSurface === 2 : false,
    };
  }

  getSessionData() {
    return {
      WeekendInfo: {
        TrackPitSpeedLimit: this.pitSpeedLimit,
      }
    };
  }
}
