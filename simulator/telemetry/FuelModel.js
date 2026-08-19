/**
 * FuelModel - Tracks fuel capacity, progressive consumption per lap, and pit refueling.
 */

export class FuelModel {
  constructor({ capacityLiters = 85.0, initialLevelLiters = 55.0, burnRatePerLap = 3.3 } = {}) {
    this.capacity = capacityLiters;
    this.currentLevel = initialLevelLiters;
    this.burnRatePerLap = burnRatePerLap;
    this.fuelUsePerHour = 48.5; // Liters / hour
  }

  update(dt, playerSpeedMps, trackLengthMeters) {
    if (dt <= 0) return;

    // Fuel consumption rate proportional to speed and distance
    const distTravelledMeters = playerSpeedMps * dt;
    const lapFraction = distTravelledMeters / trackLengthMeters;
    const fuelUsed = lapFraction * this.burnRatePerLap;

    this.currentLevel = Math.max(0.1, this.currentLevel - fuelUsed);
  }

  refuel(amountLiters) {
    this.currentLevel = Math.min(this.capacity, this.currentLevel + amountLiters);
  }

  getTelemetryFrame() {
    return {
      FuelLevel: parseFloat(this.currentLevel.toFixed(2)),
      FuelLevelPct: parseFloat((this.currentLevel / this.capacity).toFixed(3)),
      FuelUsePerHour: parseFloat(this.fuelUsePerHour.toFixed(1)),
      FuelCapacity: this.capacity,
    };
  }
}
