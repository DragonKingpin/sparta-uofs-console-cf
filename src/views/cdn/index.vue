<template>
  <el-container class="full-height">
    <el-row :gutter="30" class="full-height">
      <!-- 侧边栏 -->
      <el-col :xs="24" :sm="6" :md="5" :lg="5" :xl="5">
        <el-aside class="sidebar">
          <el-button type="primary" class="full-width" @click="drawer = true">增加站点</el-button>
          <div
            v-for="site in sites"
            :key="site.siteGuid"
            class="siteItem"
            :class="{ 'siteItem-active': selectSite && selectSite.siteGuid === site.siteGuid }"
            @mousedown="showDetails(site, $event)"
          >
            <el-card shadow="hover" class="site-card">
              <div class="site-card-content">
                <i class="el-icon-location" />
                <span>{{ site.siteName }}</span>
              </div>
            </el-card>
          </div>
        </el-aside>
      </el-col>

      <!-- 主内容区 -->
      <el-col :xs="24" :sm="18" :md="19" :lg="19" :xl="19">
        <el-main class="main-content">
          <el-table :data="sites" class="file-table" stripe border>
            <el-table-column prop="siteName" label="站点名称" width="300" />
            <el-table-column prop="siteGuid" label="站点ID" width="600" />
            <el-table-column label="操作">
              <template #default="scope">
                <el-button type="text" size="small" @click="handleEdit(scope.row)">编辑</el-button>
                <el-button type="text" size="small" @click="handleDelete(scope.row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-main>
      </el-col>
    </el-row>

    <!-- 新增站点抽屉 -->
    <el-drawer
      :visible.sync="drawer"
      :direction="direction"
      size="40%"
      @open="resetForm"
    >
      <el-card class="drawer-card">
        <div class="drawer-header">
          <i class="el-icon-circle-plus-outline" />
          <span>创建新站点</span>
        </div>
        <div class="drawer-content">
          <el-form label-width="100px">
            <el-form-item label="站点名">
              <el-input v-model="siteName" placeholder="请输入站点名" />
            </el-form-item>
          </el-form>
          <el-button type="primary" class="submit-button" @click="addSite">提交</el-button>
        </div>
      </el-card>
    </el-drawer>

    <!-- 上传文件对话框 -->
    <el-dialog
      title="上传文件"
      :visible.sync="uploadDialogVisible"
      width="40%"
      center
    >
      <div style="display: flex; flex-direction: column; align-items: center;">
        <!-- 上传组件 -->
        <el-upload
          ref="upload"
          class="upload-demo"
          drag
          action=""
          :auto-upload="false"
          :on-change="handleChange"
          :file-list="fileList"
          :show-file-list="true"
          :on-preview="handlePreview"
        >
          <i class="el-icon-upload" />
          <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        </el-upload>

        <!-- 文件路径输入框 -->
        <el-input
          v-model="filePath"
          placeholder="文件路径"
          style="margin-top: 10px; width: 80%;"
        />

        <!-- 版本号输入框 -->
        <el-input
          v-model="version"
          placeholder="版本号"
          style="margin-top: 10px; width: 80%;"
        />

        <!-- 上传按钮 -->
        <el-button
          type="primary"
          style="margin-top: 10px;"
          :disabled="isUploading"
          @click="uploadFile"
        >
          上传文件
        </el-button>
      </div>
    </el-dialog>
  </el-container>
</template>

<script>
import axios from 'axios'

