"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

interface InteractiveTutorialProps {
  isActive: boolean
  currentStep: string
  onComplete: () => void
  onSkip: () => void
  onStepComplete: (step: string) => void
}

const TUTORIAL_STEPS: Record<
  string,
  {
    title: string
    description: string
    target?: string
    additionalTargets?: string[]
    waitForAction?: boolean
    autoHide?: boolean
    autoHideDelay?: number
    blockOtherInteractions?: boolean
  }
> = {
  welcome: {
    title: "とっかかりプランナーへようこそ！",
    description: "大きなタスクを小さなステップに分解して、「最初の一歩」を見つけるアプリです。",
    waitForAction: false,
    blockOtherInteractions: true,
  },
  "tabs-explanation": {
    title: "2つのタブで整理",
    description: "「後でじっくり考える事」タブをクリックしてみましょう。",
    target: ".tab-later",
    waitForAction: true,
    blockOtherInteractions: true,
  },
  "tab-switch": {
    title: "後でじっくり考える事",
    description: "重要だけど急がないタスクを管理するタブです。",
    target: ".tab-later",
    waitForAction: false,
    blockOtherInteractions: false,
  },
  "tab-switch-back": {
    title: "まず最初にやる事",
    description: "「まず最初にやる事」タブをクリックして戻りましょう。",
    target: ".tab-immediate",
    waitForAction: true,
    blockOtherInteractions: true,
  },
  "simple-task-explanation": {
    title: "簡単なタスクはそのまま完了",
    description:
      "「授業アンケートを提出する」のような簡単なタスクは、分解せずにそのまま完了できます。分解が必要なのは複雑で手順が分からないタスクです。",
    target: ".task-item",
    waitForAction: false,
    blockOtherInteractions: true,
  },
  "simple-task-completion": {
    title: "タスクを完了してみよう",
    description: "サンプルタスクの○ボタンをクリックして完了してください。",
    target: ".task-check-button",
    waitForAction: true,
    blockOtherInteractions: true,
  },
  "undo-explanation": {
    title: "取り消し機能",
    description: "間違って完了した時は「取り消し」で元に戻せます。5秒で自動削除されます。",
    target: ".undo-toast",
    waitForAction: false,
    blockOtherInteractions: false,
  },
  "add-task-button": {
    title: "新しいタスクを追加",
    description: "右下の+ボタンをクリックしてタスクを追加してください。",
    target: ".add-task-button",
    waitForAction: true,
    blockOtherInteractions: true,
  },
  "task-form-explanation": {
    title: "タスクを入力",
    description: "「プレゼン資料を作成する」と入力して追加してください。",
    target: ".task-form",
    waitForAction: true,
    blockOtherInteractions: false,
  },
  "task-breakdown": {
    title: "分解ボタンをクリック",
    description: "追加されたタスクの分解ボタンをクリックしてください。",
    target: ".task-breakdown-button",
    waitForAction: true,
    blockOtherInteractions: true,
  },
  "breakdown-screen": {
    title: "分解画面",
    description: "タスクの詳細をAIに説明します。マイクボタンで音声入力するか、テキストで直接入力してください。",
    target: ".breakdown-container",
    waitForAction: false,
    blockOtherInteractions: false,
  },
  "voice-input": {
    title: "詳細を説明",
    description: "マイクボタンで音声入力するか、テキストで直接入力してください。",
    waitForAction: true,
    autoHide: false,
    blockOtherInteractions: false,
  },
  "voice-input-demo": {
    title: "入力デモ",
    description:
      "今回はデモ用に「プレゼン資料作成の詳細（10分発表、10枚スライド、来週金曜締切）」を入力しました。「次へ」をクリックして分解に進みましょう。",
    target: ".tutorial-text-input",
    waitForAction: false,
    blockOtherInteractions: true,
  },
  "breakdown-submit": {
    title: "分解ボタンをクリック",
    description: "右上の「分解」ボタンをクリックしてAIにタスクを分けてもらいましょう。",
    target: ".breakdown-submit",
    waitForAction: true,
    blockOtherInteractions: true,
  },
  "breakdown-results": {
    title: "分解結果を確認",
    description: "AIが作成したステップが表示されました。スタートしてみましょう。",
    target: ".start-execution-button",
    waitForAction: true,
    blockOtherInteractions: true,
  },
  "start-execution": {
    title: "実行を開始",
    description: "右上の「スタート」ボタンをクリックして実行していきましょう。",
    target: ".start-execution-button",
    waitForAction: true,
    blockOtherInteractions: true,
  },
  "execution-overview": {
    title: "実行画面の説明",
    description: "上部に進捗バーが表示されています。現在0%から始まります。タスクを完了すると進捗が進みます。",
    target: ".execution-container",
    waitForAction: false,
    blockOtherInteractions: false,
  },
  "current-task-explanation": {
    title: "現在のタスク",
    description: "白い枠で囲まれているのが「現在のタスク」です。この○ボタンをクリックして完了できます。",
    target: ".current-task-item",
    waitForAction: false,
    blockOtherInteractions: false,
  },
  "complete-first-task": {
    title: "最初のタスクを完了",
    description: "現在のタスクの○ボタンをクリックして完了してください。",
    target: ".current-task-check",
    waitForAction: true,
    blockOtherInteractions: true,
    autoHide: true, // ○ボタンクリック後に自動で非表示
    autoHideDelay: 0, // 即座に非表示
  },
  "interrupt-explanation": {
    title: "中断機能",
    description: "右上の「中断」ボタンをクリックしてください。進捗は自動保存されるので、後で続きから再開できます。",
    target: ".interrupt-button",
    waitForAction: true,
    blockOtherInteractions: true,
  },
  "tutorial-skip-notice": {
    title: "基本操作をマスター！",
    description: "基本的な使い方を覚えました！実際の使用では、全てのタスクを完了すると盛大なお祝いが表示されます。",
    waitForAction: false,
    blockOtherInteractions: true,
  },
  complete: {
    title: "チュートリアル完了！",
    description: "これで基本的な使い方がわかりました。大きなタスクも小さく分解すれば必ず進められます！",
    waitForAction: false,
    blockOtherInteractions: true,
  },
}

