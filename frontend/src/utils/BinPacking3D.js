class Item {
  constructor(id, length, width, height, weight = 0) {
    this.id = id;
    this.length = length;
    this.width = width;
    this.height = height;
    this.weight = weight;
    this.volume = length * width * height;
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.rotation = 0;
  }

  getDimensions() {
    const rotations = [
      { length: this.length, width: this.width, height: this.height },
      { length: this.length, width: this.height, height: this.width },
      { length: this.width, width: this.length, height: this.height },
      { length: this.width, width: this.height, height: this.length },
      { length: this.height, width: this.length, height: this.width },
      { length: this.height, width: this.width, height: this.length }
    ];
    return rotations;
  }
}

class Space {
  constructor(x, y, z, length, width, height) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.length = length;
    this.width = width;
    this.height = height;
    this.volume = length * width * height;
  }

  canFit(item, rotation) {
    return (
      rotation.length <= this.length &&
      rotation.width <= this.width &&
      rotation.height <= this.height
    );
  }
}

class BinPacking3D {
  constructor(containerLength, containerWidth, containerHeight) {
    this.container = {
      length: containerLength,
      width: containerWidth,
      height: containerHeight,
      volume: containerLength * containerWidth * containerHeight
    };
    this.spaces = [new Space(0, 0, 0, containerLength, containerWidth, containerHeight)];
    this.packedItems = [];
    this.unpackedItems = [];
    this.totalPackedVolume = 0;
  }

  sortItemsByVolumeDescending(items) {
    return [...items].sort((a, b) => b.volume - a.volume);
  }

  sortSpacesByPosition(spaces) {
    return [...spaces].sort((a, b) => {
      if (a.z !== b.z) return a.z - b.z;
      if (a.y !== b.y) return a.y - b.y;
      return a.x - b.x;
    });
  }

  findBestSpace(item) {
    let bestSpace = null;
    let bestRotation = null;
    let bestSpaceIndex = -1;
    let minWaste = Infinity;

    const rotations = item.getDimensions();

    for (let i = 0; i < this.spaces.length; i++) {
      const space = this.spaces[i];
      
      for (let j = 0; j < rotations.length; j++) {
        const rotation = rotations[j];
        
        if (space.canFit(item, rotation)) {
          const waste = space.volume - (rotation.length * rotation.width * rotation.height);
          
          if (waste < minWaste) {
            minWaste = waste;
            bestSpace = space;
            bestRotation = rotation;
            bestSpaceIndex = i;
          }
        }
      }
    }

    return { bestSpace, bestRotation, bestSpaceIndex };
  }

  splitSpace(space, item, rotation) {
    const newSpaces = [];

    const remainingLength = space.length - rotation.length;
    const remainingWidth = space.width - rotation.width;
    const remainingHeight = space.height - rotation.height;

    if (remainingLength > 0) {
      newSpaces.push(new Space(
        space.x + rotation.length,
        space.y,
        space.z,
        remainingLength,
        rotation.width,
        rotation.height
      ));
    }

    if (remainingWidth > 0) {
      newSpaces.push(new Space(
        space.x,
        space.y + rotation.width,
        space.z,
        space.length,
        remainingWidth,
        rotation.height
      ));
    }

    if (remainingHeight > 0) {
      newSpaces.push(new Space(
        space.x,
        space.y,
        space.z + rotation.height,
        space.length,
        space.width,
        remainingHeight
      ));
    }

    return newSpaces;
  }

  pack(items) {
    const itemObjects = items.map(
      item => new Item(item.id, item.length, item.width, item.height, item.weight)
    );

    const sortedItems = this.sortItemsByVolumeDescending(itemObjects);

    for (const item of sortedItems) {
      const { bestSpace, bestRotation, bestSpaceIndex } = this.findBestSpace(item);

      if (bestSpace && bestRotation) {
        item.x = bestSpace.x;
        item.y = bestSpace.y;
        item.z = bestSpace.z;
        item.placedLength = bestRotation.length;
        item.placedWidth = bestRotation.width;
        item.placedHeight = bestRotation.height;

        this.packedItems.push(item);
        this.totalPackedVolume += item.volume;

        this.spaces.splice(bestSpaceIndex, 1);

        const newSpaces = this.splitSpace(bestSpace, item, bestRotation);
        this.spaces.push(...newSpaces);

        this.spaces = this.sortSpacesByPosition(this.spaces);
      } else {
        this.unpackedItems.push(item);
      }
    }

    return {
      packedItems: this.packedItems.map(item => ({
        id: item.id,
        x: item.x,
        y: item.y,
        z: item.z,
        length: item.placedLength || item.length,
        width: item.placedWidth || item.width,
        height: item.placedHeight || item.height,
        originalLength: item.length,
        originalWidth: item.width,
        originalHeight: item.height,
        volume: item.volume,
        weight: item.weight
      })),
      unpackedItems: this.unpackedItems.map(item => ({
        id: item.id,
        length: item.length,
        width: item.width,
        height: item.height,
        volume: item.volume,
        weight: item.weight
      })),
      container: this.container,
      spaceUtilization: (this.totalPackedVolume / this.container.volume) * 100,
      totalPackedVolume: this.totalPackedVolume,
      totalItems: items.length,
      packedCount: this.packedItems.length,
      unpackedCount: this.unpackedItems.length
    };
  }
}

export default BinPacking3D;
