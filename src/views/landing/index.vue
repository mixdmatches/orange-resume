<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { motion } from 'motion-v'
import TemplateThumb from '@/components/TemplateThumb.vue'
import { templates } from '@/template/index'
import { DEFAULT_RESUME } from '@/config/init-resume-data'

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

/** 功能亮点列表（单列纵向，每项：左小图标 + 右标题/描述/要点）*/
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
  },
  {
    icon: '🎨',
    title: '5 套风格化模板',
    desc: '经典商务、极简干净、专业稳重、现代科技、创意设计——套模板不用从零开始，内容填好直接用。',
    points: ['经典商务', '极简干净', '专业稳重', '现代科技', '创意设计'],
  },
  {
    icon: '🎙️',
    title: 'AI 模拟面试间',
    desc: '独立面试间页面，流式 SSE 追问引擎，多轮对话还原真实面试。结束后自动生成评分与问题清单，帮你越练越稳。',
    points: ['流式追问', '多轮对话', '评分清单', '面试历史'],
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
    a: '是，橘子简历支持多设备同步，你可以在不同设备上登录后查看和编辑你的简历。',
  },
]

/** 移动端菜单 */
const mobileMenuOpen = ref(false)

/** 模板预览用的简历数据（DEFAULT_RESUME）*/
const previewResume = { ...DEFAULT_RESUME, id: '1' }
</script>

