<template>
  <el-container style="height: 100vh;">
    <el-row :gutter="30" style="width: 100%;">
      <!-- 侧边栏 -->
      <el-col :xs="24" :sm="6" :md="5" :lg="5" :xl="5">
        <el-aside style="height: 100vh; overflow-y: auto; padding-right: 10px;">
          <el-button type="primary" style="margin-bottom: 10px; width: 100%;" @click="addVolume">增加卷</el-button>
          <el-select v-model="group" placeholder="请选择" style="width: 100%">
            <el-option
              v-for="item in options"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <div
            v-for="volume in volumes"
            :key="volume.guid"
            class="volumeItem"
            :class="{ 'volumeItem-active': currentVolume && currentVolume.guid === volume.guid }"
            @mousedown="showDetails(volume, $event)"
          >
            <el-card shadow="hover" class="volume-card">
              <div class="volume-card-content">
                <i class="el-icon-folder-opened" />
                <span>{{ volume.name }}</span>
              </div>
            </el-card>
          </div>
        </el-aside>
      </el-col>

      <!-- 主内容区 -->
      <el-col :xs="24" :sm="18" :md="19" :lg="19" :xl="19">
        <el-main>
          <el-table :data="volumes" style="width: 100%" stripe border>
            <el-table-column prop="name" label="名称" width="180" />
            <el-table-column prop="type" label="类型" width="120" />
            <el-table-column prop="volumeCapacity.definitionCapacity" label="容量" width="120" />
            <el-table-column prop="volumeCapacity.usedSize" label="已用容量" width="120" />
            <el-table-column prop="mountPoint.mountPoint" label="挂载点" />
            <el-table-column label="操作" width="120">
              <template #default="scope">
                <el-button type="text" size="small" @click="handleEdit(scope.row)">编辑</el-button>
                <el-button type="text" size="small" @click="handleDelete(scope.row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-main>
      </el-col>
    </el-row>
    <!-- 新增卷抽屉 -->
    <el-drawer
      :visible.sync="drawer"
      :direction="direction"
      size="40%"
      @open="resetForm"
    >
      <el-card class="drawer-card">
        <div class="drawer-header">
          <i class="el-icon-circle-plus-outline" />
          <span>创建新卷</span>
        </div>
        <div class="drawer-content">
          <el-form label-width="100px">
            <!-- 其他卷类型的表单内容 -->
            <template>
              <el-form-item label="卷名">
                <el-input v-model="volumeName" placeholder="请输入卷名" />
              </el-form-item>
              <el-form-item label="声明容量">
                <el-input v-model="definitionCapacity" placeholder="请输入声明容量" />
              </el-form-item>
              <el-form-item label="输入挂载点">
                <el-input v-model="mountPoint" placeholder="请输入挂载点" />
              </el-form-item>
            </template>
          </el-form>
          <el-button type="primary" class="submit-button" @click="submitVolume">提交</el-button>
        </div>
      </el-card>
    </el-drawer>
  </el-container>
</template>
<script>
import axios from 'axios'

export default {
  data() {
    return {
      volumes: [], // 卷的数据
      options: [
        {
          value: '默认组',
          label: '默认组'
        }
      ],
      group: '', // 当前选中的组
      currentVolume: null, // 当前选中的卷
      volumeName: '',
      definitionCapacity: '',
      drawer: false,
      direction: 'rtl',
      mountPoint: ''
    }
  },
  mounted() {
    this.getVolumes()
  },
  methods: {
    // 获取卷数据
    getVolumes() {
      axios
        .get('http://localhost:8080/api/v2/uofs/volume/listPhysicsVolumes')
        .then((rs) => {
          this.volumes = rs.data.data
          console.log(this.volumes)
        })
    },
    // 显示卷详情
    showDetails(volume, event) {
      if (event.button === 0) {
        this.currentVolume = volume
      }
    },
    // 编辑卷
    handleEdit(row) {
      console.log('编辑卷:', row)
      // 这里可以打开编辑对话框或跳转到编辑页面
    },
    // 删除卷
    handleDelete(row) {
      this.$confirm('确认删除该卷吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => {
          axios
            .delete(`http://localhost:8080/api/v2/uofs/volume/delete/${row.guid}`)
            .then(() => {
              this.$message.success('删除成功')
              this.getVolumes() // 刷新卷列表
            })
            .catch((error) => {
              this.$message.error('删除失败')
              console.error('删除失败:', error)
            })
        })
        .catch(() => {
          this.$message.info('已取消删除')
        })
    },
    submitVolume() {
      const url = 'http://localhost:8080/api/v2/uofs/volume/create/physicalVolume'
      const payload = {
        name: this.volumeName,
        definitionCapacity: this.definitionCapacity,
        mountPoint: this.mountPoint
      }

      axios.post(url, payload)
        .then(response => {
          this.$message.success('卷创建成功')
          this.drawer = false
          this.getVolumes()
        })
        .catch(error => {
          this.$message.error('卷创建失败')
          console.error('创建卷失败:', error.response ? error.response.data : error.message)
        })
    },
    resetForm() {
      this.volumeType = null
      this.volumeName = ''
      this.definitionCapacity = ''
      this.mountPoint = null
    },
    addVolume() {
      this.drawer = true
    }
  }
}
</script>
<style scoped>
.volumeItem {
  margin-bottom: 10px;
}

.volumeItem-active .volume-card {
  border-color: #409eff;
  background-color: #f5f7fa;
}

.volume-card {
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.volume-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.volume-card-content {
  display: flex;
  align-items: center;
  padding: 10px;
}

.volume-card-content i {
  margin-right: 10px;
  font-size: 18px;
  color: #409eff;
}

.volume-card-content span {
  font-size: 14px;
  color: #303133;
}
</style>
