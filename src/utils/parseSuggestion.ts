import type { MessageSegment, SuggestionItem } from '@/types/ai'

/**
 * 从 AI 回复的 Markdown 文本中解析 suggestion 代码块
 * 将文本分割为普通 Markdown 片段和 suggestion 卡片片段
 *
 * 每个 suggestion 代码块包含一条建议（JSON 对象）：
 * ```suggestion
 * { "module": "...", "field": "...", "original": "...", "rewritten": "...", "reason": "..." }
 * ```
 */
export function parseMessageSegments(content: string): MessageSegment[] {
  if (!content) return []

  const segments: MessageSegment[] = []
  const suggestionRegex = /```suggestion\s*\n([\s\S]*?)\n```/g

  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = suggestionRegex.exec(content)) !== null) {
    const matchStart = match.index
    const matchEnd = suggestionRegex.lastIndex
    const jsonContent = match[1].trim()

    if (matchStart > lastIndex) {
      const textBefore = content.slice(lastIndex, matchStart).trimEnd()
      if (textBefore) {
        segments.push({ type: 'markdown', content: textBefore })
      }
    }

    const item = parseSuggestionJson(jsonContent)
    if (item) {
      segments.push({ type: 'suggestion', item })
    } else {
      segments.push({ type: 'markdown', content: match[0] })
    }

    lastIndex = matchEnd
  }

  if (lastIndex < content.length) {
    const textAfter = content.slice(lastIndex).trimEnd()
    if (textAfter) {
      segments.push({ type: 'markdown', content: textAfter })
    }
  }

  return segments
}

/**
 * 解析单条 suggestion JSON 字符串为 SuggestionItem
 * 容错处理：去除可能的 markdown 包裹、修复常见 JSON 格式问题
 */
function parseSuggestionJson(jsonContent: string): SuggestionItem | null {
  if (!jsonContent) return null

  // 去除可能的 markdown 代码块包裹（如 AI 嵌套输出）
  let clean = jsonContent.trim()
  if (clean.startsWith('```') && clean.endsWith('```')) {
    clean = clean.slice(3, -3).trim()
  }

  // 尝试直接解析 JSON 对象
  try {
    const parsed = JSON.parse(clean)
    if (isValidSuggestionItem(parsed)) {
      return parsed
    }
  } catch {
    // 解析失败，尝试修复常见格式问题
  }

  // 尝试提取 JSON 对象（有时 AI 会在对象前后加文字说明）
  const objectMatch = clean.match(/(\{[\s\S]*\})/)
  if (objectMatch) {
    try {
      const parsed = JSON.parse(objectMatch[1])
      if (isValidSuggestionItem(parsed)) {
        return parsed
      }
    } catch {
      // ignore
    }
  }

  return null
}

/**
 * 校验是否为有效的 SuggestionItem
 */
function isValidSuggestionItem(item: unknown): item is SuggestionItem {
  if (!item || typeof item !== 'object') return false
  const i = item as Record<string, unknown>
  return (
    typeof i.module === 'string' &&
    typeof i.field === 'string' &&
    typeof i.original === 'string' &&
    typeof i.rewritten === 'string' &&
    typeof i.reason === 'string'
  )
}
