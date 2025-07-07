import { createOpenAI } from "@ai-sdk/openai";
import { AI_CONFIG } from "./ai-config";
// 必要な型をインポートします
import { LanguageModelV1Message, LanguageModelV1TextPart } from "@ai-sdk/provider";

export interface TaskBreakdownResult {
  success: boolean;
  tasks: string[];
  error?: string;
}

export async function breakdownTaskWithAI(
  taskTitle: string,
  userDescription: string
): Promise<TaskBreakdownResult> {
  try {
    // --- デバッグ用のログを追加 ---
    console.log("--- API Key Debugging Start ---");
    // process.env.open_api_key の生の値を確認
    console.log("process.env.open_api_key (raw value):", process.env.open_api_key);
    // AI_CONFIG.open_api_key がどのように設定されているか確認
    console.log("AI_CONFIG.open_api_key (from config file):", AI_CONFIG.open_api_key);
    console.log("--- API Key Debugging End ---");
    // -----------------------------

    // ここで AI_CONFIG.open_api_key をチェック
    if (!AI_CONFIG.open_api_key) {
      throw new Error("OpenAI API key is not configured");
    }

    console.log(
      "🔑 Using OpenAI API key:",
      AI_CONFIG.open_api_key.substring(0, 20) + "..."
    );

    const openai = createOpenAI({
      apiKey: AI_CONFIG.open_api_key, // 修正済み
    });

    const promptText = createTaskBreakdownPrompt(taskTitle, userDescription);

    // LanguageModelV1Message 型に合うようにメッセージ配列を構築
    const messages: Array<LanguageModelV1Message> = [
      {
        role: "user",
        // content は LanguageModelV1TextPart の配列である必要があります
        content: [{ type: "text", text: promptText }] as Array<LanguageModelV1TextPart>,
      },
    ];

    console.log("🤖 Calling OpenAI API...");

    // --- 最終修正: doGenerate と正しいオプション構造 ---
    const result = await openai.chat("gpt-4o-mini").doGenerate({
      prompt: messages, // 'messages' ではなく 'prompt' を使用
      inputFormat: 'messages', // inputFormat は必須
      mode: { type: 'regular' }, // mode も必須
      temperature: 0.7,
      maxTokens: 1000,
    });

    // result.text が undefined の可能性があるため、安全にアクセス
    const text = result.text ?? "";

    if (!text) {
        throw new Error("AIからの応答が空でした。");
    }
    // --- 修正ここまで ---

    console.log(
      "✅ OpenAI API response received:",
      text.substring(0, 100) + "..."
    );

    const tasks = parseTaskBreakdownResponse(text);

    console.log("📝 Parsed tasks:", tasks);

    return {
      success: true,
      tasks,
    };
  } catch (error) {
    console.error("❌ Task breakdown AI error:", error);

    let errorMessage = "タスクの分解中にエラーが発生しました";

    if (error instanceof Error) {
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });

      if (error.message.includes("API key") || error.message.includes("missing")) {
        errorMessage = "APIキーの設定に問題があります。設定を確認してください。";
      } else if (error.message.includes("network") || error.message.includes("fetch")) {
        errorMessage = "ネットワークエラーが発生しました。インターネット接続を確認してください";
      } else if (error.message.includes("quota") || error.message.includes("limit")) {
        errorMessage = "API利用制限に達しました。しばらく時間をおいてから再試行してください";
      } else if (error.message.includes("invalid") || error.message.includes("unauthorized")) {
        errorMessage = "APIキーが無効です。正しいAPIキーを設定してください。";
      } else if (error.message.includes("insufficient_quota")) {
        errorMessage = "APIの利用制限に達しました。OpenAIアカウントの残高を確認してください。";
      } else {
        errorMessage = `エラー: ${error.message}`;
      }
    }

    return {
      success: false,
      tasks: [],
      error: errorMessage,
    };
  }
}