<template>
  <div class="landing">
    <!-- ========== 导航栏 ========== -->
    <header class="nav" :class="{ scrolled }">
      <div class="nav-inner">
        <div class="nav-brand" @click="goToApp">
          <img src="~@/assets/images/logo.png" alt="橘子简历" />
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
            <span class="hero-title-accent">不该这么累</span>
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
          </motion.div>
        </div>

        <!-- 右侧：极简 SVG 线条插画（替代原 hero-visual 浮动卡组）-->
        <motion.div
          :initial="{ opacity: 0, scale: 0.96 }"
          :animate="{ opacity: 1, scale: 1 }"
          :transition="{ duration: 0.8, delay: 0.3 }"
          class="hero-visual"
        >
          <svg viewBox="0 0 440 440" class="hero-visual-svg">
            <!-- 背景圆环 -->
            <circle
              cx="220"
              cy="220"
              r="200"
              fill="none"
              stroke="var(--color-border)"
              stroke-width="1"
              stroke-dasharray="2 4"
            />
            <circle
              cx="220"
              cy="220"
              r="160"
              fill="none"
              stroke="var(--color-border)"
              stroke-width="1"
            />

            <!-- 中心简历卡片（线稿）-->
            <rect
              x="140"
              y="120"
              width="160"
              height="200"
              rx="8"
              fill="var(--color-surface)"
              stroke="var(--color-border-strong)"
              stroke-width="1.5"
            />
            <line
              x1="160"
              y1="150"
              x2="220"
              y2="150"
              stroke="var(--color-text)"
              stroke-width="2"
              stroke-linecap="round"
            />
            <circle
              cx="172"
              cy="170"
              r="8"
              fill="none"
              stroke="var(--color-primary)"
              stroke-width="1.5"
            />
            <line
              x1="190"
              y1="166"
              x2="240"
              y2="166"
              stroke="var(--color-border-strong)"
              stroke-width="2"
              stroke-linecap="round"
            />
            <line
              x1="190"
              y1="176"
              x2="220"
              y2="176"
              stroke="var(--color-border-strong)"
              stroke-width="2"
              stroke-linecap="round"
            />
            <line
              x1="160"
              y1="200"
              x2="280"
              y2="200"
              stroke="var(--color-border)"
              stroke-width="1"
            />
            <line
              x1="160"
              y1="215"
              x2="270"
              y2="215"
              stroke="var(--color-border-strong)"
              stroke-width="2"
              stroke-linecap="round"
            />
            <line
              x1="160"
              y1="225"
              x2="250"
              y2="225"
              stroke="var(--color-border-strong)"
              stroke-width="2"
              stroke-linecap="round"
            />
            <line
              x1="160"
              y1="240"
              x2="280"
              y2="240"
              stroke="var(--color-border)"
              stroke-width="1"
            />
            <line
              x1="160"
              y1="255"
              x2="265"
              y2="255"
              stroke="var(--color-border-strong)"
              stroke-width="2"
              stroke-linecap="round"
            />
            <line
              x1="160"
              y1="265"
              x2="240"
              y2="265"
              stroke="var(--color-border-strong)"
              stroke-width="2"
              stroke-linecap="round"
            />
            <line
              x1="160"
              y1="280"
              x2="275"
              y2="280"
              stroke="var(--color-border-strong)"
              stroke-width="2"
              stroke-linecap="round"
            />

            <!-- 浮动小卡片 1：AI 标记 -->
            <g class="float-card-1">
              <rect
                x="296"
                y="100"
                width="100"
                height="56"
                rx="6"
                fill="var(--color-surface)"
                stroke="var(--color-border)"
                stroke-width="1"
              />
              <circle cx="316" cy="128" r="8" fill="var(--color-primary)" />
              <line
                x1="332"
                y1="124"
                x2="378"
                y2="124"
                stroke="var(--color-border-strong)"
                stroke-width="2"
                stroke-linecap="round"
              />
              <line
                x1="332"
                y1="134"
                x2="362"
                y2="134"
                stroke="var(--color-border-strong)"
                stroke-width="2"
                stroke-linecap="round"
              />
            </g>

            <!-- 浮动小卡片 2：导出标记 -->
            <g class="float-card-2">
              <rect
                x="44"
                y="280"
                width="100"
                height="56"
                rx="6"
                fill="var(--color-surface)"
                stroke="var(--color-border)"
                stroke-width="1"
              />
              <rect
                x="60"
                y="296"
                width="20"
                height="24"
                rx="2"
                fill="none"
                stroke="var(--color-primary)"
                stroke-width="1.5"
              />
              <line
                x1="88"
                y1="304"
                x2="128"
                y2="304"
                stroke="var(--color-border-strong)"
                stroke-width="2"
                stroke-linecap="round"
              />
              <line
                x1="88"
                y1="314"
                x2="118"
                y2="314"
                stroke="var(--color-border-strong)"
                stroke-width="2"
                stroke-linecap="round"
              />
            </g>

            <!-- 装饰点 -->
            <circle cx="360" cy="200" r="4" fill="var(--color-primary)" />
            <circle
              cx="80"
              cy="180"
              r="3"
              fill="var(--color-primary)"
              opacity="0.6"
            />
            <circle
              cx="380"
              cy="340"
              r="3"
              fill="var(--color-primary)"
              opacity="0.4"
            />
          </svg>
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

    <!-- ========== 功能区（单列纵向）========== -->
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
          :initial="{ opacity: 0, y: 20 }"
          :while-in-view="{ opacity: 1, y: 0 }"
          :viewport="{ once: true, margin: '-60px' }"
          :transition="{ duration: 0.5, delay: i * 0.08 }"
          class="feature-row"
        >
          <div class="feature-icon-wrap">
            <span class="feature-icon">{{ f.icon }}</span>
          </div>
          <div class="feature-text">
            <h3 class="feature-title">{{ f.title }}</h3>
            <p class="feature-desc">{{ f.desc }}</p>
            <div class="feature-points">
              <span v-for="p in f.points" :key="p" class="point-chip">{{
                p
              }}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>

    <!-- ========== 模板展示（横向滚动 + 实时渲染）========== -->
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
        <p class="section-sub">多种风格，总有一款适合你 · 卡片为实时渲染</p>
      </motion.div>

      <div class="template-scroll">
        <motion.div
          v-for="(t, i) in templates"
          :key="t.id"
          :initial="{ opacity: 0, y: 20 }"
          :while-in-view="{ opacity: 1, y: 0 }"
          :viewport="{ once: true, margin: '-40px' }"
          :transition="{ duration: 0.5, delay: i * 0.06 }"
          class="tpl-card"
          @click="goToTemplates"
        >
          <!-- 实时渲染真实模板预览（非纯色占位）-->
          <div class="tpl-cover">
            <TemplateThumb
              :template-id="t.id"
              :resume="previewResume"
              :scale="0.3"
            />
          </div>
          <div class="tpl-meta">
            <div>
              <div class="tpl-name">{{ t.name }}</div>
              <div class="tpl-tag">{{ t.description }}</div>
            </div>
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
        :initial="{ opacity: 0, y: 20 }"
        :while-in-view="{ opacity: 1, y: 0 }"
        :viewport="{ once: true, margin: '-80px' }"
        :transition="{ duration: 0.6 }"
        class="cta-box"
      >
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
            <img src="~@/assets/images/logo.png" alt="橘子简历" />
            <span class="brand-name">橘子简历</span>
          </div>
          <p class="footer-slogan">让简历制作变得简单而智能</p>
        </div>
      </div>
      <div class="footer-bottom">
        © {{ new Date().getFullYear() }} 橘子简历 · 用心打造
      </div>
    </footer>
  </div>
