<script setup lang="ts">
import LineMdArrowSmallLeft from '~icons/line-md/arrow-small-left'
import LineMdArrowCloseDown from '~icons/line-md/arrow-close-down'
import LineMdArrowsHorizontal from '~icons/line-md/arrows-horizontal'
import { DownOutlined } from '@ant-design/icons-vue'
import ThemeIcon from '@/components/ThemeIcon.vue'
import { ref } from 'vue'
const title = ref('未命名简历')
</script>

<template>
  <div class="tool-head">
    <div class="tool-head-left">
      <line-md-arrow-small-left />
      <a-input v-model:value="title" class="title"></a-input>
    </div>
    <div class="tools">
      <a-tooltip title="切换模板">
        <a-button><line-md-arrows-horizontal /></a-button>
      </a-tooltip>
      <a-dropdown>
        <a-button type="primary" class="tool-download">
          <line-md-arrow-close-down style="margin-right: 0.2rem" />
          导出<DownOutlined
        /></a-button>
        <template #overlay>
          <a-menu>
            <a-menu-item> PDF </a-menu-item>
            <a-menu-item> JSON </a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>
      <theme-icon></theme-icon>
    </div>
  </div>
</template>

<style scoped lang="scss">
.tool-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: $site-header-height;
  line-height: $site-header-height;
  padding: 1rem 2rem;
  font-size: 2rem;
  border-bottom: 1px solid;
  @include themify(
    (
      color: $text-color,
      background-color: $bg-color,
      border-color: $border-color-mode,
    )
  );
  &-left {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .tools {
    display: flex;
    gap: 2rem;
    .tool-download {
      display: flex;
      align-items: center;
    }
  }
}
</style>
