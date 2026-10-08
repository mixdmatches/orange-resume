<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { motion } from 'motion-v'

const router = useRouter()

/** 导航到应用 */
const goToApp = () => router.push('/my-resume')
/** 导航到模板中心 */
const goToTemplates = () => router.push('/template')

/** 滚动检测：导航栏背景切换 */
const scrolled = ref(false)
onMounted(() => {
  window.addEventListener('scroll', () => {
    scrolled.value = window.scrollY > 20
  })
})

/** 数字计数动画 */
const stats = ref([
  { value: 0, target: 6, suffix: '+', label: '精美模板' },
  { value: 0, target: 2, suffix: '种', label: '导出格式' },
  { value: 0, target: 0, suffix: '元', label: '使用费用' },
  { value: 0, target: 100, suffix: '%', label: '免费使用' },
])

onMounted(() => {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        stats.value.forEach((s, i) => {
          if (s.target === 0) {
            setTimeout(() => (s.value = 0), i * 100)
            return
          }
          const duration = 1200
          const start = performance.now()
          const animate = (now: number) => {
            const progress = Math.min((now - start) / duration, 1)
            s.value = Math.floor(s.target * progress)
            if (progress < 1) requestAnimationFrame(animate)
          }
          setTimeout(() => requestAnimationFrame(animate), i * 150)
        })
        observer.disconnect()
      }
    })
  })
  nextTick(() => {
    const el = document.querySelector('.stats-band')
    if (el) observer.observe(el)
  })
})

import { nextTick } from 'vue'

/** 功能亮点列表（交错布局） */
const features = [
  {
    icon: '✨',
    title: 'AI 工具箱，帮你写好每一段',
    desc: 'AI 流式润色改写、语法错误一键修正、简历完整性评分（A/B/C/D）与模块级诊断、职位匹配度分析、自我介绍生成——编辑器右侧随时调用。',
    points: [
      '流式 AI 润色',
      '语法检查 + 一键修正',
      '简历评分分析',
      '职位匹配',
      '自我介绍生成',
    ],
    accent: '#6366F1',
    reverse: false,
  },
  {
    icon: '🏗️',
    title: 'Local-First 架构',
    desc: '编辑时秒级写入 IndexedDB，同时自动入同步队列异步上云。断网照样改，联网自动追平。多端用 updatedAt 时间戳对账，避免冲突覆盖。',
    points: [
      'IndexedDB 本地秒存',
      '同步队列自动上云',
      '离线可编辑',
      '多端对账',
    ],
    accent: '#0EA5E9',
    reverse: true,
  },
  {
    icon: '🎨',
    title: '5 套风格化模板',
    desc: '经典商务、极简干净、专业稳重、现代科技、创意设计——套模板不用从零开始，内容填好直接用。',
    points: ['经典商务', '极简干净', '专业稳重', '现代科技', '创意设计'],
    accent: '#F59E0B',
    reverse: false,
  },
  {
    icon: '🎙️',
    title: 'AI 模拟面试间',
    desc: '独立面试间页面，流式 SSE 追问引擎，多轮对话还原真实面试。结束后自动生成评分与问题清单，帮你越练越稳。',
    points: ['流式追问', '多轮对话', '评分清单', '面试历史'],
    accent: '#EC4899',
    reverse: true,
  },
]

/** FAQ */
const activeFaq = ref<number | null>(0)
const toggleFaq = (i: number) => {
  activeFaq.value = activeFaq.value === i ? null : i
}
const faqs = [
  {
    q: '使用橘子简历需要付费吗？',
    a: '核心功能完全免费，包括简历创建、AI 润色、多模板选择、PDF 导出等。我们相信每个人都应该拥有一份专业的简历。',
  },
  {
    q: '我的数据存在哪里，安全吗？',
    a: '采用 Local-First 架构：编辑时秒级写入浏览器 IndexedDB，同时通过同步队列异步上云。即使断网也能继续编辑，联网后自动追平。AI 润色仅发送你选中的文本片段到 AI 接口，不传完整简历。',
  },
  {
    q: '支持哪些导出格式？',
    a: '目前支持 PDF（投递首选）和 JSON（完整数据备份）两种格式，覆盖求职投递与数据迁移场景。',
  },
  {
    q: 'AI 功能需要配置什么？',
    a: '在设置页填入你的 AI API Key 即可。支持 OpenAI、DeepSeek、豆包等多种接口，API 请求直接从浏览器发出，不经过我们的服务器。',
  },
  {
    q: '可以在多设备间同步吗？',
    a: '目前推荐使用 JSON 导出/导入实现设备间迁移。云端同步功能正在规划中。',
  },
]

