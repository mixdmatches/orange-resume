<script setup lang="ts">
import { h, inject, ref } from 'vue'
import BasicCard from '@/views/edit-resume/cards/BasicCard.vue'
import EducationCard from '@/views/edit-resume/cards/EducationCard.vue'
import InternshipCard from '@/views/edit-resume/cards/InternshipCard.vue'
import ProjectCard from '@/views/edit-resume/cards/ProjectCard.vue'
import SkillsCard from '@/views/edit-resume/cards/SkillsCard.vue'
import type { Resume } from '@/types/userInfo'
import { PlusOutlined } from '@ant-design/icons-vue'

const themeColors = ref([
  '#111827',
  '#1d4ed8',
  '#f97316',
  '#9333ea',
  '#059669',
  '#0f172a',
])
const selectedTheme = ref(themeColors.value[1])

// 字号选择
const fontOptions = ['12px', '14px', '16px', '18px', '20px', '22px', '24px']

const resume: Resume = inject('resume') as Resume
</script>

<template>
  <div class="edit-content" size="small">
    <div class="model">
      <div class="model-title">布局内容</div>
      <div class="model-content">
        <BasicCard />
        <EducationCard />
        <InternshipCard />
        <ProjectCard />
        <SkillsCard />
      </div>
      <a-button
        style="margin-top: 1rem"
        type="primary"
        block
        class="add-custom-btn"
        :icon="h(PlusOutlined)"
      >
        添加自定义模块
      </a-button>
    </div>

    <!-- 排版 -->
    <div class="model">
      <div class="model-title">排版</div>
      <div class="model-content">
        <div class="set">
          <span>行高</span>
          <a-slider
            id="test"
            v-model:value="resume.globalConfiguration.baseLineHeight"
            :min="1"
            :max="2"
            :step="0.1"
          />
        </div>
        <a-row>
          <a-col :span="6">
            <span>基础字号</span>
            <a-select
              v-model:value="resume.globalConfiguration.baseFontSize"
              style="width: 160px"
            >
              <a-select-option
                v-for="font in fontOptions"
                :key="font"
                :value="font"
                >{{ font }}</a-select-option
              >
            </a-select>
          </a-col>
          <a-col :span="6">
            <span>模块标题字号</span>
            <a-select
              v-model:value="resume.globalConfiguration.titleFontSize"
              style="width: 160px"
            >
              <a-select-option
                v-for="font in fontOptions"
                :key="font"
                :value="font"
                >{{ font }}</a-select-option
              >
            </a-select>
          </a-col>
          <a-col :span="6">
            <span>模块一级标题字号</span>
            <a-select
              v-model:value="resume.globalConfiguration.subTitleFontSize"
              style="width: 160px"
            >
              <a-select-option
                v-for="font in fontOptions"
                :key="font"
                :value="font"
                >{{ font }}</a-select-option
              >
            </a-select>
          </a-col>
        </a-row>
      </div>
    </div>
    <!-- 主题色 -->
    <div class="model">
      <div class="model-title">主题色</div>
      <div class="theme-palette">
        <div
          v-for="color in themeColors"
          :key="color"
          :class="['theme-dot', { active: selectedTheme === color }]"
          :style="{ background: color }"
          @click="resume.globalConfiguration.themeColor = color"
        ></div>
        <a-button type="dashed" size="small">自定义</a-button>
      </div>
    </div>
    <!-- 间距 -->
    <div class="model">
      <div class="model-title">间距</div>
      <div class="spacing-controls">
        <div class="spacing-row">
          <span>页边距</span>
          <a-slider
            id="page"
            v-model:value="resume.globalConfiguration.basePagePadding"
            :min="0"
            :max="50"
            :step="2"
          />
        </div>
        <div class="spacing-row">
          <span>模块间距</span>
          <a-slider
            v-model:value="resume.globalConfiguration.baseModuleSpacing"
            :min="1"
            :max="99"
            :step="2"
          />
        </div>
        <div class="spacing-row">
          <span>段落间距</span>
          <a-slider
            v-model:value="resume.globalConfiguration.paragraphSpacing"
            :min="1"
            :max="99"
            :step="2"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.edit-content {
  width: 50%;
  height: 100%;
  overflow-y: auto;
  border-radius: 0.5rem;
  padding: 1.6rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  @include themify(
    (
      color: $text-color,
      background-color: $bg-color,
    )
  );
}

