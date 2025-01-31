<template>
  <div class="gantt-container">
    <el-row :gutter="20">
      <!-- 左侧树形结构部分 -->
      <el-col :xs="24" :sm="8" :md="6" :lg="5" :xl="4">
        <div class="tree-section">
          <ul>
            <li v-for="(item, index) in data" :key="index">
              <strong>{{ item.name }}</strong>
              <ul v-if="item.child && item.child.length > 0">
                <li v-for="(volume) in item.child" :key="volume.id" class="child-item">
                  {{ volume.name }}
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </el-col>

      <!-- 右侧进度条部分 -->
      <el-col :xs="24" :sm="16" :md="18" :lg="19" :xl="20">
        <div class="progress-section">
          <div v-if="data">
            <div v-for="(item, index) in data" :key="index">
              <!-- 父进度条 -->
              <div v-if="index === 0">
                <div class="progress-bar">
                  <div
                    class="progress"
                    :style="{ width: calculatePercentage(item.value) + '%' }"
                  />
                  <span>{{ calculatePercentage(item.value) }}%</span>
                </div>
              </div>

              <!-- 子进度条 -->
              <div v-for="(volume, i) in item.child" :key="i" class="child-container">
                <div
                  v-for="(tempVolume, idx) in item.child"
                  :key="idx"
                  class="sub-progress"
                  :style="{
                    width: calculateChildPercentage(tempVolume.value, item.child) + '%',
                    backgroundColor: tempVolume.id === volume.id ? '#76c7c0' : 'transparent',
                    border: tempVolume.id === volume.id ? 'none' : '1px solid #e0e0e0'
                  }"
                >
                  <el-tooltip
                    :content="`${tempVolume.name}: ${tempVolume.value}`"
                    placement="top"
                  >
                    <span v-if="tempVolume.id === volume.id">{{ tempVolume.value }}</span>
                  </el-tooltip>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script>

export default {
  name: 'Gantt',
  props: {
    data: {
      type: Array,
      required: true
    }
  },
  mounted() {
    this.data.forEach((volume) => {
      console.log(volume)
    })
  },
  methods: {
    // 计算父进度条百分比
    calculatePercentage(value) {
      const maxValue = Math.max(...this.data.map((item) => item.value))
      return ((value / maxValue) * 100).toFixed(2)
    },
    // 计算子进度条的百分比（相对于父进度条）
    calculateChildPercentage(value, childArray) {
      const totalValue = childArray.reduce((sum, child) => sum + child.value, 0)
      return ((value / totalValue) * 100).toFixed(2)
    }
  }
}
</script>

<style scoped>
.gantt-container {
  width: 100%;
  padding: 10px;
}

.tree-section {
  border-left: 1px solid #e0e0e0;
  padding-left: 10px;
}

.progress-section {
  padding-right: 10px;
}

.progress-bar {
  width: 100%;
  background-color: #e0e0e0;
  border-radius: 5px;
  margin-bottom: 10px;
  position: relative;
}

.progress {
  height: 20px;
  background-color: #76c7c0;
  border-radius: 5px;
}

.progress-bar span {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #333;
  font-size: 14px;
}

.child-container {
  display: flex;
  flex-direction: row;
  margin-top: 10px;
}

.sub-progress {
  height: 20px;
  display: inline-block;
  position: relative;
  text-align: center;
  line-height: 20px;
  color: white;
}

.tree-section ul {
  list-style: none;
  padding: 0;
}

.tree-section li {
  margin-bottom: 5px;
}

/* 添加缩进样式 */
.tree-section ul ul {
  padding-left: 20px; /* 子层级缩进 */
}

.child-item {
  padding-left: 20px; /* 子项缩进 */
}

/* 手机端样式 */
@media (max-width: 768px) {
  .gantt-container {
    flex-direction: column;
  }

  .tree-section {
    border-left: none;
    padding-left: 0;
    margin-bottom: 20px;
  }

  .progress-section {
    padding-right: 0;
  }

  .progress-bar span {
    font-size: 12px; /* 缩小字体 */
  }

  .sub-progress {
    height: 15px; /* 缩小高度 */
    line-height: 15px;
  }

  .child-container {
    flex-direction: column; /* 子进度条垂直排列 */
  }

  .sub-progress {
    width: 100% !important; /* 子进度条占满宽度 */
    margin-bottom: 5px; /* 增加间距 */
  }
}
</style>
