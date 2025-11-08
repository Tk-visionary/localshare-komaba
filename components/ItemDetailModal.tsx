import React, { useEffect } from 'react';
import { Item } from '../types';
import { timeSince } from '../utils/date';

interface ItemDetailModalProps {
  item: Item | null;
  isOpen: boolean;
  onClose: () => void;
}

const ItemDetailModal: React.FC<ItemDetailModalProps> = ({ item, isOpen, onClose }) => {
  // ESCキーでモーダルを閉じる
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden'; // スクロール防止
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景オーバーレイ */}
      <div
        className="absolute inset-0 bg-gray-900 bg-opacity-30 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* モーダルコンテンツ */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto transform transition-all">
        {/* 閉じるボタン */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
          aria-label="閉じる"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* 売り切れバッジ */}
        {item.isSoldOut && (
          <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-10">
            <span className="text-white text-3xl font-bold transform -rotate-12 border-4 border-white px-6 py-3 bg-red-500 shadow-lg">
              売り切れ
            </span>
          </div>
        )}

        {/* 画像 */}
        <div className={`relative ${item.isSoldOut ? 'filter grayscale opacity-75' : ''}`}>
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-80 object-cover"
          />
        </div>

        {/* 商品詳細 */}
        <div className="p-8">
          {/* 商品名と価格 */}
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-3xl font-bold text-gray-800">{item.name}</h2>
            <span className={`text-3xl font-bold ${item.price === 0 ? 'text-komaba-teal' : 'text-komaba-orange'}`}>
              {item.price === 0 ? '無料' : `¥${item.price}`}
            </span>
          </div>

          {/* 商品説明 */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">商品説明</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{item.description}</p>
          </div>

          {/* 詳細情報 */}
          <div className="space-y-4 mb-6">
            <div className="flex items-start">
              <span className="text-sm font-semibold text-gray-700 w-24 flex-shrink-0">カテゴリ:</span>
              <span className="text-sm text-gray-600">{item.category}</span>
            </div>

            <div className="flex items-start">
              <span className="text-sm font-semibold text-gray-700 w-24 flex-shrink-0">場所:</span>
              <div className="text-sm text-gray-600">
                <p>{item.boothArea}</p>
                <p className="text-gray-500">{item.boothDetail}</p>
              </div>
            </div>

            <div className="flex items-start">
              <span className="text-sm font-semibold text-gray-700 w-24 flex-shrink-0">出店者:</span>
              <span className="text-sm text-gray-600">{item.exhibitorName}</span>
            </div>

            <div className="flex items-start">
              <span className="text-sm font-semibold text-gray-700 w-24 flex-shrink-0">投稿日時:</span>
              <span className="text-sm text-gray-500">{timeSince(item.postedAt)}</span>
            </div>
          </div>

          {/* 閉じるボタン */}
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetailModal;