export function InteractiveTutorial({
  isActive,
  currentStep,
  onComplete,
  onSkip,
  onStepComplete,
}: InteractiveTutorialProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [highlightedElements, setHighlightedElements] = useState<HTMLElement[]>([])
  const [highlightRects, setHighlightRects] = useState<DOMRect[]>([])
  const [isGuideBoxVisible, setIsGuideBoxVisible] = useState(true)

  const stepData = TUTORIAL_STEPS[currentStep]

  useEffect(() => {
    if (isActive) {
      setIsVisible(true)
      setIsGuideBoxVisible(true)
    } else {
      setIsVisible(false)
      setHighlightedElements([])
      setHighlightRects([])
      setIsGuideBoxVisible(true)
    }
  }, [isActive])

  useEffect(() => {
    setIsGuideBoxVisible(true)
  }, [currentStep])

  // ○ボタンクリック時の自動非表示処理を追加
  useEffect(() => {
    if (currentStep === "complete-first-task" && isVisible && isGuideBoxVisible) {
      // 現在のタスクの○ボタンを監視
      const currentTaskCheck = document.querySelector(".current-task-check")
      if (currentTaskCheck) {
        const handleClick = () => {
          console.log("Tutorial: Current task check button clicked, hiding tutorial popup")
          setIsGuideBoxVisible(false)
        }

        currentTaskCheck.addEventListener("click", handleClick)
        return () => {
          currentTaskCheck.removeEventListener("click", handleClick)
        }
      }
    }
  }, [currentStep, isVisible, isGuideBoxVisible])

  useEffect(() => {
    if (isVisible && stepData?.autoHide && isGuideBoxVisible && stepData.autoHideDelay !== 0) {
      const timer = setTimeout(() => {
        setIsGuideBoxVisible(false)
      }, stepData.autoHideDelay || 3000)

      return () => clearTimeout(timer)
    }
  }, [isVisible, stepData, isGuideBoxVisible])

  useEffect(() => {
    if (!isVisible || !stepData?.target) {
      setHighlightedElements([])
      setHighlightRects([])
      return
    }

    const findAndHighlightElements = () => {
      const elements: HTMLElement[] = []
      const rects: DOMRect[] = []

      let mainElement: HTMLElement | null = null

      if (stepData.target === ".task-check-button") {
        const firstTaskItem = document.querySelector(".task-item")
        if (firstTaskItem) {
          mainElement = firstTaskItem.querySelector("button") as HTMLElement
        }
      } else if (stepData.target === ".undo-toast") {
        mainElement = document.querySelector(".undo-toast") as HTMLElement
      } else if (stepData.target === ".current-task-check") {
        mainElement = document.querySelector(".current-task-check") as HTMLElement
      } else if (stepData.target === ".current-task-item") {
        const allTaskItems = document.querySelectorAll('[class*="bg-white rounded-lg border border-teal-200"]')
        mainElement = allTaskItems[0] as HTMLElement
      } else {
        mainElement = document.querySelector(stepData.target!) as HTMLElement
      }

      if (mainElement) {
        elements.push(mainElement)
        rects.push(mainElement.getBoundingClientRect())
      }

      if (stepData.additionalTargets) {
        stepData.additionalTargets.forEach((selector) => {
          const additionalElement = document.querySelector(selector) as HTMLElement
          if (additionalElement) {
            elements.push(additionalElement)
            rects.push(additionalElement.getBoundingClientRect())
          }
        })
      }

      if (elements.length > 0) {
        setHighlightedElements(elements)
        setHighlightRects(rects)

        if (currentStep !== "voice-input" && currentStep !== "voice-input-demo") {
          elements[0].scrollIntoView({ behavior: "smooth", block: "center" })
        }
      } else {
        setTimeout(findAndHighlightElements, 100)
      }
    }

    findAndHighlightElements()
  }, [stepData, isVisible, currentStep])

  const handleNext = () => {
    console.log("Next button clicked for step:", currentStep)
    if (currentStep === "complete" || currentStep === "tutorial-skip-notice") {
      onComplete()
    } else {
      onStepComplete(currentStep)
    }
  }

  if (!isVisible || !stepData) return null

  // 祝福モーダルが表示されている時はチュートリアルを非表示
  if (document.querySelector(".celebration-modal")) {
    return null
  }

  if (currentStep === "task-form-explanation") {
    return null
  }

  const getGuideBoxStyle = () => {
    const windowHeight = window.innerHeight
    const windowWidth = window.innerWidth
    const padding = 16

    let boxWidth: number
    let boxMaxHeight: number

    if (windowWidth < 400) {
      boxWidth = windowWidth - padding * 2
      boxMaxHeight = windowHeight * 0.5
    } else if (windowWidth < 480) {
      boxWidth = windowWidth - padding * 2
      boxMaxHeight = windowHeight * 0.55
    } else if (windowWidth < 768) {
      boxWidth = Math.min(380, windowWidth - padding * 2)
      boxMaxHeight = windowHeight * 0.6
    } else {
      boxWidth = Math.min(420, windowWidth - padding * 2)
      boxMaxHeight = windowHeight * 0.7
    }

    boxWidth = Math.max(280, boxWidth)

    if (currentStep === "undo-explanation") {
      const undoToastHeight = 80
      const undoToastBottom = 80

      return {
        position: "fixed" as const,
        bottom: undoToastBottom + undoToastHeight + 16,
        left: Math.max(padding, Math.min(windowWidth - boxWidth - padding, (windowWidth - boxWidth) / 2)),
        width: boxWidth,
        maxHeight: Math.min(160, windowHeight * 0.2),
        zIndex: 10002,
        pointerEvents: "auto" as const,
      }
    }

    if (currentStep === "voice-input" || currentStep === "voice-input-demo") {
      return {
        position: "fixed" as const,
        top: padding + 60,
        left: Math.max(padding, Math.min(windowWidth - boxWidth - padding, (windowWidth - boxWidth) / 2)),
        width: boxWidth,
        maxHeight: Math.min(boxMaxHeight, windowHeight - 200),
        zIndex: 10010,
        pointerEvents: "auto" as const,
      }
    }

    if (highlightRects.length === 0) {
      return {
        position: "fixed" as const,
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: boxWidth,
        maxHeight: Math.min(boxMaxHeight, windowHeight - 64),
        zIndex: 10003,
        pointerEvents: "auto" as const,
      }
    }

    const highlightRect = highlightRects[0]

    let top: number
    let left: number

    left = Math.max(padding, Math.min(windowWidth - boxWidth - padding, (windowWidth - boxWidth) / 2))
    top = (windowHeight - Math.min(300, boxMaxHeight)) / 2

    const targetCenterY = highlightRect.top + highlightRect.height / 2
    const targetCenterX = highlightRect.left + highlightRect.width / 2

    if (targetCenterY < windowHeight / 2) {
      const spaceBelow = windowHeight - highlightRect.bottom - padding
      if (spaceBelow > 180) {
        top = Math.min(highlightRect.bottom + 16, windowHeight - 180 - padding)
      }
    } else {
      const spaceAbove = highlightRect.top - padding
      if (spaceAbove > 180) {
        top = Math.max(padding, highlightRect.top - 200)
      }
    }

    if (targetCenterX < windowWidth * 0.3) {
      left = Math.min(windowWidth - boxWidth - padding, Math.max(padding, windowWidth - boxWidth - padding))
    } else if (targetCenterX > windowWidth * 0.7) {
      left = Math.max(padding, Math.min(windowWidth - boxWidth - padding, padding))
    }

    top = Math.max(padding, Math.min(windowHeight - Math.min(boxMaxHeight, 200) - padding, top))
    left = Math.max(padding, Math.min(windowWidth - boxWidth - padding, left))

    return {
      position: "fixed" as const,
      top,
      left,
      width: boxWidth,
      maxHeight: Math.min(boxMaxHeight, windowHeight - top - padding),
      zIndex: 10003,
      pointerEvents: "auto" as const,
    }
  }

  const showNextButton =
    !stepData.waitForAction ||
    currentStep === "voice-input" ||
    currentStep === "voice-input-demo" ||
    currentStep === "tab-switch" ||
    currentStep === "simple-task-explanation" || // 新しいステップを追加
    currentStep === "undo-explanation" ||
    currentStep === "execution-overview" ||
    currentStep === "current-task-explanation"

  const getGuideBoxZIndex = () => {
    if (currentStep === "undo-explanation") {
      return 10002
    }
    if (currentStep === "breakdown-screen" || currentStep === "voice-input" || currentStep === "voice-input-demo") {
      return 10010
    }
    if (currentStep === "execution-overview" || currentStep === "current-task-explanation") {
      return 10015
    }
    return 10003
  }

  return (
    <>
      {stepData.blockOtherInteractions && currentStep !== "undo-explanation" && (
        <div
          className="fixed inset-0"
          style={{
            zIndex: currentStep === "task-form-explanation" ? 55 : currentStep === "voice-input-demo" ? 10010 : 9999,
            pointerEvents: "auto",
            background:
              stepData.target &&
              highlightRects.length > 0 &&
              currentStep !== "task-form-explanation" &&
              currentStep !== "voice-input-demo"
                ? `
            radial-gradient(
              ellipse ${highlightRects[0].width + 20}px ${highlightRects[0].height + 20}px at 
              ${highlightRects[0].left + highlightRects[0].width / 2}px ${highlightRects[0].top + highlightRects[0].height / 2}px,
              transparent 0%,
              transparent 60%,
              rgba(0, 0, 0, 0.3) 90%
            )
          `
                : currentStep === "task-form-explanation" || currentStep === "voice-input-demo"
                  ? "rgba(0, 0, 0, 0.5)" // voice-input-demoでも半透明オーバーレイを表示
                  : "rgba(0, 0, 0, 0.3)",
          }}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            return false
          }}
          onTouchStart={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onTouchEnd={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
        />
      )}

      {currentStep === "undo-explanation" && (
        <div
          className="fixed inset-0"
          style={{
            zIndex: 10001,
            pointerEvents: "none",
            background: "rgba(0, 0, 0, 0.1)",
          }}
        />
      )}

      {!stepData.blockOtherInteractions &&
        currentStep !== "voice-input" &&
        currentStep !== "voice-input-demo" &&
        currentStep !== "undo-explanation" && (
          <div
            className="fixed inset-0"
            style={{
              zIndex: currentStep === "task-form-explanation" ? 55 : 9999,
              pointerEvents: "auto",
              background:
                stepData.target && highlightRects.length > 0 && currentStep !== "task-form-explanation"
                  ? `
            radial-gradient(
              ellipse ${highlightRects[0].width + 20}px ${highlightRects[0].height + 20}px at 
              ${highlightRects[0].left + highlightRects[0].width / 2}px ${highlightRects[0].top + highlightRects[0].height / 2}px,
              transparent 0%,
              transparent 60%,
              rgba(0, 0, 0, 0.2) 90%
            )
          `
                  : currentStep === "task-form-explanation"
                    ? "transparent"
                    : "rgba(0, 0, 0, 0.2)",
            }}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              return false
            }}
          />
        )}

      {currentStep !== "voice-input" &&
        currentStep !== "voice-input-demo" &&
        currentStep !== "undo-explanation" &&
        highlightRects.map((rect, index) => (
          <div
            key={index}
            className="fixed"
            style={{
              top: rect.top - 5,
              left: rect.left - 5,
              width: rect.width + 10,
              height: rect.height + 10,
              zIndex: currentStep === "task-form-explanation" ? 65 : 10005,
              pointerEvents: "auto",
              background: "transparent",
            }}
            onClick={(e) => {
              if (stepData.waitForAction) {
                console.log("Tutorial click area clicked", stepData.target)
                if (highlightedElements[index]) {
                  highlightedElements[index].click()
                }
              }
            }}
          />
        ))}

      {isGuideBoxVisible && (
        <div
          className="tutorial-popup bg-white rounded-xl shadow-xl border border-teal-200 overflow-hidden border-none"
          style={{
            ...getGuideBoxStyle(),
            zIndex: getGuideBoxZIndex(),
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            className="flex justify-between items-center p-3 pb-2 border-b border-gray-100 flex-shrink-0"
            style={{ backgroundColor: "#E3F2FD" }}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div
                className="w-5 h-5 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ backgroundColor: "#0288D1" }}
              >
                ?
              </div>
              <h3 className="text-sm font-bold truncate tutorial-title" style={{ color: "#263238" }}>
                {stepData.title}
              </h3>
            </div>
          </div>

          <div className="tutorial-popup-content flex-1 overflow-y-auto p-3 min-h-0">
            <p className="leading-relaxed text-sm mb-2 font-bold" style={{ color: "#263238" }}>
              {stepData.description}
            </p>

            {currentStep === "tabs-explanation" && (
              <div className="border border-orange-200 rounded-lg p-2" style={{ backgroundColor: "#fff7ed" }}>
                <p className="text-xs font-bold" style={{ color: "#e8580c" }}>
                  💡 タブを切り替えてタスクを整理しましょう
                </p>
              </div>
            )}

            {currentStep === "tab-switch" && (
              <div className="border border-orange-200 rounded-lg p-2" style={{ backgroundColor: "#fff7ed" }}>
                <p className="text-xs font-bold" style={{ color: "#e8580c" }}>
                  例：スキルアップ、将来の計画、趣味など
                </p>
              </div>
            )}

            {currentStep === "tab-switch-back" && (
              <div className="border border-orange-200 rounded-lg p-2" style={{ backgroundColor: "#fff7ed" }}>
                <p className="text-xs font-bold" style={{ color: "#e8580c" }}>
                  例：緊急性の高いタスク、締切が近いもの
                </p>
              </div>
            )}

            {currentStep === "simple-task-explanation" && (
              <div className="border border-orange-200 rounded-lg p-2" style={{ backgroundColor: "#fff7ed" }}>
                <p className="text-xs font-bold" style={{ color: "#e8580c" }}>
                  💡 簡単 = そのまま完了、複雑 = 分解してから実行
                </p>
              </div>
            )}

            {currentStep === "simple-task-completion" && (
              <div className="border border-orange-200 rounded-lg p-2" style={{ backgroundColor: "#fff7ed" }}>
                <p className="text-xs font-bold" style={{ color: "#e8580c" }}>
                  ✓ 簡単なタスクはすぐに完了しましょう
                </p>
              </div>
            )}

            {currentStep === "undo-explanation" && (
              <div className="border border-orange-200 rounded-lg p-2" style={{ backgroundColor: "#fff7ed" }}>
                <p className="text-xs font-bold" style={{ color: "#e8580c" }}>
                  ※チュートリアル中のため取り消しはできません
                </p>
              </div>
            )}

            {currentStep === "voice-input" && (
              <div className="border border-orange-200 rounded-lg p-2" style={{ backgroundColor: "#fff7ed" }}>
                <p className="text-xs font-bold" style={{ color: "#e8580c" }}>
                  💡 詳しく話すほど、より実用的なステップに分解されます
                </p>
              </div>
            )}

            {currentStep === "voice-input-demo" && (
              <div className="border border-orange-200 rounded-lg p-2" style={{ backgroundColor: "#fff7ed" }}>
                <p className="text-xs font-bold" style={{ color: "#e8580c" }}>
                  💡 実際の使用では、ここでご自身のタスクの詳細を説明してください
                </p>
              </div>
            )}

            {currentStep === "execution-overview" && (
              <div className="border border-orange-200 rounded-lg p-2" style={{ backgroundColor: "#fff7ed" }}>
                <p className="text-xs font-bold" style={{ color: "#e8580c" }}>
                  進捗バーでタスクの完了状況を確認できます
                </p>
              </div>
            )}

            {currentStep === "current-task-explanation" && (
              <div className="border border-orange-200 rounded-lg p-2" style={{ backgroundColor: "#fff7ed" }}>
                <p className="text-xs font-bold" style={{ color: "#e8580c" }}>
                  現在のタスクのみクリックして完了できます
                </p>
              </div>
            )}

            {currentStep === "complete-first-task" && (
              <div className="border border-orange-200 rounded-lg p-2" style={{ backgroundColor: "#fff7ed" }}>
                <p className="text-xs font-bold" style={{ color: "#e8580c" }}>
                  ○ボタンをクリックするとお祝いが表示されます
                </p>
              </div>
            )}

            {currentStep === "interrupt-explanation" && (
              <div className="border border-orange-200 rounded-lg p-2" style={{ backgroundColor: "#fff7ed" }}>
                <p className="text-xs font-bold" style={{ color: "#e8580c" }}>
                  進捗は保存されるので安心して中断できます
                </p>
              </div>
            )}

            {currentStep === "tutorial-skip-notice" && (
              <div className="border border-orange-200 rounded-lg p-2" style={{ backgroundColor: "#fff7ed" }}>
                <p className="text-xs font-bold" style={{ color: "#e8580c" }}>
                  🎉 タスクの追加・分解・実行をマスターしました！
                </p>
              </div>
            )}

            {currentStep === "task-breakdown" && (
              <div className="border border-orange-200 rounded-lg p-2" style={{ backgroundColor: "#fff7ed" }}>
                <p className="text-xs font-bold" style={{ color: "#e8580c" }}>
                  AIが自動で手順を作成します
                </p>
              </div>
            )}
          </div>

          <div
            className="flex justify-between items-center p-3 pt-2 border-t border-gray-100 flex-shrink-0"
            style={{ backgroundColor: "#E3F2FD" }}
          >
            <div></div>

            {showNextButton && (
              <Button
                onClick={handleNext}
                className="text-white flex items-center gap-1 text-sm px-3 py-1 ml-auto font-bold"
                style={{ backgroundColor: "#0288D1", pointerEvents: "auto", zIndex: 10020 }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#0277BD")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#0288D1")}
              >
                {currentStep === "complete" || currentStep === "tutorial-skip-notice" ? "完了" : "次へ"}
                <ArrowRight className="w-3 h-3" />
              </Button>
            )}

            {stepData.waitForAction &&
              currentStep !== "voice-input" &&
              currentStep !== "voice-input-demo" &&
              currentStep !== "undo-explanation" &&
              currentStep !== "execution-overview" &&
              currentStep !== "current-task-explanation" && (
                <div
                  className="text-xs font-bold flex items-center gap-1 ml-auto status-text"
                  style={{ color: "#0288D1" }}
                >
                  
                  
                </div>
              )}
          </div>
        </div>
      )}
    </>
  )
}
