<template>
  <div class="container-visualizer">
    <div class="visualization-panel">
      <div ref="container3d" class="three-container"></div>
      <div class="controls-panel">
        <div class="control-group">
          <label>
            <input type="checkbox" v-model="showGrid" @change="toggleGrid" />
            显示网格
          </label>
          <label>
            <input type="checkbox" v-model="showAxes" @change="toggleAxes" />
            显示坐标轴
          </label>
          <label>
            <input type="checkbox" v-model="autoRotate" @change="toggleAutoRotate" />
            自动旋转
          </label>
        </div>
        <div class="animation-controls">
          <button @click="playAnimation" :disabled="isAnimating || packedItems.length === 0">
            {{ isAnimating ? '播放中...' : '播放动画' }}
          </button>
          <button @click="resetAnimation" :disabled="isAnimating">
            重置
          </button>
          <button @click="showAllBoxes">
            显示全部
          </button>
        </div>
      </div>
    </div>
    
    <div class="info-panel" v-if="packingResult">
      <h3>装箱统计</h3>
      <div class="stats-grid">
        <div class="stat-item">
          <span class="label">货柜尺寸:</span>
          <span class="value">{{ containerInfo }}</span>
        </div>
        <div class="stat-item">
          <span class="label">货物总数:</span>
          <span class="value">{{ packingResult.totalItems }}</span>
        </div>
        <div class="stat-item">
          <span class="label">已装箱:</span>
          <span class="value success">{{ packingResult.packedCount }}</span>
        </div>
        <div class="stat-item">
          <span class="label">未装箱:</span>
          <span class="value error">{{ packingResult.unpackedCount }}</span>
        </div>
        <div class="stat-item">
          <span class="label">空间利用率:</span>
          <span class="value highlight">{{ packingResult.spaceUtilization.toFixed(2) }}%</span>
        </div>
        <div class="stat-item">
          <span class="label">已装箱体积:</span>
          <span class="value">{{ packingResult.totalPackedVolume.toFixed(0) }}</span>
        </div>
      </div>
      
      <div class="cargo-list" v-if="packedItems.length > 0">
        <h4>货物详情</h4>
        <div class="list-header">
          <span>ID</span>
          <span>尺寸</span>
          <span>位置</span>
        </div>
        <div class="list-items" :class="{ 'scrolling': isAnimating }">
          <div 
            v-for="item in packedItems" 
            :key="item.id" 
            class="list-item"
            :class="{ 'highlighted': currentAnimationIndex >= packedItems.indexOf(item) }"
            @mouseenter="highlightItem(item)"
            @mouseleave="unhighlightItem(item)"
          >
            <span>{{ item.id }}</span>
            <span>{{ item.length.toFixed(0) }}×{{ item.width.toFixed(0) }}×{{ item.height.toFixed(0) }}</span>
            <span>({{ item.x.toFixed(0) }}, {{ item.y.toFixed(0) }}, {{ item.z.toFixed(0) }})</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export default {
  name: 'ContainerVisualizer',
  props: {
    packingResult: {
      type: Object,
      default: null
    }
  },
  setup(props) {
    const showGrid = ref(true);
    const showAxes = ref(true);
    const autoRotate = ref(false);
    const isAnimating = ref(false);
    const currentAnimationIndex = ref(-1);
    const packedItems = ref([]);
    const container3d = ref(null);

    let scene = null;
    let camera = null;
    let renderer = null;
    let controls = null;
    let gridHelper = null;
    let axesHelper = null;
    let containerMesh = null;
    let boxMeshes = [];
    let animationFrameId = null;
    let animationStartTime = 0;
    const animationDuration = 500;
    const colors = [
      0x4CAF50, 0x2196F3, 0xFF9800, 0xE91E63, 0x9C27B0,
      0x00BCD4, 0xFFEB3B, 0x795548, 0x607D8B, 0xF44336,
      0x8BC34A, 0x03A9F4, 0xFFC107, 0x3F51B5, 0x009688
    ];

    const containerInfo = computed(() => {
      if (!props.packingResult) return '';
      const c = props.packingResult.container;
      return `${c.length.toFixed(0)} × ${c.width.toFixed(0)} × ${c.height.toFixed(0)}`;
    });

    watch(() => props.packingResult, (newVal) => {
      if (newVal && newVal.packedItems) {
        packedItems.value = newVal.packedItems;
        nextTick(() => {
          initScene();
          clearBoxes();
          showAllBoxes();
        });
      }
    }, { deep: true });

    onMounted(() => {
      initScene();
      window.addEventListener('resize', onWindowResize);
    });

    onUnmounted(() => {
      dispose();
      window.removeEventListener('resize', onWindowResize);
    });

    function initScene() {
      if (scene) {
        dispose();
      }

      const container = container3d.value;
      if (!container) return;

      const width = container.clientWidth;
      const height = container.clientHeight;

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x1a1a2e);

      camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 10000);
      camera.position.set(2000, 1500, 2000);

      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      container.appendChild(renderer.domElement);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.screenSpacePanning = true;
      controls.minDistance = 500;
      controls.maxDistance = 10000;
      controls.autoRotate = autoRotate.value;
      controls.autoRotateSpeed = 0.5;

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(2000, 3000, 2000);
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.width = 2048;
      directionalLight.shadow.mapSize.height = 2048;
      scene.add(directionalLight);

      const sideLight = new THREE.DirectionalLight(0xffffff, 0.4);
      sideLight.position.set(-2000, 2000, -2000);
      scene.add(sideLight);

      if (showGrid.value) {
        addGrid();
      }
      if (showAxes.value) {
        addAxes();
      }

      if (props.packingResult) {
        drawContainer();
      }

      animate();
    }

    function addGrid() {
      if (gridHelper) {
        scene.remove(gridHelper);
      }
      gridHelper = new THREE.GridHelper(5000, 50, 0x444444, 0x333333);
      scene.add(gridHelper);
    }

    function addAxes() {
      if (axesHelper) {
        scene.remove(axesHelper);
      }
      axesHelper = new THREE.AxesHelper(1000);
      scene.add(axesHelper);
    }

    function toggleGrid() {
      if (showGrid.value) {
        addGrid();
      } else if (gridHelper) {
        scene.remove(gridHelper);
      }
    }

    function toggleAxes() {
      if (showAxes.value) {
        addAxes();
      } else if (axesHelper) {
        scene.remove(axesHelper);
      }
    }

    function toggleAutoRotate() {
      if (controls) {
        controls.autoRotate = autoRotate.value;
      }
    }

    function drawContainer() {
      if (containerMesh) {
        scene.remove(containerMesh);
      }

      const container = props.packingResult.container;
      const geometry = new THREE.BoxGeometry(container.length, container.height, container.width);
      
      const edges = new THREE.EdgesGeometry(geometry);
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00ff88, linewidth: 2 });
      containerMesh = new THREE.LineSegments(edges, lineMaterial);
      
      containerMesh.position.set(
        container.length / 2,
        container.height / 2,
        container.width / 2
      );

      scene.add(containerMesh);
    }

    function clearBoxes() {
      boxMeshes.forEach(mesh => {
        scene.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
      });
      boxMeshes = [];
      currentAnimationIndex.value = -1;
    }

    function createBoxMesh(item, index) {
      const colorIndex = index % colors.length;
      const color = colors[colorIndex];

      const geometry = new THREE.BoxGeometry(item.length, item.height, item.width);
      
      const material = new THREE.MeshPhongMaterial({
        color: color,
        transparent: true,
        opacity: 0.9,
        shininess: 50,
        specular: 0x111111
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const edges = new THREE.EdgesGeometry(geometry);
      const edgeMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 1 });
      const wireframe = new THREE.LineSegments(edges, edgeMaterial);
      mesh.add(wireframe);

      mesh.position.set(
        item.x + item.length / 2,
        item.y + item.height / 2,
        item.z + item.width / 2
      );

      mesh.userData = { item, index, color };

      return mesh;
    }

    function showAllBoxes() {
      clearBoxes();
      
      packedItems.value.forEach((item, index) => {
        const mesh = createBoxMesh(item, index);
        mesh.visible = true;
        mesh.scale.set(1, 1, 1);
        scene.add(mesh);
        boxMeshes.push(mesh);
      });
      
      currentAnimationIndex.value = packedItems.value.length - 1;
      isAnimating.value = false;
    }

    function playAnimation() {
      if (isAnimating.value || packedItems.value.length === 0) return;

      clearBoxes();
      isAnimating.value = true;
      currentAnimationIndex.value = 0;
      animationStartTime = performance.now();

      animateBoxes();
    }

    function animateBoxes() {
      if (!isAnimating.value || currentAnimationIndex.value >= packedItems.value.length) {
        isAnimating.value = false;
        return;
      }

      const currentTime = performance.now();
      const elapsed = currentTime - animationStartTime;

      if (boxMeshes.length <= currentAnimationIndex.value) {
        const item = packedItems.value[currentAnimationIndex.value];
        const mesh = createBoxMesh(item, currentAnimationIndex.value);
        mesh.visible = true;
        mesh.scale.set(0.01, 0.01, 0.01);
        mesh.material.opacity = 0;
        scene.add(mesh);
        boxMeshes.push(mesh);
      }

      const mesh = boxMeshes[currentAnimationIndex.value];
      const progress = Math.min(elapsed / animationDuration, 1);
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);

      const scale = 0.01 + (1 - 0.01) * easeOutCubic;
      mesh.scale.set(scale, scale, scale);
      mesh.material.opacity = easeOutCubic * 0.9;

      if (progress >= 1) {
        currentAnimationIndex.value++;
        animationStartTime = performance.now();
        
        if (currentAnimationIndex.value < packedItems.value.length) {
          setTimeout(() => animateBoxes(), 200);
        } else {
          isAnimating.value = false;
        }
      } else {
        animationFrameId = requestAnimationFrame(() => animateBoxes());
      }
    }

    function resetAnimation() {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      clearBoxes();
      isAnimating.value = false;
    }

    function highlightItem(item) {
      const mesh = boxMeshes.find(m => m.userData.item.id === item.id);
      if (mesh) {
        mesh.material.emissive = new THREE.Color(0xffffff);
        mesh.material.emissiveIntensity = 0.3;
        mesh.scale.set(1.05, 1.05, 1.05);
      }
    }

    function unhighlightItem(item) {
      const mesh = boxMeshes.find(m => m.userData.item.id === item.id);
      if (mesh) {
        mesh.material.emissive = new THREE.Color(0x000000);
        mesh.material.emissiveIntensity = 0;
        mesh.scale.set(1, 1, 1);
      }
    }

    function animate() {
      if (!renderer || !scene || !camera) return;

      animationFrameId = requestAnimationFrame(() => animate());
      
      if (controls) {
        controls.update();
      }
      
      renderer.render(scene, camera);
    }

    function onWindowResize() {
      const container = container3d.value;
      if (!container || !camera || !renderer) return;

      const width = container.clientWidth;
      const height = container.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    }

    function dispose() {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      if (controls) {
        controls.dispose();
      }

      if (renderer) {
        renderer.dispose();
        const container = container3d.value;
        if (container && renderer.domElement) {
          container.removeChild(renderer.domElement);
        }
      }

      boxMeshes.forEach(mesh => {
        mesh.geometry.dispose();
        mesh.material.dispose();
      });

      if (gridHelper) {
        gridHelper.geometry.dispose();
        gridHelper.material.dispose();
      }
      if (axesHelper) {
        axesHelper.geometry.dispose();
        axesHelper.material.dispose();
      }
      if (containerMesh) {
        containerMesh.geometry.dispose();
        containerMesh.material.dispose();
      }

      scene = null;
      camera = null;
      renderer = null;
      controls = null;
      boxMeshes = [];
    }

    return {
      showGrid,
      showAxes,
      autoRotate,
      isAnimating,
      currentAnimationIndex,
      packedItems,
      container3d,
      containerInfo,
      toggleGrid,
      toggleAxes,
      toggleAutoRotate,
      playAnimation,
      resetAnimation,
      showAllBoxes,
      highlightItem,
      unhighlightItem
    };
  }
};
</script>

