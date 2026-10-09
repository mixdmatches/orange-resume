<script setup lang="ts">
import {
  computed,
  inject,
  onMounted,
  onUnmounted,
  ref,
  watch,
  type Component,
} from 'vue'
import { motion } from 'motion-v'
import BasicCard from '@/views/edit-resume/cards/BasicCard.vue'
import EducationCard from '@/views/edit-resume/cards/EducationCard.vue'
import InternshipCard from '@/views/edit-resume/cards/InternshipCard.vue'
import ProjectCard from '@/views/edit-resume/cards/ProjectCard.vue'
import SkillsCard from '@/views/edit-resume/cards/SkillsCard.vue'
import CustomCard from '@/views/edit-resume/cards/CustomCard.vue'
import type { Resume } from '@/types/resume'
import {
  PlusOutlined,
  UserOutlined,
  ReadOutlined,
  SolutionOutlined,
  ProjectOutlined,
  ToolOutlined,
  AppstoreOutlined,
  SettingOutlined,
  HolderOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons-vue'
import Sortable, { type SortableEvent } from 'sortablejs'
import { getFontOptions } from '@/utils/fonts'

const themeColors = ref([
  '#111827',
  '#1d4ed8',
  '#f97316',
  '#9333ea',
  '#059669',
  '#0f172a',
])

const fontFamilyOptions = getFontOptions()

// 字号选择
const fontOptions = [12, 14, 16, 18, 20, 22, 24]

const moduleList = [
  {
    id: 'basic',
    title: '基本信息',
  },
  {
    id: 'education',
    title: '教育经历',
  },
  {
    id: 'internship',
    title: '实习经历',
  },
  {
    id: 'project',
    title: '项目经历',
  },
  {
    id: 'skills',
    title: '个人技能',
  },
]

const resume: Resume = inject('resume') as Resume

// 卡片组件映射
const cardComponents = {
  basic: BasicCard,
  education: EducationCard,
  internship: InternshipCard,
  project: ProjectCard,
  skills: SkillsCard,
}

// 模块导航图标映射
const moduleIcons: Record<string, Component> = {
  basic: UserOutlined,
  education: ReadOutlined,
  internship: SolutionOutlined,
  project: ProjectOutlined,
  skills: ToolOutlined,
}

/**
 * 根据 id 获取模块导航图标，自定义模块回退到通用图标
 * @param id - 模块 id
 */
const getModuleIcon = (id: string): Component => {
  return moduleIcons[id] || AppstoreOutlined
}

// 根据 id 获取对应的卡片组件
const getCardComponent = (id: string) => {
  if (id.startsWith('custom-')) {
    return { component: CustomCard, props: { customName: id } }
  }

  return {
    component: cardComponents[id as keyof typeof cardComponents],
    props: {},
  }
}

/** 全局设置在导航中的固定 id（排版/主题色/间距） */
const SETTINGS_ID = 'settings'

/** 当前激活的导航项：模块 id 或全局设置 id */
const activeNavId = ref<string>('basic')

/** 导航折叠状态：折叠后只显示图标列 */
const navCollapsed = ref(false)

/**
 * 简历数据异步加载后，确保激活项始终指向存在的模块，
 * 避免当前模块被删除后右侧内容区空白
 */
watch(
  () => resume.menuSections.map(section => section.id).join(','),
  ids => {
    const list = ids ? ids.split(',') : []
    if (!list.includes(activeNavId.value)) {
      activeNavId.value = list[0] || 'basic'
    }
  },
  { immediate: true },
)

/**
 * 点击导航切换当前编辑的模块
 * @param id - 模块 id 或全局设置 id
 */
const handleNavClick = (id: string) => {
  activeNavId.value = id
}

let customCount = computed(() => Object.keys(resume.customData).length)
const handleAddCustom = () => {
  const newCustomId = `custom-${customCount.value}`
  resume.customData[newCustomId] = []
  resume.menuSections.push({
    id: newCustomId,
    title: '自定义模块',
    order: String(resume.menuSections.length),
  })
  // 新增后直接聚焦到该模块
  activeNavId.value = newCustomId
}

const handleMenuItemClick = (id: string) => {
  resume.menuSections.push({
    id,
    title: moduleList.find(item => item.id === id)?.title || '',
    order: String(resume.menuSections.length),
  })
  // 新增后直接聚焦到该模块
  activeNavId.value = id
}

const handleChangeColor = (color: string) => {
  resume.globalConfiguration.themeColor = color
}

// ============ 模块导航排序（sortablejs 原生绑定）============
const navListRef = ref<HTMLElement | null>(null)
let sortableInstance: Sortable | null = null

/** 可排序的模块列表（不含 basic，basic 固定首位） */
const draggableMenuSections = computed(() =>
  resume.menuSections.filter(section => section.id !== 'basic'),
)

/**
 * 拖拽结束后回写模块顺序：
 * Sortable 已直接改动 DOM，这里同步更新 menuSections，
 * 保证 v-for 重渲染结果与 DOM 一致（basic 固定首位）
 */
const handleSortEnd = (evt: SortableEvent) => {
  const { oldIndex, newIndex } = evt
  if (oldIndex == null || newIndex == null || oldIndex === newIndex) return

  const list = [...draggableMenuSections.value]
  const [moved] = list.splice(oldIndex, 1)
  if (!moved) return
  list.splice(newIndex, 0, moved)

  // basic 固定在首位，其余按拖拽结果排序
  const basicSection = resume.menuSections.find(
    section => section.id === 'basic',
  )
  resume.menuSections = basicSection ? [basicSection, ...list] : list

  // 重新设置 order
  resume.menuSections.forEach((section, index) => {
    section.order = String(index + 1)
  })
}

/** 挂载后初始化导航排序实例 */
onMounted(() => {
  if (!navListRef.value) return
  sortableInstance = new Sortable(navListRef.value, {
    animation: 150,
    ghostClass: 'ghost',
    draggable: '.nav-item',
    onEnd: handleSortEnd,
  })
})

/** 卸载时销毁排序实例，防止事件泄漏 */
onUnmounted(() => {
  sortableInstance?.destroy()
  sortableInstance = null
})

const showDivider = computed(() =>
  moduleList.some(
    item =>
      item.id !== 'basic' &&
      !resume.menuSections.some(section => section.id === item.id),
  ),
)

/**
 * 行高滑块的展示值（保留 1 位小数）
 */
const lineHeightDisplay = computed(() =>
  (resume.globalConfiguration.baseLineHeight ?? 0).toFixed(1),
)
</script>

<template>
  <div class="edit-content">
    <!-- ============ 左侧模块导航：点击切换 + 拖拽排序 + 可折叠 ============ -->
    <motion.aside
      class="module-nav"
      :class="{ collapsed: navCollapsed }"
      :initial="{ opacity: 0, x: -12 }"
      :animate="{ opacity: 1, x: 0 }"
      :transition="{ duration: 0.4, ease: 'easeOut' }"
    >
      <div class="nav-head">
        <span v-if="!navCollapsed" class="nav-label">简历模块</span>
        <button
          type="button"
          class="nav-toggle"
          :title="navCollapsed ? '展开导航' : '收起导航'"
          @click="navCollapsed = !navCollapsed"
        >
          <MenuUnfoldOutlined v-if="navCollapsed" />
          <MenuFoldOutlined v-else />
        </button>
      </div>

      <nav class="nav-list">
        <!-- 基本信息固定首位 -->
        <button
          v-if="resume.menuSections.some(section => section.id === 'basic')"
          type="button"
          class="nav-item"
          :class="{ active: activeNavId === 'basic' }"
          title="基本信息"
          @click="handleNavClick('basic')"
        >
          <UserOutlined class="nav-icon" />
          <span class="nav-text">基本信息</span>
        </button>

        <!-- 其余模块：sortablejs 拖拽排序 -->
        <div ref="navListRef" class="draggable-nav">
          <button
            v-for="section in draggableMenuSections"
            :key="section.id"
            type="button"
            class="nav-item"
            :class="{ active: activeNavId === section.id }"
            :title="section.title"
            @click="handleNavClick(section.id)"
          >
            <component :is="getModuleIcon(section.id)" class="nav-icon" />
            <span class="nav-text">{{ section.title }}</span>
            <!-- 拖拽把手：hover 淡入，提示可排序 -->
            <HolderOutlined class="nav-grip" title="拖拽调整顺序" />
          </button>
        </div>
      </nav>

      <div class="nav-divider"></div>

      <!-- 全局排版设置 -->
      <button
        type="button"
        class="nav-item"
        :class="{ active: activeNavId === SETTINGS_ID }"
        title="排版与主题"
        @click="handleNavClick(SETTINGS_ID)"
      >
        <SettingOutlined class="nav-icon" />
        <span class="nav-text">排版与主题</span>
      </button>

      <!-- 添加模块 -->
      <div class="nav-add">
        <a-dropdown :trigger="['click']">
          <template #overlay>
            <a-menu>
              <template v-for="item in moduleList" :key="item.id">
                <a-menu-item
                  v-if="
                    !resume.menuSections.some(section => section.id === item.id)
                  "
                  @click="handleMenuItemClick(item.id)"
                >
                  {{ item.title }}
                </a-menu-item>
              </template>
              <a-menu-divider v-if="showDivider" />
              <a-menu-item @click="handleAddCustom">自定义模块</a-menu-item>
            </a-menu>
          </template>
          <a-button block class="add-module-btn" title="添加模块">
            <template #icon><PlusOutlined /></template>
            <span class="add-text">添加模块</span>
          </a-button>
        </a-dropdown>
      </div>
    </motion.aside>

    <!-- ============ 右侧内容区：仅渲染当前模块 ============ -->
    <motion.div
      :key="activeNavId"
      class="module-form"
      :initial="{ opacity: 0, y: 10 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="{ duration: 0.25, ease: 'easeOut' }"
    >
      <!-- 模块编辑视图 -->
      <template v-if="activeNavId !== SETTINGS_ID">
        <component
          :is="getCardComponent(activeNavId).component"
          v-bind="getCardComponent(activeNavId).props"
        />
      </template>

      <!-- 全局设置视图：排版 / 主题色 / 间距 -->
      <template v-else>
        <div class="section">
          <div class="section-title">排版</div>
          <div class="section-body">
            <div class="slider-row">
              <span class="slider-label">行高</span>
              <a-slider
                v-model:value="resume.globalConfiguration.baseLineHeight"
                :min="1"
                :max="2"
                :step="0.1"
                class="slider"
              />
              <span class="slider-value">{{ lineHeightDisplay }}</span>
            </div>

            <div class="form-grid">
              <div class="form-field field-full">
                <span class="field-label">字体</span>
                <a-select v-model:value="resume.globalConfiguration.fontFamily">
                  <a-select-option
                    v-for="fontF in fontFamilyOptions"
                    :key="fontF.value"
                    :value="fontF.value"
                    :style="{ fontFamily: fontF.value }"
                    >{{ fontF.label }}</a-select-option
                  >
                </a-select>
              </div>
              <div class="form-field">
                <span class="field-label">基础字号</span>
                <a-select
                  v-model:value="resume.globalConfiguration.baseFontSize"
                >
                  <a-select-option
                    v-for="font in fontOptions"
                    :key="font"
                    :value="font"
                    >{{ font }}px</a-select-option
                  >
                </a-select>
              </div>
              <div class="form-field">
                <span class="field-label">模块标题字号</span>
                <a-select
                  v-model:value="resume.globalConfiguration.titleFontSize"
                >
                  <a-select-option
                    v-for="font in fontOptions"
                    :key="font"
                    :value="font"
                    >{{ font }}px</a-select-option
                  >
                </a-select>
              </div>
              <div class="form-field">
                <span class="field-label">模块一级标题字号</span>
                <a-select
                  v-model:value="resume.globalConfiguration.subTitleFontSize"
                >
                  <a-select-option
                    v-for="font in fontOptions"
                    :key="font"
                    :value="font"
                    >{{ font }}px</a-select-option
                  >
                </a-select>
              </div>
              <div class="form-field">
                <span class="field-label">自动一页纸</span>
                <a-switch
                  v-model:checked="resume.globalConfiguration.autoOnePage"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">主题色</div>
          <div class="theme-palette">
            <button
              v-for="color in themeColors"
              :key="color"
              type="button"
              class="theme-dot"
              :class="{
                active: resume.globalConfiguration.themeColor === color,
              }"
              :style="{ backgroundColor: color }"
              :title="color"
              @click="handleChangeColor(color)"
            ></button>
            <input
              type="color"
              :value="resume.globalConfiguration.themeColor"
              class="theme-dot theme-dot-custom"
              title="自定义颜色"
              @input="
                handleChangeColor(($event.target as HTMLInputElement).value)
              "
            />
          </div>
        </div>

        <div class="section">
          <div class="section-title">间距</div>
          <div class="section-body">
            <div class="slider-row">
              <span class="slider-label">页边距</span>
              <a-slider
                v-model:value="resume.globalConfiguration.basePagePadding"
                :min="0"
                :max="50"
                :step="2"
                class="slider"
              />
              <span class="slider-value"
                >{{ resume.globalConfiguration.basePagePadding }}px</span
              >
            </div>
            <div class="slider-row">
              <span class="slider-label">模块间距</span>
              <a-slider
                v-model:value="resume.globalConfiguration.baseModuleSpacing"
                :min="1"
                :max="99"
                :step="2"
                class="slider"
              />
              <span class="slider-value"
                >{{ resume.globalConfiguration.baseModuleSpacing }}px</span
              >
            </div>
            <div class="slider-row">
              <span class="slider-label">段落间距</span>
              <a-slider
                v-model:value="resume.globalConfiguration.paragraphSpacing"
                :min="1"
                :max="99"
                :step="2"
                class="slider"
              />
              <span class="slider-value"
                >{{ resume.globalConfiguration.paragraphSpacing }}px</span
              >
            </div>
          </div>
        </div>
      </template>
    </motion.div>
  </div>