/** 移动端菜单 */
const mobileMenuOpen = ref(false)
</script>

<template>
  <div class="landing">
    <!-- ========== 导航栏 ========== -->
    <header class="nav" :class="{ scrolled }">
      <div class="nav-inner">
        <div class="nav-brand">
          <div class="brand-mark">
            <svg viewBox="0 0 40 40" width="36" height="36">
              <defs>
                <linearGradient id="navGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stop-color="#4096ff" />
                  <stop offset="100%" stop-color="#0958d9" />
                </linearGradient>
              </defs>
              <circle cx="20" cy="22" r="14" fill="url(#navGrad)" />
              <path d="M20 8 Q22 4 25 5 Q23 7 22 9" fill="#22C55E" />
            </svg>
          </div>
          <span class="brand-name">橘子简历</span>
        </div>

        <div class="nav-actions">
          <button class="btn-primary-sm" @click="goToApp">登录 / 注册</button>
          <button class="menu-toggle" @click="mobileMenuOpen = !mobileMenuOpen">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
    </header>

    <!-- ========== Hero ========== -->
    <section class="hero">
      <!-- 背景几何装饰 -->
      <div class="hero-deco">
        <div class="deco-shape shape-1"></div>
        <div class="deco-shape shape-2"></div>
        <div class="deco-shape shape-3"></div>
        <svg
          class="hero-wave"
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
        >
          <path
            d="M0,60 C320,120 640,0 960,40 C1200,80 1320,60 1440,30 L1440,120 L0,120 Z"
            fill="#F5F7FA"
          />
        </svg>
      </div>

      <div class="hero-grid">
        <!-- 左侧文案 -->
        <div class="hero-left">
          <motion.div
            :initial="{ opacity: 0, y: 20 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.6 }"
          >
            <div class="hero-pill">
              <span class="pill-dot"></span>
              AI 驱动 · Local-First · 完全免费
            </div>
          </motion.div>

          <motion.h1
            :initial="{ opacity: 0, y: 30 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.7, delay: 0.1 }"
            class="hero-title"
          >
            写简历<br />
            <span class="gradient-text">不该这么累</span>
          </motion.h1>

          <motion.p
            :initial="{ opacity: 0, y: 20 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.6, delay: 0.25 }"
            class="hero-desc"
          >
            AI 帮你润色每一段经历，Local-First 架构离线可用，<br />
            一键导出 PDF & JSON。专业简历，几分钟搞定。
          </motion.p>

          <motion.div
            :initial="{ opacity: 0, y: 20 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.6, delay: 0.4 }"
            class="hero-btns"
          >
            <button class="btn-primary" @click="goToApp">
              立即开始
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
            <button class="btn-outline" @click="goToTemplates">浏览模板</button>
          </motion.div>
        </div>

        <!-- 右侧几何插画 -->
        <motion.div
          :initial="{ opacity: 0, scale: 0.9 }"
          :animate="{ opacity: 1, scale: 1 }"
          :transition="{ duration: 0.8, delay: 0.3 }"
          class="hero-visual"
        >
          <!-- 浮动几何卡片组合 -->
          <div class="visual-card card-main">
            <div class="card-strip"></div>
            <div class="card-content">
              <div class="vc-row">
                <div class="vc-avatar"></div>
                <div class="vc-lines">
                  <div class="vc-line w70"></div>
                  <div class="vc-line w40"></div>
                </div>
              </div>
              <div class="vc-tags">
                <span class="vc-tag">Vue</span>
                <span class="vc-tag">TS</span>
                <span class="vc-tag">Node</span>
              </div>
            </div>
          </div>
          <div class="visual-card card-float-1">
            <div class="float-icon">✨</div>
            <div class="float-label">AI 润色</div>
          </div>
          <div class="visual-card card-float-2">
            <div class="float-icon">📄</div>
            <div class="float-label">PDF 导出</div>
          </div>
          <div class="visual-orbit"></div>
        </motion.div>
      </div>
    </section>

    <!-- ========== 数据统计带 ========== -->
    <section class="stats-band">
      <div class="stats-inner">
        <div v-for="s in stats" :key="s.label" class="stat-item">
          <div class="stat-value">{{ s.value }}{{ s.suffix }}</div>
          <div class="stat-label">{{ s.label }}</div>
        </div>
      </div>
    </section>

    <!-- ========== 功能区（交错布局） ========== -->
    <section class="features" id="features">
      <motion.div
        :initial="{ opacity: 0, y: 30 }"
        :while-in-view="{ opacity: 1, y: 0 }"
        :viewport="{ once: true, margin: '-80px' }"
        :transition="{ duration: 0.6 }"
        class="section-head"
      >
        <span class="eyebrow">核心能力</span>
        <h2 class="section-title">不止于简历编辑器</h2>
        <p class="section-sub">从内容润色到隐私保护，每个环节都经过精心打磨</p>
      </motion.div>

      <div class="feature-list">
        <motion.div
          v-for="(f, i) in features"
          :key="f.title"
          :initial="{ opacity: 0, y: 40 }"
          :while-in-view="{ opacity: 1, y: 0 }"
          :viewport="{ once: true, margin: '-60px' }"
          :transition="{ duration: 0.6, delay: i * 0.1 }"
          class="feature-row"
          :class="{ reverse: f.reverse }"
        >
          <div class="feature-text">
            <div class="feature-icon-wrap" :style="{ '--accent': f.accent }">
              <span class="feature-icon">{{ f.icon }}</span>
            </div>
            <h3 class="feature-title">{{ f.title }}</h3>
            <p class="feature-desc">{{ f.desc }}</p>
            <div class="feature-points">
              <span v-for="p in f.points" :key="p" class="point-chip">{{
                p
              }}</span>
            </div>
          </div>
          <div class="feature-visual" :style="{ '--accent': f.accent }">
            <div class="visual-blob"></div>
            <div class="visual-ring"></div>
            <div class="visual-dots">
              <span v-for="n in 6" :key="n"></span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>

    <!-- ========== 模板展示（横向滚动） ========== -->
    <section class="templates" id="templates">
      <motion.div
        :initial="{ opacity: 0, y: 30 }"
        :while-in-view="{ opacity: 1, y: 0 }"
        :viewport="{ once: true, margin: '-80px' }"
        :transition="{ duration: 0.6 }"
        class="section-head"
      >
        <span class="eyebrow">模板中心</span>
        <h2 class="section-title">挑一个喜欢的起点</h2>
        <p class="section-sub">多种风格，总有一款适合你</p>
      </motion.div>

      <div class="template-scroll">
        <motion.div
          v-for="(t, i) in [
            { name: '经典', color: '#1677ff', tag: 'Traditional' },
            { name: '极简', color: '#0F172A', tag: 'Minimalist' },
            { name: '画报', color: '#EC4899', tag: 'Magazine' },
            { name: '瑞士风', color: '#0EA5E9', tag: 'Swiss' },
            { name: '现代科技', color: '#6366F1', tag: 'Tech' },
            { name: '商务专业', color: '#059669', tag: 'Business' },
          ]"
          :key="t.name"
          :initial="{ opacity: 0, scale: 0.9 }"
          :while-in-view="{ opacity: 1, scale: 1 }"
          :viewport="{ once: true, margin: '-40px' }"
          :transition="{
            type: 'spring',
            stiffness: 200,
            damping: 20,
            delay: i * 0.08,
          }"
          class="tpl-card"
          :style="{ '--c': t.color }"
        >
          <div class="tpl-cover">
            <div class="tpl-pattern"></div>
            <span class="tpl-tag">{{ t.tag }}</span>
          </div>
          <div class="tpl-meta">
            <span class="tpl-name">{{ t.name }}</span>
            <span class="tpl-arrow">→</span>
          </div>
        </motion.div>
      </div>
    </section>

    <!-- ========== FAQ ========== -->
    <section class="faq" id="faq">
      <motion.div
        :initial="{ opacity: 0, y: 30 }"
        :while-in-view="{ opacity: 1, y: 0 }"
        :viewport="{ once: true, margin: '-80px' }"
        :transition="{ duration: 0.6 }"
        class="section-head"
      >
        <span class="eyebrow">常见问题</span>
        <h2 class="section-title">你可能想知道</h2>
      </motion.div>

      <div class="faq-wrap">
        <motion.div
          v-for="(item, i) in faqs"
          :key="item.q"
          :initial="{ opacity: 0, y: 20 }"
          :while-in-view="{ opacity: 1, y: 0 }"
          :viewport="{ once: true, margin: '-30px' }"
          :transition="{ duration: 0.5, delay: i * 0.06 }"
          class="faq-item"
        >
          <button
            class="faq-q"
            :class="{ open: activeFaq === i }"
            @click="toggleFaq(i)"
          >
            <span>{{ item.q }}</span>
            <svg
              class="faq-arrow"
              :class="{ open: activeFaq === i }"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          <div class="faq-a" :class="{ open: activeFaq === i }">
            <p>{{ item.a }}</p>
          </div>
        </motion.div>
      </div>
    </section>

    <!-- ========== CTA ========== -->
    <section class="cta">
      <motion.div
        :initial="{ opacity: 0, scale: 0.95 }"
        :while-in-view="{ opacity: 1, scale: 1 }"
        :viewport="{ once: true, margin: '-80px' }"
        :transition="{ duration: 0.6 }"
        class="cta-box"
      >
        <div class="cta-deco"></div>
        <h2 class="cta-title">现在就开始，<br />写一份让人记住的简历</h2>
        <p class="cta-desc">登录后使用 · 免费 · Local-First 架构</p>
        <button class="btn-primary btn-lg" @click="goToApp">
          免费开始使用
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </motion.div>
    </section>

    <!-- ========== Footer ========== -->
    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-left">
          <div class="nav-brand">
            <div class="brand-mark">
              <svg viewBox="0 0 40 40" width="32" height="32">
                <circle cx="20" cy="22" r="14" fill="#1677ff" opacity="0.15" />
                <circle cx="20" cy="22" r="10" fill="#1677ff" />
              </svg>
            </div>
            <span class="brand-name">橘子简历</span>
          </div>
          <p class="footer-slogan">让简历制作变得简单而智能</p>
        </div>
        <div class="footer-right">
          <a href="#features">功能</a>
          <a href="#templates">模板</a>
          <a href="#faq">FAQ</a>
        </div>
      </div>
      <div class="footer-bottom">
        © {{ new Date().getFullYear() }} 橘子简历 · 用心打造
      </div>
    </footer>
  </div>
