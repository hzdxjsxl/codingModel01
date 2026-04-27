<template>
  <div class="app-container">
    <header class="app-header">
      <h1>📦 货柜空间规划系统</h1>
      <p>Container Space Planning System - 3D Visualization</p>
    </header>

    <main class="app-main">
      <div class="control-section">
        <div class="action-buttons">
          <button 
            @click="fetchDataAndCalculate" 
            :disabled="isLoading"
            class="primary-btn"
          >
            {{ isLoading ? '计算中...' : '开始规划' }}
          </button>
          <button 
            @click="loadTestData" 
            :disabled="isLoading"
            class="secondary-btn"
          >
            加载测试数据
          </button>
          <button 
            @click="resetAll" 
            class="reset-btn"
          >
            重置
          </button>
        </div>

        <div v-if="error" class="error-message">
          ⚠️ {{ error }}
        </div>

        <div v-if="isLoading" class="loading-indicator">
          <div class="spinner"></div>
          <span>正在执行装箱算法计算...</span>
        </div>
      </div>

      <div class="visualization-section">
        <ContainerVisualizer 
          v-if="packingResult" 
          :packing-result="packingResult"
        />
        <div v-else class="empty-state">
          <div class="empty-icon">📦</div>
          <h3>点击"开始规划"获取数据并计算装箱方案</h3>
          <p>系统将从Java后端获取货柜尺寸和货物列表</p>
          <p>然后在前端执行3D装箱算法进行空间优化</p>
        </div>
      </div>
    </main>

    <footer class="app-footer">
      <p>© 2024 物流货柜空间规划系统 | Vue + Three.js + Java Spring Boot</p>
    </footer>
  </div>
</template>

<script>
import { ref, onUnmounted } from 'vue';
import ContainerVisualizer from './components/ContainerVisualizer.vue';
import { getPlanningData } from './api/index.js';
import BinPacking3D from './utils/BinPacking3D.js';

export default {
  name: 'App',
  components: {
    ContainerVisualizer
  },
  setup() {
    const isLoading = ref(false);
    const error = ref(null);
    const packingResult = ref(null);

    const performPacking = (container, cargoList) => {
      console.log('开始执行3D装箱算法...');
      console.log('货柜尺寸:', container.length, container.width, container.height);
      console.log('货物数量:', cargoList.length);

      const binPacking = new BinPacking3D(
        container.length,
        container.width,
        container.height
      );

      const result = binPacking.pack(cargoList);

      console.log('装箱完成:');
      console.log('  - 已装箱:', result.packedCount);
      console.log('  - 未装箱:', result.unpackedCount);
      console.log('  - 空间利用率:', result.spaceUtilization.toFixed(2) + '%');

      return result;
    };

    const fetchDataAndCalculate = async () => {
      isLoading.value = true;
      error.value = null;

      try {
        console.log('从后端获取数据...');
        const data = await getPlanningData();
        
        console.log('数据获取成功:', data);
        
        packingResult.value = performPacking(data.container, data.cargoList);
        
      } catch (err) {
        console.error('获取数据失败:', err);
        error.value = '无法连接到后端服务，请确保Java后端已启动 (http://localhost:8080)。您可以点击"加载测试数据"使用本地测试数据。';
      } finally {
        isLoading.value = false;
      }
    };

    const loadTestData = () => {
      isLoading.value = true;
      error.value = null;

      setTimeout(() => {
        console.log('加载测试数据...');
        
        const container = {
          length: 1200.0,
          width: 235.0,
          height: 269.0
        };

        const cargoList = [
          { id: 'C001', length: 100.0, width: 80.0, height: 60.0, weight: 50.0 },
          { id: 'C002', length: 100.0, width: 80.0, height: 60.0, weight: 50.0 },
          { id: 'C003', length: 100.0, width: 80.0, height: 60.0, weight: 50.0 },
          { id: 'C004', length: 100.0, width: 80.0, height: 60.0, weight: 50.0 },
          { id: 'C005', length: 120.0, width: 100.0, height: 80.0, weight: 80.0 },
          { id: 'C006', length: 120.0, width: 100.0, height: 80.0, weight: 80.0 },
          { id: 'C007', length: 120.0, width: 100.0, height: 80.0, weight: 80.0 },
          { id: 'C008', length: 80.0, width: 60.0, height: 50.0, weight: 30.0 },
          { id: 'C009', length: 80.0, width: 60.0, height: 50.0, weight: 30.0 },
          { id: 'C010', length: 80.0, width: 60.0, height: 50.0, weight: 30.0 },
          { id: 'C011', length: 80.0, width: 60.0, height: 50.0, weight: 30.0 },
          { id: 'C012', length: 80.0, width: 60.0, height: 50.0, weight: 30.0 },
          { id: 'C013', length: 150.0, width: 100.0, height: 90.0, weight: 100.0 },
          { id: 'C014', length: 150.0, width: 100.0, height: 90.0, weight: 100.0 },
          { id: 'C015', length: 60.0, width: 40.0, height: 30.0, weight: 15.0 },
          { id: 'C016', length: 60.0, width: 40.0, height: 30.0, weight: 15.0 },
          { id: 'C017', length: 60.0, width: 40.0, height: 30.0, weight: 15.0 },
          { id: 'C018', length: 60.0, width: 40.0, height: 30.0, weight: 15.0 },
          { id: 'C019', length: 60.0, width: 40.0, height: 30.0, weight: 15.0 },
          { id: 'C020', length: 60.0, width: 40.0, height: 30.0, weight: 15.0 }
        ];

        packingResult.value = performPacking(container, cargoList);
        isLoading.value = false;
      }, 500);
    };

    const resetAll = () => {
      packingResult.value = null;
      error.value = null;
      isLoading.value = false;
    };

    return {
      isLoading,
      error,
      packingResult,
      fetchDataAndCalculate,
      loadTestData,
      resetAll
    };
  }
};
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #fff;
}

