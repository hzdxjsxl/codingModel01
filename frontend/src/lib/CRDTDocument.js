import { VectorClock } from './VectorClock.js';
import { Operation } from './Operation.js';

export class CRDTDocument {
  constructor(clientId, initialContent = '') {
    this.clientId = clientId;
    this.content = initialContent;
    this.vectorClock = new VectorClock(clientId);
    this.operationHistory = [];
    this.pendingOperations = [];
  }

  getContent() {
    return this.content;
  }

  getVectorClock() {
    return this.vectorClock.clone();
  }

  localInsert(position, character) {
    this.vectorClock.increment();
    
    const op = Operation.createInsert(
      position,
      character,
      this.clientId,
      this.vectorClock.toJSON()
    );

    this.content = op.applyToString(this.content);
    this.operationHistory.push(op);
    
    return op;
  }

  localDelete(position, length = 1) {
    this.vectorClock.increment();

    const op = Operation.createDelete(
      position,
      length,
      this.clientId,
      this.vectorClock.toJSON()
    );

    this.content = op.applyToString(this.content);
    this.operationHistory.push(op);

    return op;
  }

  remoteOperation(remoteOp) {
    const remoteClock = remoteOp.vectorClock || {};
    const localClock = this.vectorClock.toJSON();

    let transformedOp = remoteOp;
    
    for (const localOp of this.operationHistory) {
      const localOpTime = localOp.vectorClock || {};
      
      if (this.isConcurrent(localOpTime, remoteClock)) {
        const transformed = transformedOp.transformAgainst(localOp, false);
        if (transformed === null) {
          return null;
        }
        transformedOp = transformed;
      }
    }

    this.vectorClock.merge({ clock: remoteClock });
    this.content = transformedOp.applyToString(this.content);
    this.operationHistory.push(transformedOp);

    return transformedOp;
  }

  isConcurrent(clock1, clock2) {
    let clock1Greater = false;
    let clock2Greater = false;

    const allKeys = new Set([...Object.keys(clock1), ...Object.keys(clock2)]);

    for (const key of allKeys) {
      const t1 = clock1[key] || 0;
      const t2 = clock2[key] || 0;

      if (t1 > t2) clock1Greater = true;
      if (t1 < t2) clock2Greater = true;
    }

    return clock1Greater && clock2Greater;
  }

  batchApply(operations) {
    const sortedOps = [...operations].sort((a, b) => {
      const aTime = a.timestamp || 0;
      const bTime = b.timestamp || 0;
      if (aTime !== bTime) return aTime - bTime;
      return (a.clientId || '').localeCompare(b.clientId || '');
    });

    const results = [];
    for (const op of sortedOps) {
      const result = this.remoteOperation(op);
      if (result) {
        results.push(result);
      }
    }

    return results;
  }

  applyOperationAtCursor(op, cursorPos) {
    let adjustedCursor = cursorPos;
    
    if (op.type === 'insert') {
      if (op.position <= cursorPos) {
        adjustedCursor = cursorPos + op.length;
      }
    } else if (op.type === 'delete') {
      if (op.position < cursorPos) {
        if (op.position + op.length <= cursorPos) {
          adjustedCursor = cursorPos - op.length;
        } else {
          adjustedCursor = op.position;
        }
      }
    }

    this.content = op.applyToString(this.content);
    return adjustedCursor;
  }

  getHistory() {
    return [...this.operationHistory];
  }

  clearHistory() {
    this.operationHistory = [];
  }

  toJSON() {
    return {
      clientId: this.clientId,
      content: this.content,
      vectorClock: this.vectorClock.toJSON(),
      operationHistory: this.operationHistory.map(op => op.toJSON())
    };
  }

  static fromJSON(json) {
    const doc = new CRDTDocument(json.clientId, json.content);
    doc.vectorClock = VectorClock.fromJSON(json.clientId, json.vectorClock);
    doc.operationHistory = (json.operationHistory || []).map(op => Operation.fromJSON(op));
    return doc;
  }
}

export default CRDTDocument;