</template>

<style scoped lang="scss">
/* ========== 设计令牌（写在 .landing 上，避免 scoped :root 不生效） ========== */
.landing {
  --c-primary: #1677ff;
  --c-primary-light: #4096ff;
  --c-primary-dark: #0958d9;
  --c-ink: #0f172a;
  --c-ink-soft: #334155;
  --c-muted: #64748b;
  --c-bg: #f5f7fa;
  --c-card: #ffffff;
  --c-border: rgba(15, 23, 42, 0.08);

  background: #fafbfd;
  color: var(--c-ink);
  font-family:
    'MiSans',
    -apple-system,
    BlinkMacSystemFont,
    'Noto Sans SC',
    sans-serif;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}

/* ========== 导航栏 ========== */
.nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  transition: all 0.3s;

  &.scrolled {
    background: rgba(250, 251, 253, 0.85);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--c-border);
  }
}

.nav-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 18px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-mark svg {
  display: block;
}

.brand-name {
  font-weight: 700;
  font-size: 18px;
  letter-spacing: -0.02em;
}

.nav-links {
  display: flex;
  gap: 36px;

  a {
    color: var(--c-muted);
    text-decoration: none;
    font-size: 15px;
    font-weight: 500;
    transition: color 0.2s;

    &:hover {
      color: var(--c-ink);
    }
  }
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-ghost {
  padding: 8px 18px;
  background: none;
  border: none;
  color: var(--c-ink-soft);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.2s;

  &:hover {
    background: rgba(15, 23, 42, 0.05);
  }
}

.btn-primary-sm {
  padding: 9px 20px;
  background: var(--c-ink);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 0.2s,
    box-shadow 0.2s;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(15, 23, 42, 0.25);
  }
}

