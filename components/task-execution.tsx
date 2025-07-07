"use client"

import { useState, useEffect, useRef, Fragment } from "react" // Added Fragment
import { Button } from "@/components/ui/button"
import { Plus, Check, X } from "lucide-react"
import type { Task } from "@/types/task"
import { CelebrationModal } from "./celebration-modal"
import { GrandCelebrationModal } from "./grand-celebration-modal"
import { getTaskProgress, saveTaskProgress } from "@/utils/progress-utils"
import { StatusBar } from "@/components/status-bar"

interface TaskExecutionProps {
  task: Task
  generatedTasks: string[]
  onBack: () => void
  onAddTask: (title: string) => void
  onBackToHome?: () => void
  onTaskCompleted?: (taskId: string) => void
  tutorialStep?: string | null
  onTutorialStepComplete?: (step: string) => void
}

export function TaskExecution({
  task,
  generatedTasks,
  onBack,
  onAddTask,
  onBackToHome,
  onTaskCompleted,
  tutorialStep,
  onTutorialStepComplete,
}: TaskExecutionProps) {
  const [completedTasks, setCompletedTasks] = useState<boolean[]>(new Array(generatedTasks.length).fill(false))
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0)
  const [showCelebration, setShowCelebration] = useState(false)
  const [showGrandCelebration, setShowGrandCelebration] = useState(false)
  const [completedTaskTitle, setCompletedTaskTitle] = useState("")
  const [actualGeneratedTasks, setActualGeneratedTasks] = useState<string[]>(generatedTasks)
  const [isAllTasksCompleted, setIsAllTasksCompleted] = useState(false)
  const currentTaskRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // 初期状態の読み込み（保存された進捗があれば復元）
  useEffect(() => {
    const savedProgress = getTaskProgress(task.id)
    if (savedProgress && savedProgress.generatedTasks.length > 0) {
      // 保存された進捗を復元
      setCompletedTasks(savedProgress.completed)
      setCurrentTaskIndex(savedProgress.currentIndex)
      setActualGeneratedTasks(savedProgress.generatedTasks)
      console.log("Progress restored:", savedProgress)
    } else if (generatedTasks.length > 0) {
      // 新しいタスクの場合は初期状態を保存
      const initialProgress = {
        completed: new Array(generatedTasks.length).fill(false),
        currentIndex: 0,
        timestamp: Date.now(),
        generatedTasks: generatedTasks,
      }
      saveTaskProgress(task.id, initialProgress)
      setCompletedTasks(initialProgress.completed)
      setCurrentTaskIndex(0)
      setActualGeneratedTasks(generatedTasks)
      console.log("Initial progress saved:", initialProgress)
    }
  }, [task.id, generatedTasks])

  // 進捗が変更されたら保存
  useEffect(() => {
    if (actualGeneratedTasks.length > 0) {
      const progressData = {
        completed: completedTasks,
        currentIndex: currentTaskIndex,
        timestamp: Date.now(),
        generatedTasks: actualGeneratedTasks,
      }
      saveTaskProgress(task.id, progressData)
      console.log("Progress saved:", progressData)
    }
  }, [completedTasks, currentTaskIndex, task.id, actualGeneratedTasks])

  // 全てのタスクが完了したかチェック
  useEffect(() => {
    const completedCount = completedTasks.filter(Boolean).length
    const isAllCompleted = completedCount === actualGeneratedTasks.length && actualGeneratedTasks.length > 0

    if (isAllCompleted && !isAllTasksCompleted) {
      setIsAllTasksCompleted(true)
    }
  }, [completedTasks, actualGeneratedTasks.length, isAllTasksCompleted])

  // 現在のタスクが変更されたら、進捗の縦線の中央くらいに余白を持って表示されるようにスクロール
  useEffect(() => {
    if (currentTaskRef.current && scrollContainerRef.current) {
      setTimeout(() => {
        currentTaskRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center", // 画面中央付近に表示して上下に適度な余白を確保
        })
      }, 100)
    }
  }, [currentTaskIndex])

  // チュートリアル中の実行画面制御を追加
  const isTutorialExecutionEnabled = (actionType: string, taskIndex?: number): boolean => {
    if (!tutorialStep) return true

    switch (tutorialStep) {
      case "execution-overview":
      case "current-task-explanation":
        return false // 観察のみ
      case "complete-first-task":
        return actionType === "task-check" && taskIndex === 0
      case "interrupt-explanation":
        return actionType === "interrupt"
      default:
        return false
    }
  }

  const handleTaskToggle = (originalIndex: number) => {
    const newCompleted = [...completedTasks]
    const wasCompleted = newCompleted[originalIndex]

    if (!wasCompleted) {
      // タスクを完了にする（現在のタスクのみ）
      if (originalIndex !== currentTaskIndex) return

      newCompleted[originalIndex] = true
      setCompletedTasks(newCompleted)

      // 次の未完了タスクを現在のタスクに設定
      const nextIncompleteIndex = newCompleted.findIndex((completed, i) => !completed && i > originalIndex)
      setCurrentTaskIndex(nextIncompleteIndex === -1 ? actualGeneratedTasks.length : nextIncompleteIndex)

      // 全てのタスクが完了したかチェック
      const completedCount = newCompleted.filter(Boolean).length
      const isAllCompleted = completedCount === actualGeneratedTasks.length

      if (isAllCompleted) {
        // 全タスク完了時は盛大な祝福モーダルを表示
        setCompletedTaskTitle(task.title) // メインタスクのタイトルを使用
        setShowGrandCelebration(true)
      } else {
        // 個別タスク完了時は通常の祝福モーダルを表示
        setCompletedTaskTitle(actualGeneratedTasks[originalIndex])
        setShowCelebration(true)

        // チュートリアル中の最初のタスク完了時の処理を追加
        if (tutorialStep === "complete-first-task" && originalIndex === 0 && onTutorialStepComplete) {
          console.log("Tutorial: First task completed, will progress after celebration modal")
          // 祝福モーダルで進行を制御するため、ここでは何もしない
        }
      }
    } else {
      // タスクを未完了に戻す（完了済みタスクをクリックした場合）
      newCompleted[originalIndex] = false
      setCompletedTasks(newCompleted)
      setIsAllTasksCompleted(false) // 完了状態をリセット

      // 現在のタスクを更新（最初の未完了タスクに設定）
      const firstIncompleteIndex = newCompleted.findIndex((completed) => !completed)
      setCurrentTaskIndex(firstIncompleteIndex === -1 ? actualGeneratedTasks.length : firstIncompleteIndex)
    }
  }

  // 画面４に戻る処理
  const handleBackToResults = () => {
    // 進捗を保存してから画面４に戻る
    if (actualGeneratedTasks.length > 0) {
      const progressData = {
        completed: completedTasks,
        currentIndex: currentTaskIndex,
        timestamp: Date.now(),
        generatedTasks: actualGeneratedTasks,
      }
      saveTaskProgress(task.id, progressData)
      console.log("Progress saved before back to results:", progressData)
    }
    onBack()
  }

  // 画面１に戻る処理（中断）
  const handleInterrupt = () => {
    console.log("Tutorial: Interrupt button clicked, tutorialStep:", tutorialStep)

    // Tutorial: 中断ボタンクリック時
    if (tutorialStep === "interrupt-explanation" && onTutorialStepComplete) {
      console.log("Tutorial: Moving to tutorial-skip-notice step")
      onTutorialStepComplete("interrupt-explanation")
    }

    // 進捗を保存してから画面１に戻る
    if (actualGeneratedTasks.length > 0) {
      const progressData = {
        completed: completedTasks,
        currentIndex: currentTaskIndex,
        timestamp: Date.now(),
        generatedTasks: actualGeneratedTasks,
      }
      saveTaskProgress(task.id, progressData)
      console.log("Progress saved before interrupt:", progressData)
    }

    if (onBackToHome) {
      onBackToHome()
    }
  }

  const completedCount = completedTasks.filter(Boolean).length
  const progressPercentage = Math.round((completedCount / actualGeneratedTasks.length) * 100)

  const handleCelebrationClose = () => {
    setShowCelebration(false)
  }

  const handleGrandCelebrationClose = () => {
    setShowGrandCelebration(false)
  }

  // 通常の祝福モーダルの「次へ」ボタンが押されたときの処理
  const handleCelebrationComplete = () => {
    // チュートリアル中の最初のタスク完了時の処理
    if (tutorialStep === "complete-first-task" && onTutorialStepComplete) {
      console.log("Tutorial: Celebration complete, progressing to interrupt-explanation")
      onTutorialStepComplete("complete-first-task")
    }
    // 個別タスク完了時は何もしない（継続）
  }

  // 盛大な祝福モーダルの完了処理
  const handleGrandCelebrationComplete = () => {
    // 画面１に戻ってタスクを削除
    if (onTaskCompleted && onBackToHome) {
      // すぐにトップに戻る
      onBackToHome()

      // 3秒後にタスクを削除
      setTimeout(() => {
        onTaskCompleted(task.id)
      }, 3000)
    }
  }

  // タスクを3つのグループに分ける
  const getTaskGroups = () => {
    const completedTasksGroup: Array<{ text: string; originalIndex: number }> = []
    const currentTaskGroup: Array<{ text: string; originalIndex: number }> = []
    const futureTasksGroup: Array<{ text: string; originalIndex: number }> = []

    actualGeneratedTasks.forEach((taskText, originalIndex) => {
      if (completedTasks[originalIndex]) {
        // 完了済みタスク
        completedTasksGroup.push({ text: taskText, originalIndex })
      } else if (originalIndex === currentTaskIndex) {
        // 現在のタスク
        currentTaskGroup.push({ text: taskText, originalIndex })
      } else if (originalIndex > currentTaskIndex) {
        // 未来のタスク
        futureTasksGroup.push({ text: taskText, originalIndex })
      }
    })

    return { completedTasksGroup, currentTaskGroup, futureTasksGroup }
  }

  const { completedTasksGroup, currentTaskGroup, futureTasksGroup } = getTaskGroups()

  const renderTaskItem = (taskItem: { text: string; originalIndex: number }, isLast: boolean, isCurrent = false) => {
    const { text: taskText, originalIndex } = taskItem
    const isCompleted = completedTasks[originalIndex]
    const isClickable = originalIndex === currentTaskIndex || isCompleted

    return (
      <div key={`${originalIndex}-${taskText}`} className="flex items-start" ref={isCurrent ? currentTaskRef : null}>
        {/* Timeline Line and Circle */}
        <div className="flex flex-col items-center mr-4 mt-2 flex-shrink-0">
          <button
            onClick={() => handleTaskToggle(originalIndex)}
            // Corrected disabled prop type
            disabled={!isClickable || !!(tutorialStep && !isTutorialExecutionEnabled("task-check", originalIndex))}
            className={`current-task-check w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
              isCompleted
                ? "bg-teal-600 border-teal-600 cursor-pointer hover:bg-teal-700"
                : isCurrent
                  ? "border-teal-400 bg-white hover:border-teal-500 cursor-pointer current-task-button"
                  : "border-gray-200 bg-gray-100 cursor-not-allowed opacity-50"
            } ${tutorialStep && !isTutorialExecutionEnabled("task-check", originalIndex) ? "opacity-30 cursor-not-allowed" : ""}`}
          >
            {isCompleted && <Check className="w-4 h-4 text-white" />}
          </button>
          {!isLast && (
            <div
              className={`w-0.5 h-16 mt-2 transition-colors duration-300 ${
                isCompleted ? "bg-teal-300" : "bg-gray-200"
              }`}
            ></div>
          )}
        </div>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <div
            className={`pb-8 transition-all duration-200 ${
              isCurrent ? "bg-white rounded-lg border border-teal-200 p-4 shadow-sm current-task-item" : "py-2"
            }`}
          >
            {/* タスクテキストをヒント付きで表示 - 現在のタスク以外は控えめに */}
            {taskText.includes("ヒント：") ? (
              <div className="space-y-3">
                {/* 目的部分 - タイトルを目立たせる */}
                <p
                  className={`leading-relaxed break-words transition-colors duration-200 font-extrabold text-base ${
                    isCompleted ? "text-gray-500 line-through" : isCurrent ? "text-gray-900" : "text-gray-400"
                  }`}
                >
                  {taskText.split("ヒント：")[0].trim()}
                </p>
                {/* ヒント部分 - 現在のタスクのみ表示 */}
                {!isCompleted && isCurrent && (
                  <div className="rounded-lg p-3 border bg-gray-100 border-gray-300">
                    <div className="flex gap-2 items-center">
                      <span className="flex-shrink-0 text-blue-600 font-semibold text-sm">{"💡"}</span>
                      <span className="leading-relaxed font-medium text-sm text-slate-900">
                        {taskText.split("ヒント：")[1]?.trim()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p
                className={`text-base leading-relaxed break-words transition-colors duration-200 font-bold ${
                  isCompleted ? "text-gray-500 line-through" : isCurrent ? "text-gray-900" : "text-gray-400"
                }`}
              >
                {taskText}
              </p>
            )}
            {isCurrent && (
              <div className="mt-2 text-sm text-teal-600 font-bold flex items-center gap-2 current-task-text">
                <div className="w-2 h-2 bg-teal-600 rounded-full animate-pulse"></div>
                現在のタスク
              </div>
            )}
            {isCompleted && (
              <button
                onClick={() => handleTaskToggle(originalIndex)}
                className="mt-2 text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer font-bold"
              >
                クリックで未完了に戻す
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="execution-container h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Status Bar */}
      <StatusBar />

      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center justify-between border-b flex-shrink-0">
        <Button variant="ghost" size="icon" onClick={handleBackToResults} className="text-black hover:bg-gray-100">
          <img
            src="/images/back-arrow.png"
            alt="戻る"
            className="w-6 h-6"
            style={{
              filter:
                "brightness(0) saturate(100%) invert(27%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(95%) contrast(85%)",
            }}
          />
        </Button>
        <h1 className="text-lg font-bold text-center flex-1">{task.title}</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleInterrupt}
          disabled={!!(tutorialStep && !isTutorialExecutionEnabled("interrupt"))} // Corrected disabled prop type
          className={`interrupt-button text-gray-600 hover:bg-gray-100 px-3 py-1 text-sm font-bold ${
            tutorialStep && !isTutorialExecutionEnabled("interrupt") ? "opacity-30 cursor-not-allowed" : ""
          }`}
        >
          <X className="w-4 h-4 mr-1" />
          中断
        </Button>
      </div>

      {/* Progress Section */}
      <div className="bg-white px-4 py-6 border-b flex-shrink-0">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-teal-600 text-white px-3 py-1 rounded-full text-sm font-bold progress-percentage">
            {progressPercentage}%
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-teal-600 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Task List - スクロール可能エリア */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto min-h-0">
        <div className="p-4 pb-32">
          <div className="space-y-0">
            {/* 完了済みタスク */}
            {completedTasksGroup.map((taskItem, index) =>
              renderTaskItem(
                taskItem,
                index === completedTasksGroup.length - 1 &&
                  currentTaskGroup.length === 0 &&
                  futureTasksGroup.length === 0,
              ),
            )}

            {/* 現在のタスク */}
            {currentTaskGroup.map((taskItem, index) =>
              renderTaskItem(taskItem, index === currentTaskGroup.length - 1 && futureTasksGroup.length === 0, true),
            )}

            {/* 未来のタスク */}
            {futureTasksGroup.map((taskItem, index) => renderTaskItem(taskItem, index === futureTasksGroup.length - 1))}
          </div>

          {/* Completion Message */}
          {completedCount === actualGeneratedTasks.length && actualGeneratedTasks.length > 0 && (
            <div className="text-center py-8">
              <div className="text-4xl mb-4 animate-bounce">🎉</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">すべてのタスクが完了しました！</h3>
              <p className="text-gray-600 text-sm font-bold">お疲れさまでした。素晴らしい成果です！</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <Button
        className="fixed bottom-8 right-6 w-14 h-14 rounded-full shadow-lg bg-teal-600 hover:bg-teal-700 z-10 font-bold"
        size="icon"
        onClick={() => onAddTask(`追加タスク ${actualGeneratedTasks.length + 1}`)}
      >
        <Plus className="w-6 h-6 text-white" />
      </Button>

      {/* Individual Task Celebration Modal */}
      <CelebrationModal
        isOpen={showCelebration}
        onClose={handleCelebrationClose}
        taskTitle={completedTaskTitle}
        onCompleteTask={handleCelebrationComplete}
        tutorialStep={tutorialStep}
        onTutorialStepComplete={onTutorialStepComplete}
      />

      {/* Grand Celebration Modal for All Tasks Completed */}
      <GrandCelebrationModal
        isOpen={showGrandCelebration}
        onClose={handleGrandCelebrationClose}
        taskTitle={completedTaskTitle}
        onCompleteAllTasks={handleGrandCelebrationComplete}
      />
    </div>
  )
}