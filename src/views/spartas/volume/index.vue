<template>
  <div class="full-height-container" @contextmenu.prevent>
    <el-container style="height: 100%;">
      <el-row :gutter="30" style="width: 100%;">
        <!-- 侧边栏 -->
        <el-col :xs="24" :sm="6" :md="5" :lg="5" :xl="5">
          <el-aside style="height: 100vh; overflow-y: auto; padding-right: 10px;">
            <el-button type="primary" style="margin-bottom: 10px; width: 100%;" @click="addVolume">增加卷</el-button>
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
            <div v-if="showDetailed" style="height: 100%">
              <el-card class="details-card">
                <div class="volume-details">
                  <div class="detail-item">
                    <i class="el-icon-document" />
                    <span class="detail-label">名称：</span>
                    <span class="detail-value">{{ currentVolume.name }}</span>
                  </div>
                  <div class="detail-item">
                    <i class="el-icon-s-data" />
                    <span class="detail-label">类型：</span>
                    <span class="detail-value">{{ currentVolume.type }}</span>
                  </div>
                  <div class="detail-item">
                    <i class="el-icon-pie-chart" />
                    <span class="detail-label">容量：</span>
                    <span class="detail-value">{{ currentVolume.volumeCapacity.definitionCapacity }}</span>
                  </div>
                  <div class="detail-item">
                    <i class="el-icon-data-line" />
                    <span class="detail-label">已用容量：</span>
                    <span class="detail-value">{{ currentVolume.volumeCapacity.usedSize }}</span>
                  </div>
                  <div v-if="currentVolume.mountPoint" class="detail-item">
                    <i class="el-icon-folder" />
                    <span class="detail-label">挂载点：</span>
                    <span class="detail-value">{{ currentVolume.mountPoint.mountPoint }}</span>
                  </div>
                </div>
              </el-card>
              <Gantt :data="data" />
              <div
                v-if="contextMenuVisible"
                ref="contextMenu"
                :style="{ top: contextMenuPosition.y + 'px', left: contextMenuPosition.x + 'px' }"
                class="context-menu"
                @mousedown.stop
              >
                <el-menu
                  default-active="1"
                  class="el-menu-vertical-demo"
                >
                  <el-menu-item @click="expansion">扩容</el-menu-item>
                  <el-menu-item @click="deleteVolume">删除</el-menu-item>
                </el-menu>
              </div>
            </div>
          </el-main>
        </el-col>
      </el-row>
    </el-container>

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
          <p class="drawer-description">请选择卷类型并填写相关信息</p>
          <el-divider />
          <div class="type-selection">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-radio v-model="volumeType" label="PhysicalVolume" border class="type-card">
                  <div class="type-content">
                    <i class="el-icon-folder" />
                    <span>镜像卷</span>
                    <p class="type-description">拥有数据备份的存储设备</p>
                  </div>
                </el-radio>
              </el-col>
              <el-col :span="12">
                <el-radio v-model="volumeType" label="SimpleVolume" border class="type-card">
                  <div class="type-content">
                    <i class="el-icon-document" />
                    <span>简单卷</span>
                    <p class="type-description">单一逻辑卷，易于管理</p>
                  </div>
                </el-radio>
              </el-col>
              <el-col :span="12">
                <el-radio v-model="volumeType" label="SpannedVolume" border class="type-card">
                  <div class="type-content">
                    <i class="el-icon-connection" />
                    <span>跨区卷</span>
                    <p class="type-description">跨多个逻辑卷扩展容量</p>
                  </div>
                </el-radio>
              </el-col>
              <el-col :span="12">
                <el-radio v-model="volumeType" label="StripVolume" border class="type-card">
                  <div class="type-content">
                    <i class="el-icon-copy-document" />
                    <span>条带卷</span>
                    <p class="type-description">数据分布到多个逻辑卷，提升性能</p>
                  </div>
                </el-radio>
              </el-col>
            </el-row>
          </div>
          <el-divider />
          <el-form label-width="100px">
            <!-- 当选择镜像卷时，显示开发中的提示 -->
            <div v-if="volumeType === 'PhysicalVolume'" class="development-message">
              开发中，敬请期待
            </div>

            <!-- 其他卷类型的表单内容 -->
            <template v-else>
              <el-form-item label="卷名">
                <el-input v-model="volumeName" placeholder="请输入卷名" />
              </el-form-item>
              <!--              <el-form-item label="声明容量">-->
              <!--                <el-input v-model="definitionCapacity" placeholder="请输入声明容量" />-->
              <!--              </el-form-item>-->
            </template>
          </el-form>
          <el-button type="primary" class="submit-button" @click="submitVolume">提交</el-button>
        </div>
      </el-card>
    </el-drawer>

    <!-- 扩容抽屉 -->
    <el-drawer
      title="扩容"
      :visible.sync="isExpansion"
      :direction="direction"
      size="40%"
      @open="resetExpansionForm"
    >
      <el-card class="drawer-card">
        <div class="drawer-header">
          <i class="el-icon-expand" />
          <span>扩容卷</span>
        </div>
        <div class="drawer-content">
          <p class="drawer-description">请选择要扩容的目标卷</p>
          <el-divider />
          <el-select v-model="selectExpansionVolume" placeholder="请选择扩容卷" class="expansion-select">
            <el-option
              v-for="item in availableVolumes"
              :key="item.guid"
              :label="item.name"
              :value="item"
            />
          </el-select>
          <span v-if="currentVolume && selectExpansionVolume">扩容后容量：{{ currentVolume.volumeCapacity.definitionCapacity + selectExpansionVolume.volumeCapacity.definitionCapacity }}</span>
          <el-button type="primary" class="submit-button" @click="submitExpand">提交扩容</el-button>
        </div>
      </el-card>
    </el-drawer>
  </div>