.menu-toggle {
  display: none;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  background: none;
  border: none;
  cursor: pointer;

  span {
    width: 20px;
    height: 2px;
    background: var(--c-ink);
    border-radius: 2px;
    transition: 0.3s;
  }
}

/* ========== Hero ========== */
.hero {
  position: relative;
  min-height: 100vh;
  padding: 140px 32px 100px;
  display: flex;
  align-items: center;
  background: linear-gradient(180deg, #f0f5ff 0%, #fafbfd 60%);
  overflow-x: clip;
}

.hero-deco {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.deco-shape {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
}

.shape-1 {
  width: 480px;
  height: 480px;
  background: radial-gradient(
    circle,
    rgba(99, 102, 241, 0.15),
    transparent 70%
  );
  top: -80px;
  right: 5%;
  animation: drift 20s ease-in-out infinite;
}

.shape-2 {
  width: 360px;
  height: 360px;
  background: radial-gradient(circle, rgba(22, 119, 255, 0.12), transparent 70%);
  bottom: 10%;
  left: -60px;
  animation: drift 25s ease-in-out infinite reverse;
}

.shape-3 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(14, 165, 233, 0.1), transparent 70%);
  top: 30%;
  right: 35%;
  animation: drift 22s ease-in-out infinite;
}

@keyframes drift {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(30px, -40px) scale(1.05);
  }
  66% {
    transform: translate(-20px, 30px) scale(0.95);
  }
}