</template>

<style scoped lang="scss">
/* ========== 全局容器 ========== */
.landing {
  color: var(--color-text);
  font-family: var(--font-sans);
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
  &::before {
    content: '';
    position: fixed;
    inset: 0;
    z-index: -1; // 垫到所有内容之下、body 底色之上
    background-image:
      linear-gradient(to right, var(--color-border) 1px, transparent 1px),
      linear-gradient(to bottom, var(--color-border) 1px, transparent 1px);
    background-size: 56px 56px;
    -webkit-mask-image: radial-gradient(
      ellipse 90% 65% at 50% 0%,
      #000 25%,
      transparent 75%
    );
    mask-image: radial-gradient(
      ellipse 90% 65% at 50% 0%,
      #000 25%,
      transparent 75%
    );
    pointer-events: none;
  }

  // 主色柔光 + 极光渐变动效：蓝/青/靛三色光斑缓慢漂移 + 色相微转
  // 放大 20% 留出漂移余量，18s 一循环，克制的呼吸感
  &::after {
    content: '';
    position: fixed;
    inset: -20%;
    z-index: -1;
    background:
      radial-gradient(
        ellipse 42% 36% at 32% 8%,
        rgba(22, 119, 255, 0.16),
        transparent 65%
      ),
      radial-gradient(
        ellipse 38% 32% at 72% 16%,
        rgba(34, 211, 238, 0.1),
        transparent 65%
      ),
      radial-gradient(
        ellipse 48% 40% at 55% 2%,
        rgba(99, 102, 241, 0.1),
        transparent 68%
      ),
      radial-gradient(
        ellipse 55% 45% at 50% 0%,
        var(--color-primary-bg),
        transparent 70%
      );
    animation: aurora-drift 10s ease-in-out infinite;
    pointer-events: none;
    will-change: transform, filter;
  }

  // 减弱动效偏好：停掉极光漂移，保留静态光斑
  @media (prefers-reduced-motion: reduce) {
    &::after {
      animation: none;
    }
  }
}

// 极光漂移：位移 + 缩放 + 色相微转（±15° 内，保持蓝色主基调不跑偏）
@keyframes aurora-drift {
  0% {
    transform: translate3d(-2%, -1.5%, 0) scale(1);
    filter: hue-rotate(-15deg) saturate(1);
  }

  33% {
    transform: translate3d(1.5%, 1%, 0) scale(1.05);
    filter: hue-rotate(8deg) saturate(1.15);
  }

  66% {
    transform: translate3d(2%, -1%, 0) scale(1.02);
    filter: hue-rotate(15deg) saturate(1.1);
  }

  100% {
    transform: translate3d(-2%, -1.5%, 0) scale(1);
    filter: hue-rotate(-15deg) saturate(1);
  }
}