export default {
  data() {
    return {
      sites: [], // 站点数据
      selectSite: null, // 当前选中的站点
      fileList: [], // 上传的文件列表
      filePath: '', // 文件路径
      version: '', // 版本号
      isUploading: false, // 是否正在上传
      drawer: false, // 控制新增站点抽屉显示
      uploadDialogVisible: false, // 控制上传文件对话框显示
      direction: 'rtl', // 抽屉方向
      siteName: '' // 新增站点名称
    }
  },
  mounted() {
    this.getSites()
  },
  methods: {
    // 获取站点数据
    getSites() {
      axios.get('http://localhost:8080/api/v2/uofs/site/listSite')
        .then(rs => {
          this.sites = rs.data.data
          console.log('站点数据:', this.sites)
        })
    },
    // 显示站点详情
    showDetails(site, event) {
      if (event.button === 0) {
        this.selectSite = site
      }
    },
    // 处理文件选择
    handleChange(file, fileList) {
      this.fileList = fileList.slice() // 更新文件列表
      console.log('Selected file:', file)
    },
    // 处理文件预览
    handlePreview(file) {
      console.log('Preview file:', file)
    },
    // 新增站点
    addSite() {
      axios.put('http://localhost:8080/api/v2/uofs/site/createSite', {}, {
        params: {
          siteName: this.siteName
        }
      })
        .then(response => {
          this.$message.success('站点创建成功')
          this.drawer = false
          this.getSites() // 刷新站点列表
        })
        .catch(error => {
          this.$message.error('创建站点失败')
          console.error('创建站点失败:', error.response ? error.response.data : error.message)
        })
    },
    // 编辑站点（弹出上传文件对话框）
    handleEdit(row) {
      this.selectSite = row
      this.uploadDialogVisible = true // 打开上传文件对话框
    },
    // 删除站点
    handleDelete(row) {
      this.$confirm('确认删除该站点吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => {
          // 调用后端删除接口
          axios.delete('http://localhost:8080/api/v2/uofs/site/deleteSite', {
            params: {
              siteName: row.siteName // 传递站点名称作为参数
            }
          })
            .then(() => {
              this.$message.success('删除成功')
              this.getSites() // 刷新站点列表
            })
            .catch(error => {
              this.$message.error('删除失败')
              console.error('删除失败:', error.response ? error.response.data : error.message)
            })
        })
        .catch(() => {
          this.$message.info('已取消删除')
        })
    },
    // 上传文件
    uploadFile() {
      if (!this.selectSite.siteName || !this.filePath || !this.version || this.fileList.length === 0) {
        this.$message.warning('请确保填写了站点名称、文件路径、版本号并选择了文件')
        return
      }

      this.isUploading = true // 防止多次点击
      const formData = new FormData()

      // 添加站点名称、文件路径和版本号
      formData.append('siteName', this.siteName) // 使用 selectSite.siteName
      console.log(this.siteName)
      formData.append('filePath', this.filePath)
      console.log(this.filePath)
      formData.append('version', this.version)

      // 添加文件
      this.fileList.forEach(file => {
        formData.append('file', file.raw) // 使用原始文件对象
        console.log(file.raw)
      })

      axios.post('http://localhost:8080/api/v2/uofs/transmit/CDNUpload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
        .then(response => {
          this.$message.success('文件上传成功')
          this.fileList = [] // 清空文件列表
          this.uploadDialogVisible = false // 关闭对话框
        })
        .catch(error => {
          this.$message.error('文件上传失败')
          console.error('文件上传失败:', error.response ? error.response.data : error.message)
        })
        .finally(() => {
          this.isUploading = false // 无论成功与否，允许再次上传
        })
    },
    // 重置表单
    resetForm() {
      this.siteName = ''
    }
  }
}
</script>

<style scoped>
.full-height {
  height: 100vh; /* 让整个布局占满整个视口 */
}

.sidebar {
  height: 100vh; /* 让侧边栏充满整个屏幕 */
  overflow-y: auto; /* 允许滚动 */
  background: #f5f7fa;
  padding: 10px;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
}

.full-width {
  width: 100%;
  margin-bottom: 10px;
}

.main-content {
  height: 100vh; /* 让主内容区也撑满 */
  overflow-y: auto; /* 允许滚动 */
  padding: 20px;
  background: #fff;
}

.file-table {
  width: 100%;
  height: calc(100vh - 60px); /* 让表格适应剩余高度 */
}

.siteItem {
  margin-bottom: 10px;
}

.siteItem-active .site-card {
  border-color: #409eff;
  background-color: #f5f7fa;
}

.site-card {
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.site-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.site-card-content {
  display: flex;
  align-items: center;
  padding: 10px;
}

.site-card-content i {
  margin-right: 10px;
  font-size: 18px;
  color: #409eff;
}

.site-card-content span {
  font-size: 14px;
  color: #303133;
}

/* 抽屉样式 */
.drawer-card {
  padding: 20px;
}

.drawer-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.drawer-header i {
  margin-right: 10px;
  font-size: 20px;
  color: #409eff;
}

.drawer-header span {
  font-size: 16px;
  font-weight: bold;
}

.submit-button {
  width: 100%;
  margin-top: 20px;
}
</style>