</template>

<script>
import axios from 'axios'
import Gantt from './gantt.vue'

export default {
  components: {
    Gantt
  },
  data() {
    return {
      volumes: [],
      showDetailed: false,
      currentVolume: null,
      contextMenuPosition: { x: 0, y: 0 },
      contextMenuVisible: false,
      selectVolume: null,
      drawer: false,
      direction: 'rtl',
      volumeType: null,
      volumeName: '',
      definitionCapacity: '',
      mountPoint: null,
      data: [],
      isExpansion: false,
      availableVolumes: [],
      selectChildVolume: [],
      selectExpansionVolume: null
    }
  },
  mounted() {
    this.getVolumes()
    window.addEventListener('click', this.closeContextMenu)
  },
  beforeUnmount() {
    window.removeEventListener('click', this.closeContextMenu)
  },
  methods: {
    getVolumes() {
      axios
        .get('http://localhost:8080/api/v2/uofs/volume/queryAllVolumes')
        .then((rs) => {
          this.volumes = rs.data.data
        })
    },
    addVolume() {
      this.drawer = true
    },
    submitVolume() {
      let url = ''
      const payload = {
        name: this.volumeName,
        definitionCapacity: 0
      }

      switch (this.volumeType) {
        // case 'PhysicalVolume':
        //   url = 'http://localhost:8080/api/v2/uofs/volume/create/physicalVolume'
        //   payload.mountPoint = this.mountPoint
        //   break
        case 'SimpleVolume':
          url = 'http://localhost:8080/api/v2/uofs/volume/create/simpleVolume'
          break
        case 'SpannedVolume':
          url = 'http://localhost:8080/api/v2/uofs/volume/create/spannedVolume'
          break
        case 'StripVolume':
          url = 'http://localhost:8080/api/v2/uofs/volume/create/stripedVolume'
          break
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
    showDetails(volume, event) {
      if (event.button === 0) {
        this.showDetailed = true
        this.loadVolumeDetails(volume)
      } else if (event.button === 2) {
        this.contextMenuPosition = { x: event.clientX, y: event.clientY }
        this.contextMenuVisible = true
        this.selectVolume = volume
        axios
          .get('http://localhost:8080/api/v2/uofs/volume/getChildren', {
            params: {
              volumeGuid: this.selectVolume.guid
            }
          }).then((rs) => {
            this.selectChildVolumes = rs.data.data
          })
        event.stopPropagation()
      }
    },
    loadVolumeDetails(volume) {
      axios
        .get('http://localhost:8080/api/v2/uofs/volume/getChildren', {
          params: {
            volumeGuid: volume.guid
          }
        })
        .then(async(rs) => { // 使用 async 关键字
          if (rs.data.code === 200) {
            const child = []
            if (rs.data.data !== null) {
              // 使用 Promise.all 等待所有异步操作完成
              await Promise.all(
                rs.data.data.map(async(volume) => {
                  const childData = await this.loadData(volume) // 等待 loadData 完成
                  child.push(childData)
                })
              )
            }

            // 继续处理逻辑
            axios
              .get('http://localhost:8080/api/v2/uofs/volume/query/logic', {
                params: {
                  guid: volume.guid
                }
              })
              .then((rs) => {
                this.currentVolume = rs.data.data
                this.data = [
                  {
                    value: this.currentVolume.volumeCapacity.definitionCapacity,
                    id: this.currentVolume.guid,
                    name: this.currentVolume.name,
                    child: child
                  }
                ]
              })
          } else {
            axios
              .get('http://localhost:8080/api/v2/uofs/volume/query/physical', {
                params: {
                  guid: volume.guid
                }
              })
              .then((rs) => {
                this.currentVolume = rs.data.data
                this.data = [
                  {
                    value: this.currentVolume.volumeCapacity.definitionCapacity,
                    id: this.currentVolume.guid,
                    name: this.currentVolume.name,
                    child: []
                  }
                ]
              })
          }
        })
    },
    async loadData(volume) {
      const child = []
      if (volume.type === 'SimpleVolume' || volume.type === 'PhysicalVolume') {
        return {
          value: volume.volumeCapacity.definitionCapacity,
          id: volume.guid,
          name: volume.name,
          child: []
        }
      } else {
        // 使用 await 等待异步操作完成
        const rs = await axios.get('http://localhost:8080/api/v2/uofs/volume/getChildren', {
          params: {
            volumeGuid: volume.guid
          }
        })

        if (rs.data.data !== null) {
          // 使用 Promise.all 等待所有异步操作完成
          await Promise.all(
            rs.data.data.map(async(volume) => {
              const childData = await this.loadData(volume) // 递归调用 loadData
              child.push(childData)
            })
          )
        }

        return {
          value: volume.volumeCapacity.definitionCapacity,
          id: volume.guid,
          name: volume.name,
          child: child
        }
      }
    },
    handleClose(done) {
      this.$confirm('确认关闭？')
        .then(_ => {
          done()
        })
        .catch(_ => {})
    },
    closeContextMenu(event) {
      this.contextMenuVisible = false
    },
    expansion() {
      this.availableVolumes = []
      if (this.selectVolume.type === 'PhysicalVolume') {
        alert('物理卷不支持扩容')
      } else {
        if (this.selectVolume.type === 'SimpleVolume') {
          if (this.selectChildVolumes === null) {
            this.isExpansion = true
            this.volumes.forEach((volume) => {
              if (volume.guid !== this.selectVolume.guid && volume.type === 'PhysicalVolume') {
                let flag = 0
                if (this.selectChildVolumes !== null) {
                  this.selectChildVolumes.forEach((childVolume) => {
                    if (childVolume.guid === volume.guid) {
                      flag = 1
                    }
                  })
                }
                if (flag === 0) {
                  this.availableVolumes.push(volume)
                }
                console.log(this.availableVolumes)
              }
            })
          } else {
            alert('简单卷已经指定物理卷不能扩容')
          }
        }
        if (this.selectVolume.type === 'SpannedVolume' || this.selectVolume.type === 'StripedVolume') {
          this.isExpansion = true
          this.volumes.forEach((volume) => {
            if (volume.guid !== this.selectVolume.guid && volume.type !== 'PhysicalVolume') {
              let flag = 0
              if (this.selectChildVolumes !== null) {
                this.selectChildVolumes.forEach((childVolume) => {
                  if (childVolume.guid === volume.guid) {
                    flag = 1
                  }
                })
              }
              if (flag === 0) {
                this.availableVolumes.push(volume)
              }
              console.log(this.availableVolumes)
            }
          })
        }
      }
    },
    submitExpand() {
      console.log(this.selectExpansionVolume)
      const requestData = {
        logicGuid: this.selectVolume.guid,
        childGuid: this.selectExpansionVolume.guid
      }
      axios.post('http://localhost:8080/api/v2/uofs/volume/storageExpansion', requestData, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
        .then(response => {
          this.$message.success('扩容成功')
          this.isExpansion = false
          this.getVolumes()
        })
        .catch(error => {
          this.$message.error('扩容失败')
          console.error('请求失败:', error.response ? error.response.data : error.message)
        })
    },
    deleteVolume() {
      this.$confirm('确认删除该卷？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        axios.delete(`http://localhost:8080/api/v2/uofs/volume/delete/${this.selectVolume.guid}`)
          .then(() => {
            this.$message.success('卷删除成功')
            this.getVolumes()
          })
          .catch(error => {
            this.$message.error('卷删除失败')
            console.error('删除卷失败:', error.response ? error.response.data : error.message)
          })
      }).catch(() => {
        this.$message.info('已取消删除')
      })
    },
    resetForm() {
      this.volumeType = null
      this.volumeName = ''
      this.definitionCapacity = ''
      this.mountPoint = null
    },
    resetExpansionForm() {
      this.selectExpansionVolume = null
    }
  }
}
</script>

<style scoped>
.full-height-container{
  height: 100vh;
}
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

.el-aside {
  border-right: 1px solid #ebeef5;
  background-color: #fafafa;
}

.details-card {
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.volume-details {
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.detail-item {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.detail-item i {
  margin-right: 10px;
  font-size: 18px;
  color: #409eff;
}

.detail-label {
  font-weight: bold;
  margin-right: 10px;
  color: #606266;
}

.detail-value {
  color: #303133;
}

.context-menu {
  position: absolute;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  z-index: 1000;
  padding: 5px 0;
  animation: fadeIn 0.2s ease;
}

.context-menu .el-menu-item {
  height: 40px;
  line-height: 40px;
  font-size: 14px;
  color: #606266;
  padding: 0 20px;
}

.context-menu .el-menu-item:hover {
  background-color: #f5f7fa;
  color: #409eff;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.drawer-card {
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.drawer-header {
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 20px;
}

.drawer-header i {
  margin-right: 10px;
  font-size: 24px;
}

.drawer-description {
  color: #666;
  margin-bottom: 20px;
}

.type-selection {
  margin-bottom: 20px;
}

.type-selection .el-radio {
  display: block;
  margin-bottom: 20px;
}

.type-card {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 20px;
  border-radius: 8px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.type-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.16);
}

.type-content {
  text-align: center;
}

.type-content i {
  font-size: 24px;
  margin-bottom: 10px;
}

.type-content span {
  font-size: 16px;
  font-weight: bold;
  display: block;
  margin-bottom: 5px;
}

.type-content .type-description {
  font-size: 12px;
  color: #999;
}

.expansion-select {
  width: 100%;
  margin-bottom: 20px;
}

.submit-button {
  width: 100%;
  margin-top: 20px;
}
</style>
