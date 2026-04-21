<script setup lang="ts">
import { computed, h, inject, ref } from 'vue'
import { motion } from 'motion-v'
import BasicCard from '@/views/edit-resume/cards/BasicCard.vue'
import EducationCard from '@/views/edit-resume/cards/EducationCard.vue'
import InternshipCard from '@/views/edit-resume/cards/InternshipCard.vue'
import ProjectCard from '@/views/edit-resume/cards/ProjectCard.vue'
import SkillsCard from '@/views/edit-resume/cards/SkillsCard.vue'
import CustomCard from '@/views/edit-resume/cards/CustomCard.vue'
import type { Resume } from '@/types/resume'
import { PlusOutlined, DownOutlined } from '@ant-design/icons-vue'
import { type UseDraggableReturn, VueDraggable } from 'vue-draggable-plus'

const themeColors = ref([
  '#111827',
  '#1d4ed8',
  '#f97316',
  '#9333ea',
  '#059669',
  '#0f172a',
])

// 字号选择
const fontOptions = [12, 14, 16, 18, 20, 22, 24]

const moduleList = [
  {
    id: 'basic',
    title: '基本信息',
  },
  {
    id: 'education',
    title: '教育经历',
  },
  {
    id: 'internship',
    title: '实习经历',
  },
  {
    id: 'project',
    title: '项目经历',
  },
  {
    id: 'skills',
    title: '个人技能',
  },
  {
    id: 'custom',
    title: '自定义模块',
  },
]

const resume: Resume = inject('resume') as Resume

// 卡片组件映射
const cardComponents = {
  basic: BasicCard,
  education: EducationCard,
  internship: InternshipCard,
  project: ProjectCard,
  skills: SkillsCard,
}

// 根据 id 获取对应的卡片组件
const getCardComponent = (id: string) => {
  if (id.startsWith('custom-')) {
    return { component: CustomCard, props: { customName: id } }
  }

  return {
    component: cardComponents[id as keyof typeof cardComponents],
    props: {},
  }
}

let customCount = computed(() => Object.keys(resume.customData).length)
const handleAddCustom = () => {
  const newCustomId = `custom-${customCount.value}`
  resume.customData[newCustomId] = []
  resume.menuSections.push({
    id: newCustomId,
    title: '自定义模块',
    order: String(resume.menuSections.length),
  })
}

const handleMenuItemClick = (id: string) => {
  resume.menuSections.push({
    id,
    title: moduleList.find(item => item.id === id)?.title || '',
    order: String(resume.menuSections.length),
  })
}

const handleChangeColor = (color: string) => {
  resume.globalConfiguration.themeColor = color
}

const el = ref<UseDraggableReturn>()

// 可拖拽的菜单部分（不包含 basic）
const draggableMenuSections = computed({
  get: () => resume.menuSections.filter(section => section.id !== 'basic'),
  set: value => {
    // 找到 basic 的位置
    const basicIndex = resume.menuSections.findIndex(
      section => section.id === 'basic',
    )
    if (basicIndex !== -1) {
      // 保留 basic 在原来的位置
      const basicSection = resume.menuSections[basicIndex]
      resume.menuSections = [...value]
      resume.menuSections.splice(basicIndex, 0, basicSection)
    } else {
      resume.menuSections = value
    }
  },
})

const onEnd = () => {
  // 重新排序，确保 basic 在第一位
  const basicSection = resume.menuSections.find(
    section => section.id === 'basic',
  )
  const otherSections = resume.menuSections.filter(
    section => section.id !== 'basic',
  )

  resume.menuSections = basicSection
    ? [basicSection, ...otherSections]
    : otherSections

  // 重新设置 order
  resume.menuSections.forEach((section, index) => {
    section.order = String(index + 1)
  })
}
</script>

<template>
  <motion.div
    class="edit-content"
    size="small"
    :initial="{ opacity: 0, y: 20 }"
    :animate="{ opacity: 1, y: 0 }"
    :transition="{ duration: 0.5, ease: 'easeOut' }"
  >
    <motion.div
      class="model"
      :initial="{ opacity: 0, y: 20 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="{ duration: 0.4, delay: 0.1 }"
    >
      <div class="model-title">布局内容</div>
      <div class="model-content">
        <component
          :is="getCardComponent('basic').component"
          v-if="resume.menuSections.some(section => section.id === 'basic')"
          v-bind="getCardComponent('basic').props"
        />

        <VueDraggable
          ref="el"
          v-model="draggableMenuSections"
          :animation="150"
          ghost-class="ghost"
          @end="onEnd"
        >
          <component
            :is="getCardComponent(section.id).component"
            v-for="section in draggableMenuSections"
            :key="section.id"
            v-bind="getCardComponent(section.id).props"
          />
        </VueDraggable>
      </div>
      <a-dropdown :trigger="['click']">
        <template #overlay>
          <a-menu>
            <template v-for="item in moduleList" :key="item.id">
              <a-menu-item
                v-if="
                  !resume.menuSections.some(section => section.id === item.id)
                "
                @click="handleMenuItemClick(item.id)"
              >
                {{ item.title }}
              </a-menu-item>
            </template>
            <a-menu-divider />
            <a-menu-item @click="handleAddCustom">自定义模块</a-menu-item>
          </a-menu>
        </template>
        <a-button
          type="primary"
          block
          class="add-custom-btn"
          :icon="h(PlusOutlined)"
          style="margin-top: 1rem"
        >
          添加模块
          <DownOutlined />
        </a-button>
      </a-dropdown>
    </motion.div>

    <!-- 排版 -->
    <motion.div
      class="model"
      :initial="{ opacity: 0, y: 20 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="{ duration: 0.4, delay: 0.2 }"
    >
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
                >{{ font }}px</a-select-option
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
                >{{ font }}px</a-select-option
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
                >{{ font }}px</a-select-option
              >
            </a-select>
          </a-col>
        </a-row>
      </div>
    </motion.div>
    <!-- 主题色 -->
    <motion.div
      class="model"
      :initial="{ opacity: 0, y: 20 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="{ duration: 0.4, delay: 0.3 }"
    >
      <div class="model-title">主题色</div>
      <div class="theme-palette">
        <motion.div
          v-for="color in themeColors"
          :key="color"
          :class="[
            'theme-dot',
            { active: resume.globalConfiguration.themeColor === color },
          ]"
          :style="{ backgroundColor: color }"
          :while-hover="{ scale: 1.1 }"
          :while-tap="{ scale: 0.95 }"
          @click="handleChangeColor(color)"
        ></motion.div>
        <input
          type="color"
          :value="resume.globalConfiguration.themeColor"
          class="theme-dot"
          @input="handleChangeColor(($event.target as HTMLInputElement).value)"
        />
      </div>
    </motion.div>
    <!-- 间距 -->
    <motion.div
      class="model"
      :initial="{ opacity: 0, y: 20 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="{ duration: 0.4, delay: 0.4 }"
    >
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
    </motion.div>
  </motion.div>
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
      background-color: $layout-bg-color,
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
      background-color: $bg-color,
    )
  );

  .model-title {
    color: $primary-color;
    font-size: 1.6rem;
    font-weight: 600;
    margin-bottom: 1rem;
  }

  &-content {
    .model-list {
      display: flex;
      flex-direction: column;
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
