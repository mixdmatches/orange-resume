/**
 * 流式 JSON 修复器：字符级状态机扫描 + 栈追踪 + 尾部裁剪 + 反序补齐。
 */
/** 扫描字符串：构建括号栈并定位末尾是否处于未闭合字符串内 */
function scan(s: string): {
  stack: string[]
  inString: boolean
  strStart: number
} {
  const stack: string[] = []
  let inString = false
  let escape = false
  let strStart = -1
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (inString) {
      if (escape) {
        escape = false
      } else if (ch === '\\') {
        escape = true
      } else if (ch === '"') {
        inString = false
      }
      continue
    }
    if (ch === '"') {
      inString = true
      strStart = i
    } else if (ch === '{' || ch === '[') {
      stack.push(ch)
    } else if (ch === '}' || ch === ']') {
      stack.pop()
    }
  }
  return { stack, inString, strStart }
}

/** 按栈反序补齐闭合符，并以 JSON.parse 做最终契约校验 */
function finalize(s: string, stack: string[]): string {
  while (stack.length > 0) {
    s += stack.pop() === '{' ? '}' : ']'
  }
  try {
    JSON.parse(s)
    return s
  } catch {
    return '{}'
  }
}

export function repairJson(input: string): string {
  if (!input || !input.trim()) return '{}'

  // 合法 JSON 直接返回，不引入副作用（快路径）
  try {
    JSON.parse(input)
    return input
  } catch {
    // 需要修复，继续
  }

  let s = input

  // ===== 阶段一：处理末尾未闭合的字符串（修复结果必为合法前缀，直接补齐返回）=====
  {
    const { stack, inString, strStart } = scan(s)
    if (inString) {
      if (s.endsWith('\\') || /\\u[0-9a-fA-F]{0,3}$/.test(s)) {
        // 转义序列不完整（"张\ 或 "张\u00）→ 删掉残缺转义，补引号闭合
        s = s.replace(/\\u?[0-9a-fA-F]*$/, '') + '"'
      } else {
        // 依据"字符串起点前的字符 + 栈顶容器"判断它是 值 / 数组元素 / 键
        let k = strStart - 1
        while (k >= 0 && /\s/.test(s[k])) k--
        const prevChar = k >= 0 ? s[k] : ''
        const top = stack[stack.length - 1]
        if (prevChar === ':' || top === '[') {
          s += '"' // 值或数组元素：直接闭合
        } else if (prevChar === ',' || prevChar === '{') {
          // 半个键：裁掉键（前置逗号一并裁掉；前置开括号保留）
          s = s.slice(0, prevChar === ',' ? k : k + 1)
        } else {
          s += '"' // 根级字符串
        }
      }
      // 裁剪半个键只会缩短文本、不影响已入栈的括号，栈可直接复用
      return finalize(s, stack)
    }
  }

  // normal 态：复用阶段一的栈（后续裁剪只动"最后一个未闭合容器内的残缺成员"，
  // 已入栈的括号都在文本前部且不被修改，故栈始终有效，仅连续开括号合并需增量 pop）
  const { stack } = scan(s)

  // ===== 阶段二：normal 态尾部裁剪（按末尾字符分流，循环直到稳定）=====
  while (true) {
    // 手动去尾部空白（比 /\s+$/ 正则回溯更快）
    let end = s.length
    while (
      end > 0 &&
      (s[end - 1] === ' ' ||
        s[end - 1] === '\t' ||
        s[end - 1] === '\n' ||
        s[end - 1] === '\r')
    ) {
      end--
    }
    if (end < s.length) s = s.slice(0, end)
    if (!s) return '{}'

    const last = s[s.length - 1]

    // 末尾逗号（元素后截断）→ 删逗号即安全
    if (last === ',') {
      s = s.slice(0, -1)
      break
    }

    // 末尾完整键但无值 → 裁掉键（保留开括号）；只查末尾切片避免长文本回溯
    if (last === '"') {
      const t = s.slice(-512)
      let m = t.match(/,\s*"((?:[^"\\]|\\.)*)"\s*$/)
      if (m) {
        s = s.slice(0, s.length - m[0].length)
        continue
      }
      m = t.match(/[[{]\s*"((?:[^"\\]|\\.)*)"\s*$/)
      if (m) {
        s = s.slice(0, s.length - m[0].length + 1)
        break
      }
      s = s.slice(0, -1) // 孤引号保底
      continue
    }

    // 末尾冒号（值未开始）→ 裁掉整个键值对（保留开括号）
    if (last === ':') {
      const t = s.slice(-512)
      let m = t.match(/,\s*"((?:[^"\\]|\\.)*)"\s*:\s*$/)
      if (m) {
        s = s.slice(0, s.length - m[0].length)
        continue
      }
      m = t.match(/[[{]\s*"((?:[^"\\]|\\.)*)"\s*:\s*$/)
      if (m) {
        s = s.slice(0, s.length - m[0].length + 1)
        break
      }
      s = s.slice(0, -1) // 裸冒号保底
      continue
    }

    // 截断数字尾巴（12. / 12e / 12e+ / 12.5e+）→ 转为 null
    if (/[0-9.eE+]/.test(last)) {
      const t = s.slice(-32)
      let m = t.match(/(\d+(?:\.\d+)?)[eE][+-]?$/)
      if (m) {
        s = s.slice(0, s.length - m[0].length) + 'null'
        break
      }
      m = t.match(/(\d+)\.$/)
      if (m) {
        s = s.slice(0, s.length - m[0].length) + 'null'
        break
      }
      break // 完整数字
    }

    // 残缺字面量（tru/fals/nul，末字符 u/s/l）→ 裁掉字面量本身
    if (last === 'u' || last === 's' || last === 'l') {
      const m = s.slice(-8).match(/(tru|fals|nul)$/)
      if (m) {
        s = s.slice(0, s.length - m[0].length)
        continue
      }
      break
    }

    // 末尾连续 ≥2 个开括号（[[[ 型嵌套中间态）→ 只保留最外层一个
    if (last === '{' || last === '[') {
      const m = s.slice(-64).match(/([{[])([{[]\s*)+$/)
      if (m) {
        s = s.slice(0, s.length - m[0].length) + m[1]
        // 栈增量维护：m[0] 是连续开括号整体，保留 1 个、弹出其余
        let inner = m[0].length - 1
        while (inner-- > 0) stack.pop()
        continue
      }
      break // 单开括号：内容为空，交给补齐阶段
    }

    break // 完整值结尾，安全
  }

  return finalize(s, stack)
}
