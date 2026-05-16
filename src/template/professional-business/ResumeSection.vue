<script setup lang="ts">
import type { Resume } from '@/types/resume'
import { inject } from 'vue'
import { LinkOutlined } from '@ant-design/icons-vue'
import { useTemplateStyles } from '@/template'

interface SectionProps {
  id: string
  title: string
  items: Array<{
    id: string
    visible: boolean
    subMain?: Array<string>
    address?: string
    description: string
  }>
}

defineProps<SectionProps>()

const resume: Resume = inject('resume') as Resume

const { resumeStyles: styles } = useTemplateStyles(resume)
</script>

<template>
  <div class="section">
    <div class="section-header">
      <div class="section-line"></div>
      <h2 class="section-title">{{ title }}</h2>
      <div class="section-line"></div>
    </div>

    <div class="section-content">
      <table class="data-table">
        <tbody>
          <tr v-for="item in items" :key="item.id">
            <template v-if="item.visible">
              <td class="time-cell">{{ item.subMain?.[3] || '' }}</td>
              <td class="content-cell">
                <div v-if="item.subMain?.length" class="sub-title">
                  <strong>{{ item.subMain?.[0] || '' }}</strong>
                  <span v-if="item.subMain?.[2]" class="separator">|</span>
                  {{ item.subMain?.[2] || '' }}
                  <span v-if="item.subMain?.[1]" class="separator">|</span>
                  {{ item.subMain?.[1] || '' }}
                </div>
                <div v-if="item.address" class="extra">
                  <LinkOutlined /> {{ item.address || '' }}
                </div>
                <div
                  v-if="item.description"
                  class="description"
                  v-html="item.description"
                ></div>
              </td>
            </template>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.section {
  margin-bottom: v-bind('styles.baseModuleSpacing');

  &:last-child {
    margin-bottom: 0;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 16px;

    .section-line {
      flex: 1;
      height: 1px;
      background: #ddd;
    }

    .section-title {
      font-size: v-bind('styles.titleFontSize');
      font-weight: 700;
      color: v-bind('styles.themeColor');
      letter-spacing: 4px;
      white-space: nowrap;
    }
  }

  .section-content {
    .data-table {
      width: 100%;
      border-collapse: collapse;

      tbody {
        display: flex;
        flex-direction: column;
        gap: v-bind('styles.paragraphSpacing');
        tr {
          border-bottom: 1px solid #eee;

          &:last-child {
            border-bottom: none;
          }

          td {
            padding: 12px 0;
            vertical-align: top;

            &.time-cell {
              width: 160px;
              font-size: 13px;
              color: #666;
              font-family: 'Courier New', monospace;
              white-space: nowrap;
            }

            &.content-cell {
              font-size: 14px;
              color: #333;

              .sub-title {
                font-size: v-bind('styles.subTitleFontSize');
                color: #333;
              }

              strong {
                font-weight: 600;
                color: #222;
              }

              .separator {
                margin: 0 8px;
                color: #ccc;
              }

              .extra {
                font-size: 13px;
                color: #666;
                margin-top: 4px;
              }

              .description {
                margin-top: 8px;
                font-size: v-bind('styles.baseFontSize');
                color: #555;
                line-height: v-bind('styles.baseLineHeight');

                :deep(p) {
                  margin-bottom: 6px;
                }

                :deep(ul) {
                  padding-left: 20px;
                  margin: 6px 0;

                  li {
                    margin-bottom: 3px;
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
</style>
