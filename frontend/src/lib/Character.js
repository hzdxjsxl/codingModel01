export class Identifier {
  constructor(position, siteId) {
    this.position = position;
    this.siteId = siteId;
  }

  compareTo(other) {
    if (this.position < other.position) return -1;
    if (this.position > other.position) return 1;
    
    if (this.siteId < other.siteId) return -1;
    if (this.siteId > other.siteId) return 1;
    
    return 0;
  }

  clone() {
    return new Identifier(this.position, this.siteId);
  }

  toJSON() {
    return {
      position: this.position,
      siteId: this.siteId
    };
  }

  static fromJSON(json) {
    return new Identifier(json.position, json.siteId);
  }
}

export class CharacterId {
  constructor(identifiers = []) {
    this.identifiers = identifiers.map(id => 
      id instanceof Identifier ? id : Identifier.fromJSON(id)
    );
  }

  compareTo(other) {
    const minLen = Math.min(this.identifiers.length, other.identifiers.length);
    
    for (let i = 0; i < minLen; i++) {
      const cmp = this.identifiers[i].compareTo(other.identifiers[i]);
      if (cmp !== 0) return cmp;
    }
    
    return this.identifiers.length - other.identifiers.length;
  }

  static min() {
    return new CharacterId([new Identifier(0, '')]);
  }

  static max() {
    return new CharacterId([new Identifier(Number.MAX_SAFE_INTEGER, '')]);
  }

  static between(id1, id2, siteId, sequenceNumber) {
    if (!id1) id1 = CharacterId.min();
    if (!id2) id2 = CharacterId.max();
    
    if (id1.compareTo(id2) >= 0) {
      throw new Error('id1 must be less than id2');
    }

    const ids1 = id1.identifiers;
    const ids2 = id2.identifiers;
    const result = [];
    
    let i = 0;
    while (i < ids1.length && i < ids2.length) {
      const pos1 = ids1[i].position;
      const pos2 = ids2[i].position;
      
      if (pos2 - pos1 > 1) {
        const newPos = pos1 + Math.floor((pos2 - pos1) / 2);
        result.push(new Identifier(newPos, siteId));
        return new CharacterId(result);
      } else if (pos2 - pos1 === 1) {
        result.push(ids1[i].clone());
        const remaining1 = new CharacterId(ids1.slice(i + 1));
        const between = CharacterId.between(
          remaining1,
          CharacterId.max(),
          siteId,
          sequenceNumber
        );
        return new CharacterId([...result, ...between.identifiers]);
      } else {
        const site1 = ids1[i].siteId;
        const site2 = ids2[i].siteId;
        
        if (siteId > site1 && siteId < site2) {
          result.push(new Identifier(pos1, siteId));
          return new CharacterId(result);
        } else if (siteId === site1) {
          result.push(ids1[i].clone());
          i++;
        } else if (siteId > site1 && siteId > site2 && pos1 === pos2) {
          result.push(ids1[i].clone());
          const remaining1 = new CharacterId(ids1.slice(i + 1));
          const between = CharacterId.between(
            remaining1,
            CharacterId.max(),
            siteId,
            sequenceNumber
          );
          return new CharacterId([...result, ...between.identifiers]);
        } else {
          result.push(ids1[i].clone());
          i++;
        }
      }
    }
    
    while (i < ids1.length) {
      result.push(ids1[i].clone());
      i++;
    }
    
    result.push(new Identifier(sequenceNumber % 10000 + 1, siteId));
    return new CharacterId(result);
  }

  clone() {
    return new CharacterId(this.identifiers.map(id => id.clone()));
  }

  toJSON() {
    return this.identifiers.map(id => id.toJSON());
  }

  static fromJSON(json) {
    return new CharacterId(json);
  }
}

export class Character {
  constructor(id, value, siteId, isDeleted = false) {
    this.id = id instanceof CharacterId ? id : CharacterId.fromJSON(id);
    this.value = value;
    this.siteId = siteId;
    this.isDeleted = isDeleted;
  }

  compareTo(other) {
    return this.id.compareTo(other.id);
  }

  delete() {
    this.isDeleted = true;
  }

  clone() {
    return new Character(this.id.clone(), this.value, this.siteId, this.isDeleted);
  }

  toJSON() {
    return {
      id: this.id.toJSON(),
      value: this.value,
      siteId: this.siteId,
      isDeleted: this.isDeleted
    };
  }

  static fromJSON(json) {
    return new Character(json.id, json.value, json.siteId, json.isDeleted);
  }
}

export default { Character, CharacterId, Identifier };
