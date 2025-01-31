<template>
  <el-tree
    :data="treeData"
    node-key="id"
    default-expand-all
    :props="defaultProps"
    @node-click="handleClick"
  />
</template>

<script>
export default {
  props: {
    treeData: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      defaultProps: {
        children: 'children',
        label: 'label'
      }
    }
  },
  methods: {
    handleClick(node) {
      this.$emit('select', node)
    }
  }
}
</script>
