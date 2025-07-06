"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X, ArrowLeft, ArrowRight, Play, Plus } from "lucide-react"
interface TutorialModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
}

const TUTORIAL_STEPS = [
  {
    id: 1,
    title: "とっかかりプランナーへようこそ！",
    content: (
      <div className="text-center space-y-6">
        <div className="text-7xl mb-6">🎯</div>
        <div className="space-y-4">
          <p className="text-xl font-medium text-gray-800">
            やるとが多すぎて
            <br />
            <span className="text-teal-600 font-bold">「何から始めればいいかわからない...」</span>
          </p>
          <p className="text-lg text-gray-600">そんな時に使うアプリです</p>
        </div>
        <div className="bg-gradient-to-r from-teal-50 to-blue-50 p-6 rounded-xl border border-teal-100">
          <div className="space-y-3">
            <h4 className="text-lg font-bold text-teal-700">このアプリでできること</h4>
            <div className="space-y-2 text-sm text-teal-600">
              <p>📝 大きなタスクを小さなステップに分解</p>
              <p>🎯 「最初の一歩」を見つける</p>
              <p>✅ 一つずつ確実に進める</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 2,
    title: "2つのタブを使い分けよう",
    content: (
      <div className="space-y-8">
        <div className="text-center">
          <p className="text-lg text-gray-600 mb-6">
            タスクを<span className="font-bold text-gray-800">緊急度</span>で分けて管理します
          </p>
          <div className="flex mb-6 rounded-lg overflow-hidden border border-gray-200">
            <div className="flex-1 py-4 px-4 text-center font-medium text-red-500 bg-red-50 border-r border-red-200">
              まず最初にやる事
            </div>
            <div className="flex-1 py-4 px-4 text-center font-medium text-blue-500 bg-blue-50">
              後でじっくり考える事
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-red-50 p-6 rounded-xl border border-red-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-2xl">🔥</div>
              <h4 className="text-lg font-bold text-red-700">まず最初にやる事</h4>
            </div>
            <p className="text-red-600 mb-4 leading-relaxed">
              今すぐ取り掛かりたいタスクや、締切が近いものを入れましょう
            </p>
            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">例えば...</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 明日の会議の準備</li>
                <li>• 締切が近いレポート</li>
                <li>• 今週中に終わらせたい作業</li>
              </ul>
            </div>
          </div>

          <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-2xl">💭</div>
              <h4 className="text-lg font-bold text-blue-700">後でじっくり考える事</h4>
            </div>
            <p className="text-blue-600 mb-4 leading-relaxed">
              重要だけど急ぎではないもの、長期的な目標などを入れましょう
            </p>
            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">例えば...</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• スキルアップの勉強</li>
                <li>• 将来の計画立て</li>
                <li>• 趣味のプロジェクト</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 3,
    title: "タスクを追加してみよう",
    content: (
      <div className="space-y-8">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-teal-600 rounded-full shadow-lg">
            <Plus className="w-10 h-10 text-white" />
          </div>
          <div className="space-y-3">
            <p className="text-xl font-medium text-gray-800">
              右下の<span className="text-teal-600 font-bold">+ボタン</span>を押して
            </p>
            <p className="text-lg text-gray-600">思いついたタスクをどんどん追加しましょう</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
            <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-xl">📝</span>
              こんなタスクを追加してみてください
            </h4>
            <div className="space-y-3">
              <div className="bg-white p-4 rounded-lg border border-gray-100">
                <p className="font-medium text-gray-700">「プレゼン資料を作成する」</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-100">
                <p className="font-medium text-gray-700">「新しいプロジェクトの企画書を書く」</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-100">
                <p className="font-medium text-gray-700">「部屋の大掃除をする」</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200">
            <div className="flex items-start gap-3">
              <div className="text-2xl">💡</div>
              <div className="space-y-2">
                <h4 className="font-bold text-yellow-800">最初は大まかでOK！</h4>
                <p className="text-yellow-700 leading-relaxed">
                  詳しい手順がわからなくても大丈夫です。
                  <br />
                  次のステップで細かく分解できるので、
                  <br />
                  まずは思いついたことをどんどん追加しましょう。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 4,
    title: "大きなタスクを小さく分解しよう",
    content: (
      <div className="space-y-8">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-teal-600 rounded-full shadow-lg">
            <img src="/images/breakdown-icon-blue.png" alt="分解" className="w-10 h-10 filter brightness-0 invert" />
          </div>
          <div className="space-y-3">
            <p className="text-xl font-medium text-gray-800">
              <span className="text-teal-600 font-bold">分解ボタン</span>で
            </p>
            <p className="text-lg text-gray-600">大きなタスクを小さなステップに分けます</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
            <h4 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
              <span className="text-xl">🎯</span>
              分解の手順
            </h4>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  1
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-gray-800">タスクの右側にある分解ボタンをタップ</p>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <img src="/images/breakdown-icon-blue.png" alt="分解" className="w-4 h-4" />
                    <span>このマークです</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  2
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-gray-800">音声入力でタスクの詳細を説明</p>
                  <p className="text-sm text-gray-600">マイクボタンを押して話してください</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  3
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-gray-800">AIが自動で小さなステップに分解</p>
                  <p className="text-sm text-gray-600">数秒で分解結果が表示されます</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  4
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-gray-800">分解されたタスクを確認・編集</p>
                  <p className="text-sm text-gray-600">必要に応じて修正や並び替えができます</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-teal-50 p-6 rounded-xl border border-teal-200">
            <div className="flex items-start gap-3">
              <div className="text-2xl">💬</div>
              <div className="space-y-3">
                <h4 className="font-bold text-teal-800">音声入力のコツ</h4>
                <div className="space-y-2 text-teal-700">
                  <p>✓ 「このタスクで何をしたいか」を具体的に話す</p>
                  <p>✓ 「最終的なゴール」を明確に伝える</p>
                  <p>✓ 「どんな手順が必要そうか」も話してみる</p>
                </div>
                <p className="text-sm text-teal-600 bg-white p-3 rounded-lg">
                  詳しく話すほど、より実用的なステップに分解されます
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 5,
    title: "分解したタスクを順番に実行しよう",
    content: (
      <div className="space-y-8">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-teal-600 rounded-full shadow-lg">
            <Play className="w-10 h-10 text-white" />
          </div>
          <div className="space-y-3">
            <p className="text-xl font-medium text-gray-800">
              <span className="text-teal-600 font-bold">再生ボタン</span>で
            </p>
            <p className="text-lg text-gray-600">分解したタスクを一つずつ実行していきます</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
            <h4 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
              <span className="text-xl">🎯</span>
              実行のポイント
            </h4>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg border border-gray-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-3 h-3 bg-teal-600 rounded-full"></div>
                  <p className="font-medium text-gray-800">現在のタスクに集中</p>
                </div>
                <p className="text-sm text-gray-600 ml-6">一つずつ確実に進めていきましょう</p>
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                  <p className="font-medium text-gray-800">完了したら次のタスクへ</p>
                </div>
                <p className="text-sm text-gray-600 ml-6">チェックを入れると自動で次に進みます</p>
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-2 bg-teal-600 rounded-full"></div>
                  <p className="font-medium text-gray-800">進捗を確認しながら</p>
                </div>
                <p className="text-sm text-gray-600 ml-6">どのくらい進んだかが一目でわかります</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-6 rounded-xl border border-green-200">
            <div className="flex items-start gap-3">
              <div className="text-2xl">🎉</div>
              <div className="space-y-3">
                <h4 className="font-bold text-green-800">完了時の特典</h4>
                <div className="space-y-2 text-green-700">
                  <p>✓ 各タスク完了時に猫からの褒め言葉</p>
                  <p>✓ 全部完了すると盛大なお祝い</p>
                  <p>✓ 達成感とモチベーションアップ</p>
                </div>
                <p className="text-sm text-green-600 bg-white p-3 rounded-lg">小さな達成も大切にお祝いします！</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 6,
    title: "さあ、始めましょう！",
    content: (
      <div className="text-center space-y-8">
        <div className="text-8xl mb-8">🚀</div>
        <div className="space-y-4">
          <p className="text-2xl font-medium text-gray-800">準備完了です！</p>
          <p className="text-lg text-gray-600 leading-relaxed">
            <span className="text-teal-600 font-bold">「とっかかり」</span>を見つけて、
            <br />
            一歩ずつ確実に前に進んでいきましょう。
          </p>
        </div>

        <div className="bg-gradient-to-r from-teal-50 via-blue-50 to-purple-50 p-8 rounded-xl border border-teal-100">
          <h4 className="text-xl font-bold text-teal-700 mb-6 flex items-center justify-center gap-2">
            <span className="text-2xl">🌟</span>
            成功のコツ
          </h4>
          <div className="grid grid-cols-1 gap-4 text-left">
            <div className="bg-white p-4 rounded-lg border border-teal-100">
              <div className="flex items-start gap-3">
                <div className="text-lg">🎯</div>
                <div>
                  <p className="font-medium text-gray-800 mb-1">完璧を求めすぎない</p>
                  <p className="text-sm text-gray-600">まずは「とっかかり」を大切に</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-teal-100">
              <div className="flex items-start gap-3">
                <div className="text-lg">🔧</div>
                <div>
                  <p className="font-medium text-gray-800 mb-1">大きなタスクは遠慮なく分解</p>
                  <p className="text-sm text-gray-600">小さくすれば必ず進められます</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-teal-100">
              <div className="flex items-start gap-3">
                <div className="text-lg">🎊</div>
                <div>
                  <p className="font-medium text-gray-800 mb-1">小さな進歩も自分を褒める</p>
                  <p className="text-sm text-gray-600">一歩進んだことを大切に</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-teal-100">
              <div className="flex items-start gap-3">
                <div className="text-lg">💬</div>
                <div>
                  <p className="font-medium text-gray-800 mb-1">困ったら音声入力で詳しく説明</p>
                  <p className="text-sm text-gray-600">AIがより良い分解をしてくれます</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
]

export function TutorialModal({ isOpen, onClose, onComplete }: TutorialModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [showAnimation, setShowAnimation] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setShowAnimation(true)
    }
  }, [isOpen])

  if (!isOpen) return null

  const currentStepData = TUTORIAL_STEPS.find((step) => step.id === currentStep)
  const isFirstStep = currentStep === 1
  const isLastStep = currentStep === TUTORIAL_STEPS.length

  const handleNext = () => {
    if (isLastStep) {
      onComplete()
    } else {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    onComplete()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className={`bg-white rounded-3xl w-full max-w-2xl transform transition-all duration-500 ease-out ${
          showAnimation ? "opacity-100 scale-100" : "opacity-0 scale-95"
        } shadow-2xl`}
        style={{
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-8 pb-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-teal-600">チュートリアル</h2>
            <div className="bg-teal-100 text-teal-600 px-3 py-1.5 rounded-full text-sm font-medium">
              {currentStep} / {TUTORIAL_STEPS.length}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-gray-100 w-10 h-10">
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="px-8 py-4 flex-shrink-0">
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-teal-600 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(currentStep / TUTORIAL_STEPS.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6 min-h-0">
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-900 text-center">{currentStepData?.title}</h3>
            <div className="text-gray-700 leading-relaxed">{currentStepData?.content}</div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 pt-6 border-t border-gray-100 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex gap-3">
              {!isFirstStep && (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  className="flex items-center gap-2 px-6 py-3 bg-transparent"
                >
                  <ArrowLeft className="w-4 h-4" />
                  戻る
                </Button>
              )}
              <Button variant="ghost" onClick={handleSkip} className="text-gray-500 hover:text-gray-700 px-6 py-3">
                スキップ
              </Button>
            </div>
            <Button
              onClick={handleNext}
              className="bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-2 px-8 py-3 text-lg"
            >
              {isLastStep ? "始める" : "次へ"}
              {!isLastStep && <ArrowRight className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
