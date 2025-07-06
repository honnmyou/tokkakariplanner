// LocalStorage管理のユーティリティ

export interface StorageData {
  tasks: any[]
  progressData: Record<string, any>
  breakdownTexts: Record<string, string>
  lastCleanup: number
}

export interface TrashItem {
  id: string
  title: string
  deletedAt: Date
  category: "immediate" | "later"
}

// LocalStorageのキー定義
export const STORAGE_KEYS = {
  TASKS: "tokkakari-tasks",
  TASK_PROGRESS_PREFIX: "task-progress-",
  TASK_BREAKDOWN_TEXT_PREFIX: "task-breakdown-text-",
  LAST_CLEANUP: "tokkakari-last-cleanup",
  TUTORIAL_COMPLETED: "tokkakari-tutorial-completed",
  TRASH: "tokkakari-trash",
} as const

// ゴミ箱にアイテムを追加
export function addToTrash(item: TrashItem): void {
  try {
    console.log(`🗑️ Adding to trash: ${item.title}`)

    const existingTrash = getTrashItems()
    const newTrash = [item, ...existingTrash]

    // 最大50件まで保持（古いものから削除）
    const limitedTrash = newTrash.slice(0, 50)

    localStorage.setItem(STORAGE_KEYS.TRASH, JSON.stringify(limitedTrash))
    console.log(`✅ Added to trash successfully. Total items: ${limitedTrash.length}`)
  } catch (error) {
    console.error(`❌ Failed to add to trash:`, error)
  }
}

// ゴミ箱のアイテムを取得
export function getTrashItems(): TrashItem[] {
  try {
    const trashData = localStorage.getItem(STORAGE_KEYS.TRASH)
    if (!trashData) return []

    const items = JSON.parse(trashData)
    // 日付を復元
    return items.map((item: any) => ({
      ...item,
      deletedAt: new Date(item.deletedAt),
    }))
  } catch (error) {
    console.error("❌ Failed to get trash items:", error)
    return []
  }
}

// ゴミ箱を空にする
export function emptyTrash(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.TRASH)
    console.log("🗑️ Trash emptied successfully")
  } catch (error) {
    console.error("❌ Failed to empty trash:", error)
  }
}

// 古いゴミ箱アイテムを自動削除（30日以上経過）
export function cleanupOldTrashItems(): void {
  try {
    const items = getTrashItems()
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const filteredItems = items.filter((item) => item.deletedAt > thirtyDaysAgo)

    if (filteredItems.length !== items.length) {
      localStorage.setItem(STORAGE_KEYS.TRASH, JSON.stringify(filteredItems))
      console.log(`🧹 Cleaned up ${items.length - filteredItems.length} old trash items`)
    }
  } catch (error) {
    console.error("❌ Failed to cleanup old trash items:", error)
  }
}

// 完了したタスクとその関連データを削除
export function cleanupCompletedTask(taskId: string): void {
  try {
    console.log(`🗑️ Cleaning up completed task: ${taskId}`)

    // 進捗データを削除
    const progressKey = `${STORAGE_KEYS.TASK_PROGRESS_PREFIX}${taskId}`
    localStorage.removeItem(progressKey)
    console.log(`Removed progress data: ${progressKey}`)

    // 分解テキストデータを削除
    const breakdownTextKey = `${STORAGE_KEYS.TASK_BREAKDOWN_TEXT_PREFIX}${taskId}`
    localStorage.removeItem(breakdownTextKey)
    console.log(`Removed breakdown text: ${breakdownTextKey}`)

    console.log(`✅ Successfully cleaned up task: ${taskId}`)
  } catch (error) {
    console.error(`❌ Failed to cleanup task ${taskId}:`, error)
  }
}

// 古いデータを定期的にクリーンアップ
export function performPeriodicCleanup(): void {
  try {
    const now = Date.now()
    const lastCleanup = localStorage.getItem(STORAGE_KEYS.LAST_CLEANUP)
    const lastCleanupTime = lastCleanup ? Number.parseInt(lastCleanup) : 0

    // 24時間に1回クリーンアップを実行
    const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000 // 24時間

    if (now - lastCleanupTime > CLEANUP_INTERVAL) {
      console.log("🧹 Performing periodic cleanup...")

      // 古いゴミ箱アイテムをクリーンアップ
      cleanupOldTrashItems()

      // 現在のタスクリストを取得
      const tasksData = localStorage.getItem(STORAGE_KEYS.TASKS)
      const currentTasks = tasksData ? JSON.parse(tasksData) : []
      const currentTaskIds = new Set(currentTasks.map((task: any) => task.id))

      // LocalStorageの全キーをチェック
      const keysToRemove: string[] = []

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (!key) continue

        // 進捗データのクリーンアップ
        if (key.startsWith(STORAGE_KEYS.TASK_PROGRESS_PREFIX)) {
          const taskId = key.replace(STORAGE_KEYS.TASK_PROGRESS_PREFIX, "")
          if (!currentTaskIds.has(taskId)) {
            keysToRemove.push(key)
          }
        }

        // 分解テキストデータのクリーンアップ
        if (key.startsWith(STORAGE_KEYS.TASK_BREAKDOWN_TEXT_PREFIX)) {
          const taskId = key.replace(STORAGE_KEYS.TASK_BREAKDOWN_TEXT_PREFIX, "")
          if (!currentTaskIds.has(taskId)) {
            keysToRemove.push(key)
          }
        }
      }

      // 不要なキーを削除
      keysToRemove.forEach((key) => {
        localStorage.removeItem(key)
        console.log(`Removed orphaned data: ${key}`)
      })

      // 最後のクリーンアップ時刻を更新
      localStorage.setItem(STORAGE_KEYS.LAST_CLEANUP, now.toString())

      console.log(`✅ Periodic cleanup completed. Removed ${keysToRemove.length} orphaned entries.`)
    }
  } catch (error) {
    console.error("❌ Failed to perform periodic cleanup:", error)
  }
}

