<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { ArrowUpOutlined, CloseOutlined } from '@ant-design/icons-vue'

/** 输入框组件属性 */
const props = withDefaults(
  defineProps<{
    /** 输入内容（v-model:value 双向绑定） */
    value: string
    /** 占位提示文字 */
    placeholder?: string
    /** 是否禁用输入（如 AI 回复中） */
    disabled?: boolean
    /** 发送按钮是否处于加载状态 */
    loading?: boolean
    /** 最大输入字数，不传则不显示字数统计 */
    maxlength?: number
    /** 最小行数（决定初始高度） */
    minRows?: number
    /** 最大行数（超过后输入框内部滚动） */
    maxRows?: number
    /** 底部提示文字（如免责声明、快捷键说明） */
    hint?: string
    /** AI 生成中是否显示"停止生成"按钮；面试间等受控流程不允许中途停止单条消息时传 false */
    showStop?: boolean
  }>(),
  {
    placeholder: '输入消息…',
    disabled: false,
    loading: false,
    maxlength: undefined,
    minRows: 1,
    maxRows: 6,
    hint: '',
    showStop: true,
  },
)

/** 更新内容事件、发送事件与停止生成事件 */
const emit = defineEmits<{
  (e: 'update:value', value: string): void
  (e: 'send'): void
  (e: 'stop'): void
}>()

/** textarea DOM 引用，用于自动增高 */
const textareaRef = ref<HTMLTextAreaElement | null>(null)

/** 行高（需与样式中的 line-height 保持一致） */
const LINE_HEIGHT = 1.6
/** 字号（rem，需与样式中的 font-size 保持一致，1rem = 10px） */
const FONT_SIZE = 1.4
/** 单行高度（rem） */
const rowHeight = LINE_HEIGHT * FONT_SIZE

/**
 * 容器内联样式：通过 CSS 变量把行数换算成 textarea 的最小/最大高度
 */
const boxStyle = computed(() => ({
  '--textarea-min-height': `${props.minRows * rowHeight}rem`,
  '--textarea-max-height': `${props.maxRows * rowHeight}rem`,
}))

/**
 * 自动调整 textarea 高度
 * 先将 height 置为 auto 让其自然收缩，再取 scrollHeight 撑开，
 * 超出 max-height 后由 CSS 限制并开启内部滚动
 */
const adjustHeight = () => {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}

/**
 * 输入事件：同步 v-model 并实时调整高度
 */
const handleInput = (e: Event) => {
  emit('update:value', (e.target as HTMLTextAreaElement).value)
  adjustHeight()
}

/**
 * 键盘事件：Enter 发送、Shift+Enter 换行
 * 中文输入法组词期间的 Enter（isComposing）不触发发送
 */
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
    e.preventDefault()
    trySend()
  }
}

/**
 * 触发发送：内容非空且不在禁用/加载状态时向外抛出 send 事件
 */
const trySend = () => {
  if (!canSend.value) return
  emit('send')
}

/**
 * 触发停止生成：AI 回复中点击停止按钮时向外抛出 stop 事件
 * （由父组件负责中止 SSE 流，如调用 AbortController.abort()）
 */
const stopSend = () => {
  emit('stop')
}

/** 发送按钮是否可点击（决定按钮配色与禁用态） */
const canSend = computed(
  () => !!props.value.trim() && !props.disabled && !props.loading,
)

// 外部清空内容（如发送成功后父组件置空）时，把高度恢复到初始行数
watch(
  () => props.value,
  val => {
    if (!val) {
      nextTick(adjustHeight)
    }
  },
)
</script>