</template>

<style scoped lang="scss">
/* ============ 编辑面板：左导航 + 右内容双栏 ============ */
.edit-content {
  height: 100%;
  padding: var(--space-5);
  display: flex;
  gap: var(--space-5);
  overflow: hidden;
  min-width: 0;
}

/* ============ 左侧模块导航 ============ */
/* 入场动画由 motion-v 驱动（opacity + x 位移），折叠展开由 width 过渡驱动 */
.module-nav {
  width: 150px;
  flex: none;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  overflow-y: auto;
  transition: width var(--duration-base) var(--ease-out);

  /* 折叠态：只保留图标列 */
  &.collapsed {
    width: 52px;

    .nav-item {
      justify-content: center;
      padding: 0;

      .nav-text,
      .nav-grip {
        display: none;
      }
    }

    .add-text {
      display: none;
    }

    .add-module-btn {
      width: 32px;
      margin: 0 auto;
      padding-inline: 0;
    }

    .nav-head {
      justify-content: center;
      padding: 0;
    }
  }
}

/* 导航头部：标题 + 折叠开关 */
.nav-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-2);
  margin-bottom: var(--space-2);
  flex: none;
}

.nav-label {
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.nav-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex: none;
  padding: 0;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  font-size: 13px;
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition:
    color var(--duration-fast) var(--ease-out),
    background-color var(--duration-fast) var(--ease-out);

  &:hover {
    color: var(--color-primary);
    background: var(--color-primary-bg);
  }
}

