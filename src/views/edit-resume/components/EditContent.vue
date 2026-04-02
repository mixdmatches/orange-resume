<script setup lang="ts">
import { ref } from 'vue'

const themeColors = ref([
  '#111827',
  '#1d4ed8',
  '#f97316',
  '#9333ea',
  '#059669',
  '#0f172a',
])
const selectedTheme = ref(themeColors.value[1])
// 间距控制
const spacingValue = ref(16) // 模块间距，默认16px
const marginValue = ref(20) // 页边距，默认20px
const paragraphValue = ref(12) // 段落间距，默认12px

// 字号选择
const fontOptions = ['12px', '14px', '16px', '18px', '20px', '22px', '24px']
</script>

<template>
  <div class="edit-content" size="small">
    <div class="model">
      <div class="model-title">布局内容</div>
      <div class="model-content">
        <slot name="basic"> </slot>
        <slot name="education"></slot>
        <slot name="internship"></slot>
        <slot name="project"></slot>
        <slot name="skills"></slot>
        <!-- <div v-for="item in infoList" :key="item.label" class="collapse">
          <div class="info" @click="handleCollapse(item.label)">
            <div>
              <div class="info-title">{{ item.label }}</div>
              <div class="info-desc">{{ item.description }}</div>
            </div>
            <div class="info-work">
              <span class="info-action">可见</span>
              <span class="info-action danger">删除</span>
            </div>
          </div>
          <div v-if="activeKey.includes(item.label)" class="collapse-content">
            <template v-if="item.label === '教育经历'">
              <template v-for="value in localEducation" :key="value.id">
                <div class="form-grid">
                  <a-input
                    v-model:value="value.school"
                    placeholder="学校名称"
                  />
                  <a-input v-model:value="value.major" placeholder="就读专业" />
                  <a-select ref="select" v-model:value="value.degree">
                    <a-select-option
                      v-for="option in degreeOptions"
                      :key="option"
                      :value="option"
                      >{{ option }}</a-select-option
                    >
                  </a-select>
                  <a-range-picker
                    v-model:value="value.dateRange"
                    :format="'YYYY/MM'"
                  />
                </div>
                <a-textarea
                  v-model:value="value.description"
                  :rows="3"
                  placeholder="自定义描述：课程/获奖/绩点等"
                />
                <a-button type="dashed" block danger>删除教育经历</a-button>
              </template>
              <div class="form-actions">
                <a-button type="dashed" block @click="handleAddEducation"
                  >+ 添加教育经历</a-button
                >
              </div>
            </template>
            <template v-else-if="item.label === '实习经历'">
              <div class="form-grid">
                <a-input placeholder="公司名称" />
                <a-input placeholder="岗位名称" />
                <a-input placeholder="所在部门" />
                <a-input placeholder="实习时间" />
              </div>
              <a-textarea :rows="4" placeholder="输入实习成果、负责模块..." />
              <div class="form-actions">
                <a-button type="default">生成 STAR 模板</a-button>
                <a-button type="primary">保存</a-button>
              </div>
            </template>
            <template v-else-if="item.label === '项目经历'">
              <div class="form-grid">
                <a-input
                  v-model:value="localBasic.name"
                  placeholder="项目名称"
                />
                <a-input placeholder="个人角色" />
                <a-input placeholder="技术栈（如 Vue3 + TS）" />
                <a-input placeholder="项目链接（GitHub / 线上）" />
              </div>
              <a-textarea :rows="4" placeholder="项目背景、难点与亮点" />
              <div class="form-actions">
                <a-button type="dashed">+ 添加项目</a-button>
              </div>
            </template>
            <template v-else>
              <div class="skill-editor">
                <div class="skill-tags">
                  <span
                    v-for="skill in skills"
                    :key="skill"
                    class="skill-tag"
                    >{{ skill }}</span
                  >
                </div>
                <div class="skill-input">
                  <a-input placeholder="输入技能关键词，如 Vue、React、Node" />
                  <a-button type="primary">添加</a-button>
                </div>
              </div>
            </template>
          </div>
        </div> -->
      </div>
      <a-button
        style="margin-top: 1rem"
        type="primary"
        block
        class="add-custom-btn"
      >
        + 添加自定义模块
      </a-button>
    </div>

    <div class="model">
      <div class="model-title">排版</div>
      <div class="model-content">
        <div class="set">
          <span>行高</span>
          <a-slider id="test" :min="1" :max="2" :step="0.1" />
        </div>
        <a-row>
          <a-col :span="6">
            <span>基础字号</span>
            <a-select style="width: 160px">
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
            <a-select style="width: 160px">
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
            <a-select style="width: 160px">
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
    <div class="model">
      <div class="model-title">主题色</div>
      <div class="theme-palette">
        <div
          v-for="color in themeColors"
          :key="color"
          :class="['theme-dot', { active: selectedTheme === color }]"
          :style="{ background: color }"
          @click="selectedTheme = color"
        ></div>
        <a-button type="dashed" size="small">自定义</a-button>
      </div>
    </div>
    <div class="model">
      <div class="model-title">间距</div>
      <div class="spacing-controls">
        <div class="spacing-row">
          <span>页边距</span>
          <a-slider
            id="page"
            v-model:value="marginValue"
            :min="0"
            :max="50"
            :step="2"
          />
        </div>
        <div class="spacing-row">
          <span>模块间距</span>
          <a-slider v-model:value="spacingValue" :min="1" :max="99" :step="2" />
        </div>
        <div class="spacing-row">
          <span>段落间距</span>
          <a-slider
            v-model:value="paragraphValue"
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
