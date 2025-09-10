<script setup lang="ts">
import TablerGripVertical from '~icons/tabler/grip-vertical'
import MdiAccount from '~icons/mdi/account'
import { DEFAULT_RESUME } from '@/config/init-resume-data'
const basic_filed = DEFAULT_RESUME.basic
</script>

<template>
  <div class="basic-field">
    <div class="field-warper">
      <div
        v-for="(field, index) in Object.keys(basic_filed)"
        :key="index"
        class="field-item"
      >
        <span class="sort-icon">
          <tabler-grip-vertical />
        </span>
        <div class="field-input">
          <div class="field-prop">
            <mdi-account style="font-size: 16px" />
            <span class="prop">{{ field }}</span>
          </div>
          <a-input
            style="margin: 0 1rem"
            type="text"
            placeholder="请输入姓名"
          />
        </div>
        <div class="field-work">
          <span class="visible">可见</span>
          <span class="delete">删除</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