/* ========== 导航栏 ========== */
.nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: var(--z-sticky);
  transition: all var(--duration-base) var(--ease-out);
  background: transparent;

  &.scrolled {
    background: var(--color-surface);
    border-bottom: 1px solid var(--color-border);
  }
}

.nav-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-5) var(--space-8);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;

  img {
    height: 52px;
    width: auto;
  }

  .brand-name {
    font-family: var(--font-display);
    font-weight: var(--font-semibold);
    font-size: var(--text-3xl);
    letter-spacing: var(--tracking-tight);
    color: var(--color-text);
  }
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.btn-ghost {
  padding: var(--space-2) var(--space-4);
  background: none;
  border: none;
  color: var(--color-text-secondary);
  font-size: var(--text-xl);
  font-weight: var(--font-medium);
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: all var(--duration-base) var(--ease-out);

  &:hover {
    background: var(--color-surface-hover);
    color: var(--color-text);
  }
}

.btn-primary-sm {
  padding: var(--space-2) var(--space-5);
  background: var(--color-text);
  color: var(--color-text-inverse);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-xl);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: all var(--duration-base) var(--ease-out);

  &:hover {
    background: var(--color-text-secondary);
  }
}

.menu-toggle {
  display: none;
  flex-direction: column;
  gap: 4px;
  padding: var(--space-2);
  background: none;
  border: none;
  cursor: pointer;

  span {
    width: 20px;
    height: 2px;
    background: var(--color-text);
    border-radius: 2px;
    transition: var(--duration-base) var(--ease-out);
  }
}

/* ========== Hero ========== */
.hero {
  position: relative;
  min-height: 88vh;
  padding: 120px var(--space-8) 80px;
  display: flex;
  align-items: center;
}

.hero-grid {
  position: relative;
  z-index: 1;
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
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4) var(--space-2) var(--space-3);
  background: var(--color-primary-bg);
  border: 1px solid var(--color-primary-border);
  border-radius: var(--radius-full);
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  color: var(--color-primary-pressed);
  margin-bottom: var(--space-6);
}

.pill-dot {
  width: 6px;
  height: 6px;
  background: var(--color-primary);
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
  font-family: var(--font-display);
  // 收敛 hero 尺寸：64px 对中文偏大，上限 56px；负字距 -0.04em 汉字显挤，减半
  font-size: clamp(36px, 5vw, 56px);
  font-weight: var(--font-bold);
  line-height: 1.15;
  letter-spacing: -0.02em;
  color: var(--color-text);
  margin-bottom: var(--space-6);
}

.hero-title-accent {
  color: var(--color-primary);
}

.hero-desc {
  font-size: clamp(14px, 1.4vw, 16px);
  color: var(--color-text-secondary);
  line-height: var(--leading-relaxed);
  margin-bottom: var(--space-8);
}

.hero-btns {
  display: flex;
  gap: var(--space-3);
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-6);
  background: var(--color-primary);
  color: var(--color-text-inverse);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-xl);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: all var(--duration-base) var(--ease-out);

  &:hover {
    background: var(--color-primary-hover);
  }

  &.btn-lg {
    padding: var(--space-4) var(--space-8);
    font-size: var(--text-lg);
  }
}

.btn-outline {
  padding: var(--space-3) var(--space-6);
  background: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: all var(--duration-base) var(--ease-out);

  &:hover {
    border-color: var(--color-border-strong);
    background: var(--color-surface-hover);
  }
}