.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: linear-gradient(90deg, #0f3460 0%, #16213e 100%);
  padding: 20px 40px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.app-header h1 {
  font-size: 28px;
  margin-bottom: 5px;
  color: #00ff88;
}

.app-header p {
  font-size: 14px;
  color: #888;
}

.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.control-section {
  margin-bottom: 20px;
}

.action-buttons {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  justify-content: center;
}

.primary-btn, .secondary-btn, .reset-btn {
  padding: 14px 32px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.primary-btn {
  background: linear-gradient(135deg, #00ff88 0%, #00cc6a 100%);
  color: #1a1a2e;
  box-shadow: 0 4px 15px rgba(0, 255, 136, 0.4);
}

.primary-btn:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0, 255, 136, 0.5);
}

.primary-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.secondary-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.secondary-btn:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.5);
}

.secondary-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.reset-btn {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
}

.reset-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(255, 107, 107, 0.5);
}

.error-message {
  margin-top: 15px;
  padding: 15px 20px;
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.3);
  border-radius: 8px;
  color: #ff6b6b;
  text-align: center;
}

.loading-indicator {
  margin-top: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 15px;
  background: rgba(0, 255, 136, 0.1);
  border-radius: 8px;
  color: #00ff88;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(0, 255, 136, 0.2);
  border-top: 3px solid #00ff88;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.visualization-section {
  flex: 1;
  min-height: 500px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.empty-state {
  height: 100%;
  min-height: 500px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  padding: 40px;
  text-align: center;
}

.empty-icon {
  font-size: 80px;
  margin-bottom: 20px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

.empty-state h3 {
  font-size: 22px;
  margin-bottom: 15px;
  color: #8bc34a;
}

.empty-state p {
  font-size: 14px;
  color: #888;
  margin-bottom: 8px;
}

.app-footer {
  background: rgba(0, 0, 0, 0.3);
  padding: 15px;
  text-align: center;
  color: #666;
  font-size: 13px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}
</style>
