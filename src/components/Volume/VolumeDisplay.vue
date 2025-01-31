<template>
  <div class="volume-wrapper">
    <!-- 当前卷显示 -->
    <div class="volume-block" :style="volumeStyle">
      <div class="volume-info">
        {{ volumeData.name }} ({{ volumeData.size }})
      </div>
    </div>
    <!-- 如果有子卷，则递归渲染 -->
    <div v-if="volumeData.children && volumeData.children.length" class="sub-volumes">
      <VolumeDisplay
        v-for="(child, index) in volumeData.children"
        :key="index"
        :volume-data="child"
      />
    </div>
  </div>
</template>

<script>
export default {
  name: 'VolumeDisplay',
  props: {
    // 当前卷的信息，支持嵌套的层级结构
    volumeData: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      randomColor: this.generateRandomColor() // 随机颜色
    }
  },
  computed: {
    volumeStyle() {
      return {
        flex: this.volumeData.size,
        backgroundColor: this.randomColor
      }
    }
  },
  methods: {
    // 随机生成颜色的方法
    generateRandomColor() {
      const r = Math.floor(Math.random() * 256)
      const g = Math.floor(Math.random() * 256)
      const b = Math.floor(Math.random() * 256)
      return `rgb(${r}, ${g}, ${b})`
    }
  }
}
</script>

<style scoped>
.volume-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin: 10px 0;
}

.volume-block {
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid #000;
  color: #000;
  font-size: 14px;
  height: 40px;
  width: 100%;
  margin-bottom: 5px;
}

.sub-volumes {
  display: flex;
  flex-direction: row;
  width: 100%;
  gap: 5px;
}
</style>
