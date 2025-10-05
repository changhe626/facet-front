import { createApp } from 'vue'
import App from './App.vue'

// 1. 引入路由配置
import router from './router'

// 2. 完整引入 Element Plus 组件库和样式
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

// (可选，但推荐) 全局注册所有 Element Plus 图标
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// 创建应用实例
const app = createApp(App)

// 全局注册图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
}

// 3. 注册插件 (告诉 Vue 使用路由和 Element Plus)
app.use(router)
app.use(ElementPlus)

// 4. 挂载应用
app.mount('#app')