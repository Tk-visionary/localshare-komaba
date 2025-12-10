import React, { useState } from 'react';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (reason: string, additionalInfo: string) => void;
    isSubmitting: boolean;
}

const REPORT_REASONS = [
    'スパム・迷惑行為',
    '詐欺・なりすまし',
    '暴言・嫌がらせ',
    '不適切なコンテンツ',
    '個人情報の不正利用',
    'その他',
];

const ReportModal: React.FC<ReportModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    isSubmitting,
}) => {
    const [selectedReason, setSelectedReason] = useState('');
    const [additionalInfo, setAdditionalInfo] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedReason) {
            onSubmit(selectedReason, additionalInfo);
        }
    };

    const handleClose = () => {
        setSelectedReason('');
        setAdditionalInfo('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                {/* Header */}
                <div className="bg-red-500 text-white p-4">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        メッセージを通報
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Reason selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            通報理由を選択してください
                        </label>
                        <div className="space-y-2">
                            {REPORT_REASONS.map((reason) => (
                                <label
                                    key={reason}
                                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${selectedReason === reason
                                            ? 'border-red-500 bg-red-50'
                                            : 'border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="reason"
                                        value={reason}
                                        checked={selectedReason === reason}
                                        onChange={(e) => setSelectedReason(e.target.value)}
                                        className="sr-only"
                                    />
                                    <span className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${selectedReason === reason ? 'border-red-500' : 'border-gray-400'
                                        }`}>
                                        {selectedReason === reason && (
                                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                        )}
                                    </span>
                                    <span className="text-sm text-gray-700">{reason}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Additional info */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            詳細（任意）
                        </label>
                        <textarea
                            value={additionalInfo}
                            onChange={(e) => setAdditionalInfo(e.target.value)}
                            placeholder="追加の情報があれば入力してください..."
                            rows={3}
                            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                        >
                            キャンセル
                        </button>
                        <button
                            type="submit"
                            disabled={!selectedReason || isSubmitting}
                            className="flex-1 py-3 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                    送信
                                </>
                            )}
                        </button>
                    </div>

                    <p className="text-xs text-gray-500 text-center">
                        虚偽の通報は処罰の対象となる場合があります
                    </p>
                </form>
            </div>
        </div>
    );
};

export default ReportModal;
