import Vue from 'vue'

import Cookies from 'js-cookie'

import 'normalize.css/normalize.css' // a modern alternative to CSS resets

import Element from 'element-ui'
import './styles/element-variables.scss'
import 'element-ui/lib/theme-chalk/index.css'

import '@/styles/index.scss' // global css

import App from './App'
import store from './store'
import router from './router'

import i18n from './i18n/index.ts' // i18n configuration

import './icons' // icon
import './permission' // permission control
import './utils/error-log' // error log

import * as filters from './filters' // global filters
// 引入 Font Awesome
import { library } from '@fortawesome/fontawesome-svg-core' // 核心库
import { faFilePdf } from '@fortawesome/free-regular-svg-icons' // 引入 PDF 图标
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome' // Vue 组件
import { faFileWord } from '@fortawesome/free-solid-svg-icons' // 引入 Word 图标
import { faFileExcel } from '@fortawesome/free-solid-svg-icons' // 引入 Excel 图标
// 将图标添加到库中
library.add(faFilePdf)
library.add(faFileWord)
// 将图标添加到库中
library.add(faFileExcel)
// 全局注册 FontAwesomeIcon 组件
Vue.component('font-awesome-icon', FontAwesomeIcon)

// 如果只使用中文，下面这行可以删除
// import enLang from 'element-ui/lib/locale/lang/en';

/**
 * If you don't want to use mock-server
 * you want to use MockJs for mock api
 * you can execute: mockXHR()
 *
 * Currently MockJs will be used in the production environment,
 * please remove it before going online ! ! !
 */
if (process.env.NODE_ENV === 'production') {
  const { mockXHR } = require('../mock')
  mockXHR()
}

Vue.use(Element, {
  size: Cookies.get('size') || 'medium' // set element-ui default size
  // 如果只使用中文，下面这行可以删除
  // locale: enLang
})

// register global utility filters
Object.keys(filters).forEach(key => {
  Vue.filter(key, filters[key])
})

Vue.config.productionTip = false

new Vue({
  router,
  store,
  i18n, // 传递 i18n 实例给 Vue 实例
  render: h => h(App)
}).$mount('#app')
