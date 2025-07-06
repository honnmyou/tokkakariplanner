import { breakdownTaskWithAI } from "../lib/task-breakdown-ai.js"

async function testNewPrompt() {
  console.log("🧪 新しいプロンプトのテストを開始...")

  // テストケース1: プレゼン資料作成
  const testCase1 = {
    title: "プレゼン資料を作成する",
    description:
      "新商品の紹介プレゼンを作成したいです。10分程度の発表で、スライドは10枚程度、グラフや画像も含めたいと思います。来週の金曜日までに完成させる必要があります。",
  }

  console.log("\n📋 テストケース1:")
  console.log(`タイトル: ${testCase1.title}`)
  console.log(`詳細: ${testCase1.description}`)

  try {
    const result1 = await breakdownTaskWithAI(testCase1.title, testCase1.description)

    if (result1.success) {
      console.log("\n✅ 分解成功!")
      console.log(`📝 生成されたステップ数: ${result1.tasks.length}`)
      console.log("\n🔍 分解結果:")
      result1.tasks.forEach((task, index) => {
        console.log(`${index + 1}. ${task}`)
      })

      // 新形式の確認
      const hasHints = result1.tasks.some((task) => task.includes("ヒント："))
      console.log(`\n💡 ヒント形式の確認: ${hasHints ? "✅ 含まれている" : "❌ 含まれていない"}`)

      // 文字数チェック
      const longTasks = result1.tasks.filter((task) => task.length > 50)
      console.log(`📏 50文字超過: ${longTasks.length}個`)
      if (longTasks.length > 0) {
        console.log("長すぎるタスク:")
        longTasks.forEach((task) => console.log(`  - ${task} (${task.length}文字)`))
      }
    } else {
      console.log("❌ 分解失敗:", result1.error)
    }
  } catch (error) {
    console.error("❌ テスト実行エラー:", error)
  }

  // テストケース2: レポート作成
  const testCase2 = {
    title: "環境問題についてのレポートを書く",
    description:
      "大学の授業でA4用紙2枚程度の環境問題に関するレポートを書く必要があります。テーマは地球温暖化で、原因と対策について調べて書きたいと思います。",
  }

  console.log("\n\n📋 テストケース2:")
  console.log(`タイトル: ${testCase2.title}`)
  console.log(`詳細: ${testCase2.description}`)

  try {
    const result2 = await breakdownTaskWithAI(testCase2.title, testCase2.description)

    if (result2.success) {
      console.log("\n✅ 分解成功!")
      console.log(`📝 生成されたステップ数: ${result2.tasks.length}`)
      console.log("\n🔍 分解結果:")
      result2.tasks.forEach((task, index) => {
        console.log(`${index + 1}. ${task}`)
      })

      // 品質チェック
      const hasAbstractWords = result2.tasks.some(
        (task) => task.includes("考える") || task.includes("検討する") || task.includes("調べる"),
      )
      console.log(`\n🚫 曖昧な表現チェック: ${hasAbstractWords ? "❌ 含まれている" : "✅ 具体的"}`)
    } else {
      console.log("❌ 分解失敗:", result2.error)
    }
  } catch (error) {
    console.error("❌ テスト実行エラー:", error)
  }

  console.log("\n🏁 テスト完了")
}

// テスト実行
testNewPrompt()