// LocalStorageの使用量を取得（概算）
export function getStorageUsage(): { used: number; total: number; percentage: number } {
  try {
    let used = 0
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        const value = localStorage.getItem(key)
        if (value) {
          used += key.length + value.length
        }
      }
    }

    // LocalStorageの制限は通常5-10MB（ブラウザによって異なる）
    const total = 5 * 1024 * 1024 // 5MBと仮定
    const percentage = Math.round((used / total) * 100)

    return { used, total, percentage }
  } catch (error) {
    console.error("Failed to calculate storage usage:", error)
    return { used: 0, total: 0, percentage: 0 }
  }
}

// 緊急時のストレージクリーンアップ
export function emergencyCleanup(): void {
  try {
    console.log("🚨 Performing emergency cleanup...")

    // 古いゴミ箱アイテムを全削除
    emptyTrash()

    // 完了から1週間以上経過したタスクの関連データを削除
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000

    const keysToRemove: string[] = []

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key) continue

      // 進捗データをチェック
      if (key.startsWith(STORAGE_KEYS.TASK_PROGRESS_PREFIX)) {
        try {
          const value = localStorage.getItem(key)
          if (value) {
            const progressData = JSON.parse(value)
            if (progressData.timestamp && progressData.timestamp < oneWeekAgo) {
              keysToRemove.push(key)
            }
          }
        } catch (e) {
          // パースできない古いデータは削除
          keysToRemove.push(key)
        }
      }

      // 分解テキストデータは古いものを削除
      if (key.startsWith(STORAGE_KEYS.TASK_BREAKDOWN_TEXT_PREFIX)) {
        keysToRemove.push(key)
      }
    }

    // 削除実行
    keysToRemove.forEach((key) => {
      localStorage.removeItem(key)
    })

    console.log(`🗑️ Emergency cleanup completed. Removed ${keysToRemove.length} old entries.`)
  } catch (error) {
    console.error("❌ Emergency cleanup failed:", error)
  }
}

// ストレージの健全性をチェック
export function checkStorageHealth(): boolean {
  try {
    const usage = getStorageUsage()
    console.log(
      `📊 Storage usage: ${usage.percentage}% (${Math.round(usage.used / 1024)}KB / ${Math.round(usage.total / 1024)}KB)`,
    )

    // 80%を超えたら警告
    if (usage.percentage > 80) {
      console.warn("⚠️ Storage usage is high, consider cleanup")
      emergencyCleanup()
      return false
    }

    return true
  } catch (error) {
    console.error("Failed to check storage health:", error)
    return false
  }
}

// データのバックアップ作成
export function createBackup(): string | null {
  try {
    const backup = {
      timestamp: Date.now(),
      tasks: localStorage.getItem(STORAGE_KEYS.TASKS),
      tutorialCompleted: localStorage.getItem(STORAGE_KEYS.TUTORIAL_COMPLETED),
      trash: localStorage.getItem(STORAGE_KEYS.TRASH),
    }

    return JSON.stringify(backup)
  } catch (error) {
    console.error("Failed to create backup:", error)
    return null
  }
}

// バックアップからの復元
export function restoreFromBackup(backupData: string): boolean {
  try {
    const backup = JSON.parse(backupData)

    if (backup.tasks) {
      localStorage.setItem(STORAGE_KEYS.TASKS, backup.tasks)
    }

    if (backup.tutorialCompleted) {
      localStorage.setItem(STORAGE_KEYS.TUTORIAL_COMPLETED, backup.tutorialCompleted)
    }

    if (backup.trash) {
      localStorage.setItem(STORAGE_KEYS.TRASH, backup.trash)
    }

    console.log("✅ Successfully restored from backup")
    return true
  } catch (error) {
    console.error("❌ Failed to restore from backup:", error)
    return false
  }
}
