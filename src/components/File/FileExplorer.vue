<template>
  <div class="file-explorer">
    <el-row :gutter="20">
      <el-col :span="6">
        <file-tree :tree-data="treeData" @select="handleFolderSelect" />
      </el-col>
      <el-col :span="18">
        <div class="view-toggle">
          <el-radio-group v-model="viewMode" size="mini">
            <el-radio-button label="grid">图标视图</el-radio-button>
            <el-radio-button label="list">列表视图</el-radio-button>
          </el-radio-group>
        </div>
        <div v-if="viewMode === 'grid'">
          <file-grid :files="currentFiles" @delete="handleDelete" @rename="handleRename" />
        </div>
        <div v-else>
          <file-list :files="currentFiles" @delete="handleDelete" @rename="handleRename" />
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import FileTree from './FileTree.vue'
import FileGrid from './FileGrid.vue'
import FileList from './FileList.vue'

export default {
  components: { FileTree, FileGrid, FileList },
  data() {
    return {
      treeData: [
        {
          id: 1,
          label: '根目录',
          children: [
            { id: 2, label: '文件夹1', children: [] },
            { id: 3, label: '文件夹2', children: [] }
          ]
        }
      ],
      currentFiles: [],
      viewMode: 'grid'
    }
  },
  methods: {
    handleFolderSelect(folder) {
      // Mock fetch folder contents
      this.currentFiles = [
        { name: '文件1.txt', type: 'txt', size: '1KB', created: '2024-12-01' },
        { name: '图片1.png', type: 'png', size: '2MB', created: '2024-12-02' }
      ]
    },
    handleDelete(file) {
      this.currentFiles = this.currentFiles.filter((f) => f.name !== file.name)
    },
    handleRename(file, newName) {
      const targetFile = this.currentFiles.find((f) => f.name === file.name)
      if (targetFile) targetFile.name = newName
    }
  }
}
</script>

<style>
.file-explorer {
  margin: 20px;
}
.view-toggle {
  margin-bottom: 10px;
}
</style>
