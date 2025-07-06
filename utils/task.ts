export interface Task {
  id: string
  title: string
  completed: boolean
  dueDate?: Date
  category: "immediate" | "later"
  createdAt: Date
}