.add-custom-btn {
  margin-top: auto;
}

.model {
  padding: 1.2rem 1.4rem;
  border-radius: 0.8rem;
  border: 1px solid;
  @include themify(
    (
      border-color: $border-color-mode,
    )
  );

  .model-title {
    color: $primary-color;
    font-size: 1.6rem;
    font-weight: 600;
    margin-bottom: 1rem;
  }

  &-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;

    .collapse {
      display: flex;
      flex-direction: column;
      gap: 1rem;

      .info {
        width: 100%;
        min-height: 78px;
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        border: 1px dashed;
        padding: 1rem 1.4rem;
        cursor: pointer;
        transition:
          border-color 0.2s,
          background 0.2s;
        border-radius: 0.6rem;
        @include themify(
          (
            border-color: $border-color-mode,
          )
        );

        &:hover {
          background: rgba(59, 130, 246, 0.08);
        }

        &-title {
          font-size: 1.6rem;
          font-weight: 600;
        }

        .info-desc {
          font-size: 1.3rem;
          color: #8c8c8c;
          margin-top: 0.3rem;
        }

        &-work {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          align-items: flex-end;
        }

        .info-action {
          color: $primary-color;
          font-size: 1.3rem;

          &.danger {
            color: #f97316;
          }
        }
      }

      &-content {
        width: 100%;
        border: 1px solid;
        padding: 1.4rem;
        border-radius: 0.6rem;
        background: rgba(255, 255, 255, 0.8);
        @include themify(
          (
            border-color: $border-color-mode,
          )
        );

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .form-actions {
          margin-top: 1rem;
          display: flex;
          gap: 1rem;
        }

        .basic-field {
          .field-warper {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }

          .field-item {
            display: flex;
            align-items: center;
            gap: 1rem;
            border: 1px solid #e5e7eb;
            border-radius: 0.6rem;
            padding: 0.8rem 1rem;
          }

          .sort-icon {
            cursor: move;
            font-size: 1.8rem;
            color: #9ca3af;
            display: flex;
          }

          .field-input {
            flex: 1;
            display: flex;
            align-items: center;
            gap: 1rem;
          }

          .field-prop {
            display: flex;
            align-items: center;
            gap: 0.4rem;
            width: 120px;
            font-size: 1.3rem;
            color: #4b5563;
          }

          .field-text {
            flex: 1;
          }

          .field-work {
            display: flex;
            flex-direction: column;
            gap: 0.4rem;
            font-size: 1.2rem;
            color: #94a3b8;
          }
        }

        .skill-editor {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .skill-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.8rem;
        }

        .skill-tag {
          padding: 0.3rem 1rem;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.05);
          font-size: 1.3rem;
        }

        .skill-input {
          display: flex;
          gap: 1rem;
          align-items: center;
        }
      }
    }
  }
}

.layout-options {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.layout-card {
  border: 1px solid;
  border-radius: 0.6rem;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  @include themify(
    (
      border-color: $border-color-mode,
    )
  );

  &.active {
    border-color: $primary-color;
    box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.2);
  }

  .layout-name {
    font-weight: 600;
    margin-bottom: 0.4rem;
  }
  .layout-desc {
    font-size: 1.3rem;
    color: #8c8c8c;
  }
}

.theme-palette {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.theme-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
  transition:
    transform 0.2s,
    border-color 0.2s;

  &.active {
    transform: scale(1.05);
    border-color: #3b82f6;
  }
}
</style>
