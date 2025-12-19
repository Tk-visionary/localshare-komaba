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
import ConfirmModal from './ConfirmModal';

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
  const [isCancelling, setIsCancelling] = useState(false);
  const [applications, setApplications] = useState<PurchaseApplication[]>([]);
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);
  const [userHasApplied, setUserHasApplied] = useState(false);
  const [myApplication, setMyApplication] = useState<PurchaseApplication | null>(null);

  // Modal states
  const [showApplyConfirm, setShowApplyConfirm] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Reset state when item changes or modal opens
  useEffect(() => {
    if (isOpen && item && currentUser) {
      if (item.userId === currentUser.id) {
        // Owner: fetch all applications
        fetchApplications();
        setUserHasApplied(false);
      } else {
        // Non-owner: check if user has applied
        checkUserApplication();
      }
    } else {
      setApplications([]);
      setUserHasApplied(false);
      setMyApplication(null);
    }
    setCancelReason('');
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
    } finally {
      setIsLoadingApplications(false);
    }
  };

  const checkUserApplication = async () => {
    if (!item) return;
    try {
      const result = await itemApi.checkMyApplication(item.id);
      setUserHasApplied(result.hasApplied);
      setMyApplication(result.application || null);
    } catch (error) {
      console.error('Error checking application status:', error);
      // Fallback to localStorage in case of error
      const appliedItems = JSON.parse(localStorage.getItem('appliedItems') || '[]');
      setUserHasApplied(appliedItems.includes(item.id));
      setMyApplication(null);
    }
  };

  const handleApplyClick = () => {
    if (!item || !currentUser) {
      toast.error('ログインしてください');
      navigate('/login');
      return;
    }
    setShowApplyConfirm(true);
  };

  const handleApplyConfirm = async () => {
    setShowApplyConfirm(false);
    if (!item) return;

    setIsApplying(true);
    try {
      await itemApi.applyForPurchase(item.id);
      toast.success('購入申請を送信しました！');
      // Store in localStorage
      const appliedItems = JSON.parse(localStorage.getItem('appliedItems') || '[]');
      if (!appliedItems.includes(item.id)) {
        appliedItems.push(item.id);
        localStorage.setItem('appliedItems', JSON.stringify(appliedItems));
      }
      setUserHasApplied(true);
    } catch (error: any) {
      console.error('Error applying:', error);
      if (error.error === 'Already applied') {
        toast.error('既に申請済みです');
        setUserHasApplied(true);
      } else if (error.error === 'Cannot apply to your own item') {
        toast.error('自分の商品には申請できません');
      } else {
        toast.error('申請に失敗しました');
      }
    } finally {
      setIsApplying(false);
    }
  };

  const handleCancelClick = () => {
    setShowCancelModal(true);
  };

  const handleCancelConfirm = async () => {
    if (!item) return;

    setIsCancelling(true);
    try {
      await itemApi.cancelPurchaseApplication(item.id, cancelReason || undefined);
      toast.success('購入申請を取り消しました');
      // Remove from localStorage
      const appliedItems = JSON.parse(localStorage.getItem('appliedItems') || '[]');
      const newAppliedItems = appliedItems.filter((id: string) => id !== item.id);
      localStorage.setItem('appliedItems', JSON.stringify(newAppliedItems));
      setUserHasApplied(false);
      setShowCancelModal(false);
      setCancelReason('');
    } catch (error: any) {
      console.error('Error cancelling:', error);
      if (error.error === 'Application not found') {
        toast.error('申請が見つかりませんでした');
        setUserHasApplied(false);
      } else {
        toast.error('取り消しに失敗しました');
      }
    } finally {
      setIsCancelling(false);
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
    <>
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

            {/* 自分の申請情報 (申請者本人のみ表示) */}
            {!isOwner && userHasApplied && myApplication && (
              <div className="mb-6 border-t border-gray-100 pt-6">
                <h3 className="text-md font-bold text-gray-800 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  あなたの申請
                </h3>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar picture={myApplication.applicantPicture} name={myApplication.applicantName} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-gray-800">{myApplication.applicantName}</p>
                        <p className="text-xs text-gray-500">申請日: {timeSince(myApplication.createdAt)}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full border ${myApplication.status === 'pending' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
                      myApplication.status === 'approved' ? 'bg-green-50 text-green-600 border-green-200' :
                        'bg-gray-50 text-gray-500 border-gray-200'
                      }`}>
                      {myApplication.status === 'pending' ? '申請中' : myApplication.status === 'approved' ? '承認済み' : '却下'}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-gray-600">
                    出品者からの連絡をお待ちください。質問がある場合は「質問する」ボタンからメッセージを送れます。
                  </p>
                </div>
              </div>
            )}


            {/* アクションボタン */}
            <div className="flex justify-end gap-3 flex-wrap">
              {/* 購入申請ボタン or 申請取り消しボタン */}
              {currentUser && !isOwner && !item.isSoldOut && (
                userHasApplied ? (
                  <button
                    onClick={handleCancelClick}
                    disabled={isCancelling}
                    className="px-6 py-3 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
                  >
                    {isCancelling ? (
                      <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    申請を取り消す
                  </button>
                ) : (
                  <button
                    onClick={handleApplyClick}
                    disabled={isApplying}
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
                )
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

      {/* 購入申請確認モーダル */}
      <ConfirmModal
        isOpen={showApplyConfirm}
        title="購入申請"
        message="この商品の購入を申請しますか？"
        warningMessage="出品者に購入希望の通知が送信されます。申請後、出品者からの連絡をお待ちください。"
        confirmText="申請する"
        cancelText="キャンセル"
        onConfirm={handleApplyConfirm}
        onCancel={() => setShowApplyConfirm(false)}
      />

      {/* 申請取り消しモーダル */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 backdrop-blur-sm"
            onClick={() => setShowCancelModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800">申請の取り消し</h3>
              </div>

              <p className="text-gray-700 mb-4">購入申請を取り消しますか？</p>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  取り消しの理由（任意）
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="例: 他で購入しました / 予算の都合で..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-komaba-orange focus:border-transparent resize-none"
                  rows={3}
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancelReason('');
                  }}
                  className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  戻る
                </button>
                <button
                  onClick={handleCancelConfirm}
                  disabled={isCancelling}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isCancelling && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  取り消す
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ItemDetailModal;

