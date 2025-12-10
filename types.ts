
// 商品カテゴリの列挙型
export enum ItemCategory {
  FOOD = "飲食物",
  GOODS = "物品",
  OTHER = "その他",
}

// 出店エリアの列挙型 (駒場祭のマップに基づく)
export enum BoothArea {
  MAIN_GATE = "正門・時計台エリア",
  GINKGO_AVENUE = "いちょう並木エリア",
  KOMABA_HALL = "900番講堂エリア",
  CP_PLAZA = "コミュニケーション・プラザエリア",
  BUILDING_1 = "1号館エリア",
  BUILDING_7 = "7号館エリア",
  BUILDING_10 = "10号館エリア",
  BUILDING_11 = "11号館エリア",
  BUILDING_13 = "13号館エリア",
  GROUND = "グラウンドエリア",
  OTHER = "その他",
}

// 商品のデータ構造を定義するインターフェース
export interface Item {
  id: string; // FirestoreのドキュメントID
  name: string; // 商品名
  description: string; // 商品説明
  category: ItemCategory;
  price: number; // 価格 (0の場合は「無料」と表示)
  imageUrl: string; // 商品画像のURL (Firebase Storage)
  boothArea: BoothArea;
  boothDetail: string; // 例: 「1103教室前」「グラウンド テントNo.5」
  exhibitorName: string; // 出店団体名
  postedAt: Date; // 投稿日時
  isSoldOut: boolean; // 売り切れフラグ
  userId: string; // 出品したユーザーのID
  user?: {
    name: string;
    picture?: string;
  } | null;
}

// Googleサインインで取得するユーザー情報のインターフェース
export interface User {
  id: string; // Google User ID
  name: string;
  email: string;
  picture?: string; // プロフィール画像のURL
}

// 通知のデータ構造
export interface Notification {
  id: number;
  message: string;
  type: 'success' | 'error';
}

// DM機能: 会話のデータ構造
export interface Conversation {
  id: string;
  participants: string[]; // ユーザーIDの配列
  itemId?: string; // 関連する商品ID（任意）
  item?: {
    name: string;
    imageUrl: string;
  } | null;
  lastMessage: string;
  lastMessageAt: Date | string;
  createdAt: Date | string;
  otherUser?: {
    id: string;
    name: string;
    picture?: string;
  } | null;
  unreadCount?: number;
}

// DM機能: メッセージのデータ構造
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: Date | string;
  read: boolean;
}
