<template>
  <el-row :gutter="10">
    <el-col v-for="file in files" :key="file.name" :span="6">
      <div class="file-item">
        <img :src="getIcon(file.type)" alt="icon" class="file-icon">
        <p>{{ file.name }}</p>
        <el-button size="mini" type="danger" @click="$emit('delete', file)">删除</el-button>
        <el-button size="mini" type="primary" @click="renameFile(file)">重命名</el-button>
      </div>
    </el-col>
  </el-row>
</template>

<script>
export default {
  props: {
    files: {
      type: Array,
      required: true
    }
  },
  methods: {
    getIcon(type) {
      const icons = {
        txt: '/icons/txt.png',
        png: '/icons/png.png'
      }
      return icons[type] || '/icons/file.png'
    },
    renameFile(file) {
      const newName = prompt('请输入新名称', file.name)
      if (newName) this.$emit('rename', file, newName)
    }
  }
}
</script>

<style>
.file-item {
  text-align: center;
  border: 1px solid #ebeef5;
  padding: 10px;
  border-radius: 4px;
}
.file-icon {
  width: 64px;
  height: 64px;
}
</style>
