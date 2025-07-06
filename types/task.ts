export interface Task {
  id: string
  title: string
  completed: boolean
  dueDate?: Date
  category: "immediate" | "later"
  createdAt: Date
  isBreakdown?: boolean // 分解済みかどうか
  generatedTasks?: string[] // 分解されたタスクリスト
}

export interface CompletedTask extends Task {
  completedAt: Date
  autoDeleteTimer?: NodeJS.Timeout
}
