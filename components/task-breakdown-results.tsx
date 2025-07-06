"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus, GripVertical } from "lucide-react"
import type { Task } from "@/types/task"
import { TaskExecution } from "./task-execution"
import { StatusBar } from "@/components/status-bar"

interface TaskBreakdownResultsProps {
  task: Task
  generatedTasks: string[]
  onBack: () => void
  onStart: () => void
  onTasksGenerated: (tasks: string[]) => void
  onBackToHome?: () => void
  onTaskCompleted?: (taskId: string) => void
  tutorialStep?: string | null
  onTutorialStepComplete?: (step: string) => void
}

export function TaskBreakdownResults({
  task,
  generatedTasks,
  onBack,
  onStart,
  onTasksGenerated,
  onBackToHome,
  onTaskCompleted,
  tutorialStep,
  onTutorialStepComplete,
}: TaskBreakdownResultsProps) {
  const [editableTasks, setEditableTasks] = useState(generatedTasks)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editText, setEditText] = useState("")
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [insertPosition, setInsertPosition] = useState<{ index: number; position: "before" | "after" } | null>(null)
  const [showExecution, setShowExecution] = useState(false)

  // タッチ操作用の状態
  const [touchStartY, setTouchStartY] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragElementRef = useRef<HTMLDivElement | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  // Tutorial: breakdown results step - 自動遷移を削除
  useEffect(() => {
    if (tutorialStep === "breakdown-results") {
      // 自動遷移を削除 - ユーザーがスタートボタンをクリックするまで待つ
      // setTimeout(() => {
      //   if (onTutorialStepComplete) {
      //     onTutorialStepComplete("breakdown-results")
      //   }
      // }, 2000)
    }
  }, [tutorialStep, onTutorialStepComplete])

  // Tutorial: monitor start execution - 実際にスタートボタンがクリックされたら遷移
  useEffect(() => {
    if (tutorialStep === "start-execution" && showExecution) {
      setTimeout(() => {
        if (onTutorialStepComplete) {
          onTutorialStepComplete("start-execution")
        }
      }, 500) // 短い遅延で画面遷移を確認
    }
  }, [showExecution, tutorialStep, onTutorialStepComplete])

  // Tutorial: task edit monitoring
  useEffect(() => {
    if (tutorialStep === "task-edit" && editingIndex !== null) {
      setTimeout(() => {
        if (onTutorialStepComplete) {
          onTutorialStepComplete("task-edit")
        }
      }, 1000)
    }
  }, [editingIndex, tutorialStep, onTutorialStepComplete])

  // Tutorial: task reorder monitoring
  useEffect(() => {
    if (tutorialStep === "task-reorder" && draggedIndex !== null) {
      setTimeout(() => {
        if (onTutorialStepComplete) {
          onTutorialStepComplete("task-reorder")
        }
      }, 2000)
    }
  }, [draggedIndex, tutorialStep, onTutorialStepComplete])

  const handleTaskClick = (index: number, event: React.MouseEvent | React.TouchEvent) => {
    // ドラッグハンドルをクリック/タッチした場合は編集モードに入らない
    if ((event.target as HTMLElement).closest(".drag-handle")) {
      return
    }

    // ドラッグ中の場合は編集モードに入らない
    if (isDragging) {
      return
    }

    setEditingIndex(index)
    setEditText(editableTasks[index])
  }

  const handleTaskSave = () => {
    if (editingIndex !== null && editText.trim()) {
      const newTasks = [...editableTasks]
      newTasks[editingIndex] = editText.trim()
      setEditableTasks(newTasks)
    }
    setEditingIndex(null)
    setEditText("")
  }

  const handleTaskDelete = (index: number) => {
    console.log("Deleting task at index:", index, "Current tasks:", editableTasks) // デバッグ用
    const newTasks = editableTasks.filter((_, i) => i !== index)
    console.log("New tasks after deletion:", newTasks) // デバッグ用
    setEditableTasks(newTasks)
    setEditingIndex(null)
    setEditText("")

    // 削除後にタスクが空になった場合の処理
    if (newTasks.length === 0) {
      console.log("All tasks deleted, returning to previous screen")
      // 必要に応じて前の画面に戻る処理を追加
    }
  }

  const handleAddTask = () => {
    const newTask = `新しいタスク ${editableTasks.length + 1}`
    setEditableTasks([...editableTasks, newTask])
  }

  const handleStart = () => {
    // Tutorial: スタートボタンクリック時にbreakdown-resultsステップを完了
    if (tutorialStep === "breakdown-results" && onTutorialStepComplete) {
      onTutorialStepComplete("breakdown-results")
    }

    // 分解されたタスクの進捗を初期化して保存
    const initialProgress = {
      completed: new Array(editableTasks.length).fill(false),
      currentIndex: 0,
      timestamp: Date.now(),
      generatedTasks: editableTasks,
    }

    const progressKey = `task-progress-${task.id}`
    localStorage.setItem(progressKey, JSON.stringify(initialProgress))

    setShowExecution(true)
  }

  const handleBackFromExecution = () => {
    setShowExecution(false)
  }

  const handleAddTaskFromExecution = (title: string) => {
    setEditableTasks([...editableTasks, title])
  }

  // デスクトップ用ドラッグ&ドロップ関数（改善版）
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/html", e.currentTarget.outerHTML)

    // ドラッグ中の透明度を設定
    setTimeout(() => {
      const element = e.target as HTMLElement
      element.style.opacity = "0.5"
      element.style.transform = "rotate(2deg) scale(1.02)"
      element.style.transition = "all 0.2s ease"
    }, 0)
  }

  const handleDragEnd = (e: React.DragEvent) => {
    const element = e.target as HTMLElement
    element.style.opacity = "1"
    element.style.transform = "none"
    element.style.transition = "all 0.3s ease"
    setDraggedIndex(null)
    setInsertPosition(null)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"

    if (draggedIndex !== null && draggedIndex !== index) {
      const rect = e.currentTarget.getBoundingClientRect()
      const y = e.clientY - rect.top
      const height = rect.height

      // 上半分なら前に、下半分なら後に挿入
      const position = y < height / 2 ? "before" : "after"
      setInsertPosition({ index, position })
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // 子要素に移動した場合は無視
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setInsertPosition(null)
    }
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()

    if (draggedIndex !== null && insertPosition) {
      const newTasks = [...editableTasks]
      const draggedTask = newTasks[draggedIndex]

      // 元の位置から削除
      newTasks.splice(draggedIndex, 1)

      // 挿入位置を計算
      let insertIndex = insertPosition.index
      if (draggedIndex < insertPosition.index) {
        insertIndex -= 1
      }
      if (insertPosition.position === "after") {
        insertIndex += 1
      }

      // 新しい位置に挿入
      newTasks.splice(insertIndex, 0, draggedTask)
      setEditableTasks(newTasks)
    }

    setDraggedIndex(null)
    setInsertPosition(null)
  }

  // タッチ操作用の関数（改善版）
  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    // ドラッグハンドルをタッチした場合のみドラッグ開始
    if (!(e.target as HTMLElement).closest(".drag-handle")) {
      return
    }

    e.preventDefault()
    const touch = e.touches[0]
    const rect = e.currentTarget.getBoundingClientRect()

    setTouchStartY(touch.clientY)
    setDraggedIndex(index)
    setIsDragging(false)
    setDragOffset({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    })

    // ドラッグ要素の参照を保存
    dragElementRef.current = e.currentTarget as HTMLDivElement
  }

  const handleTouchMove = (e: React.TouchEvent, index: number) => {
    if (draggedIndex !== index || touchStartY === null) return

    e.preventDefault()
    const touch = e.touches[0]

    // ドラッグ開始の判定（10px以上移動した場合）
    if (!isDragging && Math.abs(touch.clientY - touchStartY) > 10) {
      setIsDragging(true)
      if (dragElementRef.current) {
        dragElementRef.current.style.position = "fixed"
        dragElementRef.current.style.zIndex = "1000"
        dragElementRef.current.style.pointerEvents = "none"
        dragElementRef.current.style.opacity = "0.9"
        dragElementRef.current.style.transform = "rotate(2deg) scale(1.02)"
        dragElementRef.current.style.transition = "transform 0.2s ease"
        dragElementRef.current.style.boxShadow = "0 10px 25px rgba(0,0,0,0.3)"
      }
    }

    if (isDragging && dragElementRef.current) {
      // ドラッグの位置更新
      dragElementRef.current.style.left = `${touch.clientX - dragOffset.x}px`
      dragElementRef.current.style.top = `${touch.clientY - dragOffset.y}px`

      // 挿入位置の判定
      const elements = document.elementsFromPoint(touch.clientX, touch.clientY)
      const taskElement = elements.find((el) => el.classList.contains("task-item") && el !== dragElementRef.current)

      if (taskElement) {
        const targetIndex = Number.parseInt(taskElement.getAttribute("data-index") || "-1")
        if (targetIndex !== -1 && targetIndex !== draggedIndex) {
          const rect = taskElement.getBoundingClientRect()
          const y = touch.clientY - rect.top
          const height = rect.height

          // 上半分なら前に、下半分なら後に挿入
          const position = y < height / 2 ? "before" : "after"
          setInsertPosition({ index: targetIndex, position })
        } else {
          setInsertPosition(null)
        }
      } else {
        setInsertPosition(null)
      }
    }
  }

  const handleTouchEnd = (e: React.TouchEvent, index: number) => {
    if (draggedIndex !== index) return

    e.preventDefault()

    if (isDragging && insertPosition && draggedIndex !== null) {
      // ドロップ処理を実行
      const newTasks = [...editableTasks]
      const draggedTask = newTasks[draggedIndex]

      // 元の位置から削除
      newTasks.splice(draggedIndex, 1)

      // 挿入位置を計算
      let insertIndex = insertPosition.index
      if (draggedIndex < insertPosition.index) {
        insertIndex -= 1
      }
      if (insertPosition.position === "after") {
        insertIndex += 1
      }

      // 新しい位置に挿入
      newTasks.splice(insertIndex, 0, draggedTask)
      setEditableTasks(newTasks)
    }

    // 状態をリセット
    if (dragElementRef.current) {
      dragElementRef.current.style.position = "static"
      dragElementRef.current.style.opacity = "1"
      dragElementRef.current.style.transform = "none"
      dragElementRef.current.style.zIndex = "auto"
      dragElementRef.current.style.pointerEvents = "auto"
      dragElementRef.current.style.boxShadow = "none"
      dragElementRef.current.style.transition = "all 0.3s ease"
    }

    setTouchStartY(null)
    setDraggedIndex(null)
    setInsertPosition(null)
    setIsDragging(false)
    setDragOffset({ x: 0, y: 0 })
    dragElementRef.current = null
  }

  if (showExecution) {
    return (
      <TaskExecution
        task={task}
        generatedTasks={editableTasks}
        onBack={handleBackFromExecution}
        onAddTask={handleAddTaskFromExecution}
        onBackToHome={onBackToHome}
        onTaskCompleted={onTaskCompleted}
        tutorialStep={tutorialStep}
        onTutorialStepComplete={onTutorialStepComplete}
      />
    )
  }

  return (
    <div className="breakdown-results h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Status Bar */}
      <StatusBar />

      {/* Header */}
      <div className="bg-teal-600 px-4 py-4 flex items-center justify-between flex-shrink-0">
        <Button variant="ghost" size="icon" onClick={onBack} className="text-white hover:bg-teal-700">
          <img src="/images/back-arrow.png" alt="戻る" className="w-6 h-6 filter brightness-0 invert" />
        </Button>
        <Button
          variant="outline"
          className="start-execution-button text-teal-600 border-white bg-white hover:bg-gray-100"
          onClick={handleStart}
        >
          スタート
        </Button>
      </div>

      {/* Content - スクロール可能 */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-4 pb-32">
          <h1 className="text-xl font-bold text-teal-600 mb-2">{task.title}</h1>

          <div className="flex items-center gap-2 mb-6">
            <span className="text-lg">💡</span>
            <p className="text-gray-600 text-sm">
              クリックで編集、
              <span className="hidden sm:inline">ドラッグで並び替え</span>
              <span className="sm:hidden">ハンドルをドラッグで並び替え</span>
              ができます
            </p>
          </div>

          <div className="space-y-2">
            {editableTasks.map((taskText, index) => (
              <div key={`${index}-${taskText}`} className="relative">
                {/* 挿入ライン（上） */}
                {insertPosition?.index === index && insertPosition.position === "before" && (
                  <div className="absolute -top-1 left-0 right-0 h-0.5 bg-teal-500 rounded-full z-10 animate-pulse">
                    <div className="absolute left-2 -top-1 w-2 h-2 bg-teal-500 rounded-full"></div>
                    <div className="absolute right-2 -top-1 w-2 h-2 bg-teal-500 rounded-full"></div>
                  </div>
                )}

                <div
                  data-index={index}
                  className={`task-item bg-white rounded-lg border transition-all duration-300 ${
                    draggedIndex === index && isDragging ? "opacity-30" : ""
                  } ${editingIndex === index ? "ring-2 ring-teal-500" : "hover:bg-gray-50 hover:shadow-md"} ${
                    insertPosition?.index === index ? "transform scale-102" : ""
                  }`}
                  draggable={editingIndex !== index}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onTouchStart={(e) => handleTouchStart(e, index)}
                  onTouchMove={(e) => handleTouchMove(e, index)}
                  onTouchEnd={(e) => handleTouchEnd(e, index)}
                >
                  {editingIndex === index ? (
                    <div className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-teal-600 font-bold text-lg min-w-[24px]">{index + 1}.</span>
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onBlur={(e) => {
                            // 削除ボタンをクリックした場合は保存しない
                            if (e.relatedTarget?.textContent === "削除") {
                              return
                            }
                            handleTaskSave()
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && e.ctrlKey) {
                              handleTaskSave()
                            } else if (e.key === "Escape") {
                              setEditingIndex(null)
                              setEditText("")
                            }
                          }}
                          className="flex-1 text-gray-800 font-medium bg-transparent border-none outline-none resize-none min-h-[60px]"
                          autoFocus
                          rows={3}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            e.preventDefault()
                            console.log("Delete button clicked for index:", index)
                            handleTaskDelete(index)
                          }}
                          onMouseDown={(e) => {
                            e.stopPropagation()
                            e.preventDefault()
                          }}
                          className="text-red-500 hover:text-red-700 text-sm px-2 py-1 rounded hover:bg-red-50 transition-colors flex-shrink-0"
                          type="button"
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="p-4 cursor-pointer flex items-start gap-3"
                      onClick={(e) => handleTaskClick(index, e)}
                    >
                      <div
                        className="drag-handle cursor-move p-2 hover:bg-gray-100 rounded transition-all duration-200 touch-manipulation active:bg-gray-200"
                        title="ドラッグして並び替え"
                      >
                        <GripVertical className="w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors" />
                      </div>
                      <span className="text-teal-600 font-bold text-lg min-w-[24px] mt-1">{index + 1}.</span>
                      <div className="flex-1 break-words">
                        {/* タスクテキストをヒント付きで表示 - タイトルを目立たせる */}
                        {taskText.includes("ヒント：") ? (
                          <div className="space-y-3">
                            {/* 目的部分 - より目立つように */}
                            <div className="text-gray-900 font-bold text-base leading-relaxed">
                              {taskText.split("ヒント：")[0].trim()}
                            </div>
                            {/* ヒント部分 - 控えめに */}
                            <div className="border rounded-lg p-3 bg-gray-100 border-gray-300">
                              <div className="flex items-start gap-2">
                                <span className="text-gray-500 font-medium text-xs flex-shrink-0">💡
</span>
                                <span className="text-xs leading-relaxed text-gray-900">
                                  {taskText.split("ヒント：")[1]?.trim()}
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-900 font-bold text-base leading-relaxed">{taskText}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 挿入ライン（下） */}
                {insertPosition?.index === index && insertPosition.position === "after" && (
                  <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-teal-500 rounded-full z-10 animate-pulse">
                    <div className="absolute left-2 -top-1 w-2 h-2 bg-teal-500 rounded-full"></div>
                    <div className="absolute right-2 -top-1 w-2 h-2 bg-teal-500 rounded-full"></div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {editableTasks.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>タスクがありません</p>
              <p className="text-sm mt-1">+ ボタンでタスクを追加しましょう</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <Button
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg bg-teal-600 hover:bg-teal-700 z-10 transition-all duration-200 hover:scale-110"
        size="icon"
        onClick={handleAddTask}
      >
        <Plus className="w-6 h-6 text-white" />
      </Button>
    </div>
  )
}