<template>
  <div class="chat-input-wrap">
    <!-- 大圆角卡片容器：聚焦时整体高亮 -->
    <div class="chat-input" :style="boxStyle">
      <textarea
        ref="textareaRef"
        class="chat-input-textarea"
        :value="value"
        :placeholder="placeholder"
        :disabled="disabled"
        :maxlength="maxlength"
        rows="1"
        @input="handleInput"
        @keydown="handleKeydown"
      />
      <div class="chat-input-footer">
        <!-- 左侧工具栏：由使用方通过插槽注入功能按钮 -->
        <div class="toolbar">
          <slot name="toolbar" />
        </div>
        <div class="footer-right">
          <span v-if="maxlength && value" class="char-count">
            {{ value.length }} / {{ maxlength }}
          </span>
          <button
            v-if="!loading"
            type="button"
            class="send-btn"
            :class="{ 'is-active': canSend }"
            :disabled="!canSend"
            @click="trySend"
          >
            <ArrowUpOutlined />
          </button>
          <!-- 停止按钮：AI 流式回复中显示，点击中止生成；
               showStop=false 时隐藏（面试间等受控流程不允许中途停止单条消息） -->
          <button
            v-else-if="showStop"
            type="button"
            class="send-btn is-stop"
            title="停止生成"
            @click="stopSend"
          >
            <CloseOutlined />
          </button>
        </div>
      </div>
    </div>
    <!-- 底部提示（免责声明 / 快捷键说明） -->
    <div v-if="hint" class="chat-input-hint">{{ hint }}</div>
  </div>
</template>

<style scoped lang="scss">
.chat-input-wrap {
  width: 100%;
}

/* 输入卡片容器 */
.chat-input {
  border-radius: 1.6rem;
  padding: 0.2rem 0.4rem 0.4rem;
  border: 1px solid transparent;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
  @include themify(
    (
      background-color: $layout-bg-color,
      border-color: $border-color-mode,
    )
  );

  /* 聚焦时容器整体高亮：主题色边框 + 柔和光环 */
  &:focus-within {
    border-color: $primary-color;
    box-shadow: 0 0 0 3px rgba(22, 119, 255, 0.12);
  }
}

/* 输入文本域：无边框透明，融入卡片 */
.chat-input-textarea {
  display: block;
  width: 100%;
  min-height: var(--textarea-min-height);
  max-height: var(--textarea-max-height);
  padding: 0.8rem 1rem 0;
  border: none;
  outline: none;
  background: transparent;
  resize: none;
  font-size: 1.4rem;
  line-height: 1.6;
  overflow-y: auto;
  word-break: break-word;
  @include themify(
    (
      color: $text-color,
    )
  );

  &::placeholder {
    @include themify(
      (
        color: (
          light: #b0b3b8,
          dark: rgba(255, 255, 255, 0.32),
        ),
      )
    );
  }

  &:disabled {
    cursor: not-allowed;
  }
}

/* 底部工具栏一行 */
.chat-input-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  padding: 0.4rem 0.4rem 0 0.8rem;

  .toolbar {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    min-width: 0;
  }

  .footer-right {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    flex-shrink: 0;
  }
}

/* 字数统计 */
.char-count {
  font-size: 1.2rem;
  font-variant-numeric: tabular-nums;
  @include themify(
    (
      color: (
        light: #999,
        dark: rgba(255, 255, 255, 0.45),
      ),
    )
  );
}

/* 圆形发送按钮 */
.send-btn {
  width: 3.2rem;
  height: 3.2rem;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    transform 0.1s ease;
  @include themify(
    (
      background-color: (
        light: #dcdfe4,
        dark: #3a3a3c,
      ),
      color: (
        light: #b0b3b8,
        dark: rgba(255, 255, 255, 0.35),
      ),
    )
  );

  /* 有内容时激活为主题色 */
  &.is-active {
    background: $primary-color;
    color: #fff;

    &:hover {
      background: #4096ff;
    }

    &:active {
      transform: scale(0.92);
    }
  }

  &:disabled {
    cursor: not-allowed;
  }

  &.is-stop {
    @include themify(
      (
        background-color: (
          light: #1f2329,
          dark: #f0f0f0,
        ),
        color: (
          light: #fff,
          dark: #1f2329,
        ),
      )
    );

    &:hover {
      opacity: 0.85;
    }

    &:active {
      transform: scale(0.92);
    }
  }
}

/* 底部提示文字 */
.chat-input-hint {
  margin-top: 0.6rem;
  text-align: center;
  font-size: 1.2rem;
  @include themify(
    (
      color: (
        light: #b0b3b8,
        dark: rgba(255, 255, 255, 0.32),
      ),
    )
  );
}
</style>
