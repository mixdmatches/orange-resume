import { onUnmounted, ref } from 'vue'

/** 验证码发送倒计时（60s） */
export function useCountdown() {
  const countdown = ref(0)
  let timer: ReturnType<typeof setInterval> | null = null

  function start(seconds = 60) {
    stop()
    countdown.value = seconds
    timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        stop()
      }
    }, 1000)
  }

  function stop() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    countdown.value = 0
  }

  onUnmounted(stop)

  return { countdown, start, stop }
}
