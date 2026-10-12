/**
 * 单个日期的解析结果
 */
export interface DateInfo {
  year: number | null
  month: number | null
  isValid: boolean
  /** 是否为"至今"等当前时间标记 */
  isPresent?: boolean
  reason?: string
}

/**
 * 日期区间的解析结果
 */
export interface DateRangeResult {
  start: DateInfo
  end: DateInfo
}

/**
 * 全角字符转半角
 * @param str 可能包含全角字符的字符串
 * @returns 转换后的半角字符串
 */
function fullWidthToHalf(str: string): string {
  return str.replace(/[\uFF01-\uFF5E]/g, char =>
    String.fromCharCode(char.charCodeAt(0) - 0xfee0),
  )
}

/**
 * 中文数字转阿拉伯数字（支持 零~十二）
 * @param cn 中文数字字符串
 * @returns 阿拉伯数字，无法识别返回 NaN
 */
function chineseNumberToInt(cn: string): number {
  const map: Record<string, number> = {
    零: 0,
    一: 1,
    二: 2,
    两: 2,
    三: 3,
    四: 4,
    五: 5,
    六: 6,
    七: 7,
    八: 8,
    九: 9,
    十: 10,
    十一: 11,
    十二: 12,
  }
  if (map[cn] !== undefined) return map[cn]
  return NaN
}

/**
 * 将字符串中 "年X月" 格式的中文数字月份替换为阿拉伯数字
 * 例如 "2023年一月" → "2023年1月"，"2023年十月" → "2023年10月"
 * @param str 输入字符串
 * @returns 替换后的字符串
 */
function replaceChineseMonth(str: string): string {
  return str.replace(
    /年(十[一二两三四五六七八九]|十|[一二三四五六七八九两])月/g,
    (match, cnMonth) => {
      const num = chineseNumberToInt(cnMonth)
      if (!isNaN(num)) return `年${num}月`
      return match
    },
  )
}

/**
 * 判断分隔符：将明显的区间分隔符统一为 ~
 * @param str 预处理后的输入字符串
 * @returns 分隔符统一后的字符串
 */
function normalizeSeparators(str: string): string {
  return (
    str
      // 1. 至今标记 → 占位符
      .replace(/至今|现在|present|now/gi, '__PRESENT__')
      // 2. 至今标记前的短横线/斜杠/空格 → 区间分隔符
      .replace(/\s*[-／]\s*__PRESENT__/g, '~__PRESENT__')
      .replace(/\s+__PRESENT__/g, '~__PRESENT__')
      // 3. 明显的区间词和长横线 → ~
      .replace(/至|到|—|–|～/g, '~')
      // 4. 全角斜杠 → 半角斜杠
      .replace(/／/g, '/')
      // 5. 全角点 → 半角点
      .replace(/．/g, '.')
      // 6. 当 "-" 前后都是 4 位年份时，视为区间分隔符 → ~
      //    例："2023-2024" 中的 "-"，但 "2023-01" 中的 "-" 不动
      .replace(/(\d{4})\s*-\s*(\d{4})/g, '$1~$2')
      // 7. 当 "-" 前面是"完整日期"且后面是另一个年份时，视为区间分隔符 → ~
      //    例："2023年1月-2024/03"、"2023.01 - 2023.06"
      .replace(/(年\d+月|\d{4}[./-]\d{1,2})\s*[-/]\s*(\d{4})/g, '$1~$2')
      // 8. 清理空白
      .replace(/\s+/g, '')
  )
}

/**
 * 预处理日期字符串，为解析做准备
 * @param str 原始日期字符串
 * @returns 预处理结果
 */
function preprocess(str: string): {
  cleaned: string
  hasPresent: boolean
} {
  // 1. 全角转半角
  let s = fullWidthToHalf(str.trim())
  // 2. 中文数字月份替换
  s = replaceChineseMonth(s)
  // 3. 检测至今标记
  const hasPresent = /至今|现在|present|now/i.test(s)
  // 4. 归一化分隔符
  s = normalizeSeparators(s)
  return { cleaned: s, hasPresent }
}

/**
 * 解析单个日期部分
 * @param part 日期部分字符串（不含区间分隔符）
 * @returns 解析后的 DateInfo
 */
function parseSingleDate(part: string): DateInfo {
  if (!part) {
    return { year: null, month: null, isValid: false, reason: '空字符串' }
  }

  // 至今标记
  if (part.includes('__PRESENT__')) {
    return { year: null, month: null, isValid: true, isPresent: true }
  }

  // 尝试提取年份和月份
  const yearMonthRegex = /(\d{4})\s*[-./年]?\s*(?:(\d{1,2})月?)?/
  const match = part.match(yearMonthRegex)

  if (!match) {
    return {
      year: null,
      month: null,
      isValid: false,
      reason: `无法解析: "${part}"`,
    }
  }

  const year = parseInt(match[1], 10)
  const monthStr = match[2]

  // 年份有效性校验（合理范围 1900-2100）
  if (year < 1900 || year > 2100) {
    return {
      year: null,
      month: null,
      isValid: false,
      reason: `年份超出有效范围: ${year}`,
    }
  }

  // 只有年份 → month 默认 1
  if (!monthStr) {
    return { year, month: 1, isValid: true }
  }

  const month = parseInt(monthStr, 10)
  if (month < 1 || month > 12) {
    return {
      year,
      month: null,
      isValid: false,
      reason: `月份超出范围: ${month}`,
    }
  }

  return { year, month, isValid: true }
}

/**
 * 解析简历中的日期区间字符串为结构化数据
 * @param date 日期区间字符串
 * @returns 结构化的 { start, end } 解析结果；永远不抛异常
 */
export function parseDateRange(date: string): DateRangeResult {
  if (!date || !date.trim()) {
    const invalid: DateInfo = {
      year: null,
      month: null,
      isValid: false,
      reason: '输入为空',
    }
    return { start: invalid, end: { ...invalid } }
  }

  // 预处理
  const { cleaned, hasPresent } = preprocess(date)

  // 按 ~ 分割为 start 和 end 两部分
  const parts = cleaned.split('~').filter(p => p.length > 0)

  if (parts.length === 0) {
    const invalid: DateInfo = {
      year: null,
      month: null,
      isValid: false,
      reason: '无法解析',
    }
    return { start: invalid, end: { ...invalid } }
  }

  // 解析开始日期
  const start = parseSingleDate(parts[0])

  // 只有一个部分且没有至今标记 → 单个日期
  if (parts.length === 1 && !hasPresent) {
    return {
      start,
      end: {
        year: null,
        month: null,
        isValid: false,
        reason: '无结束日期',
      },
    }
  }

  // 正常的两部分区间
  if (parts.length >= 2) {
    const end = parseSingleDate(parts[1])
    return { start, end }
  }

  // 只有一个部分但有至今标记
  return {
    start,
    end: { year: null, month: null, isValid: true, isPresent: true },
  }
}
