<template>
  <el-table :data="files" border style="width: 100%">
    <el-table-column prop="name" label="文件名" />
    <el-table-column prop="type" label="类型" />
    <el-table-column prop="size" label="大小" />
    <el-table-column prop="created" label="创建时间" />
    <el-table-column label="操作">
      <template #default="scope">
        <el-button size="mini" type="danger" @click="$emit('delete', scope.row)">删除</el-button>
        <el-button size="mini" type="primary" @click="renameFile(scope.row)">重命名</el-button>
      </template>
    </el-table-column>
  </el-table>
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
    renameFile(file) {
      const newName = prompt('请输入新名称', file.name)
      if (newName) this.$emit('rename', file, newName)
    }
  }
}
</script>
