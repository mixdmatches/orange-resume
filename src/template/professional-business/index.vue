<script setup lang="ts">
import { computed, inject } from 'vue'
import type { Resume } from '@/types/resume'
import {
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons-vue'
import ResumeSection from './ResumeSection.vue'
import { useTemplateStyles } from '@/template'

const resume: Resume = inject('resume') as Resume

const { resumeStyles: styles, getSectionItems } = useTemplateStyles(resume)

const sortedSections = computed(() => {
  return [...resume.menuSections]
    .sort((a, b) => {
      return parseInt(a.order) - parseInt(b.order)
    })
    .filter(s => s.id !== 'basic')
})
</script>

<template>
  <div class="professional-business-resume">
    <!-- 商务头部 -->
    <header class="resume-header">
      <div class="header-top">
        <div class="header-brand">
          <div v-if="resume.basic.photo" class="avatar">
            <img :src="resume.basic.photo" :alt="resume.basic.name" />
          </div>
          <div class="brand-info">
            <h1 class="name">{{ resume.basic.name }}</h1>
            <p class="position">{{ resume.basic.position }}</p>
          </div>
        </div>
        <div class="header-contact">
          <div class="contact-row">
            <PhoneOutlined /> {{ resume.basic.phone }}
          </div>
          <div class="contact-row">
            <MailOutlined /> {{ resume.basic.email }}
          </div>
          <div class="contact-row">
            <EnvironmentOutlined /> {{ resume.basic.address }}
          </div>
        </div>
      </div>
      <div class="header-divider"></div>
    </header>

    <!-- 主体内容 -->
    <main class="resume-body">
      <template v-for="section in sortedSections" :key="section.id">
        <ResumeSection
          :id="section.id"
          :title="section.title"
          :items="getSectionItems(section.id)"
        ></ResumeSection>
      </template>
    </main>
  </div>
</template>

<style scoped lang="scss">
.professional-business-resume {
  background: #fff;
  font-size: v-bind('styles.baseFontSize');
  color: #333;
  line-height: 1.6;
  font-family: 'Times New Roman', Times, serif;

  .resume-header {
    padding: 10px 0;

    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .header-brand {
        display: flex;
        align-items: center;
        gap: 20px;

        .avatar {
          width: 80px;
          height: 100px;
          border: 2px solid v-bind('styles.themeColor');
          padding: 3px;

          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
        }

        .brand-info {
          .name {
            font-size: 20px;
            font-weight: 700;
            color: v-bind('styles.themeColor');
            letter-spacing: 4px;
            margin-bottom: 6px;
          }

          .position {
            font-size: 18px;
            color: #666;
          }
        }
      }

      .header-contact {
        text-align: right;

        .contact-row {
          font-size: 13px;
          color: #555;
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;

          &:last-child {
            margin-bottom: 0;
          }
        }
      }
    }

    .header-divider {
      margin-top: 20px;
      height: 3px;
      background: linear-gradient(
        to right,
        v-bind('styles.themeColor'),
        transparent
      );
    }
  }
}
</style>
