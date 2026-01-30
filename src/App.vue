<template>
  <div class="app-container">
    <!-- 顶部标题 -->
    <header class="app-header">
      <h1>🌍 西域之光9.0服务器</h1>
      <p>Java+基岩双端互通 | 支持1.9-1.21x版本</p>
    </header>

    <!-- 置顶公告 -->
    <section class="notice-section" v-if="notice">
      <div class="notice-card">
        <span class="notice-tag">置顶公告</span>
        <span class="notice-content">{{ notice }}</span>
      </div>
    </section>

    <!-- 服务器IP模块（核心，一键复制） -->
    <section class="ip-section">
      <h2 class="section-title">🔥 服务器IP（点击复制）</h2>
      <div class="ip-card">
        <div class="ip-item" @click="copyToClipboard(javaIp)">
          <span class="ip-label">Java版：</span>
          <span class="ip-value">{{ javaIp }}</span>
        </div>
        <div class="ip-item" @click="copyToClipboard(bedrockIp)">
          <span class="ip-label">基岩版地址：</span>
          <span class="ip-value">{{ bedrockIp }}</span>
        </div>
        <div class="ip-item" @click="copyToClipboard(bedrockPort)">
          <span class="ip-label">基岩版端口：</span>
          <span class="ip-value">{{ bedrockPort }}</span>
        </div>
      </div>
      <p class="ip-tip">✅ Java版直接粘贴进服务器列表；基岩版手动填写地址+端口</p>
    </section>

    <!-- 玩家群二维码（引流用） -->
    <section class="qrcode-section">
      <p class="qrcode-tip">扫码进群，获取福利&最新通知</p>
      <img src="/blogs/qrcode.jpg" alt="玩家群二维码" class="qrcode-img" v-if="hasQrcode">
      <p class="qrcode-placeholder" v-else>群二维码可放入 src/public/blogs 命名为 qrcode.jpg</p>
    </section>

    <!-- 服务器实时状态 -->
    <section class="status-section">
      <h2 class="section-title">📊 服务器实时状态</h2>
      <div class="status-card">
        <p v-if="isLoading">查询中...</p>
        <p v-else-if="errorMsg" class="error">{{ errorMsg }}</p>
        <div v-else>
          <p>状态：<span class="status-online">{{ isOnline ? '✅ 在线' : '❌ 离线' }}</span></p>
          <p>在线人数：{{ onlinePlayers }}/{{ maxPlayers }}</p>
          <p>版本支持：{{ serverVersion }}</p>
        </div>
      </div>
    </section>

    <!-- MD博客模块（支持上传+搜索+排序） -->
    <section class="blog-section">
      <h2 class="section-title">📝 服务器博客</h2>
      <!-- 博客搜索 -->
      <div class="blog-search">
        <input type="text" v-model="searchKey" placeholder="搜索博客标题/内容" class="search-input">
      </div>
      <!-- MD上传按钮 -->
      <div class="blog-upload">
        <label for="md-upload" class="upload-btn">上传MD博客</label>
        <input type="file" id="md-upload" accept=".md" @change="handleMdUpload" hidden>
      </div>
      <!-- 博客列表 -->
      <div class="blog-list">
        <div class="blog-item" v-for="(blog, index) in filterBlogs" :key="index">
          <h3 class="blog-title">{{ blog.title }}</h3>
          <p class="blog-time">{{ blog.time }}</p>
          <div class="blog-content" v-html="$marked(blog.content)"></div>
          <div class="blog-divider"></div>
        </div>
        <p v-if="filterBlogs.length === 0" class="empty-tip">暂无博客，上传MD文件开始分享～</p>
      </div>
    </section>

    <!-- 玩家留言板（KV持久化） -->
    <section class="comment-section">
      <h2 class="section-title">💬 玩家留言板</h2>
      <!-- 清空留言按钮（管理员用） -->
      <button @click="clearComments" class="clear-btn">清空所有留言（管理员）</button>
      <!-- 留言输入 -->
      <div class="comment-input">
        <textarea v-model="newComment" placeholder="输入你的留言（支持简单Markdown）" rows="3"></textarea>
        <button @click="submitComment" class="submit-btn">提交留言</button>
      </div>
      <!-- 留言列表 -->
      <div class="comment-list">
        <div class="comment-item" v-for="(comment, index) in commentList" :key="index">
          <div class="comment-content" v-html="$marked(comment)"></div>
          <div class="comment-time">{{ getCommentTime(index) }}</div>
        </div>
        <p v-if="commentList.length === 0" class="empty-tip">暂无留言，快来抢沙发～</p>
      </div>
    </section>

    <!-- 底部信息 -->
    <footer class="app-footer">
      <p>西域之光9.0服务器 © 2024 | 部署于Cloudflare Pages</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'