.hero-wave {
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  width: 100%;
  height: 80px;
}

.hero-grid {
  position: relative;
  z-index: 2;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;
}

.hero-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px 8px 12px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(22, 119, 255, 0.2);
  border-radius: 100px;
  font-size: 13px;
  font-weight: 500;
  color: #0958d9;
  margin-bottom: 28px;
}

.pill-dot {
  width: 8px;
  height: 8px;
  background: var(--c-primary);
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(22, 119, 255, 0.4);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(22, 119, 255, 0);
  }
}

.hero-title {
  font-size: clamp(40px, 5.5vw, 68px);
  font-weight: 800;
  line-height: 1.08;
  letter-spacing: -0.04em;
  margin-bottom: 24px;
}

.gradient-text {
  background: linear-gradient(135deg, #1677ff 0%, #4096ff 50%, #69b1ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-desc {
  font-size: clamp(15px, 1.6vw, 18px);
  color: var(--c-muted);
  line-height: 1.7;
  margin-bottom: 36px;
}

.hero-btns {
  display: flex;
  gap: 14px;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  background: var(--c-ink);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 0.25s,
    box-shadow 0.25s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.3);
  }

  &.btn-lg {
    padding: 18px 36px;
    font-size: 17px;
  }
}

.btn-outline {
  padding: 14px 28px;
  background: white;
  color: var(--c-ink);
  border: 1px solid var(--c-border);
  border-radius: 10px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s;

  &:hover {
    border-color: var(--c-ink);
    transform: translateY(-2px);
  }
}

