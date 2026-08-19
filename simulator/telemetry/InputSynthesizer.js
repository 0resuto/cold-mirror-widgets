/**
 * InputSynthesizer - Generates physically synchronized driver inputs (Pedals, Steering, RPM, Gear)
 * based on vehicle speed, track location, and cornering profiles.
 */

export class InputSynthesizer {
  constructor(trackModel) {
    this.trackModel = trackModel;
    this.currentRPM = 5000;
    this.currentGear = 3;
    this.gearRatios = [0, 3.2, 2.2, 1.6, 1.25, 1.0, 0.85]; // Ratios for gears 1-6
    this.idleRPM = 3500;
    this.shiftRPM = 8100;
    this.maxRPM = 8600;
  }

  update(playerSpeedKph, playerLapDistPct) {
    const dynamics = this.trackModel.getCorneringDynamics(playerLapDistPct);
    const speedMps = (playerSpeedKph * 1000) / 3600;

    // 1. Determine Gear from Speed
    let gear = 1;
    if (playerSpeedKph > 240) gear = 6;
    else if (playerSpeedKph > 195) gear = 5;
    else if (playerSpeedKph > 150) gear = 4;
    else if (playerSpeedKph > 105) gear = 3;
    else if (playerSpeedKph > 65) gear = 2;
    else gear = 1;

    this.currentGear = gear;

    // 2. Derive RPM from speed in current gear
    const gearBaseSpeed = [0, 50, 90, 135, 180, 225, 270][gear] || 150;
    const speedRatio = playerSpeedKph / Math.max(10, gearBaseSpeed);
    let targetRPM = this.idleRPM + (this.shiftRPM - this.idleRPM) * speedRatio;
    targetRPM = Math.max(3800, Math.min(this.maxRPM, targetRPM));

    // Smooth RPM response
    this.currentRPM += (targetRPM - this.currentRPM) * 0.25;

    // 3. Synthesize Throttle and Brake
    let brake = dynamics.brake || 0;
    let throttle = 0;

    if (brake > 0.05) {
      throttle = 0.0;
    } else {
      // Throttle is high on straightaways, moderate in mid-corner
      const cornerAbs = Math.abs(dynamics.steering);
      throttle = Math.max(0.2, 1.0 - (cornerAbs * 0.6));
    }

    // 4. Shift lights indicator percentage (0.0 to 1.0)
    const shiftIndicatorPct = Math.max(0, Math.min(1.0, (this.currentRPM - 6500) / (this.shiftRPM - 6500)));

    return {
      Speed: speedMps, // m/s for widgets
      SpeedKph: playerSpeedKph,
      RPM: Math.round(this.currentRPM),
      Gear: this.currentGear,
      Throttle: parseFloat(throttle.toFixed(2)),
      Brake: parseFloat(brake.toFixed(2)),
      SteeringWheelAngle: parseFloat(dynamics.steering.toFixed(2)),
      Clutch: 0.0,
      ShiftGrindRPM: this.maxRPM,
      ShiftIndicatorPct: parseFloat(shiftIndicatorPct.toFixed(2)),
    };
  }
}