// 核心配置（直接修改这里即可更新）
const javaIp = 'westworld.9666.fun:16044'
const bedrockIp = 'westworld.9666.fun'
const bedrockPort = '16044'
const notice = ref('服务器每日10点例行维护，时长30分钟，请勿跑图～') // 置顶公告
const hasQrcode = ref(false) // 是否有群二维码

// 1. 一键复制功能
const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text)
    .then(() => alert(`已复制：${text}`))
    .catch(() => alert('复制失败，请手动复制'))
}

// 2. 服务器状态查询（带重试，适配端口查询）
const isLoading = ref(true)
const errorMsg = ref('')
const isOnline = ref(false)
const onlinePlayers = ref(0)
const maxPlayers = ref(20)
const serverVersion = ref('1.9-1.21x')

const fetchServerStatus = async () => {
  try {
    isLoading.value = true
    const [host, port] = javaIp.split(':')
    const res = await axios.get(`https://api.mcsrvstat.us/2/${host}:${port}`)
    const data = res.data
    isOnline.value = data.online
    if (data.online) {
      onlinePlayers.value = data.players.online || 0
      maxPlayers.value = data.players.max || 20
      serverVersion.value = data.version || '1.9-1.21x'
      errorMsg.value = ''
    } else {
      errorMsg.value = '✅ 服务器离线（维护中/未开服）'
    }
  } catch (err) {
    // 失败自动重试1次
    setTimeout(async () => {
      try {
        const [host, port] = javaIp.split(':')
        const res = await axios.get(`https://api.mcsrvstat.us/2/${host}:${port}`)
        const data = res.data
        isOnline.value = data.online
        onlinePlayers.value = data.players.online || 0
        maxPlayers.value = data.players.max || 20
        serverVersion.value = data.version || '1.9-1.21x'
      } catch (retryErr) {
        errorMsg.value = '❌ 状态查询失败（服务器未开/网络问题）'
      } finally {
        isLoading.value = false
      }
    }, 1000)
  } finally {
    if (!errorMsg.value) isLoading.value = false
  }
}

// 3. MD博客处理（防乱码+标题提取+排序+搜索）
const blogList = ref([])
const searchKey = ref('')
// 过滤后的博客列表（搜索用）
const filterBlogs = computed(() => {
  if (!searchKey.value.trim()) return blogList.value
  return blogList.value.filter(item => 
    item.title.includes(searchKey.value) || item.content.includes(searchKey.value)
  )
})