/* Hero 右侧视觉 */
.hero-visual {
  position: relative;
  height: 440px;
}

.visual-orbit {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 380px;
  height: 380px;
  border: 2px dashed rgba(99, 102, 241, 0.15);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: spin 40s linear infinite;
}

@keyframes spin {
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

.visual-card {
  position: absolute;
  background: white;
  border-radius: 16px;
  box-shadow:
    0 4px 24px rgba(15, 23, 42, 0.1),
    0 1px 4px rgba(15, 23, 42, 0.06);
  border: 1px solid rgba(15, 23, 42, 0.04);
}

.card-main {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 280px;
  padding: 24px;
  animation: floatCard 6s ease-in-out infinite;
}

@keyframes floatCard {
  0%,
  100% {
    transform: translate(-50%, -50%);
  }
  50% {
    transform: translate(-50%, -55%);
  }
}

.card-strip {
  height: 4px;
  background: linear-gradient(90deg, #1677ff, #6366f1);
  border-radius: 2px;
  margin-bottom: 20px;
}

.vc-row {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 18px;
}

.vc-avatar {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #4096ff, #1677ff);
  border-radius: 50%;
  flex-shrink: 0;
}

.vc-lines {
  flex: 1;

  .vc-line {
    height: 10px;
    background: #f1f5f9;
    border-radius: 4px;
    margin-bottom: 6px;

    &.w70 {
      width: 70%;
      background: linear-gradient(90deg, #e2e8f0, #f1f5f9);
    }
    &.w40 {
      width: 40%;
    }
  }
}

.vc-tags {
  display: flex;
  gap: 6px;
}

.vc-tag {
  padding: 4px 10px;
  background: #f0f5ff;
  color: #0958d9;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

.card-float-1 {
  top: 15%;
  right: 0;
  width: 130px;
  padding: 16px;
  text-align: center;
  animation: floatSide 5s ease-in-out infinite;
}

.card-float-2 {
  bottom: 12%;
  left: 5%;
  width: 130px;
  padding: 16px;
  text-align: center;
  animation: floatSide 5s ease-in-out infinite 1.5s;
}

@keyframes floatSide {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-12px);
  }
}

.float-icon {
  font-size: 24px;
  margin-bottom: 6px;
}

.float-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--c-ink-soft);
}

/* ========== 数据统计带 ========== */
.stats-band {
  background: var(--c-ink);
  padding: 56px 32px;
}

.stats-inner {
  max-width: 1000px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 32px;
  text-align: center;
}

.stat-item {
  position: relative;

  &:not(:last-child)::after {
    content: '';
    position: absolute;
    right: -16px;
    top: 50%;
    transform: translateY(-50%);
    width: 1px;
    height: 40px;
    background: rgba(255, 255, 255, 0.1);
  }
}

.stat-value {
  font-size: 42px;
  font-weight: 800;
  background: linear-gradient(135deg, #4096ff, #1677ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.03em;
}

.stat-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 8px;
}

/* ========== 通用 section ========== */
.features,
.templates,
.faq {
  padding: 110px 32px;
  max-width: 1200px;
  margin: 0 auto;
}

.section-head {
  text-align: center;
  margin-bottom: 60px;
}

.eyebrow {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: var(--c-primary);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-bottom: 14px;
}

.section-title {
  font-size: clamp(30px, 4vw, 44px);
  font-weight: 800;
  letter-spacing: -0.03em;
  margin-bottom: 14px;
}

.section-sub {
  font-size: 16px;
  color: var(--c-muted);
}

/* ========== 功能区交错布局 ========== */
.feature-list {
  display: flex;
  flex-direction: column;
  gap: 80px;
}

.feature-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;

  &.reverse {
    .feature-text {
      order: 2;
    }
    .feature-visual {
      order: 1;
    }
  }
}