.nav-list,
.draggable-nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

/* 拖拽中的幽灵占位：降低不透明度 + 主色浅底，明确放置位置 */
.ghost {
  opacity: 0.4;
  background: var(--color-primary-bg);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  height: 36px;
  padding: 0 var(--space-2);
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  font: inherit;
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  text-align: left;
  cursor: pointer;
  transition:
    background-color var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out);

  .nav-icon {
    flex: none;
    font-size: 15px;
    color: var(--color-text-tertiary);
    transition: color var(--duration-fast) var(--ease-out);
  }

  .nav-text {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &:hover {
    background: var(--color-bg-muted);
    color: var(--color-text);
  }

  /* 激活态：主色浅底，克制强调 */
  &.active {
    background: var(--color-primary-bg);
    color: var(--color-primary);
    font-weight: var(--font-semibold);

    .nav-icon {
      color: var(--color-primary);
    }
  }
}

/* 拖拽把手：默认隐藏，hover / 拖拽中淡入，暗示可排序 */
.nav-grip {
  flex: none;
  font-size: 12px;
  color: var(--color-text-tertiary);
  cursor: grab;
  opacity: 0;
  transition: opacity var(--duration-fast) var(--ease-out);
}

.nav-item:hover .nav-grip,
.nav-item.sortable-chosen .nav-grip {
  opacity: 0.7;
}

