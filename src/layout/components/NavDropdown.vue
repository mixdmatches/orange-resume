<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { DownOutlined } from '@ant-design/icons-vue'

export interface DropdownItem {
  path: string
  title: string
  icon?: () => any
  desc?: string
}

const props = defineProps<{
  /** 触发器显示文字 */
  label: string
  /** 触发器图标渲染函数 */
  icon?: () => any
  /** 子菜单项 */
  items: DropdownItem[]
  /** 当前激活路径（用于高亮触发器）*/
  activePath: string
}>()

const router = useRouter()

/** 下拉面板是否打开 */
const isOpen = ref(false)

/** 触发器 DOM 引用（用于 click-outside 计算边界）*/
const triggerRef = ref<HTMLElement | null>(null)

/** 当前路由是否属于分组（高亮触发器）*/
const isActive = computed(() =>
  props.items.some(item => item.path === props.activePath),
)

/**
 * 点击触发器切换下拉
 */
const toggle = () => {
  isOpen.value = !isOpen.value
}

/**
 * 选择子项后关闭下拉并跳转
 */
const handleSelect = (path: string) => {
  isOpen.value = false
  if (router.currentRoute.value.path !== path) {
    router.push(path)
  }
}

/**
 * 全局 click 监听：点击触发器外部时关闭
 */
const handleDocumentClick = (e: MouseEvent) => {
  if (!triggerRef.value) return
  if (!triggerRef.value.contains(e.target as Node)) {
    isOpen.value = false
  }
}

/**
 * ESC 键关闭
 */
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div
    ref="triggerRef"
    class="nav-dropdown"
    :class="{ open: isOpen, active: isActive }"
  >
    <!-- 触发器按钮 -->
    <button type="button" class="nav-item" @click="toggle">
      <span v-if="icon" class="nav-icon">
        <component :is="icon()" />
      </span>
      <span class="nav-label">{{ label }}</span>
      <down-outlined class="nav-caret" />
    </button>

    <!-- 下拉面板 -->
    <Transition name="dropdown">
      <div v-if="isOpen" class="dropdown-panel" role="menu">
        <button
          v-for="item in items"
          :key="item.path"
          type="button"
          class="dropdown-item"
          :class="{ active: activePath === item.path }"
          @click="handleSelect(item.path)"
        >
          <span v-if="item.icon" class="item-icon">
            <component :is="item.icon()" />
          </span>
          <span class="item-text">
            <span class="item-label">{{ item.title }}</span>
            <span v-if="item.desc" class="item-desc">{{ item.desc }}</span>
          </span>
          <span
            v-if="activePath === item.path"
            class="item-check"
            aria-hidden="true"
          >
            ✓
          </span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
.nav-dropdown {
  position: relative;

  &.active .nav-item {
    background: var(--color-primary-bg);
    color: var(--color-primary);
    font-weight: var(--font-semibold);

    .nav-icon,
    .nav-caret {
      color: var(--color-primary);
    }
  }
}

/* ============ 触发器（复用 nav-item 结构）============ */
.nav-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 var(--space-3);
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  cursor: pointer;
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--color-text-secondary);
  transition:
    background var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out);

  &:hover {
    background: var(--color-bg-muted);
    color: var(--color-text);

    .nav-icon {
      color: var(--color-text-secondary);
    }
  }

  .nav-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    color: var(--color-text-tertiary);
    transition: color var(--duration-fast) var(--ease-out);
  }

  .nav-label {
    line-height: 1;
  }

  .nav-caret {
    font-size: 10px;
    color: var(--color-text-tertiary);
    transition:
      transform var(--duration-fast) var(--ease-out),
      color var(--duration-fast) var(--ease-out);
  }
}

.nav-dropdown.open .nav-caret {
  transform: rotate(180deg);
}

/* ============ 下拉面板 ============ */
.dropdown-panel {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  min-width: 165px;
  padding: var(--space-1);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  z-index: var(--z-dropdown, 50);
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  width: 100%;
  padding: var(--space-3) var(--space-3);
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition: background var(--duration-fast) var(--ease-out);

  &:hover {
    background: var(--color-bg-muted);
  }

  &.active {
    background: var(--color-primary-bg);
    color: var(--color-primary);

    .item-label {
      color: var(--color-primary);
    }
  }

  .item-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    font-size: 14px;
    color: var(--color-text-tertiary);
    flex-shrink: 0;
  }

  .item-text {
    display: flex;
    flex-direction: column;
    gap: 0;
    min-width: 0;
    flex: 1;
  }

  .item-label {
    font-size: var(--text-xs);
    font-weight: var(--font-medium);
    color: var(--color-text);
    line-height: 1.3;
  }

  .item-desc {
    font-size: var(--text-xs);
    color: var(--color-text-tertiary);
    margin-top: 2px;
  }

  .item-check {
    font-size: 12px;
    color: var(--color-primary);
    flex-shrink: 0;
  }
}

/* ============ 过渡动画 ============ */
.dropdown-enter-active,
.dropdown-leave-active {
  transition:
    opacity var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out);
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
