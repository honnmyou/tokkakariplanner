import type { Task } from "./task" // Assuming Task is declared in a task.ts file

export function formatDueDate(date: Date): string {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
  const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  if (taskDate.getTime() === today.getTime()) {
    return "今日"
  } else if (taskDate.getTime() === tomorrow.getTime()) {
    return "明日"
  } else {
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }
}

export function getDaysUntilDue(date: Date): number {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  const diffTime = taskDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays
}

export function formatDaysUntilDue(date: Date): string {
  const daysUntil = getDaysUntilDue(date)

  if (daysUntil < 0) {
    const overdueDays = Math.abs(daysUntil)
    return `${overdueDays}日遅れ`
  } else if (daysUntil === 0) {
    return "今日まで"
  } else if (daysUntil === 1) {
    return "明日まで"
  } else {
    return `後${daysUntil}日`
  }
}

export function getDueDateUrgency(date: Date): {
  level: "overdue" | "today" | "tomorrow" | "soon" | "normal" | "distant"
  className: string
  bgClassName: string
  showAlert: boolean
  shouldBlink: boolean
} {
  const daysUntil = getDaysUntilDue(date)

  if (daysUntil < 0) {
    // 緊急アラート：期限切れ - 赤背景・警告アイコン・点滅あり
    return {
      level: "overdue",
      className: "text-white border-transparent",
      bgClassName: "bg-red-600",
      showAlert: true,
      shouldBlink: true,
    }
  } else if (daysUntil === 0) {
    // 緊急アラート：今日まで - 赤背景・警告アイコン・点滅あり
    return {
      level: "today",
      className: "text-white border-transparent",
      bgClassName: "bg-red-600",
      showAlert: true,
      shouldBlink: true,
    }
  } else if (daysUntil === 1) {
    // 注意アラート：明日まで - オレンジ背景・警告アイコン・点滅なし
    return {
      level: "tomorrow",
      className: "text-white border-transparent",
      bgClassName: "bg-orange-500",
      showAlert: true,
      shouldBlink: false,
    }
  } else if (daysUntil <= 3) {
    // 通常表示：2〜3日後 - 黄色背景
    return {
      level: "soon",
      className: "text-gray-800 border-yellow-300",
      bgClassName: "bg-yellow-200",
      showAlert: false,
      shouldBlink: false,
    }
  } else if (daysUntil <= 7) {
    // 通常表示：4〜7日後 - 明るいグレー背景
    return {
      level: "normal",
      className: "text-gray-700 border-gray-300",
      bgClassName: "bg-gray-200",
      showAlert: false,
      shouldBlink: false,
    }
  } else {
    // 通常表示：1週間以上 - 薄いグレー背景
    return {
      level: "distant",
      className: "text-gray-600 border-gray-300",
      bgClassName: "bg-gray-100",
      showAlert: false,
      shouldBlink: false,
    }
  }
}

export function getNextSunday(): Date {
  const now = new Date()
  const daysUntilSunday = 7 - now.getDay()
  const nextSunday = new Date(now.getTime() + daysUntilSunday * 24 * 60 * 60 * 1000)
  nextSunday.setHours(23, 59, 0, 0)
  return nextSunday
}

export function getTodayEnd(): Date {
  const today = new Date()
  today.setHours(23, 59, 0, 0)
  return today
}

export function getTomorrowEnd(): Date {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(23, 59, 0, 0)
  return tomorrow
}

export function sortTasksByDueDate(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return 0
    if (!a.dueDate) return 1
    if (!b.dueDate) return -1
    return a.dueDate.getTime() - b.dueDate.getTime()
  })
}
