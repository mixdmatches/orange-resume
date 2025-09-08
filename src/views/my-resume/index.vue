<script setup lang="ts">
import {
  PlusOutlined,
  SettingOutlined,
  EditOutlined,
  EllipsisOutlined,
} from '@ant-design/icons-vue'
</script>

<template>
  <div class="my-resume">
    <div class="add-resume">
      <PlusOutlined style="font-size: 2rem" />
      <span>新建简历</span>
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
          <edit-outlined key="edit" />
          <ellipsis-outlined key="ellipsis" />
        </template>
        <a-card-meta title="Card title" description="This is the description">
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
</style>