/* Hero 右侧 SVG 视觉 */
.hero-visual {
  position: relative;
  height: 440px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-visual-svg {
  width: 100%;
  height: 100%;
  max-width: 440px;

  .float-card-1,
  .float-card-2 {
    animation: floatSide 6s ease-in-out infinite;
    transform-origin: center;
  }

  .float-card-2 {
    animation-delay: 1.5s;
  }
}

@keyframes floatSide {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

/* ========== 数据统计带 ========== */
.stats-band {
  background: var(--color-bg-muted);
  padding: var(--space-12) var(--space-8);
}

.stats-inner {
  max-width: 1000px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-8);
  text-align: center;
}

.stat-item {
  position: relative;

  &:not(:last-child)::after {
    content: '';
    position: absolute;
    right: calc(var(--space-8) / -2);
    top: 50%;
    transform: translateY(-50%);
    width: 1px;
    height: 40px;
    background: var(--color-border);
  }
}

.stat-value {
  font-family: var(--font-display);
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  color: var(--color-text);
  letter-spacing: -0.02em;
}

.stat-label {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin-top: var(--space-2);
}

/* ========== 通用 section ========== */
.features,
.templates,
.faq {
  padding: 100px var(--space-8);
  max-width: 1200px;
  margin: 0 auto;
}

.section-head {
  text-align: center;
  margin-bottom: var(--space-12);
}

.eyebrow {
  display: block;
  // 中文界面：去掉 uppercase 宽字距，13px→14px 提升可读性，仅靠主色区分
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--color-primary);
  margin-bottom: var(--space-3);
}

.section-title {
  font-family: var(--font-display);
  // 随全站字号上调：36→40 上限，负字距保持 -0.01em
  font-size: clamp(28px, 3.2vw, 40px);
  font-weight: var(--font-bold);
  letter-spacing: -0.01em;
  color: var(--color-text);
  margin-bottom: var(--space-3);
}

.section-sub {
  font-size: var(--text-base);
  color: var(--color-text-secondary);
}

/* ========== 功能区（单列纵向）========== */
.feature-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  max-width: 760px;
  margin: 0 auto;
}

.feature-row {
  display: grid;
  grid-template-columns: 56px 1fr;
  gap: var(--space-6);
  padding: var(--space-8) 0;
  border-bottom: 1px solid var(--color-border);

  &:last-child {
    border-bottom: none;
  }
}

.feature-icon-wrap {
  width: 48px;
  height: 48px;
  background: var(--color-primary-bg);
  border: 1px solid var(--color-primary-border);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
}

.feature-icon {
  font-size: 22px;
}

.feature-title {
  font-family: var(--font-display);
  // 列表行标题从 24px 降到 20px：与 section-title(36px) 拉开层级，避免喧宾夺主
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--color-text);
  letter-spacing: -0.01em;
  margin-bottom: var(--space-3);
}

.feature-desc {
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  line-height: var(--leading-relaxed);
  margin-bottom: var(--space-4);
}

.feature-points {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.point-chip {
  padding: 4px var(--space-3);
  background: var(--color-bg-muted);
  color: var(--color-text-secondary);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
}

/* ========== 模板横向滚动 ========== */
.template-scroll {
  display: flex;
  gap: var(--space-5);
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  padding: var(--space-2) var(--space-8) var(--space-6);
  max-width: 1200px;
  margin: 0 auto;
}

.tpl-card {
  // 270px = 缩略图宽 238（794×0.3）+ 左右内边距 32，避免横向裁切
  flex: 0 0 270px;
  scroll-snap-align: start;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
  transition:
    border-color var(--duration-base) var(--ease-out),
    box-shadow var(--duration-base) var(--ease-out);

  &:hover {
    border-color: var(--color-primary-border);
    box-shadow: var(--shadow-md);

    .tpl-arrow {
      transform: translateX(4px);
      color: var(--color-primary);
    }
  }
}

.tpl-cover {
  width: 100%;
  // 高度自适应：scale 0.3 时完整 A4 缩放高度约 337px，不写死避免上下裁切
  display: flex;
  justify-content: center;
  padding: var(--space-4);
  background: var(--color-bg-muted);
  overflow: hidden;
}

.tpl-meta {
  padding: var(--space-4);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-2);
  // flex 子项避免撑破父容器
  min-width: 0;

  // 直接子 div 包裹 name + tag，设 flex:1 + min-width:0 防止被箭头挤爆
  > div {
    flex: 1;
    min-width: 0;
  }
}