.nav-divider {
  flex: none;
  height: 1px;
  margin: var(--space-3) var(--space-2);
  background: var(--color-border);
}

/* 添加模块固定在导航底部 */
.nav-add {
  margin-top: auto;
  padding-top: var(--space-3);
}

.add-module-btn {
  height: 36px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  font-size: var(--text-xs);
  transition:
    color var(--duration-fast) var(--ease-out),
    border-color var(--duration-fast) var(--ease-out);

  &:hover {
    color: var(--color-primary);
    border-color: var(--color-primary-border);
  }
}

/* ============ 右侧内容区 ============ */
.module-form {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

/* ============ 全局设置分区卡片 ============ */
.section {
  flex: none;
  padding: var(--space-4);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.section-title {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--color-text);
  margin-bottom: var(--space-4);
}

.section-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

/* ============ 滑块行：label 左 + 滑块 + 数值右 ============ */
.slider-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.slider-label {
  flex: none;
  width: 84px;
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
}

.slider {
  flex: 1;
  margin: 0;
}

.slider-value {
  flex: none;
  min-width: 44px;
  text-align: right;
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  font-variant-numeric: tabular-nums;
}

/* ============ 字体与字号设置网格 ============ */
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3) var(--space-4);
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;

  &.field-full {
    grid-column: 1 / -1;
  }
}

