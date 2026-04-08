<script setup lang="ts">
import { DEFAULT_RESUME } from '@/config/init-resume-data'
import {
  addResumeIDB,
  deleteResumeIDB,
  getAllResumesIDB,
} from '@/service/indexDB'
import type { Resume } from '@/types/resume'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  VerticalAlignTopOutlined,
} from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import { h, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()

const activeResumeId = ref<string>('')

const resumes = ref<Resume[]>([])

const getAllResume = async () => {
  const res = await getAllResumesIDB()
  res.sort((a, b) => b.createdAt - a.createdAt)
  resumes.value = res
}
onMounted(() => {
  getAllResume()
})

/**
 * 创建简历
 */
const handleAddResume = async () => {
  const newResume: Omit<Resume, 'id'> = Object.assign({}, DEFAULT_RESUME)
  await addResumeIDB(newResume)
  await getAllResume()
}

const handleEditResume = (id: string) => {
  router.push(`/edit-resume/${id}`)
}

const handleDeleteResume = async (id: string) => {
  activeResumeId.value = id
  open.value = true
}

const open = ref(false)
const confirmLoading = ref(false)

const handleOk = async () => {
  confirmLoading.value = true
  await deleteResumeIDB(activeResumeId.value)
  confirmLoading.value = false
  open.value = false
  await getAllResume()
}
</script>

<template>
  <div class="my-resume">
    <a-modal
      v-model:open="open"
      title="删除简历"
      :confirm-loading="confirmLoading"
      @ok="handleOk"
    >
      <p>确定删除该简历吗？删除后不可恢复</p>
    </a-modal>
    <div class="work">
      <a-space>
        <a-button
          type="primary"
          size="large"
          :icon="h(PlusOutlined)"
          @click="handleAddResume"
          >新建简历</a-button
        >
        <a-button size="large" :icon="h(VerticalAlignTopOutlined)"
          >导入配置</a-button
        >
      </a-space>
    </div>
    <div v-if="resumes.length > 0" class="resumes">
      <a-card v-for="item in resumes" :key="item.id" hoverable>
        <template #actions>
          <edit-outlined key="edit" @click="handleEditResume(item.id)" />
          <DeleteOutlined
            key="delete"
            style="color: #ff4d4f"
            @click="handleDeleteResume(item.id)"
          />
        </template>
        <a-card-meta
          :title="item.title"
          :description="dayjs(item.createdAt).format('YYYY-MM-DD')"
        >
        </a-card-meta>
      </a-card>
    </div>
    <a-empty v-else :image-style="{ height: '200px' }" description="暂无简历" />
  </div>
</template>

<style scoped lang="scss">
.add-resume {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 70px;
  line-height: 70px;
  text-align: center;
  border-radius: 1rem;
  border: 1px dashed $primary-color;
  font-size: 1.4rem;
  transition: all 0.3s ease-in-out;
  cursor: pointer;
  margin-bottom: 2rem;
  &:hover {
    background-color: $primary-color;
    color: #fff;
  }
}
.resumes {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-gap: 2rem;
}
.work {
  margin-bottom: 2rem;
}
</style>
