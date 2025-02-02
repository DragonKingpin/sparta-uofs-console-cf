<template>
  <div
    class="container"
    @contextmenu.prevent="handleGlobalContextMenu"
    @mousedown="handleGlobalClick"
    @drop="handleDrop"
    @dragover="handleDragOver"
  >
    <!-- 顶部操作栏 -->
    <div class="top-bar">
      <el-button
        icon="el-icon-back"
        :disabled="currentPath.length === 0"
        @click="goBack"
      >返回上级</el-button>
      <el-button type="primary" icon="el-icon-upload2" @click="triggerFileInput">上传</el-button>
      <el-button icon="el-icon-folder-add" @click="openCreateFolderDialog">新建文件夹</el-button>
      <el-button icon="el-icon-download" @click="offlineDownload">离线下载</el-button>
      <el-button-group class="view-switch">
        <el-button
          :type="viewMode === 'list' ? 'primary' : 'default'"
          icon="el-icon-menu"
          @click="switchView('list')"
        />
        <el-button
          :type="viewMode === 'grid' ? 'primary' : 'default'"
          icon="el-icon-picture-outline"
          @click="switchView('grid')"
        />
      </el-button-group>
    </div>

    <!-- 地址栏（路径导航） -->
    <div class="address-bar">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item>
          <a @click="jumpToFolder(-1)">根目录</a>
        </el-breadcrumb-item>
        <el-breadcrumb-item
          v-for="(folder, index) in currentPath"
          :key="folder.guid"
        >
          <a @click="jumpToFolder(index)">{{ folder.name }}</a>
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <!-- 隐藏的文件输入元素 -->
    <input
      ref="fileInput"
      type="file"
      style="display: none"
      @change="handleFileInputChange"
    >

    <!-- 下载进度条 -->
    <el-progress
      v-if="downloadProgressVisible"
      :percentage="downloadProgress"
      status="success"
      :stroke-width="10"
      class="download-progress"
    />

    <el-container style="height: calc(100% - 60px);">
      <!-- 左侧树形结构 -->
      <el-aside width="200px" class="sidebar">
        <el-tree
          ref="fileTree"
          :data="data"
          :props="defaultProps"
          draggable
          class="tree"
          :default-expanded-keys="expandedKeys"
          node-key="guid"
          @node-click="handleNodeClick"
        />
      </el-aside>

      <!-- 右侧内容区域 -->
      <el-main class="main-content">
        <!-- 网格视图 -->
        <!-- 网格视图 -->
        <div v-if="viewMode === 'grid'" class="grid-view">
          <div
            v-for="item in mainData"
            :key="item.guid"
            class="file-item"
            @click="handleFileClick(item)"
            @contextmenu.prevent="handleFileContextMenu(item, $event)"
          >
            <!-- 如果是图片文件，展示缩略图 -->
            <img
              v-if="isImageFile(item)"
              :src="getFileUrl(item)"
              :alt="item.name"
              class="file-thumbnail"
            >
            <!-- 如果是文件夹，展示文件夹图标 -->
            <i v-else-if="item.metaType === 'Folder'" class="el-icon-folder" />
            <i v-else-if="item.metaType === 'ExternalSymbolic'" class="el-icon-folder" />
            <i v-else-if="item.metaType === 'ExternalFolder'" class="el-icon-folder" />
            <!-- 如果是视频文件，展示视频图标 -->
            <i v-else-if="['mp4', 'avi', 'mov', 'mkv'].includes(getFileType(item.name))" class="el-icon-video-camera" />
            <!-- 如果是音频文件，展示音频图标 -->
            <i v-else-if="['mp3', 'wav', 'ogg'].includes(getFileType(item.name))" class="el-icon-headset" />
            <!-- 如果是 PDF 文件，展示 PDF 图标 -->
            <font-awesome-icon
              v-else-if="getFileType(item.name) === 'pdf'"
              icon="far fa-file-pdf"
              style="font-size: 50px; color: #409eff ;"
            />
            <font-awesome-icon
              v-else-if="['doc', 'docx'].includes(getFileType(item.name))"
              icon="fas fa-file-word"
              style="font-size: 50px; color: #409eff;"
            />
            <!-- 如果是 Excel 文件，展示 Excel 图标 -->
            <font-awesome-icon
              v-else-if="['xls', 'xlsx'].includes(getFileType(item.name))"
              icon="fas fa-file-excel"
              style="font-size: 50px; color: #409eff;"
            />
            <!-- 如果是 PPTX 文件，展示 PPTX 图标 -->
            <i v-else-if="['ppt', 'pptx'].includes(getFileType(item.name))" class="el-icon-document" />
            <!-- 其他文件类型，展示默认图标 -->
            <i v-else class="el-icon-document" />
            <span class="file-name">{{ item.name }}</span>
          </div>
        </div>

        <!-- 列表视图 -->
        <el-table
          v-else
          :data="mainData"
          style="width: 100%"
          class="file-table"
          @row-contextmenu="handleTableContextMenu"
          @row-click="handleRowClick"
        >
          <el-table-column prop="name" label="名称" />
          <el-table-column prop="updateTime" label="更新时间" />
          <el-table-column prop="metaType" label="类型" />
          <el-table-column prop="physicalSize" label="大小" />
        </el-table>
      </el-main>
    </el-container>

    <!-- 自定义右键菜单 -->
    <transition name="menu-fade">
      <div
        v-if="contextMenuVisible"
        :style="{ top: contextMenuPosition.y + 'px', left: contextMenuPosition.x + 'px' }"
        class="context-menu"
        @mousedown.stop
      >
        <ul>
          <li @click="removeFile"><i class="el-icon-delete" /> 删除</li>
          <li @click="attribute"><i class="el-icon-document" /> 属性</li>
          <li @click="downloadFile(currentFile)"><i class="el-icon-download" /> 下载</li>
        </ul>
      </div>
    </transition>

    <!-- 属性抽屉 -->
    <el-drawer
      title="属性"
      :visible.sync="drawer"
      :direction="direction"
      class="attribute-drawer"
    >
      <div v-if="currentFile" class="attribute-content">
        <!-- 名称 -->
        <div class="attribute-item">
          <div class="attribute-label">
            <i class="el-icon-document" />
            <span>名称：</span>
          </div>
          <div class="attribute-value" @click="copyToClipboard(currentFile.name)">
            {{ currentFile.name }}
          </div>
        </div>
        <el-divider />

        <!-- 类型 -->
        <div class="attribute-item">
          <div class="attribute-label">
            <i class="el-icon-folder" />
            <span>类型：</span>
          </div>
          <div class="attribute-value" @click="copyToClipboard(currentFile.metaType)">
            {{ currentFile.metaType }}
          </div>
        </div>
        <el-divider />

        <!-- 更新时间 -->
        <div class="attribute-item">
          <div class="attribute-label">
            <i class="el-icon-time" />
            <span>更新时间：</span>
          </div>
          <div class="attribute-value" @click="copyToClipboard(currentFile.updateTime)">
            {{ currentFile.updateTime }}
          </div>
        </div>
        <el-divider />

        <!-- 创建时间 -->
        <div class="attribute-item">
          <div class="attribute-label">
            <i class="el-icon-date" />
            <span>创建时间：</span>
          </div>
          <div class="attribute-value" @click="copyToClipboard(currentFile.createTime)">
            {{ currentFile.createTime }}
          </div>
        </div>
      </div>
    </el-drawer>
    <!-- 音频文件预览弹窗 -->
    <el-dialog
      title="音频文件预览"
      :visible.sync="audioPreviewDialogVisible"
      width="50%"
      @close="handleAudioPreviewClose"
    >
      <audio
        :src="audioUrl"
        controls
        style="width: 100%;"
      >
        您的浏览器不支持音频播放。
      </audio>
    </el-dialog>
    <!-- TXT 文件预览弹窗 -->
    <el-dialog
      title="TXT 文件预览"
      :visible.sync="fileShowDialogVisible"
      width="50%"
      @close="fileShowDialogVisible = false"
    >
      <pre class="file-content">{{ fileContent }}</pre>
    </el-dialog>
    <!-- 视频文件预览弹窗 -->
    <!-- 视频文件预览弹窗 -->
    <el-dialog
      title="视频文件预览"
      :visible.sync="videoPreviewDialogVisible"
      width="40%"
      class="video-preview-dialog"
      @close="handleVideoPreviewClose"
    >
      <video
        ref="videoPlayer"
        :src="videoUrl"
        controls
        style="width: 100%; height: auto;"
      >
        您的浏览器不支持视频播放。
      </video>
    </el-dialog>
    <!-- Excel 文件预览弹窗 -->
    <el-dialog
      title="Excel 文件预览"
      :visible.sync="excelPreviewDialogVisible"
      width="50%"
      @close="excelPreviewDialogVisible = false"
    >
      <hot-table :settings="hotSettings" />
    </el-dialog>
    <el-dialog
      title="PDF 文件预览"
      :visible.sync="pdfPreviewDialogVisible"
      width="50%"
      @close="pdfPreviewDialogVisible = false"
    >
      <div id="pdf-preview-container" />
    </el-dialog>
    <!-- Word 文件预览弹窗 -->
    <el-dialog
      title="Word 文件预览"
      :visible.sync="wordPreviewDialogVisible"
      width="60%"
      @close="wordPreviewDialogVisible = false"
    >
      <div class="word-preview-content" v-html="wordContent" />
    </el-dialog>
    <!-- PPTX 文件预览弹窗 -->
    <el-dialog
      title="PPTX 文件预览"
      :visible.sync="pptPreviewDialogVisible"
      width="60%"
      @close="pptPreviewDialogVisible = false"
    >
      <office-viewer :src="pptUrl" />
    </el-dialog>
    <!-- 图片文件预览弹窗 -->
    <el-dialog
      title="图片文件预览"
      :visible.sync="imagePreviewDialogVisible"
      width="50%"
      height="100px"
      @close="imagePreviewDialogVisible = false"
    >
      <img
        :src="imageUrl"
        alt="图片预览"
        style="max-width: 100%; max-height: 80vh; display: block; margin: 0 auto;"
      >
    </el-dialog>
    <!-- 新建文件夹弹窗 -->
    <el-dialog
      title="新建文件夹"
      :visible.sync="createFolderDialogVisible"
      width="30%"
      @close="resetCreateFolderForm"
    >
      <el-form :model="createFolderForm" label-width="80px">
        <el-form-item label="文件夹名">
          <el-input v-model="createFolderForm.folderName" placeholder="请输入文件夹名称" />
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="createFolderDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmCreateFolder">确定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script >
import OfficeViewer from 'office-viewer'
import * as XLSX from 'xlsx' // 导入 xlsx 库
import { HotTable } from '@handsontable/vue' // 导入 Handsontable 组件
import 'handsontable/dist/handsontable.full.css' // 导入 Handsontable 样式
import PDFObject from 'pdfobject'
import axios from 'axios'
import { saveAs } from 'file-saver'
import mammoth from 'mammoth'
export default {
  components: {
    HotTable, // 注册 Handsontable 组件
    OfficeViewer
  },
  data() {
    return {
      data: [],
      // 其他数据...
      pptPreviewDialogVisible: false, // 控制 PPTX 预览弹窗显示
      pptUrl: '', // PPTX 文件的 URL
      excelPreviewDialogVisible: false, // 控制 Excel 预览弹窗显示
      excelData: [], // Excel 文件数据
      hotSettings: {
        data: [], // Handsontable 数据
        rowHeaders: true, // 显示行号
        colHeaders: true, // 显示列号
        height: 'auto', // 自动高度
        autoColumnSize: true, // 启用自动列宽
        licenseKey: 'non-commercial-and-evaluation' // 免费许可证
      },
      defaultProps: {
        children: 'children',
        label: 'name'
      },
      pdfPreviewDialogVisible: false, // 控制 PDF 预览弹窗显示
      pdfUrl: '', // PDF 文件 URL
      currentPage: 1, // 当前页码
      totalPages: 0, // 总页数
      pdfDoc: null, // PDF 文档对象
      wordPreviewDialogVisible: false, // 控制 Word 预览弹窗显示
      wordContent: '', // Word 文件内容
      audioPreviewDialogVisible: false, // 控制音频预览弹窗显示
      audioUrl: '', // 音频文件的 URL
      imagePreviewDialogVisible: false, // 控制图片预览弹窗显示
      imageUrl: '', // 图片文件的 URL
      videoPreviewDialogVisible: false, // 控制视频预览弹窗显示
      videoUrl: '', // 视频文件的 URL
      fileContent: '', // TXT 文件的内容
      fileShowDialogVisible: false, // 控制 TXT 预览弹窗显示
      mainData: [],
      contextMenuVisible: false,
      contextMenuPosition: { x: 0, y: 0 },
      selectedNode: null,
      drawer: false,
      direction: 'rtl',
      currentFile: null,
      viewMode: 'list', // 默认视图模式：list | grid
      expandedKeys: [], // 展开的节点 key 数组
      currentPath: [], // 当前路径
      downloadProgress: 0, // 下载进度百分比
      downloadProgressVisible: false, // 是否显示进度条
      createFolderDialogVisible: false, // 新建文件夹弹窗显示状态
      createFolderForm: {
        folderName: '' // 用户输入的文件夹名称
      }
    }
  },
  mounted() {
    this.listRoot()
  },
  methods: {
    // 判断文件是否为图片类型
    isImageFile(item) {
      const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp']
      const fileType = this.getFileType(item.name) // 获取文件扩展名
      return imageTypes.includes(fileType)
    },
    // 点击地址栏中的文件夹，跳转到对应的文件夹
    jumpToFolder(index) {
      if (index === -1) {
        this.listRoot() // 直接返回根目录
        this.currentPath = []
        localStorage.removeItem('currentPath')
      } else {
        this.currentPath = this.currentPath.slice(0, index + 1) // 截取路径
        const targetFolder = this.currentPath[index] // 获取目标文件夹
        this.loadFolderContent(targetFolder) // 加载该文件夹的内容
      }
      this.saveCurrentPath()
    },
    previewPptxFile(item) {
      this.pptUrl = this.getFileUrl(item)
      this.pptPreviewDialogVisible = true
    },
    // 预览 Excel 文件
    previewExcelFile(item) {
      const fileUrl = this.getFileUrl(item)
      axios
        .get(fileUrl, { responseType: 'arraybuffer' })
        .then((response) => {
          const data = new Uint8Array(response.data)
          const workbook = XLSX.read(data, { type: 'array' }) // 解析 Excel 文件
          const sheetName = workbook.SheetNames[0] // 获取第一个工作表
          const worksheet = workbook.Sheets[sheetName]
          this.excelData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) // 将工作表数据转换为 JSON

          // 更新 Handsontable 数据
          this.hotSettings.data = this.excelData
          this.excelPreviewDialogVisible = true // 打开预览弹窗
        })
        .catch((error) => {
          console.error('Excel 文件解析失败:', error)
          this.$message.error('Excel 文件解析失败，请下载后查看')
        })
    },

    // 判断文件类型
    getFileType(filename) {
      const extension = filename.split('.').pop().toLowerCase()
      return extension
    },
    // 触发文件选择对话框
    triggerFileInput() {
      this.$refs.fileInput.click()
    },

    // 处理文件选择
    handleFileInputChange(event) {
      const file = event.target.files[0]
      if (file) {
        this.uploadFile(file)
      }
    },

    // 处理文件上传
    uploadFile(file) {
      const formData = new FormData()

      // 获取当前路径
      const currentPath = this.getCurrentPath()

      // 生成完整路径（当前路径 + 文件名）
      const filePath = currentPath ? `${currentPath}/${file.name}` : file.name

      // 添加文件路径和文件到 FormData
      formData.append('filePath', filePath) // 文件路径
      formData.append('file', file) // 文件

      // 调用后端接口上传文件
      axios
        .post('http://localhost:8080/api/v2/uofs/transmit/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data' // 必须设置 Content-Type
          }
        })
        .then((response) => {
          this.$message.success('文件上传成功')
          // 上传成功后刷新当前文件夹内容
          this.loadFolderContent(this.currentPath[this.currentPath.length - 1])
        })
        .catch((error) => {
          this.$message.error('文件上传失败')
          console.error('上传失败:', error)
        })
    },

    // 处理拖放文件上传
    handleDrop(event) {
      event.preventDefault()
      const file = event.dataTransfer.files[0]
      if (file) {
        this.uploadFile(file)
      }
    },

    // 阻止默认的拖放行为
    handleDragOver(event) {
      event.preventDefault()
    },
    // 打开新建文件夹弹窗
    openCreateFolderDialog() {
      this.createFolderDialogVisible = true
    },

    // 重置新建文件夹表单
    resetCreateFolderForm() {
      this.createFolderForm.folderName = ''
    },

    // 确认创建文件夹
    confirmCreateFolder() {
      if (!this.createFolderForm.folderName) {
        this.$message.warning('请输入文件夹名称')
        return
      }

      // 获取当前路径
      const currentPath = this.getCurrentPath()

      // 生成完整路径
      const fullPath = currentPath ? `${currentPath}/${this.createFolderForm.folderName}` : this.createFolderForm.folderName

      // 调用后端接口创建文件夹
      this.createFolderRequest(fullPath)

      // 关闭弹窗
      this.createFolderDialogVisible = false
    },

    // 获取当前路径
    getCurrentPath() {
      return this.currentPath.map(folder => folder.name).join('/')
    },

    // 调用后端接口创建文件夹
    createFolderRequest(fullPath) {
      console.log('完整路径:', fullPath)
      axios.get('http://localhost:8080/api/v2/uofs/folder/creat/folder', {
        params: {
          destDirPath: fullPath
        }
      }).then((rs) => {
        console.log(rs)
        const currentFolder = this.currentPath.length > 0 ? this.currentPath[this.currentPath.length - 1] : null
        if (currentFolder) {
          this.loadFolderContent(currentFolder) // 重新加载当前文件夹内容
        } else {
          this.listRoot() // 如果当前在根目录，重新加载根目录
        }
      })
    },

    // 处理列表视图中的行点击事件
    handleRowClick(row, column, event) {
      this.handleFileClick(row) // 调用 handleFileClick 方法
    },

    // 点击网格视图中的文件或文件夹
    handleFileClick(item) {
      const fileType = this.getFileType(item.name)
      if (item.metaType === 'Folder') {
        this.currentPath.push(item) // 添加到路径
        this.loadFolderContent(item)
        this.expandTree(item)
      } else if (item.metaType === 'ExternalSymbolic') {
        this.currentPath.push(item)
        this.loadExternalSymbolicContent(item)
        this.expandTree(item)
      } else if (item.metaType === 'ExternalFolder') {
        this.currentPath.push(item)
        this.loadExternalFolderContent(item)
        this.expandTree(item)
      } else if (fileType === 'txt') {
      // 如果是 TXT 文件，预览
        this.previewTextFile(item)
      } else if (['mp4', 'avi', 'mov', 'mkv'].includes(fileType)) {
        // 如果是视频文件，预览
        this.previewVideoFile(item)
      } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(fileType)) {
        // 如果是图片文件，预览
        this.previewImageFile(item)
      } else if (['mp3', 'wav', 'ogg'].includes(fileType)) {
        // 如果是音频文件，预览
        this.previewAudioFile(item)
      } else if (['doc', 'docx'].includes(fileType)) {
        // 如果是 Word、Excel 等文件，使用第三方服务预览
        this.previewWordFile(item)
      } else if (fileType === 'pdf') {
        // 如果是 PDF 文件，预览
        this.previewPdfFile(item)
      } else if (['xls', 'xlsx'].includes(fileType)) {
        this.previewExcelFile(item) // 预览 Excel 文件
      } else if (['ppt', 'pptx'].includes(fileType)) {
      // 如果是 PPTX 文件，预览
        this.previewPptxFile(item)
      }
      this.saveCurrentPath()
    },
    previewPdfFile(item) {
      const pdfUrl = this.getFileUrl(item) // 获取 PDF 文件的 URL
      this.pdfPreviewDialogVisible = true // 打开预览弹窗

      this.$nextTick(() => {
      // 将 PDF 文件嵌入到容器中
        PDFObject.embed(pdfUrl, '#pdf-preview-container', {
          height: '600px',
          width: '100%'
        })
      })
    },
    // 处理视频预览弹窗关闭
    handleVideoPreviewClose() {
      this.videoPreviewDialogVisible = false // 关闭弹窗
      const videoPlayer = this.$refs.videoPlayer // 获取 video 元素
      if (videoPlayer) {
        videoPlayer.pause() // 暂停播放
      }
    },

    // 处理音频预览弹窗关闭
    handleAudioPreviewClose() {
      this.audioPreviewDialogVisible = false // 关闭弹窗
      const audioPlayer = this.$refs.audioPlayer // 获取 audio 元素
      if (audioPlayer) {
        audioPlayer.pause() // 暂停播放
      }
    },

    // 预览音频文件
    previewAudioFile(item) {
      this.audioUrl = this.getFileUrl(item) // 获取音频文件的 URL
      this.audioPreviewDialogVisible = true // 打开音频预览弹窗
    },
    // 预览图片文件
    previewImageFile(item) {
      this.imageUrl = this.getFileUrl(item) // 获取图片文件的 URL
      this.imagePreviewDialogVisible = true // 打开图片预览弹窗
    },
    previewVideoFile(item) {
      this.videoUrl = this.getFileUrl(item) // 获取视频文件的 URL
      this.videoPreviewDialogVisible = true // 打开视频预览弹窗
    },
    previewWordFile(item) {
      const fileUrl = this.getFileUrl(item)
      axios
        .get(fileUrl, { responseType: 'arraybuffer' })
        .then((response) => {
          const arrayBuffer = response.data
          mammoth
            .extractRawText({ arrayBuffer: arrayBuffer })
            .then((result) => {
              this.wordContent = result.value // 获取纯文本内容
              this.wordPreviewDialogVisible = true // 打开预览弹窗
            })
            .catch((error) => {
              console.error('Word 文件解析失败:', error)
              this.$message.error('Word 文件解析失败，请下载后查看')
            })
        })
        .catch((error) => {
          console.error('文件加载失败:', error)
          this.$message.error('文件加载失败，请稍后重试')
        })
    },
    // 预览 TXT 文件
    previewTextFile(item) {
      axios
        .get(this.getFileUrl(item), { responseType: 'text' })
        .then((response) => {
          this.fileContent = response.data
          this.fileShowDialogVisible = true
        })
        .catch((error) => {
          console.error('文件读取失败:', error)
          this.$message.error('文件读取失败，请稍后重试')
        })
    },
    // 获取文件 URL
    getFileUrl(item) {
      return `http://localhost:8080/api/v2/uofs/transmit/download/path?path=${this.concatenate() + '/' + item.name}`
    },
    listRoot() {
      axios.get('http://localhost:8080/api/v2/uofs/folder/list/root').then((rs) => {
        this.data = rs.data.data
        for (let i = 0; i < this.data.length; i++) {
          if (this.data[i].metaType === 'Folder') {
            axios
              .get('http://localhost:8080/api/v2/uofs/folder/folder/listItem', {
                params: {
                  folderGuid: this.data[i].guid
                }
              }).then((rs) => {
                this.data[i].children = rs.data.data
              })
          }
        }
        this.mainData = rs.data.data
        this.currentPath = [] // 重置路径
        this.restoreCurrentPath()
        this.switchView(localStorage.getItem('viewMode'))
        console.log(this.data)
      })
    },
    // 返回上级
    goBack() {
      if (this.currentPath.length > 0) {
        this.currentPath.pop() // 移除最后一个路径
        const parentFolder = this.currentPath.length > 0 ? this.currentPath[this.currentPath.length - 1] : null
        if (parentFolder) {
          this.loadFolderContent(parentFolder)
          this.expandTree(parentFolder)
        } else {
          // 返回到根目录
          this.listRoot()
        }
        this.saveCurrentPath()
      }
    },

    // 加载文件夹内容
    loadFolderContent(folder) {
      if (folder.metaType === 'Folder') {
        axios
          .get('http://localhost:8080/api/v2/uofs/folder/folder/listItem', {
            params: {
              folderGuid: folder.guid
            }
          })
          .then((rs) => {
            folder.children = rs.data.data
            this.mainData = rs.data.data
            for (let i = 0; i < this.mainData.length; i++) {
              if (this.mainData[i].metaType === 'FileNode') {
                const parts = this.mainData[i].name.split('.')
                this.mainData[i].metaType = parts[parts.length - 1]
              }
            }
          })
      } else if (folder.metaType === 'ExternalSymbolic') {
        this.loadExternalSymbolicContent(folder)
      } else if (folder.metaType === 'ExternalFolder') {
        this.loadExternalFolderContent(folder)
      }
    },
    loadExternalSymbolicContent(item) {
      let path = ''
      for (let i = 0; i < this.currentPath.length; i++) {
        if (i === 0) {
          path = this.currentPath[i].name
        } else {
          path = path + '/' + this.currentPath[i].name
        }
      }
      axios
        .get('http://localhost:8080/api/v2/uofs/externalSymbolic/listItem', {
          params: {
            path: path
          }
        })
        .then((rs) => {
          item.children = rs.data.data
          this.mainData = rs.data.data
          for (let i = 0; i < this.mainData.length; i++) {
            if (this.mainData[i].metaType === 'ExternalFile') {
              const parts = this.mainData[i].name.split('.')
              this.mainData[i].metaType = parts[parts.length - 1]
            }
          }
        })
    },
    loadExternalFolderContent(item) {
      axios
        .get('http://localhost:8080/api/v2/uofs/externalSymbolic/listItem/externalFoldr', {
          params: {
            path: item.path
          }
        })
        .then((rs) => {
          item.children = rs.data.data
          this.mainData = rs.data.data
          for (let i = 0; i < this.mainData.length; i++) {
            if (this.mainData[i].metaType === 'ExternalFile') {
              const parts = this.mainData[i].name.split('.')
              this.mainData[i].metaType = parts[parts.length - 1]
            }
          }
        })
    },
    restoreCurrentPath() {
      const savedPath = localStorage.getItem('currentPath')
      if (savedPath) {
        this.currentPath = JSON.parse(savedPath)
        console.log(this.currentPath)
        if (this.currentPath.length > 0) {
          const lastFolder = this.currentPath[this.currentPath.length - 1]
          this.loadFolderContent(lastFolder)
          this.expandTree(lastFolder)
        }
      }
    },

    // 展开左侧文件树到对应节点
    expandTree(node) {
      this.expandedKeys = [node.guid]
      this.$refs.fileTree.setCurrentKey(node.guid)
    },

    // 点击树节点
    handleNodeClick(node) {
      if (node.metaType === 'Folder' && node.children === null) {
        this.currentPath.push(node) // 添加到路径
        this.loadFolderContent(node)
      }
      if (node.children != null) {
        this.mainData = node.children
        this.currentFile = node
      }
    },

    // 处理表格右键菜单
    handleTableContextMenu(row, column, event) {
      if (event.button === 2) {
        event.preventDefault()
        this.currentFile = row
        this.contextMenuVisible = true
        this.contextMenuPosition = { x: event.clientX, y: event.clientY }
      }
    },

    // 处理文件右键菜单
    handleFileContextMenu(item, event) {
      event.preventDefault()
      this.currentFile = item
      this.contextMenuVisible = true
      this.contextMenuPosition = { x: event.clientX, y: event.clientY }
    },

    // 处理全局右键菜单
    handleGlobalContextMenu(event) {
      const table = document.querySelector('.el-table')
      if (!table || !table.contains(event.target)) {
        this.contextMenuVisible = true
        this.contextMenuPosition = { x: event.clientX, y: event.clientY }
      }
    },

    // 处理全局点击事件
    handleGlobalClick(event) {
      const menu = document.querySelector('.context-menu')
      if (!menu || !menu.contains(event.target)) {
        this.contextMenuVisible = false
      }
    },

    // 删除文件
    removeFile() {
      axios
        .delete('http://localhost:8080/api/v2/uofs/folder/remove/file', {
          params: {
            fileGuid: this.currentFile.guid
          }
        })
        .then((response) => {
          console.log('成功:', response.data)
          this.refreshFileList() // 刷新文件列表
        })
        .catch((error) => {
          console.error('失败:', error)
        })
    },
    concatenate() {
      let path = ''
      for (let i = 0; i < this.currentPath.length; i++) {
        if (i === 0) {
          path = this.currentPath[i].name
        } else {
          path = path + '/' + this.currentPath[i].name
        }
      }
      return path
    },
    // 打开属性抽屉
    attribute() {
      this.drawer = true
    },

    // 关闭抽屉
    handleClose(done) {
      this.$confirm('确认关闭？')
        .then(_ => {
          done()
        })
        .catch(_ => {})
    },
    copyToClipboard(text) {
      navigator.clipboard.writeText(text)
        .then(() => {
          this.$message.success('已复制到剪贴板')
        })
        .catch(() => {
          this.$message.error('复制失败，请手动复制')
        })
    },

    // 下载文件
    downloadFile(item) {
      const file = item || this.currentFile
      if (!file) {
        this.$message.warning('未选中文件')
        return
      }
      if (item.metaType === 'Folder') {
        this.$alert('现在还不可以直接进行文件夹的下载', '开发中', {
          confirmButtonText: '确定',
          callback: action => {
            this.$message({
              type: 'info',
              message: `action: ${action}`
            })
          }
        })
      } else {
        let path = this.concatenate()
        path = path + '/' + item.name
        console.log(path)
        this.downloadProgressVisible = true // 显示进度条
        this.downloadProgress = 0 // 重置进度
        axios
          .get('http://localhost:8080/api/v2/uofs/transmit/download/path', {
            params: {
              path: path
            },
            responseType: 'blob',
            onDownloadProgress: (progressEvent) => {
              // 计算下载进度百分比
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
              this.downloadProgress = percentCompleted
            }
          })
          .then((rs) => {
            saveAs(rs.data, item.name)
            this.downloadProgressVisible = false // 下载完成后隐藏进度条
          })
          .catch((error) => {
            console.error('下载失败:', error)
            this.downloadProgressVisible = false // 下载失败时隐藏进度条
          })
      }
      this.contextMenuVisible = false
    },
    saveCurrentPath() {
      localStorage.setItem('currentPath', JSON.stringify(this.currentPath))
    },
    saveViewMode() {
      localStorage.setItem('viewMode', this.viewMode)
    },

    // 离线下载
    offlineDownload() {
      // 离线下载逻辑
    },

    // 切换视图模式
    switchView(mode) {
      this.viewMode = mode
      this.saveViewMode()
    }
  }
}
</script>

