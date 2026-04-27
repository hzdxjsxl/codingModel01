export class VectorClock {
  constructor(clientId, initialClock = {}) {
    this.clientId = clientId;
    this.clock = { ...initialClock };
    if (!(clientId in this.clock)) {
      this.clock[clientId] = 0;
    }
  }

  increment() {
    this.clock[this.clientId] = (this.clock[this.clientId] || 0) + 1;
    return this.clone();
  }

  merge(otherClock) {
    for (const [clientId, time] of Object.entries(otherClock.clock || otherClock)) {
      this.clock[clientId] = Math.max(this.clock[clientId] || 0, time);
    }
    return this.clone();
  }

  compare(otherClock) {
    const other = otherClock.clock || otherClock;
    let thisGreater = false;
    let otherGreater = false;

    const allClients = new Set([...Object.keys(this.clock), ...Object.keys(other)]);

    for (const client of allClients) {
      const thisTime = this.clock[client] || 0;
      const otherTime = other[client] || 0;

      if (thisTime > otherTime) {
        thisGreater = true;
      } else if (thisTime < otherTime) {
        otherGreater = true;
      }
    }

    if (thisGreater && !otherGreater) return 1;
    if (otherGreater && !thisGreater) return -1;
    return 0;
  }

  happensBefore(otherClock) {
    return this.compare(otherClock) === -1;
  }

  happensAfter(otherClock) {
    return this.compare(otherClock) === 1;
  }

  concurrent(otherClock) {
    return this.compare(otherClock) === 0;
  }

  getTime(clientId) {
    return this.clock[clientId] || 0;
  }

  clone() {
    return new VectorClock(this.clientId, { ...this.clock });
  }

  toJSON() {
    return { ...this.clock };
  }

  static fromJSON(clientId, json) {
    return new VectorClock(clientId, json);
  }
}

export default VectorClock;
