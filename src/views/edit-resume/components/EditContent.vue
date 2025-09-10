<script setup lang="ts">
import { ref } from 'vue'

const infoList = ref([
  '基本信息',
  '教育经历',
  '实习经历',
  '项目经历',
  '个人技能',
])

const activeKey = ref(['基本信息'])
const handleCollapse = (item: string) => {
  if (activeKey.value.includes(item)) {
    activeKey.value = activeKey.value.filter(i => i !== item)
  } else {
    activeKey.value.push(item)
  }
}
</script>

<template>
  <div class="edit-content" size="small">
    <div class="model">
      <div class="model-title">布局内容</div>
      <div class="model-content">
        <div v-for="item in infoList" :key="item" class="collapse">
          <div class="info" @click="handleCollapse(item)">
            <div class="info-title">{{ item }}</div>
            <div class="info-work">
              <span>可见</span>
              <span>删除</span>
            </div>
          </div>
          <div v-if="activeKey.includes(item)" class="collapse-content"></div>
        </div>
      </div>
    </div>
    <div class="model">
      <div class="model-title">排版</div>
    </div>
    <div class="model">
      <div class="model-title">主题色</div>
    </div>
    <div class="model">
      <div class="model-title">间距</div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.edit-content {
  width: 50%;
  height: 100%;
  overflow-y: scroll;
  border-radius: 0.5rem;
  padding: 1rem;
  @include themify(
    (
      color: $text-color,
      background-color: $bg-color,
    )
  );
}
.model {
  //border: 1px solid;
  //@include themify(
  //  (
  //    border-color: $border-color-mode,
  //  )
  //);
  .model-title {
    color: $primary-color;
    font-size: 1.6rem;
    font-weight: 500;
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
        height: 70px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border: 1px solid;
        padding: 0 1rem;
        cursor: pointer;
        @include themify(
          (
            border-color: $border-color-mode,
          )
        );
        border-radius: 4px;
        &-title {
          font-size: 1.6rem;
          font-weight: 500;
        }
        &-work {
          display: flex;
          gap: 1rem;
        }
      }
      &-content {
        width: 100%;
        // height: 300px;
        border: 1px solid;
        padding: 1rem;
        @include themify(
          (
            border-color: $border-color-mode,
          )
        );
        border-radius: 4px;
        .basic-field {
          font-weight: 500;
          .basic-field-title {
            font-size: 1.6rem;
            font-weight: 500;
            margin-bottom: 1rem;
          }
          .field-warper {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            margin-top: 1rem;
          }
          .field-item {
            display: flex;
            justify-content: space-around;
            align-items: center;
            border: 1px solid #ccc;
            border-radius: 4px;
            padding: 1rem;
            .sort-icon {
              cursor: move;
              font-size: 1.6rem;
            }
            .field-input {
              width: calc(100% - 200px);
              display: flex;
              align-items: center;

              .field-prop {
                display: flex;
                align-items: center;
                width: 90px;
                font-size: 1.4rem;
              }
            }
            .field-work {
              width: 100px;
              display: flex;
              gap: 1rem;
            }
          }
        }
      }
    }
  }
}
</style>
