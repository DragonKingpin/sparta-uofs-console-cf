<template>
  <div style="margin-left: 20px">
    <h2>Bucket列表</h2>
    <div style="display: flex; flex-direction: row; gap: 8px;">
      <el-button type="primary" @click="drawer = true">创建Bucket</el-button>
      <el-input v-model="bucketName" placeholder="Bucket名称" style="width: 246px; height: 30px">
        <el-button slot="append" icon="el-icon-search" />
      </el-input>
    </div>
    <div>
      <el-table
        :data="tableData"
        border
        style=" margin-top: 2%"
      >
        <el-table-column label="Bucket名称">
          <template slot-scope="scope">
            <!-- 使用span标签包裹bucketName并绑定点击事件 -->
            <span
              class="bucket-name"
              @click="handleBucketNameClick(scope.row)"
              @mouseover="onMouseOver(scope.$index)"
              @mouseout="onMouseOut(scope.$index)"
            >
              {{ scope.row.bucketName }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" />
      </el-table>
      <div style="text-align: right;">
        <el-pagination
          :current-page="currentPage4"
          :page-sizes="[5, 10, 15]"
          :page-size="5"
          layout="total, sizes, prev, pager, next, jumper"
          :total="1"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
      <el-drawer
        title="创建bucket"
        :visible.sync="drawer"
        :direction="direction"
        :before-close="handleClose"
      >
        <el-input v-model="temporaryBucketName" placeholder="bucketName" style="width: 50%" />
      </el-drawer>
    </div>

  </div>
</template>
<script>
import axios from 'axios'

export default {
  data() {
    return {
      bucketName: '',
      tableData: [{
        createTime: '2016-05-02',
        bucketName: '王小虎'
      }, {
        createTime: '2016-05-04',
        bucketName: '王小虎'
      }, {
        createTime: '2016-05-01',
        bucketName: '王小虎'
      }, {
        createTime: '2016-05-03',
        bucketName: '王小虎'
      }],
      currentPage4: 0,
      drawer: false,
      direction: 'rtl',
      temporaryBucketName: ''
    }
  },
  mounted() {
    this.getTableData()
  },
  methods: {
    handleSizeChange(val) {
      console.log(`每页 ${val} 条`)
    },
    handleCurrentChange(val) {
      console.log(`当前页: ${val}`)
    },
    getTableData() {
      axios.get('http://localhost:8080/api/v2/uofs/bucket/',
        {
          params: {
            accountGuid: '0000000-000000-0000-00'
          }
        })
        .then(rs => {
          console.log(rs)
        })
    },
    handleBucketNameClick(row) {
      this.$router.push({
        name: 'bucket空间',
        params: { bucketId: row.id }
      })
    },
    handleClose(done) {
      this.$confirm('确认关闭？')
        .then(_ => {
          done()
        })
        .catch(_ => {})
    }
  }
}
</script>

<style scoped>
.bucket-name {
  cursor: default;
  text-decoration: none;
  color: inherit;
}

.bucket-name:hover, .bucket-name.active {
  cursor: pointer;
  color: #409EFF; /* Element UI的主题色 */
  text-decoration: underline;
}
</style>
