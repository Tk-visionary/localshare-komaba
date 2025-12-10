import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Item } from '../types';
import { timeSince } from '../utils/date';
import { useAuth } from '../contexts/AuthContext';
import * as messageApi from '../services/messageApi';

interface ItemDetailModalProps {
  item: Item | null;
  isOpen: boolean;
  onClose: () => void;
}

const ItemDetailModal: React.FC<ItemDetailModalProps> = ({ item, isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isStartingChat, setIsStartingChat] = useState(false);

  // 出品者にメッセージを送る
  const handleSendMessage = async () => {
    if (!item || !currentUser) {
      toast.error('ログインしてください');
      navigate('/login');
      return;
    }

    if (item.userId === currentUser.id) {
      toast.error('自分の出品にはメッセージを送れません');
      return;
    }

    setIsStartingChat(true);
    try {
      const conversation = await messageApi.createConversation(item.userId, item.id);
      onClose();
      navigate(`/messages?id=${conversation.id}`);
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.error('メッセージの開始に失敗しました');
    } finally {
      setIsStartingChat(false);
    }
  };
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
        className="absolute inset-0 backdrop-blur-sm"
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
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-rose-600 blur-md opacity-60 rounded-xl"></div>
              <span className="relative inline-block text-white text-3xl font-black tracking-wide transform -rotate-3 px-8 py-3.5 bg-gradient-to-br from-red-500 via-rose-500 to-red-600 shadow-2xl rounded-xl border-2 border-white/30">
                売り切れ
              </span>
            </div>
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
        <div className="p-6 md:p-8">
          {/* 商品名と価格 */}
          <div className="flex justify-between items-start mb-4 gap-4">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800">{item.name}</h2>
            <span className={`text-xl md:text-2xl lg:text-3xl font-bold flex-shrink-0 ${item.price === 0 ? 'text-komaba-teal' : 'text-komaba-orange'}`}>
              {item.price === 0 ? '無料' : `¥${item.price}`}
            </span>
          </div>

          {/* 商品説明 */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">商品説明</h3>
            <p className="text-sm md:text-base text-gray-700 leading-relaxed whitespace-pre-wrap">{item.description}</p>
          </div>

          {/* 詳細情報 */}
          <div className="space-y-3 md:space-y-4 mb-6">
            <div className="flex items-start">
              <span className="text-xs md:text-sm font-semibold text-gray-700 w-20 md:w-24 flex-shrink-0">カテゴリ:</span>
              <span className="text-xs md:text-sm text-gray-600">{item.category}</span>
            </div>

            <div className="flex items-start">
              <span className="text-xs md:text-sm font-semibold text-gray-700 w-20 md:w-24 flex-shrink-0">場所:</span>
              <div className="text-xs md:text-sm text-gray-600">
                <p>{item.boothArea}</p>
                <p className="text-gray-500">{item.boothDetail}</p>
              </div>
            </div>

            <div className="flex items-start">
              <span className="text-xs md:text-sm font-semibold text-gray-700 w-20 md:w-24 flex-shrink-0">出店者:</span>
              <span className="text-xs md:text-sm text-gray-600">{item.exhibitorName}</span>
            </div>

            <div className="flex items-start">
              <span className="text-xs md:text-sm font-semibold text-gray-700 w-20 md:w-24 flex-shrink-0">投稿日時:</span>
              <span className="text-xs md:text-sm text-gray-500">{timeSince(item.postedAt)}</span>
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex justify-end gap-3">
            {/* メッセージボタン（自分の出品でない場合のみ表示） */}
            {currentUser && item.userId !== currentUser.id && (
              <button
                onClick={handleSendMessage}
                disabled={isStartingChat}
                className="px-6 py-3 bg-komaba-orange text-white rounded-lg hover:brightness-90 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
              >
                {isStartingChat ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                )}
                メッセージを送る
              </button>
            )}
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
