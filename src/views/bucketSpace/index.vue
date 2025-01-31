<template>
  <div class="bucketSpace">
    <el-container style="height: 100%;">
      <el-aside style="width: 22%; height: 100%">
        <el-menu
          default-active="2"
          class="el-menu-vertical-demo"
          router
          @open="handleOpen"
          @close="handleClose"
        >
          <el-submenu index="1">
            <template v-slot:title>
              <span>文件管理</span>
            </template>
            <el-menu-item index="/bucketSpace/bucketSpace/fileList">
              <i class="el-icon-menu" />
              <span slot="title">文件列表</span>
            </el-menu-item>
          </el-submenu>
        </el-menu>
      </el-aside>
      <el-main><router-view /></el-main>
    </el-container>
  </div>
</template>

<script>
export default {
  methods: {
    handleOpen(key, keyPath) {
      console.log(key, keyPath)
    },
    handleClose(key, keyPath) {
      console.log(key, keyPath)
    },
    navigateTo(name) {
      this.$router.push({ name })
    }
  }
}
</script>

<style scoped>
.el-menu-vertical-demo {
  height: 100%;
}
.bucketSpace {
  height: 100vh; /* 使用视窗高度单位 */
  display: flex;
  flex-direction: column;
}
.el-container {
  flex-grow: 1; /* 确保容器占据剩余空间 */
}
</style>
