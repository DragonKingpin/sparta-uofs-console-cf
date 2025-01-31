<template>
  <div>
    <div style="display: flex; flex-direction: row;">
      <el-button type="primary" style="margin-left: 20px">上传文件</el-button>
      <el-button style="margin-left: 20px">新建目录</el-button>
    </div>
    <div style="margin-top: 10px">
      <el-table
        ref="multipleTable"
        :data="tableData"
        tooltip-effect="dark"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column
          type="selection"
          width="55"
        />
        <el-table-column
          prop="fileName"
          label="文件名"
          width="120"
        />
        <el-table-column
          prop="size"
          label="文件大小"
          width="120"
        />
        <el-table-column
          prop="updateTime"
          label="更新时间"
          show-overflow-tooltip
        />
        <el-table-column
          label="操作"
          width="120"
        >
          <template>详情</template>
        </el-table-column>
      </el-table>
      <el-pagination
        background
        layout="prev, pager, next"
        :total="10"
      />
    </div>
  </div>

</template>

<script>
export default {
  data() {
    return {
      multipleSelection: []
    }
  },

  methods: {
    toggleSelection(rows) {
      if (rows) {
        rows.forEach(row => {
          this.$refs.multipleTable.toggleRowSelection(row)
        })
      } else {
        this.$refs.multipleTable.clearSelection()
      }
    },
    handleSelectionChange(val) {
      this.multipleSelection = val
    }
  }
}
</script>
