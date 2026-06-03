<script setup lang="ts">
import { computed } from 'vue'
import type { Resume } from '@/types/resume'

const props = defineProps({
  resume: {
    type: Object as () => Resume | null,
    default: null,
  },
})

const summaryItems = computed(() => {
  if (!props.resume) return []
  const { basic, skills } = props.resume
  return [
    { label: '姓名', value: basic.name || '未填写' },
    { label: '求职岗位', value: basic.position || '未填写' },
    { label: '电话', value: basic.phone || '未填写' },
    { label: '邮箱', value: basic.email || '未填写' },
    { label: '技能', value: skills || '未填写' },
  ]
})

const firstEducation = computed(() => props.resume?.educations?.[0] ?? null)
const firstProject = computed(() => props.resume?.projects?.[0] ?? null)
const firstInternship = computed(() => props.resume?.internships?.[0] ?? null)
</script>

<template>
  <a-card class="resume-preview-card" bordered>
    <div class="preview-header">
      <div>
        <h3>简历预览</h3>
        <p>快速查看当前选中简历的核心信息，方便你基于内容提问 AI。</p>
      </div>
      <a-tag color="blue">当前简历</a-tag>
    </div>

    <div v-if="!props.resume" class="empty-state">
      <a-empty description="请先选择一份简历" />
    </div>

    <div v-else class="preview-body">
      <div class="summary-row">
        <div
          v-for="item in summaryItems"
          :key="item.label"
          class="summary-item"
        >
          <div class="summary-label">{{ item.label }}</div>
          <div class="summary-value">{{ item.value }}</div>
        </div>
      </div>

      <a-divider />

      <div class="detail-section">
        <div class="detail-block">
          <div class="block-title">教育经历</div>
          <div v-if="firstEducation">
            <div class="item-title">
              {{ firstEducation.school }} · {{ firstEducation.major }}
            </div>
            <div class="item-subtitle">
              {{ firstEducation.degree }} | {{ firstEducation.dateRange }}
            </div>
            <p v-if="firstEducation.description" class="item-desc">
              {{ firstEducation.description }}
            </p>
          </div>
          <p v-else class="empty-text">暂无教育经历</p>
        </div>

        <div class="detail-block">
          <div class="block-title">项目经历</div>
          <div v-if="firstProject">
            <div class="item-title">
              {{ firstProject.name }} · {{ firstProject.role }}
            </div>
            <div class="item-subtitle">
              {{ firstProject.gitAddress || '' }} {{ firstProject.dateRange }}
            </div>
            <p v-if="firstProject.description" class="item-desc">
              {{ firstProject.description }}
            </p>
          </div>
          <p v-else class="empty-text">暂无项目经历</p>
        </div>

        <div class="detail-block">
          <div class="block-title">实习经历</div>
          <div v-if="firstInternship">
            <div class="item-title">
              {{ firstInternship.companyName }} · {{ firstInternship.position }}
            </div>
            <div class="item-subtitle">{{ firstInternship.dateRange }}</div>
            <p v-if="firstInternship.description" class="item-desc">
              {{ firstInternship.description }}
            </p>
          </div>
          <p v-else class="empty-text">暂无实习经历</p>
        </div>
      </div>
    </div>
  </a-card>
</template>

<style scoped lang="scss">
.resume-preview-card {
  background: #fff;
  border-radius: 1rem;
  min-width: 360px;
  min-height: 320px;
  @include themify(
    (
      background: (
        light: #fff,
        dark: #111827,
      ),
      border-color: (
        light: #f0f0f0,
        dark: rgba(255, 255, 255, 0.12),
      ),
    )
  );
}

.preview-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.preview-header h3 {
  margin: 0;
  font-size: 1.55rem;
}

.preview-header p {
  margin: 0.6rem 0 0;
  color: rgba(0, 0, 0, 0.65);
  @include themify(
    (
      color: (
        light: rgba(0, 0, 0, 0.65),
        dark: rgba(255, 255, 255, 0.65),
      ),
    )
  );
}

.preview-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.summary-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.summary-item {
  padding: 1rem;
  border: 1px solid #f0f0f0;
  border-radius: 1rem;
  background: #fafafa;
  @include themify(
    (
      border-color: (
        light: #f0f0f0,
        dark: rgba(255, 255, 255, 0.12),
      ),
      background: (
        light: #fafafa,
        dark: #0f172a,
      ),
    )
  );
}

.summary-label {
  color: rgba(0, 0, 0, 0.65);
  font-size: 1.2rem;
  @include themify(
    (
      color: (
        light: rgba(0, 0, 0, 0.65),
        dark: rgba(255, 255, 255, 0.65),
      ),
    )
  );
}

.summary-value {
  margin-top: 0.4rem;
  font-size: 1.35rem;
  font-weight: 600;
  line-height: 1.4;
  @include themify(
    (
      color: (
        light: #111827,
        dark: #f8faff,
      ),
    )
  );
}

.detail-section {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.detail-block {
  padding: 1rem;
  border: 1px solid #f0f0f0;
  border-radius: 1rem;
  min-height: 140px;
  @include themify(
    (
      border-color: (
        light: #f0f0f0,
        dark: rgba(255, 255, 255, 0.12),
      ),
      background: (
        light: #fff,
        dark: #0f172a,
      ),
    )
  );
}

.block-title {
  margin-bottom: 0.8rem;
  font-weight: 600;
  @include themify(
    (
      color: (
        light: #111827,
        dark: #f8faff,
      ),
    )
  );
}

.item-title {
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 0.3rem;
  @include themify(
    (
      color: (
        light: #111827,
        dark: #f8faff,
      ),
    )
  );
}

.item-subtitle {
  color: rgba(0, 0, 0, 0.65);
  margin-bottom: 0.6rem;
  @include themify(
    (
      color: (
        light: rgba(0, 0, 0, 0.65),
        dark: rgba(255, 255, 255, 0.65),
      ),
    )
  );
}

.item-desc {
  margin: 0;
  color: rgba(0, 0, 0, 0.75);
  line-height: 1.7;
  @include themify(
    (
      color: (
        light: rgba(0, 0, 0, 0.75),
        dark: rgba(255, 255, 255, 0.75),
      ),
    )
  );
}

.empty-text {
  margin: 0;
  color: rgba(0, 0, 0, 0.45);
  @include themify(
    (
      color: (
        light: rgba(0, 0, 0, 0.45),
        dark: rgba(255, 255, 255, 0.45),
      ),
    )
  );
}

.empty-state {
  min-height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  @include themify(
    (
      color: (
        light: #000,
        dark: #f8faff,
      ),
    )
  );
}

@media screen and (max-width: 1100px) {
  .summary-row,
  .detail-section {
    grid-template-columns: 1fr;
  }
}
</style>
