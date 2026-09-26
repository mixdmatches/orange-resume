/**
 * 生成 UUID v4 字符串
 *
 * 优先使用原生 crypto.randomUUID()（仅 HTTPS/localhost 安全上下文可用），
 * 非 HTTPS 环境或旧浏览器降级为 crypto.getRandomValues / Math.random 手动实现，
 * 避免线上 HTTP 访问时调用报 "crypto.randomUUID is not a function"。
 *
 * @returns 36 位标准格式的 UUID v4 字符串，如 "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
 */
export function generateUUID(): string {
  // 优先走原生实现
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID()
  }

  // 降级方案 1：crypto.getRandomValues 存在时，用它保证随机质量
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.getRandomValues === 'function'
  ) {
    // 16 进制字符表，用于把随机字节映射成 UUID 格式
    const hex = '0123456789abcdef'
    const bytes = crypto.getRandomValues(new Uint8Array(16))
    // 设置 version 位为 4（UUID v4 规范）
    bytes[6] = (bytes[6] & 0x0f) | 0x40
    // 设置 variant 位为 10（RFC 4122 规范）
    bytes[8] = (bytes[8] & 0x3f) | 0x80
    let out = ''
    bytes.forEach((b, i) => {
      // 按标准格式在第 8、12、16、20 位插入连字符
      if (i === 4 || i === 6 || i === 8 || i === 10) out += '-'
      out += hex[b >> 4] + hex[b & 0x0f]
    })
    return out
  }

  // 降级方案 2：兜底使用 Math.random（随机性较弱，仅极端环境使用）
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
