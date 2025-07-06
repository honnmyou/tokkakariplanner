import { cleanupCompletedTask } from "./storage-manager"

export interface TaskProgress {
  completed: boolean[]
  currentIndex: number
  timestamp: number
  generatedTasks: string[]
}

export function getTaskProgress(taskId: string): TaskProgress | null {
  try {
    const savedProgress = localStorage.getItem(`task-progress-${taskId}`)
    if (savedProgress) {
      const progress = JSON.parse(savedProgress)
      console.log(`📊 Loaded progress for task ${taskId}:`, progress)
      return progress
    }
  } catch (error) {
    console.error("Failed to load progress:", error)
  }
  return null
}

export function saveTaskProgress(taskId: string, progress: TaskProgress): void {
  try {
    localStorage.setItem(`task-progress-${taskId}`, JSON.stringify(progress))
    console.log(`💾 Saved progress for task ${taskId}:`, progress)
  } catch (error) {
    console.error("Failed to save progress:", error)

    // 容量不足の場合は緊急クリーンアップを試行
    if (error instanceof Error && error.name === "QuotaExceededError") {
      console.log("🚨 Storage quota exceeded while saving progress, performing cleanup...")
      const { emergencyCleanup } = require("./storage-manager")
      emergencyCleanup()

      // 再度保存を試行
      try {
        localStorage.setItem(`task-progress-${taskId}`, JSON.stringify(progress))
        console.log("✅ Successfully saved progress after cleanup")
      } catch (retryError) {
        console.error("❌ Failed to save progress even after cleanup:", retryError)
      }
    }
  }
}

export function calculateProgressPercentage(taskId: string): number {
  const progress = getTaskProgress(taskId)
  if (!progress || !progress.generatedTasks.length) {
    return 0
  }

  const completedCount = progress.completed.filter(Boolean).length
  return Math.round((completedCount / progress.generatedTasks.length) * 100)
}

export function isTaskInProgress(taskId: string): boolean {
  const progress = getTaskProgress(taskId)
  if (!progress) return false

  const completedCount = progress.completed.filter(Boolean).length
  return completedCount > 0 && completedCount < progress.generatedTasks.length
}

export function isTaskBreakdown(taskId: string): boolean {
  return getTaskProgress(taskId) !== null
}

export function isTaskCompleted(taskId: string): boolean {
  const progress = getTaskProgress(taskId)
  if (!progress) return false

  const completedCount = progress.completed.filter(Boolean).length
  return completedCount === progress.generatedTasks.length
}

// タスク完了時の進捗データ削除
export function deleteTaskProgress(taskId: string): void {
  try {
    localStorage.removeItem(`task-progress-${taskId}`)
    console.log(`🗑️ Deleted progress data for task: ${taskId}`)
  } catch (error) {
    console.error(`❌ Failed to delete progress for task ${taskId}:`, error)
  }
}

// 完了したタスクの進捗データを自動削除
export function cleanupCompletedTaskProgress(taskId: string): void {
  const progress = getTaskProgress(taskId)
  if (progress && isTaskCompleted(taskId)) {
    console.log(`🎉 Task ${taskId} is completed, cleaning up progress data...`)
    deleteTaskProgress(taskId)
    cleanupCompletedTask(taskId)
  }
}
