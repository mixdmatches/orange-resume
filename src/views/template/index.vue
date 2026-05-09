<script setup lang="ts">
import { templates } from '@/template/index'
import classicPreview from '@/assets/images/classic.fcafadcb.svg'
</script>

<template>
  <div class="template-container">
    <div v-for="temp in templates" :key="temp.id" class="template-box">
      <div class="template-wrapper">
        <div class="template-image">
          <img :src="classicPreview" alt="模板预览" />
        </div>
        <!-- 蒙版 -->
        <div class="template-mask">
          <div class="template-name">{{ temp.name }}</div>
          <div class="template-description">{{ temp.description }}</div>
        </div>
      </div>
      <div class="template-button">
        <a-button type="primary" size="large">使用模板</a-button>
        <a-button size="large">预览模板</a-button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.template-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-gap: 20px;
  padding: 20px;

  .template-box {
    height: 600px;
    background-color: #f9f9f9;
    border-radius: 10px;
    overflow: hidden;
    position: relative;
    border: 1px solid #ccc;

    .template-wrapper {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }

    .template-image {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .template-mask {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      opacity: 0;
      transition: opacity 0.3s ease;
      z-index: 10;

      .template-name {
        font-size: 24px;
        font-weight: bold;
        color: #fff;
        margin-bottom: 12px;
      }

      .template-description {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.85);
        text-align: center;
        padding: 0 20px;
      }
    }

    .template-button {
      position: absolute;
      bottom: 20px;
      left: 20px;
      right: 20px;
      display: flex;
      justify-content: center;
      gap: 10px;
      z-index: 20;
    }

    // 鼠标移入显示蒙版
    &:hover {
      .template-mask {
        opacity: 1;
      }
    }
  }
}
</style>
