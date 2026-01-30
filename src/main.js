import { createApp } from 'vue'
import App from './App.vue'
import { marked } from 'marked'

// MD代码高亮配置（适配MC指令，无需额外依赖）
const renderer = new marked.Renderer()
renderer.code = (code, lang) => {
  return `<pre style="background:#f5f5f5;padding:15px;border-radius:6px;overflow:auto"><code style="color:#d48806;font-family:Consolas, monospace">${code}</code></pre>`
}
// MD基础配置，优化渲染效果
marked.use({
  renderer,
  gfm: true, // 支持GitHub风格MD
  breaks: true, // 回车换行
  headerIds: false // 关闭自动生成header ID
})

// 初始化Vue应用，全局挂载MD解析方法
const app = createApp(App)
app.config.globalProperties.$marked = marked
app.mount('#app')