// createTaskBreakdownPrompt および parseTaskBreakdownResponse 関数は変更なし
function createTaskBreakdownPrompt(
  taskTitle: string,
  userDescription: string
): string {
  return `【タスク情報】
- タスクタイトル: ${taskTitle}
- 詳細説明: ${userDescription}

【分解のルール】
- ストーリーポイント1相当（30分〜2時間）になるまで細かく分けてください。
- 各ステップは「目的」と「ヒント」を1つのタスクとして統合してください。
- 曖昧な言葉は禁止（例：「調べる」→「Webで"〇〇とは"と検索する」）
- 各ステップは**必ず具体的に手を動かせる内容**にしてください（「考える」や「検討する」はNG）
- MECEは「作業工程全体が重複なく・漏れなくカバーされている」ことを意識してください。分類のMECEではありません。
- 人間の思考力をサポートするように、Google など固有のサービスを固定せずに記載ください。
- 人間の思考力がなくならないように、以下のストレスがかからない書き方にしてください。
  - 思考の発散のタイミング、調査のタイミングで、Webや本などで調査するなど、やり方の指定の記載がある時、調査方法を具体的に指定せず、あくまで「ヒント」としていくつかの例を提示しつつ、ユーザーが自由に最適な方法を選択できる余地を残してください。

【出力形式】
- 各ステップは「目的」と「ヒント：」を含む1つのタスクとして出力する
- 目的を最初に書き、改行してから「ヒント：」で具体的な方法を説明する
- 上から順番に、誰でもそのまま実行できるように並べてください

【入力例】
> A4１枚でヤングケアラーについてのレポートを作成したいです。

【出力例】
ヤングケアラーの基本的な意味を理解する
ヒント：検索エンジンで「ヤングケアラーとは」と検索し、簡単な説明を読む

レポートの構成（見出し）を決める
ヒント：例として「定義」「現状」「課題」「支援策」など、A4一枚に収まる見出しを3～4個考える

各見出しごとに使う情報をメモにまとめる
ヒント：検索結果や信頼できる記事から、短い文章やキーワードをコピーして貼り付ける

レポートの文章を作成するための下書きを作る
ヒント：メモした情報を元に、簡単な文章を見出しごとに書き写す

下書きをA4一枚のフォーマットにまとめる
ヒント：WordやGoogleドキュメントで用紙サイズA4に設定し、文章を整理して配置する

誤字脱字や文法のミスをチェックする
ヒント：読み返して気になる部分を修正し、Webの文法チェックツールも使う

完成したレポートをPDFに保存する
ヒント：ファイル→名前を付けて保存でPDF形式を選択し保存する

それでは、上記のタスクを分解してください。`
}

function parseTaskBreakdownResponse(response: string): string[] {
  try {
    const lines = response
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .filter((line) => !line.startsWith("#"))
      .filter((line) => !line.startsWith("例："))
      .filter((line) => !line.includes("それでは"))

    const tasks: string[] = [];
    let currentTask = "";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const cleanedLine = line
        .replace(/^\d+\.\s*/, "")
        .replace(/^[-*]\s*/, "")
        .trim();

      if (cleanedLine.startsWith("ヒント：")) {
        if (currentTask) {
          currentTask += "\n" + cleanedLine;
          tasks.push(currentTask);
          currentTask = "";
        }
      } else {
        if (currentTask) {
          tasks.push(currentTask);
        }
        currentTask = cleanedLine;
      }
    }

    if (currentTask) {
      tasks.push(currentTask);
    }

    if (tasks.length === 0) {
      throw new Error("No valid tasks found in response");
    }

    return tasks.slice(0, 100);
  } catch (error) {
    console.error("Failed to parse task breakdown response:", error);
    return [
      "タスクの詳細を整理する\nヒント：必要な情報や手順を紙やメモアプリに書き出してみる",
      "必要な情報を収集する\nヒント：インターネット検索や関連資料から情報を集める",
      "作業計画を立てる\nヒント：優先順位をつけて、どの順番で進めるかを決める",
      "実際の作業を開始する\nヒント：最も簡単で取り組みやすいものから始める",
      "進捗を確認して調整する\nヒント：定期的に進み具合をチェックし、必要に応じて計画を見直す",
      "最終確認を行う\nヒント：完成したものを見直して、要件を満たしているか確認する",
    ];
  }
}

// APIキーのテスト用関数
export async function testAIConnection(): Promise<boolean> {
  try {
    console.log("🧪 Testing OpenAI API connection...");
    const openai = createOpenAI({
      apiKey: AI_CONFIG.open_api_key, // 修正済み
    });

    const testPromptText = "これはAPI接続のテストです";
    const testMessages: Array<LanguageModelV1Message> = [
      { role: "user", content: [{ type: "text", text: testPromptText }] as Array<LanguageModelV1TextPart> },
    ];

    // ここも doGenerate と正しいオプション構造に修正
    const result = await openai.chat("gpt-4o-mini").doGenerate({
      prompt: testMessages,
      inputFormat: 'messages',
      mode: { type: 'regular' },
      temperature: 0.7,
      maxTokens: 100,
    });

    const testText = result.text ?? "";
    
    console.log("🧪 Test result:", testText.substring(0, 50) + "...");
    return true;
  } catch (error) {
    console.error("❌ AI connection test failed:", error);
    return false;
  }
}