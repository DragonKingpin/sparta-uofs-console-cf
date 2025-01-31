// i18n/index.js

import Vue from 'vue'
import VueI18n from 'vue-i18n'

// 安装 vue-i18n 插件
Vue.use(VueI18n)

// 语言包配置
const messages = {
  // 中文语言包
  zh: {
    name: '名称',
    updateTime: '修改日期',
    type: '类型',
    size: '大小'
  },
  // 英文语言包
  en: {
    name: 'name',
    updateTime: 'updateTime',
    type: 'type',
    size: 'size'
  }
}

// 创建 i18n 实例
const i18n = new VueI18n({
  locale: 'zh', // 设置默认语言
  fallbackLocale: 'en', // 设置备用语言
  messages // 语言包
})

export default i18n