.feature-icon-wrap {
  --accent: #6366f1;
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: color-mix(in srgb, var(--accent) 12%, white);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 22px;
}

.feature-icon {
  font-size: 26px;
}

.feature-title {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-bottom: 12px;
}

.feature-desc {
  font-size: 15px;
  color: var(--c-muted);
  line-height: 1.75;
  margin-bottom: 20px;
}

.feature-points {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.point-chip {
  padding: 5px 12px;
  background: #f1f5f9;
  color: var(--c-ink-soft);
  border-radius: 100px;
  font-size: 13px;
  font-weight: 500;
}

.feature-visual {
  --accent: #6366f1;
  position: relative;
  height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.visual-blob {
  position: absolute;
  width: 200px;
  height: 200px;
  background: linear-gradient(
    135deg,
    var(--accent),
    color-mix(in srgb, var(--accent) 50%, white)
  );
  border-radius: 40% 60% 70% 30% / 40% 50% 50% 60%;
  filter: blur(2px);
  opacity: 0.25;
  animation: morph 8s ease-in-out infinite;
}

@keyframes morph {
  0%,
  100% {
    border-radius: 40% 60% 70% 30% / 40% 50% 50% 60%;
  }
  50% {
    border-radius: 60% 40% 30% 70% / 50% 60% 40% 50%;
  }
}

.visual-ring {
  position: absolute;
  width: 160px;
  height: 160px;
  border: 3px solid var(--accent);
  border-radius: 50%;
  opacity: 0.2;
}

.visual-dots {
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  align-content: center;
  padding: 40px;

  span {
    width: 8px;
    height: 8px;
    background: var(--accent);
    border-radius: 50%;
    opacity: 0.3;
    animation: dotPulse 3s ease-in-out infinite;

    &:nth-child(1) {
      animation-delay: 0s;
    }
    &:nth-child(2) {
      animation-delay: 0.2s;
    }
    &:nth-child(3) {
      animation-delay: 0.4s;
    }
    &:nth-child(4) {
      animation-delay: 0.6s;
    }
    &:nth-child(5) {
      animation-delay: 0.8s;
    }
    &:nth-child(6) {
      animation-delay: 1s;
    }
  }
}

@keyframes dotPulse {
  0%,
  100% {
    opacity: 0.15;
    transform: scale(0.8);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
}

.templates .section-head,
.faq .section-head {
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
}

/* ========== 模板横向滚动 ========== */
.template-scroll {
  display: flex;
  gap: 20px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  padding: 8px 32px 24px;
  max-width: 1200px;
  margin: 0 auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.tpl-card {
  --c: #1677ff;
  flex: 0 0 240px;
  scroll-snap-align: start;
  background: white;
  border: 1px solid var(--c-border);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition:
    transform 0.3s,
    box-shadow 0.3s;

  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 12px 32px rgba(15, 23, 42, 0.12);

    .tpl-cover {
      height: 200px;
    }
  }
}

.tpl-cover {
  height: 170px;
  background: var(--c);
  position: relative;
  overflow: hidden;
  transition: height 0.3s;
}

.tpl-pattern {
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(
      45deg,
      transparent 0 10px,
      rgba(255, 255, 255, 0.08) 10px 11px
    ),
    radial-gradient(
      circle at 70% 30%,
      rgba(255, 255, 255, 0.15),
      transparent 50%
    );
}

.tpl-tag {
  position: absolute;
  bottom: 12px;
  left: 12px;
  padding: 3px 10px;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(4px);
  color: white;
  border-radius: 100px;
  font-size: 11px;
  font-weight: 600;
}

.tpl-meta {
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tpl-name {
  font-size: 15px;
  font-weight: 600;
}

.tpl-arrow {
  color: var(--c-muted);
  font-size: 18px;
  transition: transform 0.2s;
}

.tpl-card:hover .tpl-arrow {
  transform: translateX(4px);
  color: var(--c);
}

/* ========== FAQ ========== */
.faq-wrap {
  max-width: 720px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.faq-item {
  background: white;
  border: 1px solid var(--c-border);
  border-radius: 12px;
  overflow: hidden;
  transition: border-color 0.2s;

  &:hover {
    border-color: rgba(22, 119, 255, 0.3);
  }
}

.faq-q {
  width: 100%;
  padding: 20px 24px;
  background: none;
  border: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: var(--c-ink);
  cursor: pointer;
  text-align: left;
  transition: color 0.2s;

  &.open {
    color: var(--c-primary);
  }
}

.faq-arrow {
  color: var(--c-muted);
  flex-shrink: 0;
  transition:
    transform 0.3s,
    color 0.3s;

  &.open {
    transform: rotate(180deg);
    color: var(--c-primary);
  }
}

.faq-a {
  overflow: hidden;
  max-height: 0;
  opacity: 0;
  transition:
    max-height 0.35s ease,
    opacity 0.25s ease;

  &.open {
    max-height: 400px;
    opacity: 1;
  }

  p {
    padding: 0 24px 20px;
    font-size: 14px;
    color: var(--c-muted);
    line-height: 1.8;
  }
}

/* ========== CTA ========== */
.cta {
  padding: 80px 32px 100px;
  max-width: 1100px;
  margin: 0 auto;
}

.cta-box {
  position: relative;
  text-align: center;
  padding: 72px 32px;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  border-radius: 28px;
  overflow: hidden;
}

.cta-deco {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(
      circle at 20% 20%,
      rgba(22, 119, 255, 0.25) 0%,
      transparent 50%
    ),
    radial-gradient(
      circle at 80% 80%,
      rgba(99, 102, 241, 0.2) 0%,
      transparent 45%
    );
}

.cta-title {
  position: relative;
  font-size: clamp(28px, 3.5vw, 40px);
  font-weight: 800;
  color: white;
  letter-spacing: -0.02em;
  margin-bottom: 14px;
}

.cta-desc {
  position: relative;
  font-size: 15px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 32px;
}

.cta-box .btn-primary {
  position: relative;
  background: white;
  color: var(--c-ink);

  &:hover {
    background: #f0f5ff;
    box-shadow: 0 8px 28px rgba(0, 0, 0, 0.3);
  }
}

/* ========== Footer ========== */
.footer {
  background: #0f172a;
  color: rgba(255, 255, 255, 0.6);
  padding: 48px 32px 24px;
}

.footer-inner {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 28px;
  flex-wrap: wrap;
  gap: 24px;
}

.footer-left .brand-name {
  color: white;
}

.footer-slogan {
  font-size: 13px;
  margin-top: 10px;
  color: rgba(255, 255, 255, 0.5);
}

.footer-right {
  display: flex;
  gap: 28px;

  a {
    color: rgba(255, 255, 255, 0.6);
    text-decoration: none;
    font-size: 14px;
    transition: color 0.2s;

    &:hover {
      color: white;
    }
  }
}

.footer-bottom {
  max-width: 1100px;
  margin: 0 auto;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  text-align: center;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
}

/* ========== 响应式 ========== */
@media (max-width: 768px) {
  .nav-links {
    display: none;

    &.open {
      display: flex;
      flex-direction: column;
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      padding: 20px 32px;
      gap: 16px;
      border-bottom: 1px solid var(--c-border);
    }
  }

  .btn-ghost {
    display: none;
  }

  .menu-toggle {
    display: flex;
  }

  .hero-grid {
    grid-template-columns: 1fr;
    gap: 40px;
  }

  .hero-visual {
    height: 320px;
  }

  .stats-inner {
    grid-template-columns: repeat(2, 1fr);
    gap: 32px;

    .stat-item:nth-child(2)::after {
      display: none;
    }
  }

  .feature-row {
    grid-template-columns: 1fr;
    gap: 30px;

    &.reverse {
      .feature-text {
        order: 1;
      }
      .feature-visual {
        order: 2;
      }
    }
  }

  .feature-visual {
    height: 200px;
  }

  .hero-btns {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
