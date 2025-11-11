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
  const { name, category, price, exhibitorName, boothDetail } = input;

  const priceText = price === 0 ? '無料' : `${price}円`;
  const exhibitorText = exhibitorName ? `- 出店者: ${exhibitorName}` : '';
  const detailText = boothDetail ? `- 詳細情報: ${boothDetail}` : '';

  return `あなたは駒場祭（東京大学の学園祭）のフリマアプリで使用される商品説明を生成するAIアシスタントです。

以下の情報を元に、魅力的で分かりやすい商品説明を生成してください。

【商品情報】
- 商品名: ${name}
- カテゴリ: ${category}
- 価格: ${priceText}
${exhibitorText}
${detailText}

【要件】
- 2〜3文程度の簡潔な説明にしてください
- 駒場祭の雰囲気に合った、親しみやすい文体で書いてください
- 商品の魅力や特徴を強調してください
- 詳細情報に個数や数量が含まれている場合は、その情報を説明に含めてください
- 「です・ます調」を使用してください
- 絵文字は使用しないでください
- 商品名やカテゴリをそのまま繰り返さないでください
- 実際には存在しない詳細情報（味、サイズ、材料など）を勝手に追加しないでください

商品説明のみを出力してください。`;
}
