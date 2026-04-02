<script setup lang="ts">
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  VerticalAlignTopOutlined,
} from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import { h } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()
const handleAddResume = () => {
  // 创建简历
  // 跳转编辑页面
  router.push('/edit-resume/1')
}
const handleEditResume = (item: number) => {
  router.push(`/edit-resume/${item}`)
}
const handleDeleteResume = (item: number) => {
  // 删除简历
  console.log(item)
}
</script>

<template>
  <div class="my-resume">
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
    <div class="resumes">
      <a-card v-for="item in 8" :key="item" hoverable>
        <template #cover>
          <img
            alt="example"
            src="https://gw.alipayobjects.com/zos/rmsportal/JiqGstEfoWAOHiTxclqi.png"
          />
        </template>
        <template #actions>
          <edit-outlined key="edit" @click="handleEditResume(item)" />
          <DeleteOutlined
            key="delete"
            style="color: #ff4d4f"
            @click="handleDeleteResume(item)"
          />
        </template>
        <a-card-meta
          title="未命名简历"
          :description="dayjs(Date.now()).format('YYYY-MM-DD')"
        >
        </a-card-meta>
      </a-card>
    </div>
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
