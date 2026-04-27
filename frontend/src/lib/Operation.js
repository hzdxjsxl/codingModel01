export class Operation {
  constructor(options = {}) {
    this.id = options.id || this.generateId();
    this.type = options.type;
    this.position = options.position;
    this.character = options.character;
    this.length = options.length || 1;
    this.clientId = options.clientId;
    this.vectorClock = options.vectorClock || {};
    this.timestamp = options.timestamp || Date.now();
  }

  generateId() {
    return `op_${this.clientId || 'unknown'}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static createInsert(position, character, clientId, vectorClock) {
    return new Operation({
      type: 'insert',
      position,
      character,
      clientId,
      vectorClock: vectorClock ? { ...vectorClock } : {}
    });
  }

  static createDelete(position, length, clientId, vectorClock) {
    return new Operation({
      type: 'delete',
      position,
      length,
      clientId,
      vectorClock: vectorClock ? { ...vectorClock } : {}
    });
  }

  transformAgainst(otherOp, isLeft = true) {
    if (this.type === 'insert' && otherOp.type === 'insert') {
      if (this.position > otherOp.position) {
        return this.cloneWithPosition(this.position + otherOp.length);
      } else if (this.position === otherOp.position) {
        if (this.clientId < otherOp.clientId) {
          return isLeft ? this.clone() : this.cloneWithPosition(this.position + otherOp.length);
        } else {
          return isLeft ? this.cloneWithPosition(this.position + otherOp.length) : this.clone();
        }
      }
      return this.clone();
    }

    if (this.type === 'insert' && otherOp.type === 'delete') {
      if (this.position > otherOp.position) {
        if (this.position <= otherOp.position + otherOp.length) {
          return this.cloneWithPosition(otherOp.position);
        } else {
          return this.cloneWithPosition(this.position - otherOp.length);
        }
      }
      return this.clone();
    }

    if (this.type === 'delete' && otherOp.type === 'insert') {
      if (this.position >= otherOp.position) {
        return this.cloneWithPosition(this.position + otherOp.length);
      }
      if (this.position + this.length > otherOp.position) {
        return this.cloneWithLength(this.length + otherOp.length);
      }
      return this.clone();
    }

    if (this.type === 'delete' && otherOp.type === 'delete') {
      if (this.position >= otherOp.position + otherOp.length) {
        return this.cloneWithPosition(this.position - otherOp.length);
      }
      if (this.position + this.length <= otherOp.position) {
        return this.clone();
      }

      let newPos = Math.min(this.position, otherOp.position);
      let overlapStart = Math.max(this.position, otherOp.position);
      let overlapEnd = Math.min(this.position + this.length, otherOp.position + otherOp.length);
      let overlapLength = overlapEnd - overlapStart;

      let newLength = this.length - overlapLength;
      
      if (newLength <= 0) {
        return null;
      }

      if (this.position < otherOp.position) {
        return new Operation({
          ...this,
          position: newPos,
          length: otherOp.position - this.position
        });
      } else {
        return new Operation({
          ...this,
          position: otherOp.position,
          length: this.position + this.length - (otherOp.position + otherOp.length)
        });
      }
    }

    return this.clone();
  }

  clone() {
    return new Operation({ ...this });
  }

  cloneWithPosition(newPosition) {
    return new Operation({ ...this, position: newPosition });
  }

  cloneWithLength(newLength) {
    return new Operation({ ...this, length: newLength });
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      position: this.position,
      character: this.character,
      length: this.length,
      clientId: this.clientId,
      vectorClock: this.vectorClock,
      timestamp: this.timestamp
    };
  }

  static fromJSON(json) {
    return new Operation(json);
  }

  applyToString(str) {
    if (this.type === 'insert') {
      return str.slice(0, this.position) + this.character + str.slice(this.position);
    } else if (this.type === 'delete') {
      return str.slice(0, this.position) + str.slice(this.position + this.length);
    }
    return str;
  }
}

export default Operation;
