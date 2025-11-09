import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

if (!GEMINI_API_KEY) {
  console.warn('[AI Service] Warning: GEMINI_API_KEY is not set');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export interface GenerateDescriptionInput {
  name: string;
  category: string;
  price: number;
  exhibitorName?: string;
}

export async function generateProductDescription(input: GenerateDescriptionInput): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    const prompt = createPrompt(input);

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    return text.trim();
  } catch (error) {
    console.error('[AI Service] Error generating description:', error);
    throw new Error('商品説明の生成に失敗しました');
  }
}

function createPrompt(input: GenerateDescriptionInput): string {
  const { name, category, price, exhibitorName } = input;

  const priceText = price === 0 ? '無料' : `${price}円`;
  const exhibitorText = exhibitorName ? `出店者: ${exhibitorName}` : '';

  return `あなたは駒場祭（東京大学の学園祭）のフリマアプリで使用される商品説明を生成するAIアシスタントです。

以下の情報を元に、魅力的で分かりやすい商品説明を生成してください。

【商品情報】
- 商品名: ${name}
- カテゴリ: ${category}
- 価格: ${priceText}
${exhibitorText}

【要件】
- 2〜3文程度の簡潔な説明にしてください
- 駒場祭の雰囲気に合った、親しみやすい文体で書いてください
- 商品の魅力や特徴を強調してください
- 「です・ます調」を使用してください
- 絵文字は使用しないでください
- 商品名やカテゴリをそのまま繰り返さないでください
- 実際には存在しない詳細情報（味、サイズ、材料など）を勝手に追加しないでください

商品説明のみを出力してください。`;
}
