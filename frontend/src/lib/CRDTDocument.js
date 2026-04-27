import { Character, CharacterId } from './Character.js';
import { VectorClock } from './VectorClock.js';

export class CRDTDocument {
  constructor(clientId) {
    this.clientId = clientId;
    this.characters = [];
    this.vectorClock = new VectorClock(clientId);
    this.sequenceCounter = 0;
    this.characterIdMap = new Map();
  }

  getContent() {
    return this.characters
      .filter(char => !char.isDeleted)
      .map(char => char.value)
      .join('');
  }

  getLength() {
    return this.characters.filter(char => !char.isDeleted).length;
  }

  getVectorClock() {
    return this.vectorClock.clone();
  }

  localInsert(index, value) {
    this.sequenceCounter++;
    this.vectorClock.increment();

    const visibleChars = this.characters.filter(char => !char.isDeleted);
    
    let prevId = null;
    let nextId = null;

    if (index === 0) {
      prevId = null;
      nextId = visibleChars.length > 0 ? visibleChars[0].id : null;
    } else if (index >= visibleChars.length) {
      prevId = visibleChars.length > 0 ? visibleChars[visibleChars.length - 1].id : null;
      nextId = null;
    } else {
      prevId = visibleChars[index - 1].id;
      nextId = visibleChars[index].id;
    }

    const newId = CharacterId.between(
      prevId, 
      nextId, 
      this.clientId, 
      this.sequenceCounter
    );

    const newChar = new Character(newId, value, this.clientId, false);
    
    this.insertCharacterSorted(newChar);

    return {
      type: 'crdt-insert',
      id: newChar.id.toJSON(),
      value: newChar.value,
      siteId: newChar.siteId,
      vectorClock: this.vectorClock.toJSON(),
      timestamp: Date.now()
    };
  }

  localDelete(index) {
    const visibleChars = this.characters.filter(char => !char.isDeleted);
    
    if (index < 0 || index >= visibleChars.length) {
      return null;
    }

    const charToDelete = visibleChars[index];
    
    this.sequenceCounter++;
    this.vectorClock.increment();

    charToDelete.delete();

    return {
      type: 'crdt-delete',
      id: charToDelete.id.toJSON(),
      siteId: this.clientId,
      vectorClock: this.vectorClock.toJSON(),
      timestamp: Date.now()
    };
  }

  localDeleteRange(startIndex, length) {
    const operations = [];
    const visibleChars = this.characters.filter(char => !char.isDeleted);
    
    for (let i = 0; i < length && startIndex < visibleChars.length; i++) {
      const op = this.localDelete(startIndex);
      if (op) {
        operations.push(op);
      }
    }
    
    return operations;
  }

  applyRemoteOperation(operation) {
    if (operation.type === 'crdt-insert') {
      return this.applyRemoteInsert(operation);
    } else if (operation.type === 'crdt-delete') {
      return this.applyRemoteDelete(operation);
    }
    return null;
  }

  applyRemoteInsert(operation) {
    const charId = CharacterId.fromJSON(operation.id);
    const idKey = JSON.stringify(charId.toJSON());

    if (this.characterIdMap.has(idKey)) {
      return null;
    }

    const newChar = new Character(
      charId,
      operation.value,
      operation.siteId,
      false
    );

    this.insertCharacterSorted(newChar);

    if (operation.vectorClock) {
      this.vectorClock.merge({ clock: operation.vectorClock });
    }

    return newChar;
  }

  applyRemoteDelete(operation) {
    const charId = CharacterId.fromJSON(operation.id);
    const idKey = JSON.stringify(charId.toJSON());

    const char = this.characterIdMap.get(idKey);
    if (!char || char.isDeleted) {
      return null;
    }

    char.delete();

    if (operation.vectorClock) {
      this.vectorClock.merge({ clock: operation.vectorClock });
    }

    return char;
  }

  insertCharacterSorted(char) {
    const idKey = JSON.stringify(char.id.toJSON());
    
    if (this.characterIdMap.has(idKey)) {
      return;
    }

    let low = 0;
    let high = this.characters.length;

    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (this.characters[mid].id.compareTo(char.id) < 0) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }

    this.characters.splice(low, 0, char);
    this.characterIdMap.set(idKey, char);
  }

  getCharIndexById(charId) {
    const visibleChars = this.characters.filter(c => !c.isDeleted);
    const targetKey = JSON.stringify(charId.toJSON());
    
    for (let i = 0; i < visibleChars.length; i++) {
      const key = JSON.stringify(visibleChars[i].id.toJSON());
      if (key === targetKey) {
        return i;
      }
    }
    return -1;
  }

  getCharAtPosition(position) {
    const visibleChars = this.characters.filter(c => !c.isDeleted);
    if (position >= 0 && position < visibleChars.length) {
      return visibleChars[position];
    }
    return null;
  }

  getCursorAdjustmentForInsert(insertedCharId, originalCursor) {
    const insertedKey = JSON.stringify(insertedCharId.toJSON());
    const visibleChars = this.characters.filter(c => !c.isDeleted);
    
    let insertIndex = -1;
    for (let i = 0; i < visibleChars.length; i++) {
      const key = JSON.stringify(visibleChars[i].id.toJSON());
      if (key === insertedKey) {
        insertIndex = i;
        break;
      }
    }

    if (insertIndex === -1) return originalCursor;

    if (insertIndex < originalCursor) {
      return originalCursor + 1;
    }
    return originalCursor;
  }

  getCursorAdjustmentForDelete(deletedCharId, originalCursor) {
    const deletedKey = JSON.stringify(deletedCharId.toJSON());
    const visibleChars = this.characters.filter(c => !c.isDeleted);
    
    let deleteIndex = -1;
    for (let i = 0; i < this.characters.length; i++) {
      const char = this.characters[i];
      const key = JSON.stringify(char.id.toJSON());
      if (key === deletedKey) {
        let visibleBefore = 0;
        for (let j = 0; j < i; j++) {
          if (!this.characters[j].isDeleted) {
            visibleBefore++;
          }
        }
        deleteIndex = visibleBefore;
        break;
      }
    }

    if (deleteIndex === -1) return originalCursor;

    if (deleteIndex < originalCursor) {
      return Math.max(0, originalCursor - 1);
    }
    return originalCursor;
  }

  getOperationHistory() {
    return [...this.characters.map(c => c.toJSON())];
  }

  toJSON() {
    return {
      clientId: this.clientId,
      characters: this.characters.map(c => c.toJSON()),
      vectorClock: this.vectorClock.toJSON(),
      sequenceCounter: this.sequenceCounter
    };
  }

  static fromJSON(json) {
    const doc = new CRDTDocument(json.clientId);
    doc.sequenceCounter = json.sequenceCounter || 0;
    doc.vectorClock = VectorClock.fromJSON(json.clientId, json.vectorClock);
    
    for (const charJson of json.characters) {
      const char = Character.fromJSON(charJson);
      doc.characters.push(char);
      doc.characterIdMap.set(JSON.stringify(char.id.toJSON()), char);
    }
    
    doc.characters.sort((a, b) => a.id.compareTo(b.id));
    
    return doc;
  }
}

export default CRDTDocument;