.tpl-name {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--color-text);
  margin-bottom: 2px;
  // 标题过长省略，不撑宽
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tpl-tag {
  font-size: var(--text-lg);
  color: var(--color-text-secondary);
  line-height: 1.4;
  // 1 行省略，不换行撑高
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  // flex 子项防溢出
  min-width: 0;
  flex: 1;
}

.tpl-arrow {
  color: var(--color-text-tertiary);
  font-size: 18px;
  transition: all var(--duration-base) var(--ease-out);
  flex-shrink: 0;
}

/* ========== FAQ ========== */
.faq-wrap {
  max-width: 720px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.faq-item {
  border-bottom: 1px solid var(--color-border);

  &:first-child {
    border-top: 1px solid var(--color-border);
  }
}

.faq-q {
  width: 100%;
  padding: var(--space-5) 0;
  background: none;
  border: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--text-xl);
  font-weight: var(--font-medium);
  color: var(--color-text);
  cursor: pointer;
  text-align: left;
  transition: color var(--duration-base) var(--ease-out);

  &.open {
    color: var(--color-primary);
  }
}

.faq-arrow {
  color: var(--color-text-tertiary);
  flex-shrink: 0;
  transition:
    transform var(--duration-slow) var(--ease-out),
    color var(--duration-base) var(--ease-out);

  &.open {
    transform: rotate(180deg);
    color: var(--color-primary);
  }
}

.faq-a {
  overflow: hidden;
  max-height: 0;
  opacity: 0;
  transition:
    max-height var(--duration-slow) var(--ease-out),
    opacity var(--duration-base) var(--ease-out);

  &.open {
    max-height: 400px;
    opacity: 1;
  }

  p {
    padding: 0 0 var(--space-5);
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    line-height: var(--leading-relaxed);
  }
}

/* ========== CTA ========== */
.cta {
  padding: 80px var(--space-8) 100px;
  max-width: 1100px;
  margin: 0 auto;
}

.cta-box {
  position: relative;
  text-align: center;
  padding: 72px var(--space-8);
  background: var(--color-primary-bg);
  border: 1px solid var(--color-primary-border);
  border-radius: var(--radius-2xl);
  overflow: hidden;
}

.cta-title {
  font-family: var(--font-display);
  font-size: clamp(28px, 3vw, 36px);
  font-weight: var(--font-bold);
  color: var(--color-text);
  letter-spacing: -0.01em;
  margin-bottom: var(--space-3);
}

.cta-desc {
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-8);
}

.cta-box .btn-primary {
  background: var(--color-primary);
  color: var(--color-text-inverse);

  &:hover {
    background: var(--color-primary-hover);
  }
}

/* ========== Footer ========== */
.footer {
  background: var(--color-text);
  color: rgba(255, 255, 255, 0.6);
  padding: 48px var(--space-8) var(--space-6);
}

.footer-inner {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: var(--space-6);
  flex-wrap: wrap;
  gap: var(--space-6);
}

.footer-left .nav-brand {
  cursor: default;

  img {
    height: 28px;
    filter: brightness(0) invert(1);
  }

  .brand-name {
    color: #fff;
  }
}

.footer-slogan {
  font-size: var(--text-xs);
  margin-top: var(--space-2);
  color: rgba(255, 255, 255, 0.5);
}

.footer-bottom {
  max-width: 1100px;
  margin: 0 auto;
  padding-top: var(--space-6);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  text-align: center;
  font-size: var(--text-xs);
  color: rgba(255, 255, 255, 0.4);
}

/* ========== 响应式 ========== */
@media (max-width: 768px) {
  .nav-actions .btn-ghost {
    display: none;
  }

  .menu-toggle {
    display: flex;
  }

  .hero {
    padding: 100px var(--space-5) 60px;
  }

  .hero-grid {
    grid-template-columns: 1fr;
    gap: 40px;
  }

  .hero-visual {
    height: 320px;
    order: -1;
  }

  .stats-inner {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-6);

    .stat-item:nth-child(2)::after {
      display: none;
    }
  }

  .features,
  .templates,
  .faq {
    padding: 60px var(--space-5);
  }

  .hero-btns {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
