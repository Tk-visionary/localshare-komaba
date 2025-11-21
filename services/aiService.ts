import { VertexAI } from '@google-cloud/vertexai';

// Initialize Vertex AI
const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'localshare-komaba-54c0d';
const location = 'asia-northeast1'; // Tokyo region

const vertexAI = new VertexAI({ project: projectId, location: location });

export interface GenerateDescriptionInput {
  name: string;
  category: string;
  price: number;
  exhibitorName?: string;
  boothDetail?: string;
  existingDescription?: string;
}

export async function generateProductDescription(input: GenerateDescriptionInput): Promise<string> {
  try {
    const model = vertexAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
    });

    const prompt = createPrompt(input);

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!text) {
      throw new Error('生成結果が空です');
    }

    return text.trim();
  } catch (error) {
    console.error('[AI Service] Error generating description:', error);
    throw new Error('商品説明の生成に失敗しました');
  }
}

function createPrompt(input: GenerateDescriptionInput): string {
  const { name, category, price, exhibitorName, boothDetail, existingDescription } = input;

  const priceText = price === 0 ? '無料' : `${price}円`;
  const exhibitorText = exhibitorName ? `- 出店団体: ${exhibitorName}` : '';
  const detailText = boothDetail ? `- 出店場所詳細: ${boothDetail}` : '';
  const existingText = existingDescription ? `- ユーザーが入力した説明: ${existingDescription}` : '';

  return `あなたは駒場祭のフリマアプリ「LocalShare駒場」で商品説明を生成するAIです。
このアプリは東大生が東大生に向けて余った物資を出品・譲渡するためのサービスです。

【最重要】ユーザーが入力した説明がある場合、そこに含まれる情報（個数、数量、セット内容など）は絶対に省略せず、必ず説明に含めてください。

【商品情報】
- 商品名: ${name}
- カテゴリ: ${category}
- 価格: ${priceText}
${exhibitorText}
${detailText}
${existingText}

【出力要件】
- 2〜3文程度の簡潔な説明
- 東大生同士のやり取りにふさわしい、フラットで実用的な文体（過度にフレンドリーにしない）
- 「です・ます調」を使用
- 絵文字は使用しない
- 商品名やカテゴリをそのまま繰り返さない
- 実際には存在しない詳細情報（味、サイズ、材料など）を勝手に追加しない
- 「来場者」「お客様」などの表現は使わない（利用者は全員東大生）

商品説明のみを出力してください。`;
}