<style scoped>
.container-visualizer {
  display: flex;
  width: 100%;
  height: 100%;
  background-color: #1a1a2e;
}

.visualization-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
}

.three-container {
  flex: 1;
  width: 100%;
  min-height: 400px;
}

.controls-panel {
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  z-index: 10;
  pointer-events: none;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: rgba(30, 30, 50, 0.9);
  padding: 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  pointer-events: auto;
}

.control-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #ccc;
  font-size: 13px;
  cursor: pointer;
}

.control-group input[type="checkbox"] {
  cursor: pointer;
  width: 14px;
  height: 14px;
}

.animation-controls {
  display: flex;
  gap: 8px;
  background: rgba(30, 30, 50, 0.9);
  padding: 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  pointer-events: auto;
}

.animation-controls button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.animation-controls button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.animation-controls button:disabled {
  background: #555;
  cursor: not-allowed;
  opacity: 0.6;
}

.info-panel {
  width: 320px;
  background: linear-gradient(180deg, #16213e 0%, #1a1a2e 100%);
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  padding: 20px;
  overflow-y: auto;
  color: #eee;
}

.info-panel h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #00ff88;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 8px;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  margin-bottom: 24px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.stat-item .label {
  color: #aaa;
  font-size: 13px;
}

.stat-item .value {
  font-weight: 600;
  font-size: 14px;
  color: #fff;
}

