<script lang="ts" setup>
import { reactive, ref, VueElement } from 'vue'
import { useRouter } from 'vue-router'
import { header_routes } from '@/router'
import { MenuUnfoldOutlined, MenuFoldOutlined } from '@ant-design/icons-vue'
import type { MenuProps, ItemType } from 'ant-design-vue'

const router = useRouter()

const selectedKeys = ref<string[]>([header_routes[0].path])

function getItem(
  label: VueElement | string,
  key: string,
  icon?: any,
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

const generateItems = () => {
  return header_routes.map(item =>
    getItem(item.meta?.title as string, item.path, item.meta?.icon),
  )
}

const items: ItemType[] = reactive(generateItems())

const handleClick: MenuProps['onClick'] = e => {
  selectedKeys.value = [e.key as string]
  router.push(e.key as string)
}

const toggleCollapsed = () => {
  collapsed.value = !collapsed.value
}

const collapsed = ref(false)
</script>

<template>
  <div class="side-bar">
    <div class="logo">
      <img src="~@/assets/images/logo.png" alt="fan-resume" />
      <img
        v-if="!collapsed"
        src="~@/assets/images/logo-text.png"
        alt="fan-resume"
      />
    </div>
    <a-menu
      v-model:selected-keys="selectedKeys"
      class="menu"
      mode="inline"
      :items="items"
      :inline-collapsed="collapsed"
      @click="handleClick"
    ></a-menu>
    <div class="menu-btn">
      <a-button
        type="primary"
        style="margin-bottom: 16px"
        @click="toggleCollapsed"
      >
        <MenuUnfoldOutlined v-if="collapsed" />
        <MenuFoldOutlined v-else />
      </a-button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.side-bar {
  display: flex;
  flex-direction: column;
}
.menu {
  height: 100%;
}
.ant-menu-root {
  border-inline-end: none !important;
}
.logo {
  display: flex;
  height: $site-header-height;
  align-items: center;
  justify-content: center;
  img:nth-child(1) {
    height: 90%;
  }
  img:nth-child(2) {
    width: 15rem;
    object-fit: contain;
  }
}
.menu-btn {
  padding: 1rem;
  display: flex;
  justify-content: right;
}
</style>
