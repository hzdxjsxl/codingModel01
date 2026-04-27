import { describe, it, expect, beforeEach } from 'vitest';
import BinPacking3D from './BinPacking3D';

describe('BinPacking3D', () => {
  describe('Basic Functionality', () => {
    it('should create a BinPacking3D instance with container dimensions', () => {
      const binPacking = new BinPacking3D(100, 80, 60);
      expect(binPacking).toBeDefined();
    });

    it('should pack a single item that fits exactly', () => {
      const binPacking = new BinPacking3D(100, 80, 60);
      const items = [
        { id: 'item1', length: 100, width: 80, height: 60, weight: 10 }
      ];
      
      const result = binPacking.pack(items);
      
      expect(result.packedCount).toBe(1);
      expect(result.unpackedCount).toBe(0);
      expect(result.spaceUtilization).toBeCloseTo(100, 5);
    });

    it('should pack multiple items', () => {
      const binPacking = new BinPacking3D(200, 100, 100);
      const items = [
        { id: 'item1', length: 100, width: 100, height: 100, weight: 10 },
        { id: 'item2', length: 100, width: 100, height: 100, weight: 10 }
      ];
      
      const result = binPacking.pack(items);
      
      expect(result.packedCount).toBe(2);
      expect(result.unpackedCount).toBe(0);
    });

    it('should handle items that do not fit', () => {
      const binPacking = new BinPacking3D(50, 50, 50);
      const items = [
        { id: 'item1', length: 100, width: 80, height: 60, weight: 10 }
      ];
      
      const result = binPacking.pack(items);
      
      expect(result.packedCount).toBe(0);
      expect(result.unpackedCount).toBe(1);
    });
  });

  describe('Item Rotation', () => {
    it('should rotate items to fit', () => {
      const binPacking = new BinPacking3D(80, 100, 60);
      const items = [
        { id: 'item1', length: 100, width: 80, height: 60, weight: 10 }
      ];
      
      const result = binPacking.pack(items);
      
      expect(result.packedCount).toBe(1);
    });

    it('should try all 6 rotations', () => {
      const binPacking = new BinPacking3D(60, 80, 100);
      const items = [
        { id: 'item1', length: 100, width: 80, height: 60, weight: 10 }
      ];
      
      const result = binPacking.pack(items);
      
      expect(result.packedCount).toBe(1);
    });
  });

  describe('Best-Fit Algorithm', () => {
    it('should sort items by volume descending', () => {
      const binPacking = new BinPacking3D(500, 200, 200);
      const items = [
        { id: 'small', length: 50, width: 50, height: 50, weight: 1 },
        { id: 'large', length: 150, width: 150, height: 150, weight: 10 },
        { id: 'medium', length: 100, width: 100, height: 100, weight: 5 }
      ];
      
      const result = binPacking.pack(items);
      
      expect(result.packedCount).toBe(3);
      expect(result.unpackedCount).toBe(0);
    });

    it('should calculate correct space utilization', () => {
      const binPacking = new BinPacking3D(200, 200, 200);
      const containerVolume = 200 * 200 * 200;
      
      const items = [
        { id: 'item1', length: 100, width: 100, height: 100, weight: 10 }
      ];
      
      const result = binPacking.pack(items);
      const expectedUtilization = (100 * 100 * 100 / containerVolume) * 100;
      
      expect(result.spaceUtilization).toBeCloseTo(expectedUtilization, 5);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty item list', () => {
      const binPacking = new BinPacking3D(100, 80, 60);
      const result = binPacking.pack([]);
      
      expect(result.packedCount).toBe(0);
      expect(result.unpackedCount).toBe(0);
      expect(result.spaceUtilization).toBe(0);
    });

    it('should calculate correct coordinates for packed items', () => {
      const binPacking = new BinPacking3D(200, 100, 100);
      const items = [
        { id: 'item1', length: 100, width: 100, height: 100, weight: 10 },
        { id: 'item2', length: 100, width: 100, height: 100, weight: 10 }
      ];
      
      const result = binPacking.pack(items);
      
      expect(result.packedItems[0].x).toBe(0);
      expect(result.packedItems[0].y).toBe(0);
      expect(result.packedItems[0].z).toBe(0);
      
      expect(result.packedCount).toBe(2);
    });

    it('should return all packed items with correct properties', () => {
      const binPacking = new BinPacking3D(200, 200, 200);
      const items = [
        { id: 'test', length: 100, width: 80, height: 60, weight: 50 }
      ];
      
      const result = binPacking.pack(items);
      const packedItem = result.packedItems[0];
      
      expect(packedItem.id).toBe('test');
      expect(packedItem.x).toBeDefined();
      expect(packedItem.y).toBeDefined();
      expect(packedItem.z).toBeDefined();
      expect(packedItem.volume).toBe(100 * 80 * 60);
      expect(packedItem.weight).toBe(50);
    });
  });

  describe('Real-world Scenario', () => {
    it('should handle container planning scenario', () => {
      const binPacking = new BinPacking3D(1200, 235, 269);
      const items = [
        { id: 'C001', length: 100, width: 80, height: 60, weight: 50 },
        { id: 'C002', length: 100, width: 80, height: 60, weight: 50 },
        { id: 'C003', length: 100, width: 80, height: 60, weight: 50 },
        { id: 'C004', length: 100, width: 80, height: 60, weight: 50 },
        { id: 'C005', length: 120, width: 100, height: 80, weight: 80 },
        { id: 'C006', length: 120, width: 100, height: 80, weight: 80 },
        { id: 'C007', length: 120, width: 100, height: 80, weight: 80 },
        { id: 'C008', length: 80, width: 60, height: 50, weight: 30 },
        { id: 'C009', length: 80, width: 60, height: 50, weight: 30 },
        { id: 'C010', length: 80, width: 60, height: 50, weight: 30 }
      ];
      
      const result = binPacking.pack(items);
      
      console.log('Test Result:');
      console.log('  Total items:', result.totalItems);
      console.log('  Packed:', result.packedCount);
      console.log('  Unpacked:', result.unpackedCount);
      console.log('  Space Utilization:', result.spaceUtilization.toFixed(2) + '%');
      
      expect(result.totalItems).toBe(10);
      expect(result.spaceUtilization).toBeGreaterThan(0);
    });
  });
});
