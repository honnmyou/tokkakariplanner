// APIキーの設定 - OpenAIに変更
export const AI_CONFIG = {
  open_api_key: process.env.open_api_key|| "",

  // 他のAIプロバイダーのAPIキーもここに追加可能
  // GOOGLE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY || "",
  // ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || "",
};

// 使用するAIプロバイダーの設定
export const AI_PROVIDER = "openai"; // "openai" | "google" | "anthropic"