// 上传本地MD（防乱码+自动提标题）
const handleMdUpload = (e) => {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.readAsText(file, 'utf-8') // 强制UTF-8防乱码
  reader.onload = (event) => {
    let content = event.target.result
    // 提取一级标题作为博客标题
    const titleMatch = content.match(/#\s+(.*?)\n/)
    const blogTitle = titleMatch ? titleMatch[1] : file.name.replace('.md', '')
    blogList.value.unshift({
      title: blogTitle,
      content: content,
      fileName: file.name,
      time: new Date().toLocaleString('zh-CN')
    })
    alert(`已上传博客：${blogTitle}`)
    e.target.value = '' // 重置文件选择器
  }
}

// 加载服务器端MD文件（按时间排序）
const loadBlogsFromServer = async () => {
  try {
    const res = await fetch('/blogs/')
    if (!res.ok) return
    const html = await res.text()
    const mdLinks = html.match(/href="(.*?\.md)"/g) || []
    const blogPromises = mdLinks.map(async (link) => {
      const url = link.match(/href="(.*?)"/)[1]
      const mdRes = await fetch(url)
      const content = await mdRes.text()
      const fileName = url.split('/').pop()
      // 提取标题，文件名带日期则用日期排序
      const titleMatch = content.match(/#\s+(.*?)\n/)
      const title = titleMatch ? titleMatch[1] : fileName.replace('.md', '')
      const timeMatch = fileName.match(/(\d{4}-\d{2}-\d{2})/)
      const time = timeMatch ? timeMatch[1] : new Date().toLocaleString('zh-CN')
      return { title, content, fileName, time }
    })
    const loadedBlogs = await Promise.all(blogPromises)
    // 按时间倒序，新博客在前
    blogList.value = loadedBlogs.sort((a, b) => new Date(b.time) - new Date(a.time))
    // 检测是否有二维码
    const qrRes = await fetch('/blogs/qrcode.jpg')
    hasQrcode.value = qrRes.ok
  } catch (err) {
    console.log('加载服务器MD/二维码失败（本地开发正常）：', err)
  }
}

// 4. 玩家留言（KV持久化+清空功能）
const newComment = ref('')
const commentList = ref([])

// 读取留言（生产KV/本地localStorage）
const loadCommentsFromKV = async () => {
  try {
    if (process.env.NODE_ENV === 'production') {
      const comments = await env.blog_data.get('player_comments', { type: 'json' })
      commentList.value = comments || []
    } else {
      const localComments = localStorage.getItem('player_comments')
      commentList.value = localComments ? JSON.parse(localComments) : []
    }
  } catch (err) {
    console.error('读取留言失败：', err)
    commentList.value = []
  }
}

// 提交留言
const submitComment = async () => {
  const comment = newComment.value.trim()
  if (!comment) return alert('留言不能为空！')
  commentList.value.unshift(comment)
  newComment.value = ''
  try {
    const commentsStr = JSON.stringify(commentList.value)
    if (process.env.NODE_ENV === 'production') {
      await env.blog_data.put('player_comments', commentsStr)
    } else {
      localStorage.setItem('player_comments', commentsStr)
    }
  } catch (err) {
    alert('留言提交失败，请稍后重试')
    console.error('保存留言失败：', err)
  }
}

// 清空所有留言（管理员功能）
const clearComments = async () => {
  if (!confirm('确定清空所有留言？操作不可恢复！')) return
  commentList.value = []
  try {
    if (process.env.NODE_ENV === 'production') {
      await env.blog_data.put('player_comments', JSON.stringify([]))
    } else {
      localStorage.removeItem('player_comments')
    }
    alert('所有留言已清空')
  } catch (err) {
    alert('清空留言失败')
    console.error('清空留言报错：', err)
  }
}

// 留言时间格式化
const getCommentTime = (index) => {
  const now = new Date()
  return `发表于 ${now.toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  })}`
}

// 页面初始化（加载所有数据）
onMounted(() => {
  fetchServerStatus() // 查服务器状态
  loadBlogsFromServer() // 加载MD博客
  loadCommentsFromKV() // 加载留言
  // 每5分钟刷新一次服务器状态
  setInterval(fetchServerStatus, 300000)
  // 生产环境从KV读取公告（可远程修改）
  if (process.env.NODE_ENV === 'production') {
    env.blog_data.get('server_notice').then(res => {
      if (res) notice.value = res
    })
  }
})
</script>

<style scoped>
/* 全局样式，西域风格，简洁适配 */
.app-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Microsoft YaHei', sans-serif;
  color: #333;
  background-color: #f9f9f9;
  min-height: 100vh;
}

.app-header {
  text-align: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e6a23c;
}
.app-header h1 {
  color: #e6a23c;
  font-size: 28px;
  margin-bottom: 8px;
}
.app-header p {
  color: #666;
  font-size: 16px;
}

/* 置顶公告 */
.notice-section { margin-bottom: 20px; }
.notice-card {
  background: #fff3cd;
  padding: 12px 15px;
  border-radius: 6px;
  border-left: 3px solid #ffc107;
}
.notice-tag {
  color: #856404;
  font-weight: bold;
  margin-right: 8px;
}
.notice-content { color: #856404; }

/* 通用标题 */
.section-title {
  color: #d48806;
  font-size: 20px;
  margin: 25px 0 12px;
  padding-left: 10px;
  border-left: 3px solid #e6a23c;
}

/* IP模块 */
.ip-card {
  background: #2c2c2c;
  color: #fff;
  padding: 20px;
  border-radius: 10px;
  border-left: 4px solid #e6a23c;
}
.ip-item {
  margin: 10px 0;
  padding: 8px 12px;
  background: #444;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
}
.ip-item:hover {
  background: #e6a23c;
  color: #000;
}
.ip-label {
  font-weight: bold;
  color: #f5d399;
  margin-right: 10px;
  width: 80px;
}
.ip-value {
  font-family: 'Courier New', monospace;
  flex: 1;
}
.ip-tip {
  color: #666;
  font-size: 14px;
  margin-top: 10px;
  line-height: 1.5;
}

/* 二维码模块 */
.qrcode-section {
  text-align: center;
  margin: 20px 0;
  padding: 15px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}
.qrcode-tip { color: #666; margin-bottom: 10px; }
.qrcode-img { width: 150px; border-radius: 8px; }
.qrcode-placeholder { color: #999; font-size: 13px; }

/* 服务器状态 */
.status-card {
  background: #fff;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  line-height: 1.8;
}
.status-online { color: #28a745; font-weight: bold; }
.error { color: #dc3545; }

/* 博客模块 */
.blog-search { margin-bottom: 12px; }
.search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  outline: none;
  font-size: 14px;
}
.search-input:focus { border-color: #e6a23c; }
.upload-btn {
  display: inline-block;
  padding: 10px 20px;
  background: #e6a23c;
  color: #fff;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.3s;
  margin-bottom: 15px;
}
.upload-btn:hover { background: #d48806; }
.blog-list {
  background: #fff;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}
.blog-item { margin-bottom: 25px; }
.blog-title {
  color: #d48806;
  font-size: 20px;
  margin-bottom: 5px;
}
.blog-time {
  font-size: 12px;
  color: #999;
  margin-bottom: 10px;
}
.blog-content { line-height: 1.6; }
.blog-content h1 { font-size: 22px; color: #d48806; margin: 15px 0; }
.blog-content h2 { font-size: 18px; color: #e6a23c; margin: 12px 0; }
.blog-content p { margin: 10px 0; }
.blog-content img { max-width: 100%; border-radius: 6px; margin: 10px 0; }
.blog-divider {
  height: 1px;
  background: #eee;
  margin: 20px 0;
}

/* 留言模块 */
.clear-btn {
  padding: 6px 12px;
  background: #dc3545;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  margin-bottom: 10px;
}
.clear-btn:hover { background: #c82333; }
.comment-input {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}
.comment-input textarea {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  resize: none;
  outline: none;
}
.comment-input textarea:focus { border-color: #e6a23c; }
.submit-btn {
  padding: 0 20px;
  background: #e6a23c;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.3s;
}
.submit-btn:hover { background: #d48806; }
.comment-list {
  background: #fff;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}
.comment-item {
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px dashed #eee;
}
.comment-time {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
}

/* 通用空提示 */
.empty-tip {
  color: #999;
  text-align: center;
  padding: 20px;
  line-height: 1.5;
}

/* 底部 */
.app-footer {
  text-align: center;
  padding: 20px 0;
  color: #999;
  font-size: 14px;
  border-top: 1px solid #eee;
  margin-top: 40px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .app-container { padding: 15px; }
  .app-header h1 { font-size: 24px; }
  .comment-input { flex-direction: column; }
  .ip-item { font-size: 14px; padding: 6px 10px; }
  .section-title { font-size: 18px; }
}
</style>
