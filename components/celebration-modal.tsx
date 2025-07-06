"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

interface CelebrationModalProps {
  isOpen: boolean
  onClose: () => void
  taskTitle: string
  onCompleteTask?: () => void // タスク完了時の処理
  tutorialStep?: string | null
  onTutorialStepComplete?: (step: string) => void
}

const PRAISE_MESSAGES = [
  "やったニャ！！今この瞬間、世界でいちばんえらいニャ！！",
  "すごいニャすごいニャ！！伝説のタスク、ほんとに終わったニャ！？信じられないニャ！！",
  "その成し遂げたそれ、尊すぎてしっぽが感電したニャ。",
  "もしかして神？いや、今日だけは神ニャ。",
  "この喜び、猫のゴロゴロ音の最大級バージョンニャ！聴こえるニャ？",
  "喜びの舞いを始めてしまったニャ……ああ……止まらないニャ……！！",
  "すばらしいニャ！！この感動は永久保存ニャ！タンスの奥にしまっておくニャ！",
  "やったこと、詩にして後世に伝えるニャ……第一章「たすく完遂の章」ニャ。",
  "信じられないニャ！こんなことってあるニャ！？猫生最大の衝撃ニャ！",
  "すごすぎて言葉が出ないニャ……ただただ、圧倒的ニャ……！",
  "この達成、猫界の歴史に刻まれるニャ！伝説誕生の瞬間ニャ！",
  "やったニャ！やったニャ！やったニャー！重要なので三回言いましたニャ！",
  "この喜び、全宇宙の猫と分かち合いたいニャ！通信回線繋ぐニャ！",
  "信じられニャい……まさか……本当に……やったニャアアアア！！！",
  "この感動をどう表現すればいいか、猫語辞典にも載ってないニャ！",
  "この偉業を称え、今から盛大に猫缶パーティーを開催するニャ！",
  "もはや言葉はいらないニャ……ただただ、ひれ伏すのみニャ……！",
  "この達成、猫の教科書に載せるべきニャ！全猫必修科目ニャ！",
  "やったニャ！やったニャ！やったニャ！嬉しすぎて踊り狂うニャ！",
  "この感動、猫まっしぐらニャ！猫まっしぐら！猫まっしぐらニャ！",
  "信じられないニャ！こんなすごいことって、本当に起こるんだニャ！",
  "やったニャ！やったニャ！やったニャ！嬉しすぎて、もう一回言っちゃったニャ！",
  "この達成、猫の神様も祝福してるニャ！きっとそうだニャ！",
  "信じられないニャ！こんなすごいこと、猫にも真似できないニャ！",
  "この感動、猫の魂に刻み込むニャ！一生忘れないニャ！",
  "やったニャ！やったニャ！やったニャ！嬉しすぎて、涙がちょちょぎれるニャ！",
  "この達成、猫界の宝ニャ！大切にするニャ！",
  "信じられないニャ！こんなすごいこと、猫の想像を遥かに超えているニャ！",
  "やばいニャ！やばすぎるニャ！感動のあまり、背中の毛が逆立ったニャ！今日からここは聖地ニャ！",
  "ひゃっほーい！この喜び、猫の尻尾がプロペラみたいに回っちゃうニャ！空飛べそうニャ！",
]

const CELEBRATION_IMAGES = [
  "/images/cat-celebration-1.png",
  "/images/cat-celebration-2.png",
  "/images/cat-celebration-3.jpg",
]

export function CelebrationModal({
  isOpen,
  onClose,
  taskTitle,
  onCompleteTask,
  tutorialStep,
  onTutorialStepComplete,
}: CelebrationModalProps) {
  const [message, setMessage] = useState("")
  const [image, setImage] = useState("")
  const [showAnimation, setShowAnimation] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // ランダムなメッセージと画像を選択
      const randomMessage = PRAISE_MESSAGES[Math.floor(Math.random() * PRAISE_MESSAGES.length)]
      const randomImage = CELEBRATION_IMAGES[Math.floor(Math.random() * CELEBRATION_IMAGES.length)]

      setMessage(randomMessage)
      setImage(randomImage)

      // 直接フェードインアニメーションを開始
      setShowAnimation(true)
    } else {
      // モーダルが閉じる時はアニメーションをリセット
      setShowAnimation(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && tutorialStep === "complete-first-task") {
      // 3秒後に自動的に次のステップに進む
      const timer = setTimeout(() => {
        console.log("Tutorial: Auto-progressing after 3 seconds")
        handleNext()
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [isOpen, tutorialStep])

  const handleNext = () => {
    console.log("Celebration modal Next button clicked or auto-progressed, tutorialStep:", tutorialStep)

    // Tutorial: 祝福モーダルの「次へ」ボタンが押された時の処理
    if (tutorialStep === "complete-first-task" && onTutorialStepComplete) {
      console.log("Tutorial: Moving to interrupt-explanation step")

      // まずモーダルを閉じる
      onClose()

      // onCompleteTaskがあれば実行（チュートリアル進行を含む）
      if (onCompleteTask) {
        onCompleteTask()
      }

      // 少し遅延してからチュートリアルステップを完了
      setTimeout(() => {
        onTutorialStepComplete("complete-first-task")
      }, 100)
    } else {
      // 通常の処理
      onClose()
      if (onCompleteTask) {
        onCompleteTask()
      }
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="celebration-modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ zIndex: 50000 }}
    >
      <div
        className={`bg-white rounded-2xl w-full max-w-sm transform transition-all duration-300 ease-out ${
          showAnimation ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
        style={{ maxHeight: "80vh", display: "flex", flexDirection: "column", zIndex: 50001 }}
      >
        {/* スクロール可能なコンテンツエリア */}
        <div
          className="flex-1 p-6 text-center"
          style={{
            overflowY: "auto",
            minHeight: 0,
          }}
        >
          {/* 祝福画像 */}
          <div className="mb-4">
            <img src={image || "/placeholder.svg"} alt="お祝い猫" className="w-32 h-32 mx-auto object-contain" />
          </div>

          {/* タスク完了メッセージ */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-teal-600 mb-4">タスク完了！</h2>
          </div>

          {/* 褒め言葉 */}
          <div className="mb-6">
            <p className="text-base leading-relaxed text-gray-800 font-bold celebration-message">{message}</p>
          </div>
        </div>

        {/* 固定ボタンエリア */}
        <div className="flex-shrink-0 p-6 pt-0 border-t border-gray-100">
          <Button
            onClick={handleNext}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold"
            style={{ zIndex: 50002 }}
          >
            次へ
          </Button>
        </div>
      </div>
    </div>
  )
}