.stat-item .value.success {
  color: #00ff88;
}

.stat-item .value.error {
  color: #ff6b6b;
}

.stat-item .value.highlight {
  color: #ffd700;
  font-size: 16px;
}

.cargo-list {
  margin-top: 20px;
}

.cargo-list h4 {
  margin: 0 0 12px 0;
  font-size: 15px;
  color: #8bc34a;
}

.list-header {
  display: grid;
  grid-template-columns: 60px 1fr 1fr;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  font-size: 12px;
  color: #888;
  font-weight: 600;
}

.list-items {
  max-height: 300px;
  overflow-y: auto;
  margin-top: 8px;
  scrollbar-width: thin;
  scrollbar-color: #555 #222;
}

.list-items::-webkit-scrollbar {
  width: 6px;
}

.list-items::-webkit-scrollbar-track {
  background: #222;
  border-radius: 3px;
}

.list-items::-webkit-scrollbar-thumb {
  background: #555;
  border-radius: 3px;
}

.list-items.scrolling {
  scroll-behavior: smooth;
}

.list-item {
  display: grid;
  grid-template-columns: 60px 1fr 1fr;
  gap: 8px;
  padding: 10px 12px;
  margin-bottom: 4px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.list-item:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.1);
}

.list-item.highlighted {
  background: rgba(0, 255, 136, 0.1);
  border-color: rgba(0, 255, 136, 0.3);
}

.list-item span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.list-item span:first-child {
  color: #00ff88;
  font-weight: 600;
}
</style>
