/**
 * WeatherModel - Dynamic ambient temperature, track temperature, wind direction, velocity, and skies.
 */

export class WeatherModel {
  constructor({
    initialAirTemp = 23.5,
    initialTrackTemp = 31.0,
    initialWindSpeed = 2.4,
    initialSkies = 0 // 0: Clear, 1: Partly Cloudy, 2: Overcast, 3: Rain
  } = {}) {
    this.airTemp = initialAirTemp;
    this.trackTemp = initialTrackTemp;
    this.windVel = initialWindSpeed;
    this.windDir = 1.45; // Radians
    this.skies = initialSkies;
    this.isRaining = false;
  }

  update(dt, sessionTime) {
    // Subtle oscillations over time
    const wave = Math.sin(sessionTime / 120.0);
    this.airTemp = 23.5 + wave * 1.5;
    this.trackTemp = (this.isRaining ? 19.0 : 31.0) + wave * 2.5;
    this.windVel = Math.max(0.5, 2.4 + Math.cos(sessionTime / 80.0) * 1.2);
    this.windDir = (this.windDir + (dt * 0.005)) % (Math.PI * 2);
  }

  toggleRain() {
    this.isRaining = !this.isRaining;
    this.skies = this.isRaining ? 3 : 0;
  }

  getTelemetryFrame() {
    return {
      AirTemp: parseFloat(this.airTemp.toFixed(1)),
      TrackTemp: parseFloat(this.trackTemp.toFixed(1)),
      WindVel: parseFloat(this.windVel.toFixed(1)),
      WindDir: parseFloat(this.windDir.toFixed(2)),
      Skies: this.skies,
    };
  }
}