<style lang="scss" scoped>

.grid-view {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;

  .file-item {
    width: 120px;
    text-align: center;
    cursor: pointer;

    .file-thumbnail {
      width: 80%;
      height: 80px;
      object-fit: cover; // 保持图片比例
      border-radius: 4px; // 圆角
    }

    i {
      font-size: 48px;
      color: #409eff;
    }

    .file-name {
      display: block;
      margin-top: 8px;
      font-size: 14px;
      white-space: nowrap; // 防止文件名换行
      overflow: hidden; // 超出部分隐藏
      text-overflow: ellipsis; // 显示省略号
    }
  }
}
.excel-preview-dialog {
  .el-dialog {
    width: 80% !important;
    max-width: 1200px;
  }

  .handsontable {
    width: 100%;
    height: 500px;
  }
}
.pdf-preview-container {
  text-align: center;
  overflow: auto;
  max-height: 70vh;
}

canvas {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
}

.pdf-pagination {
  margin-top: 16px;
  text-align: center;
}

.pdf-pagination button {
  margin: 0 8px;
}
.video-preview-dialog {
  .el-dialog {
    width: 40% !important; // 调整弹窗宽度
    max-width: 600px; // 设置最大宽度
    border-radius: 8px; // 圆角
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); // 阴影
  }

  .el-dialog__header {
    padding: 16px;
    border-bottom: 1px solid #e4e7ed; // 标题栏底部边框
  }

  .el-dialog__title {
    font-size: 16px;
    font-weight: 500;
    color: #303133;
  }

  .el-dialog__body {
    padding: 16px;
  }

  .el-dialog__footer {
    padding: 16px;
    border-top: 1px solid #e4e7ed; // 底部边框
  }

  video {
    border-radius: 8px; // 视频播放器圆角
    background-color: #000; // 背景色
  }
}
.file-content {
  width: 800px; /* 固定宽度 */
  max-width: 100%; /* 确保不超过父容器宽度 */
  overflow-x: auto; /* 启用水平滚动条 */
  white-space: pre-wrap; /* 保留换行符和空格 */
  word-wrap: break-word; /* 允许长单词换行 */
  font-family: monospace; /* 使用等宽字体 */
  padding: 10px; /* 内边距 */
  background-color: #f5f7fa; /* 背景颜色 */
  border: 1px solid #e4e7ed; /* 边框 */
  border-radius: 4px; /* 圆角 */
}
.container {
  height: 100vh;
  background-color: #f5f7fa;
  padding: 20px;
  &.dragover {
    border: 2px dashed #409eff;
  }
}

