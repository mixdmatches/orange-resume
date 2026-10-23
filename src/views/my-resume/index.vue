<script setup lang="ts">
import { h, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  PlusOutlined,
  VerticalAlignTopOutlined,
  CheckSquareOutlined,
} from '@ant-design/icons-vue'
import type { Resume } from '@/types/resume'
import { useResumeList } from './composables/useResumeList'
import { useBatchSelect } from './composables/useBatchSelect'
import ResumeCard from './components/ResumeCard.vue'
import BatchActionBar from './components/BatchActionBar.vue'
import ImportConfigModal from './components/ImportConfigModal.vue'

const router = useRouter()

// ========== 简历列表（加载 / 新建 / 单份删除） ==========
const {
  resumes,
  latestUpdateText,
  oneDeleteOpen,
  oneDeleteLoading,
  getAllResume,
  handleAddResume,
  handleDeleteResume,
  handleOneDeleteOk,
} = useResumeList()

// ========== 批量管理（多选 / 批量删除） ==========
const {
  selectMode,
  batchDeleteOpen,
  batchDeleteLoading,
  selectedIds,
  allSelected,
  indeterminate,
  checkAll,
  isSelected,
  toggleSelect,
  toggleSelectMode,
  handleBatchDeleteOk,
} = useBatchSelect({ resumes, refresh: getAllResume })

onMounted(() => {
  getAllResume()
})

// ========== 导入配置弹窗 ==========
const importModalOpen = ref(false)

const handleEditResume = (id: string) => {
  router.push(`/edit-resume/${id}`)
}

/**
 * 卡片点击：多选模式下切换选中，非多选模式下进入编辑
 */
const handleCardClick = (item: Resume) => {
  if (selectMode.value) {
    toggleSelect(item.id)
  } else {
    handleEditResume(item.id)
  }
}
</script>

<template>
  <div class="page page-my-resume">
    <!-- 删除单份简历弹窗 -->
    <a-modal
      v-model:open="oneDeleteOpen"
      title="删除简历"
      centered
      :confirm-loading="oneDeleteLoading"
      @ok="handleOneDeleteOk"
    >
      <p>确定删除该简历吗？删除后不可恢复</p>
    </a-modal>

    <!-- 批量删除简历确认弹窗 -->
    <a-modal
      v-model:open="batchDeleteOpen"
      title="批量删除简历"
      centered
      :confirm-loading="batchDeleteLoading"
      @ok="handleBatchDeleteOk"
    >
      <p>
        确定删除选中的
        <a-tag color="red">{{ selectedIds.length }}</a-tag>
        份简历吗？删除后不可恢复
      </p>
    </a-modal>

    <!-- 导入配置弹窗 -->
    <ImportConfigModal
      v-model:open="importModalOpen"
      @imported="getAllResume"
    />

    <!-- ============ 页面头部 ============ -->
    <header class="page-header">
      <div>
        <h1 class="page-title">我的简历</h1>
        <p class="page-subtitle">
          {{ resumes.length }} 份简历 · 最新更新于 {{ latestUpdateText }}
        </p>
      </div>
      <div class="page-actions">
        <a-button
          type="primary"
          :disabled="selectMode"
          :icon="h(PlusOutlined)"
          @click="handleAddResume"
          >新建简历</a-button
        >
        <a-button
          :disabled="selectMode"
          :icon="h(VerticalAlignTopOutlined)"
          @click="() => (importModalOpen = true)"
          >导入配置</a-button
        >
        <a-button
          :icon="h(CheckSquareOutlined)"
          :type="selectMode ? 'primary' : 'default'"
          :danger="selectMode"
          @click="toggleSelectMode"
        >
          {{ selectMode ? '退出多选' : '批量管理' }}
        </a-button>
      </div>
    </header>

    <!-- ============ 批量操作栏（仅多选模式显示）============ -->
    <BatchActionBar
      v-if="selectMode"
      :all-selected="allSelected"
      :indeterminate="indeterminate"
      :selected-count="selectedIds.length"
      :total-count="resumes.length"
      @check-all="checkAll"
      @delete="() => (batchDeleteOpen = true)"
    />

    <!-- ============ 简历卡片网格 ============ -->
    <section v-if="resumes.length > 0" class="resume-grid">
      <ResumeCard
        v-for="(item, i) in resumes"
        :key="item.id"
        :resume="item"
        :select-mode="selectMode"
        :selected="isSelected(item.id)"
        :style="{ animationDelay: `${i * 50}ms` }"
        @click="handleCardClick(item)"
        @edit="handleEditResume"
        @delete="handleDeleteResume"
      />
    </section>

    <a-empty v-else :image-style="{ height: '200px' }" description="暂无简历" />
  </div>
</template>

<style scoped lang="scss">
/* ============ 简历卡片网格 ============ */
.resume-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--space-5);
}
</style>
