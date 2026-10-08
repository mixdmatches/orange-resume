<script lang="ts" setup>
import { reactive, ref, VueElement, watch } from 'vue'
import { useRouter } from 'vue-router'
import { header_routes } from '@/router'
import LineMdGithub from '~icons/line-md/github'
import ThemeIcon from '@/components/ThemeIcon.vue'
import type { MenuProps, ItemType } from 'ant-design-vue'

const router = useRouter()

const selectedKeys = ref<string[]>([])

/**
 * 构造 a-menu 所需的菜单项数据
 * @param label - 菜单标题
 * @param key - 路由路径，作为菜单 key
 * @param icon - 菜单图标
 */
function getItem(
  label: VueElement | string,
  key: string,
  icon?: VueElement,
  children?: ItemType[],
  type?: 'group',
): ItemType {
  return {
    key,
    icon,
    children,
    label,
    type,
  } as ItemType
}

/** 将路由配置转换为菜单项列表 */
const generateItems = () => {
  return header_routes.map(item =>
    getItem(
      item.meta?.title as string,
      item.path,
      item.meta?.icon as VueElement,
    ),
  )
}

const items: ItemType[] = reactive(generateItems())

/** 点击菜单项发起导航 */
const handleClick: MenuProps['onClick'] = e => {
  router.push(e.key as string)
}

/** 路由变化时同步高亮菜单项 */
watch(
  () => router.currentRoute.value.path,
  newVal => {
    selectedKeys.value = [newVal as string]
  },
  { immediate: true },
)

/** 跳转 GitHub 仓库 */
const goToGithub = () => {
  window.location.href = 'https://github.com/mixdmatches/orange-resume'
}
</script>

<template>
  <div class="top-nav">
    <!-- 左侧：Logo -->
    <div class="logo">
      <img src="~@/assets/images/logo.png" alt="orange-resume" />
      <img
        src="~@/assets/images/logo-text.png"
        alt="orange-resume"
        class="logo-text"
      />
    </div>

    <!-- 中间：横向导航菜单 -->
    <a-menu
      :selected-keys="selectedKeys"
      class="menu"
      mode="horizontal"
      :items="items"
      @click="handleClick"
    ></a-menu>

    <!-- 右侧：操作区 -->
    <div class="actions">
      <line-md-github class="action-icon" @click="goToGithub" />
      <theme-icon></theme-icon>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.top-nav {
  display: flex;
  align-items: center;
  height: $site-header-height;
  padding: 0 1.5rem;
  border-bottom: 1px solid $border-color;
  @include themify(
    (
      border-color: $border-color-mode,
      background-color: $bg-color,
    )
  );
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
  margin-right: 2rem;

  img:nth-child(1) {
    height: 36px;
  }

  .logo-text {
    width: 8rem;
    object-fit: contain;
  }
}

.menu {
  flex: 1;
  border: none !important;
  background: transparent !important;
}

/* 去掉 ant-menu 横向模式下的下边框 */
:deep(.ant-menu-root) {
  border-inline-end: none !important;
  border-bottom: none !important;
}

.actions {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-shrink: 0;
  margin-left: auto;

  .action-icon {
    font-size: 1.4rem;
    cursor: pointer;
    @include themify(
      (
        color: $text-color,
      )
    );
  }
}
</style>
