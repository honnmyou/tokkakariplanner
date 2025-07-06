"use client"

import { useState, useEffect, useRef } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TaskForm } from "@/components/task-form"
import { TaskItem } from "@/components/task-item"
import { UndoToast } from "@/components/undo-toast"
import { TrashModal } from "@/components/trash-modal"
import { InteractiveTutorial } from "@/components/interactive-tutorial"
import type { Task, CompletedTask } from "@/types/task"
import { sortTasksByDueDate } from "@/utils/date-utils"

// Import the TaskBreakdown component
import { TaskBreakdown } from "@/components/task-breakdown"
import { TaskExecution } from "@/components/task-execution"
import { getTaskProgress } from "@/utils/progress-utils"

// Import the StatusBar component
import { StatusBar } from "@/components/status-bar"

// Import storage management utilities
import {
  cleanupCompletedTask,
  performPeriodicCleanup,
  checkStorageHealth,
  STORAGE_KEYS,
  addToTrash,
} from "@/utils/storage-manager"

export default function TokkakariPlanner() {
  const [activeTab, setActiveTab] = useState<"immediate" | "later">("immediate")
  const [tasks, setTasks] = useState<Task[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isTrashOpen, setIsTrashOpen] = useState(false)
  const [completedTask, setCompletedTask] = useState<CompletedTask | null>(null)
  const [showTutorial, setShowTutorial] = useState(false)
  const [tutorialStep, setTutorialStep] = useState("welcome")
  const scrollRef = useRef<HTMLDivElement>(null)

  // Add state for breakdown mode
  const [breakdownTask, setBreakdownTask] = useState<Task | null>(null)

  // Add state for execution mode
  const [executionTask, setExecutionTask] = useState<Task | null>(null)

  // Check if tutorial should be shown on first load - 必ず表示するように修正
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem(STORAGE_KEYS.TUTORIAL_COMPLETED)
    console.log("Tutorial completion status:", hasSeenTutorial)

    // 初回起動時は必ずチュートリアルを表示
    if (!hasSeenTutorial) {
      console.log("First time user - showing tutorial")
      setShowTutorial(true)
    } else {
      console.log("Returning user - tutorial already completed")
      // 既存ユーザーでも手動でチュートリアルを開始できる
    }
  }, [])

  // チュートリアル開始時にサンプルタスクを追加
  useEffect(() => {
    if (showTutorial && tutorialStep === "welcome") {
      // サンプルタスクを追加
      const sampleTask: Task = {
        id: "tutorial-sample-task",
        title: "授業アンケートを提出する",
        completed: false,
        category: "immediate",
        createdAt: new Date(),
      }

      // 既存のタスクにサンプルタスクがない場合のみ追加
      setTasks((prev) => {
        const hasSampleTask = prev.some((task) => task.id === "tutorial-sample-task")
        if (!hasSampleTask) {
          return [sampleTask, ...prev]
        }
        return prev
      })
    }
  }, [showTutorial, tutorialStep])

  // Load tasks from localStorage on mount and perform cleanup
  useEffect(() => {
    try {
      // ストレージの健全性をチェック
      checkStorageHealth()

      // 定期クリーンアップを実行
      performPeriodicCleanup()

      // タスクデータを読み込み
      const savedTasks = localStorage.getItem(STORAGE_KEYS.TASKS)
      if (savedTasks) {
        const parsedTasks = JSON.parse(savedTasks).map((task: any) => ({
          ...task,
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
          createdAt: new Date(task.createdAt),
        }))
        setTasks(parsedTasks)
        console.log(`📋 Loaded ${parsedTasks.length} tasks from localStorage`)
      }
    } catch (error) {
      console.error("❌ Failed to load tasks from localStorage:", error)
      // エラーが発生した場合は空の配列で初期化
      setTasks([])
    }
  }, [])

  // Save tasks to localStorage whenever tasks change (チュートリアル中は保存しない)
  useEffect(() => {
    // チュートリアル中はサンプルタスクを保存しない
    if (showTutorial) return

    try {
      // チュートリアル用のサンプルタスクを除外して保存
      const tasksToSave = tasks.filter((task) => task.id !== "tutorial-sample-task")
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasksToSave))
      console.log(`💾 Saved ${tasksToSave.length} tasks to localStorage`)

      // ストレージ使用量をチェック
      checkStorageHealth()
    } catch (error) {
      console.error("❌ Failed to save tasks to localStorage:", error)

      // 容量不足の場合は緊急クリーンアップを試行
      if (error instanceof Error && error.name === "QuotaExceededError") {
        console.log("🚨 Storage quota exceeded, performing cleanup...")
        const { emergencyCleanup } = require("@/utils/storage-manager")
        emergencyCleanup()

        // 再度保存を試行
        try {
          const tasksToSave = tasks.filter((task) => task.id !== "tutorial-sample-task")
          localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasksToSave))
          console.log("✅ Successfully saved after cleanup")
        } catch (retryError) {
          console.error("❌ Failed to save even after cleanup:", retryError)
        }
      }
    }
  }, [tasks, showTutorial])

  // Reset scroll position when switching tabs
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0
    }
  }, [activeTab])

  // Monitor tab switching for tutorial - waitForActionのみ
  useEffect(() => {
    if (showTutorial && tutorialStep === "tabs-explanation" && activeTab === "later") {
      setTimeout(() => handleTutorialStepComplete("tabs-explanation"), 500)
    }

    // 「まず最初にやる事」タブへの切り替えを監視
    if (showTutorial && tutorialStep === "tab-switch-back" && activeTab === "immediate") {
      setTimeout(() => handleTutorialStepComplete("tab-switch-back"), 500)
    }
  }, [activeTab, tutorialStep, showTutorial])

  // Tutorial step progression - task-completed-celebrationを削除
  const handleTutorialStepComplete = (step: string) => {
    console.log("Main page: Tutorial step completed:", step)

    const stepOrder = [
      "welcome",
      "tabs-explanation",
      "tab-switch",
      "tab-switch-back",
      "simple-task-explanation", // 新しいステップを追加
      "simple-task-completion",
      "undo-explanation",
      "add-task-button",
      "task-form-explanation",
      "task-breakdown",
      "breakdown-screen",
      "voice-input",
      "voice-input-demo",
      "breakdown-submit",
      "breakdown-results",
      "start-execution",
      "execution-overview",
      "current-task-explanation",
      "complete-first-task",
      "interrupt-explanation",
      "tutorial-skip-notice",
      "complete",
    ]

    const currentIndex = stepOrder.indexOf(step)
    console.log("Main page: Current step index:", currentIndex)

    if (currentIndex < stepOrder.length - 1) {
      const nextStep = stepOrder[currentIndex + 1]
      console.log("Main page: Moving to next step:", nextStep)
      setTutorialStep(nextStep)
    } else {
      handleTutorialComplete()
    }
  }

  // Monitor form open for tutorial - waitForActionのみ
  useEffect(() => {
    if (showTutorial && tutorialStep === "add-task-button" && isFormOpen) {
      setTimeout(() => handleTutorialStepComplete("add-task-button"), 500)
    }
  }, [isFormOpen, tutorialStep, showTutorial])

  // Monitor task addition for tutorial - waitForActionのみ
  useEffect(() => {
    if (showTutorial && tutorialStep === "task-form-explanation") {
      // サンプルタスク以外のタスクが追加され��かチェック
      const userTasks = tasks.filter((task) => task.id !== "tutorial-sample-task")
      if (userTasks.length > 0) {
        setTimeout(() => handleTutorialStepComplete("task-form-explanation"), 1000)
      }
    }
  }, [tasks, tutorialStep, showTutorial])

  // Monitor simple task completion for tutorial - waitForActionのみ
  useEffect(() => {
    if (showTutorial && tutorialStep === "simple-task-completion" && completedTask?.id === "tutorial-sample-task") {
      setTimeout(() => handleTutorialStepComplete("simple-task-completion"), 1000)
    }
  }, [completedTask, tutorialStep, showTutorial])

  // Monitor breakdown screen for tutorial - waitForActionのみ
  useEffect(() => {
    if (showTutorial && tutorialStep === "task-breakdown" && breakdownTask) {
      setTimeout(() => handleTutorialStepComplete("task-breakdown"), 500)
    }
  }, [breakdownTask, tutorialStep, showTutorial])

  // Monitor execution screen for tutorial - waitForActionのみ
  useEffect(() => {
    if (showTutorial && tutorialStep === "start-execution" && executionTask) {
      setTimeout(() => handleTutorialStepComplete("start-execution"), 500)
    }
  }, [executionTask, tutorialStep, showTutorial])

  const handleAddTask = (title: string, dueDate?: Date, category?: "immediate" | "later") => {
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      completed: false,
      dueDate,
      category: category || activeTab,
      createdAt: new Date(),
    }
    setTasks((prev) => [...prev, newTask])
  }

  const handleToggleComplete = (id: string) => {
    const task = tasks.find((t) => t.id === id)
    if (!task) return

    if (!task.completed) {
      // Mark as completed and set up auto-delete
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: true } : t)))

      const completedTaskData: CompletedTask = {
        ...task,
        completed: true,
        completedAt: new Date(),
      }

      // Set up auto-delete after 5 seconds (changed from 3 seconds)
      const timer = setTimeout(() => {
        // タスクをリストから削除
        setTasks((prev) => prev.filter((t) => t.id !== id))

        // ゴミ箱に追加（サンプルタスクは除く）
        if (id !== "tutorial-sample-task") {
          addToTrash({
            id: task.id,
            title: task.title,
            deletedAt: new Date(),
            category: task.category,
          })
        }

        // 関連するlocalStorageデータも削除（サンプルタスクは除く）
        if (id !== "tutorial-sample-task") {
          cleanupCompletedTask(id)
        }

        setCompletedTask(null)

        console.log(`🗑️ Auto-deleted completed task: ${task.title}`)
      }, 5000) // Changed from 3000 to 5000

      completedTaskData.autoDeleteTimer = timer
      setCompletedTask(completedTaskData)

      // Tutorial: task completion - waitForActionのみ
      if (showTutorial && tutorialStep === "complete-first-task") {
        setTimeout(() => handleTutorialStepComplete("complete-first-task"), 1000)
      }
    } else {
      // Mark as incomplete
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: false } : t)))

      // Clear any pending deletion
      if (completedTask?.id === id && completedTask.autoDeleteTimer) {
        clearTimeout(completedTask.autoDeleteTimer)
        setCompletedTask(null)
      }
    }
  }

  const handleEditTask = (id: string, title: string, dueDate?: Date) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, title, dueDate } : t)))
  }

  const handleDeleteTask = (id: string) => {
    const task = tasks.find((t) => t.id === id)
    if (!task) return

    // タスクをリストから削除
    setTasks((prev) => prev.filter((t) => t.id !== id))

    // ゴミ箱に追加（サンプルタスクは除く）
    if (id !== "tutorial-sample-task") {
      addToTrash({
        id: task.id,
        title: task.title,
        deletedAt: new Date(),
        category: task.category,
      })
    }

    // 関連するlocalStorageデータも削除（サンプルタスクは除く）
    if (id !== "tutorial-sample-task") {
      cleanupCompletedTask(id)
    }

    console.log(`🗑️ Manually deleted task: ${task.title}`)
  }

  const handleUndoDelete = () => {
    if (completedTask?.autoDeleteTimer) {
      clearTimeout(completedTask.autoDeleteTimer)
      setTasks((prev) => prev.map((t) => (t.id === completedTask.id ? { ...t, completed: false } : t)))
      setCompletedTask(null)
      console.log(`↩️ Undid deletion for task: ${completedTask.title}`)
    }
  }

  const handleCloseUndoToast = () => {
    setCompletedTask(null)
  }

  // Add handler for opening task breakdown
  const handleOpenBreakdown = (id: string) => {
    const task = tasks.find((t) => t.id === id)
    if (task) {
      setBreakdownTask(task)
    }
  }

  // Add handler for execution (分解済みタスクのみ)
  const handleExecuteBreakdownTask = (id: string) => {
    const task = tasks.find((t) => t.id === id)
    if (task) {
      // 保存された進捗から分解されたタスクを取得
      const savedProgress = getTaskProgress(task.id)
      if (savedProgress && savedProgress.generatedTasks.length > 0) {
        // 保存された進捗がある場合はそれを使用
        setExecutionTask({
          ...task,
          generatedTasks: savedProgress.generatedTasks,
        })
        console.log("Opening execution with saved progress:", savedProgress)
      } else if (task.isBreakdown && task.generatedTasks) {
        // 保存された進捗がない場合はタスクのgeneratedTasksを使用
        setExecutionTask(task)
        console.log("Opening execution with task generatedTasks:", task.generatedTasks)
      } else {
        console.error("No generated tasks found for breakdown task:", task)
      }
    }
  }

  const handleTasksGenerated = (taskTitles: string[], isBreakdown = false) => {
    const newTasks: Task[] = taskTitles.map((title) => ({
      id: Date.now().toString() + Math.random(),
      title,
      completed: false,
      category: breakdownTask?.category || activeTab,
      createdAt: new Date(),
    }))
    setTasks((prev) => [...prev, ...newTasks])

    // 元のタスクを分解済みとしてマーク
    if (isBreakdown && breakdownTask) {
      setTasks((prev) =>
        prev.map((t) => (t.id === breakdownTask.id ? { ...t, isBreakdown: true, generatedTasks: taskTitles } : t)),
      )
    }
  }

  // 画面１に戻るためのハンドラー
  const handleBackToHome = () => {
    setBreakdownTask(null)
    setExecutionTask(null)
    setActiveTab("immediate")
  }

  // タスク完了時のハンドラー（全タスク完了時）
  const handleTaskCompleted = (taskId: string) => {
    // タスクを削除
    setTasks((prev) => prev.filter((t) => t.id !== taskId))

    // 関連するlocalStorageデータも削除
    cleanupCompletedTask(taskId)

    // 画面１に戻る
    handleBackToHome()

    console.log(`🎉 Completed and cleaned up task: ${taskId}`)
  }

  // Tutorial handlers
  const handleTutorialComplete = () => {
    try {
      localStorage.setItem(STORAGE_KEYS.TUTORIAL_COMPLETED, "true")
      setShowTutorial(false)

      // チュートリアル完了時にサンプルタスクを削除
      setTasks((prev) => prev.filter((task) => task.id !== "tutorial-sample-task"))

      console.log("✅ Tutorial completed and saved")
    } catch (error) {
      console.error("❌ Failed to save tutorial completion:", error)
      setShowTutorial(false)
    }
  }

  const handleTutorialSkip = () => {
    setShowTutorial(false)
    // スキップ時もサンプルタスクを削除
    setTasks((prev) => prev.filter((task) => task.id !== "tutorial-sample-task"))
  }

  // チュートリアル中に特定のボタンが有効かどうかを判定する関数
  const isTutorialButtonEnabled = (buttonType: string, taskId?: string): boolean => {
    if (!showTutorial) return true

    switch (tutorialStep) {
      case "welcome":
        return false // 次へボタンのみ有効
      case "tabs-explanation":
        return buttonType === "tab-later"
      case "tab-switch":
        return false // 次へボタンのみ有効
      case "tab-switch-back":
        return buttonType === "tab-immediate"
      case "simple-task-explanation":
        return false // 次へボタンのみ有効
      case "simple-task-completion":
        return buttonType === "task-check" && taskId === "tutorial-sample-task"
      case "undo-explanation":
        return buttonType === "undo-button"
      case "add-task-button":
        return buttonType === "add-task"
      case "task-form-explanation":
        return buttonType === "task-form-submit"
      case "task-breakdown":
        return buttonType === "task-breakdown" && taskId !== "tutorial-sample-task"
      case "breakdown-screen":
      case "voice-input":
      case "voice-input-demo":
      case "breakdown-submit":
        return buttonType === "breakdown-submit" || buttonType === "voice-input" || buttonType === "text-input"
      case "breakdown-results":
        return buttonType === "start-execution" || buttonType === "task-edit" || buttonType === "task-reorder"
      case "start-execution":
        return buttonType === "start-execution"
      case "execution-overview":
      case "current-task-explanation":
        return false // 次へボタンのみ有効
      case "complete-first-task":
        return buttonType === "current-task-check"
      case "interrupt-explanation":
        return buttonType === "interrupt-button"
      case "tutorial-skip-notice":
      case "complete":
        return false // 完了ボタンのみ有効
      default:
        return false
    }
  }

  const currentTasks = sortTasksByDueDate(tasks.filter((task) => task.category === activeTab))
  const accentColor = activeTab === "immediate" ? "text-red-500" : "text-blue-500"
  const buttonColor = activeTab === "immediate" ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col japanese-text">
      {/* Status Bar */}
      <StatusBar />

      {/* Header */}
      <div className="bg-white px-4 text-center flex-shrink-0 py-6 border-b">
        <div className="flex items-center relative justify-center mb-[-15px]">
          <img src="/images/yarn-ball-logo.png" alt="とっかかりプランナー ロゴ" className="w-16 h-16" />
          {/* Trash Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsTrashOpen(true)}
            className="absolute right-0 top-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            disabled={showTutorial}
          >
            <Trash2 className="w-5 h-5" />
          </Button>
        </div>
        <h1 className="font-bold app-title font-mono text-lg text-gray-900">tokkakari</h1>
        <button
          onClick={() => setShowTutorial(true)}
          className="mt-2 text-xs text-gray-500 hover:text-gray-700 transition-colors font-bold"
        >
          チュートリアルを見る
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs-container bg-white flex-shrink-0">
        <div className="flex">
          <button
            onClick={() => setActiveTab("immediate")}
            disabled={!isTutorialButtonEnabled("tab-immediate")}
            className={`tab-immediate flex-1 py-4 px-4 text-center font-bold tab-text border-b-2 transition-colors ${
              activeTab === "immediate" ? "border-b-2" : "text-gray-600 border-transparent"
            } ${!isTutorialButtonEnabled("tab-immediate") ? "opacity-50 cursor-not-allowed" : ""}`}
            style={{
              color: activeTab === "immediate" ? "#FF5F68" : "#444444",
              borderBottomColor: activeTab === "immediate" ? "#FF5F68" : "transparent",
            }}
          >
            まず最初にやる事
          </button>
          <button
            onClick={() => setActiveTab("later")}
            disabled={!isTutorialButtonEnabled("tab-later")}
            className={`tab-later flex-1 py-4 px-4 text-center font-bold tab-text border-b-2 transition-colors ${
              activeTab === "later" ? "border-b-2" : "text-gray-600 border-transparent"
            } ${!isTutorialButtonEnabled("tab-later") ? "opacity-50 cursor-not-allowed" : ""}`}
            style={{
              color: activeTab === "later" ? "#007AFF" : "#444444",
              borderBottomColor: activeTab === "later" ? "#007AFF" : "transparent",
            }}
          >
            後でじっくり考える事
          </button>
        </div>
      </div>

      {/* Content - スクロール可能 */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="p-4 pb-32">
          <h2 className="text-lg font-bold mb-6" style={{ color: activeTab === "immediate" ? "#FF5F68" : "#007AFF" }}>
            {activeTab === "immediate" ? "まず最初にやること" : "後でじっくり考えること"}
          </h2>

          <div className="space-y-3">
            {currentTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggleComplete={handleToggleComplete}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
                onBreakdown={handleOpenBreakdown}
                onExecute={handleExecuteBreakdownTask}
                accentColor={accentColor}
                tutorialStep={showTutorial ? tutorialStep : null}
                showTutorial={showTutorial}
              />
            ))}

            {currentTasks.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <p className="font-bold">タスクがありません</p>
                <p className="text-sm mt-1 font-bold">+ ボタンでタスクを追加しましょう</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <Button
        className={`add-task-button fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg z-10 font-bold ${
          !isTutorialButtonEnabled("add-task") ? "opacity-50 cursor-not-allowed" : ""
        }`}
        style={{
          backgroundColor: activeTab === "immediate" ? "#FF5F68" : "#007AFF",
          color: "#FFFFFF",
        }}
        size="icon"
        onClick={() => setIsFormOpen(true)}
        disabled={!isTutorialButtonEnabled("add-task")}
      >
        <Plus className="w-6 h-6" />
      </Button>

      {/* Task Form Modal */}
      <TaskForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleAddTask}
        category={activeTab}
        tutorialStep={showTutorial ? tutorialStep : null}
        onTutorialStepComplete={handleTutorialStepComplete}
      />

      {/* Trash Modal */}
      <TrashModal isOpen={isTrashOpen} onClose={() => setIsTrashOpen(false)} />

      {/* Undo Toast */}
      <UndoToast
        isVisible={!!completedTask}
        taskTitle={completedTask?.title || ""}
        onUndo={handleUndoDelete}
        onClose={handleCloseUndoToast}
      />

      {/* Interactive Tutorial */}
      <InteractiveTutorial
        isActive={showTutorial}
        currentStep={tutorialStep}
        onComplete={handleTutorialComplete}
        onSkip={handleTutorialSkip}
        onStepComplete={handleTutorialStepComplete}
      />

      {breakdownTask && (
        <div className="fixed inset-0 bg-white z-50">
          <TaskBreakdown
            task={breakdownTask}
            onBack={() => setBreakdownTask(null)}
            onTasksGenerated={handleTasksGenerated}
            onBackToHome={handleBackToHome}
            onTaskCompleted={handleTaskCompleted}
            tutorialStep={showTutorial ? tutorialStep : null}
            onTutorialStepComplete={handleTutorialStepComplete}
          />
        </div>
      )}

      {executionTask && (
        <div className="fixed inset-0 bg-white z-50">
          <TaskExecution
            task={executionTask}
            generatedTasks={executionTask.generatedTasks || []}
            onBack={() => setExecutionTask(null)}
            onBackToHome={handleBackToHome}
            onTaskCompleted={handleTaskCompleted}
            tutorialStep={showTutorial ? tutorialStep : null}
            onTutorialStepComplete={handleTutorialStepComplete}
            onAddTask={(title) => {
              const newTask: Task = {
                id: Date.now().toString() + Math.random(),
                title,
                completed: false,
                category: executionTask?.category || activeTab,
                createdAt: new Date(),
              }
              setTasks((prev) => [...prev, ...newTask])
            }}
          />
        </div>
      )}
    </div>
  )
}