.top-bar {
  display: flex;
  align-items: center;
  margin-bottom: 20px;

  .view-switch {
    margin-left: auto;
  }
}

.sidebar {
  background-color: #fff;
  border-right: 1px solid #e4e7ed;
  padding: 10px;
}

.main-content {
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.grid-view {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;

  .file-item {
    width: 120px;
    text-align: center;
    cursor: pointer;

    i {
      font-size: 48px;
      color: #409eff;
    }

    .file-name {
      display: block;
      margin-top: 8px;
      font-size: 14px;
    }
  }
}

.context-menu {
  position: absolute;
  background: #fff;
  border: 1px solid #e4e7ed;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  padding: 8px 0;
  border-radius: 6px;
  min-width: 160px;
  transform-origin: top left;
  animation: menu-scale 0.2s ease-out;

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  li {
    padding: 8px 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    font-size: 14px;
    color: #606266;
    transition: all 0.2s ease;

    i {
      margin-right: 8px;
      font-size: 16px;
      color: #909399;
    }

    &:hover {
      background-color: #f5f7fa;
      color: #409eff;
      i {
        color: #409eff;
      }
    }
  }
}

.menu-fade-enter-active,
.menu-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.menu-fade-enter-from,
.menu-fade-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

@keyframes menu-scale {
  0% {
    transform: scale(0.95);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.download-progress {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 2000;
  border-radius: 0;
}

.attribute-drawer {
  .attribute-content {
    padding: 20px;

    .attribute-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;

      .attribute-label {
        display: flex;
        align-items: center;
        font-size: 14px;
        color: #606266;

        i {
          margin-right: 8px;
          font-size: 16px;
        }
      }

      .attribute-value {
        font-size: 14px;
        color: #303133;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;
        background-color: #f5f7fa;
        transition: background-color 0.2s;

        &:hover {
          background-color: #e4e7ed;
        }
      }
    }

    .el-divider {
      margin: 12px 0;
    }
  }
}

.address-bar {
  background: #fff;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.address-bar a {
  color: #409eff;
  cursor: pointer;
}
.address-bar a:hover {
  text-decoration: underline;
}
</style>
