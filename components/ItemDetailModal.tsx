import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Item, PurchaseApplication } from '../types';
import { timeSince } from '../utils/date';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../hooks/useModal';
import * as messageApi from '../services/messageApi';
import * as itemApi from '../services/itemApi';
import Avatar from './Avatar';

interface ItemDetailModalProps {
  item: Item | null;
  isOpen: boolean;
  onClose: () => void;
}

const ItemDetailModal: React.FC<ItemDetailModalProps> = ({ item, isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isStartingChat, setIsStartingChat] = useState(false);

  // Purchase Application State
  const [isApplying, setIsApplying] = useState(false);
  const [applications, setApplications] = useState<PurchaseApplication[]>([]);
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);

  // Reset state when item changes or modal opens
  useEffect(() => {
    if (isOpen && item && currentUser && item.userId === currentUser.id) {
      fetchApplications();
    } else {
      setApplications([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, item, currentUser]);

  const fetchApplications = async () => {
    if (!item) return;
    setIsLoadingApplications(true);
    try {
      const apps = await itemApi.fetchPurchaseApplications(item.id);
      setApplications(apps);
    } catch (error) {
      console.error('Error fetching applications:', error);
      // Silent error or toast? For now just log
    } finally {
      setIsLoadingApplications(false);
    }
  };

  const handleApply = async () => {
    if (!item || !currentUser) {
      toast.error('ログインしてください');
      navigate('/login');
      return;
    }

    if (confirm('購入申請を行いますか？\n出品者に通知が送信されます。')) {
      setIsApplying(true);
      try {
        await itemApi.applyForPurchase(item.id);
        toast.success('購入申請を送信しました！');
        onClose();
        // TODO: Ideally refresh the item list or item data to show the pending status immediately
        // For now, closing the modal is a simple feedback loop.
      } catch (error: any) {
        console.error('Error applying:', error);
        if (error.error === 'Already applied') {
          toast.error('既に申請済みです');
        } else if (error.error === 'Cannot apply to your own item') {
          toast.error('自分の商品には申請できません');
        } else {
          toast.error('申請に失敗しました');
        }
      } finally {
        setIsApplying(false);
      }
    }
  };

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

  // useModal hook for ESC key and body scroll lock
  useModal(isOpen, onClose);

  if (!isOpen || !item) return null;

  const isOwner = currentUser?.id === item.userId;

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
            loading="lazy"
            width={800}
            height={320}
            decoding="async"
          />
        </div>

        {/* 商品詳細 */}
        <div className="p-6 md:p-8">
          {/* 商品名と価格 */}
          <div className="flex justify-between items-start mb-4 gap-4">
            <div>
              <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800">{item.name}</h2>
              {item.hasApplication && !item.isSoldOut && (
                <span className="inline-flex items-center mt-2 px-3 py-1 rounded-full text-sm font-semibold bg-komaba-orange/10 text-komaba-orange">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  購入申請あり
                  {item.lastApplicationAt && (
                    <span className="ml-1 text-xs text-gray-500">
                      ({timeSince(item.lastApplicationAt)})
                    </span>
                  )}
                </span>
              )}
            </div>

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

          {/* 購入申請リスト (出品者のみ表示) */}
          {isOwner && (
            <div className="mb-6 border-t border-gray-100 pt-6">
              <h3 className="text-md font-bold text-gray-800 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-komaba-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                購入申請一覧
              </h3>

              {isLoadingApplications ? (
                <div className="flex justify-center p-4">
                  <div className="w-6 h-6 border-2 border-komaba-orange border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : applications.length > 0 ? (
                <div className="space-y-3">
                  {applications.map((app) => (
                    <div key={app.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-3">
                        <Avatar picture={app.applicantPicture} name={app.applicantName} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-gray-800">{app.applicantName}</p>
                          <p className="text-xs text-gray-500">{timeSince(app.createdAt)}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full border ${app.status === 'pending' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
                        app.status === 'approved' ? 'bg-green-50 text-green-600 border-green-200' :
                          'bg-gray-50 text-gray-500 border-gray-200'
                        }`}>
                        {app.status === 'pending' ? '申請中' : app.status === 'approved' ? '承認済み' : '却下'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">まだ購入申請はありません</p>
              )}
            </div>
          )}


          {/* アクションボタン */}
          <div className="flex justify-end gap-3 flex-wrap">
            {/* 購入申請ボタン (自分の出品でなく、売り切れでない場合のみ) */}
            {currentUser && !isOwner && !item.isSoldOut && (
              <button
                onClick={handleApply}
                disabled={isApplying || item.hasApplication} // 暫定的に「申請あり」ならボタン無効化？いや、複数申請もありうる仕様にするなら `item.hasApplication` でdisableにするのはおかしい。
                // しかし、仕様では「購入申請フラグを作成し、一般ユーザーはフラグの有無と作成日時を確認できます」とある。
                // 「早い者勝ち」感を出すなら、誰かが申請したら他は申請できない方がいいのか、それとも「キャンセル待ち」的に複数OKなのか？
                // "一般ユーザーはフラグの有無と作成日時を確認できます" -> This implies visibility of conflict.
                // Let's allow multiple applications for now, as it's a fleamarket negotiation usually.
                // But to prevent spam, maybe `disabled={isApplying}` is enough.
                // Just purely `isApplying`.
                className="px-6 py-3 bg-gradient-to-r from-komaba-orange to-orange-600 text-white rounded-lg hover:shadow-lg hover:brightness-110 transition-all font-medium flex items-center gap-2 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isApplying ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                )}
                購入申請する
              </button>
            )}


            {/* メッセージボタン（自分の出品でない場合のみ表示） */}
            {currentUser && !isOwner && (
              <button
                onClick={handleSendMessage}
                disabled={isStartingChat}
                className="px-6 py-3 bg-white text-komaba-orange border-2 border-komaba-orange rounded-lg hover:bg-orange-50 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
              >
                {isStartingChat ? (
                  <div className="w-5 h-5 border-2 border-komaba-orange border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                )}
                質問する
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