.field-label {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  line-height: var(--leading-normal);
}

/* ============ 主题色 ============ */
.theme-palette {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.theme-dot {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  cursor: pointer;
  padding: 0;
  border: none;
  transition:
    box-shadow var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out);

  &:hover {
    transform: scale(1.08);
  }

  /* 选中态：白底 + 主色环，克制的强调方式 */
  &.active {
    box-shadow:
      0 0 0 2px var(--color-surface),
      0 0 0 4px var(--color-primary);
  }
}

/* 自定义颜色：原生取色器做成圆形色块 */
.theme-dot-custom {
  background: conic-gradient(
    from 180deg,
    #f97316,
    #facc15,
    #22c55e,
    #06b6d4,
    #6366f1,
    #ec4899,
    #f97316
  );
  overflow: hidden;

  &::-webkit-color-swatch-wrapper {
    padding: 4px;
  }

  &::-webkit-color-swatch {
    border: none;
    border-radius: 50%;
  }

  &::-moz-color-swatch {
    border: none;
    border-radius: 50%;
  }
}

/* ============ 响应式：窄屏时导航横向化 ============ */
@media (max-width: 768px) {
  .edit-content {
    flex-direction: column;
    padding: var(--space-3);
    gap: var(--space-3);
    overflow-y: auto;
  }

  .module-nav {
    width: 100%;
    flex-direction: row;
    align-items: center;
    overflow-x: auto;
    overflow-y: hidden;
    padding-bottom: var(--space-1);

    /* 移动端横向布局下忽略折叠态宽度 */
    &.collapsed {
      width: 100%;
    }
  }

  /* 移动端横排导航空间有限，隐藏折叠开关与折叠态样式 */
  .nav-toggle {
    display: none;
  }

  .module-nav.collapsed .nav-item {
    justify-content: flex-start;
    padding: 0 var(--space-2);

    .nav-text,
    .nav-grip {
      display: inline;
    }
  }

  .module-nav.collapsed .add-text {
    display: inline;
  }

  .nav-label {
    display: none;
  }

  .nav-list,
  .draggable-nav {
    flex-direction: row;
  }

  .nav-item {
    width: auto;
    flex: none;
    white-space: nowrap;
  }

  .nav-divider {
    width: 1px;
    height: 20px;
    margin: 0 var(--space-2);
  }

  .nav-add {
    margin: 0 0 0 auto;
    padding: 0 0 0 var(--space-2);
  }

  .add-module-btn {
    white-space: nowrap;
  }

  .module-form {
    overflow: visible;
  }
}
</style>
