import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Conversation, Message } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { timeSince } from '../utils/date';
import ReportModal from './ReportModal';
import * as messageApi from '../services/messageApi';

interface ChatWindowProps {
    conversation: Conversation | null;
    messages: Message[];
    onSendMessage: (text: string) => void;
    isLoading: boolean;
    isSending: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
    conversation,
    messages,
    onSendMessage,
    isLoading,
    isSending,
}) => {
    const { currentUser } = useAuth();
    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [reportingMessage, setReportingMessage] = useState<Message | null>(null);
    const [isReporting, setIsReporting] = useState(false);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputText.trim() && !isSending) {
            onSendMessage(inputText.trim());
            setInputText('');
        }
    };

    const handleReportSubmit = async (reason: string, additionalInfo: string) => {
        if (!reportingMessage || !conversation) return;

        setIsReporting(true);
        try {
            await messageApi.reportMessage({
                conversationId: conversation.id,
                messageId: reportingMessage.id,
                reason,
                additionalInfo: additionalInfo || undefined,
            });
            toast.success('通報を受け付けました');
            setReportingMessage(null);
        } catch (error) {
            console.error('Error reporting message:', error);
            toast.error('通報の送信に失敗しました');
        } finally {
            setIsReporting(false);
        }
    };

    if (!conversation) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center text-gray-500">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p>会話を選択してください</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-white">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
                <div className="flex items-center gap-3">
                    {conversation.otherUser?.picture ? (
                        <img
                            src={conversation.otherUser.picture}
                            alt={conversation.otherUser.name}
                            className="w-10 h-10 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-gray-600">
                                {conversation.otherUser?.name?.charAt(0) || '?'}
                            </span>
                        </div>
                    )}
                    <div>
                        <h2 className="font-semibold text-gray-900">
                            {conversation.otherUser?.name || 'Unknown User'}
                        </h2>
                        {conversation.item && (
                            <p className="text-xs text-gray-500">
                                商品: {conversation.item.name}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full">
                        <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-komaba-orange"></div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                        <p>まだメッセージがありません</p>
                        <p className="text-sm mt-1">最初のメッセージを送信しましょう！</p>
                    </div>
                ) : (
                    messages.map((message) => {
                        const isOwn = message.senderId === currentUser?.id;
                        return (
                            <div
                                key={message.id}
                                className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}
                            >
                                {/* Report button for other's messages */}
                                {!isOwn && (
                                    <button
                                        onClick={() => setReportingMessage(message)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity mr-2 self-center p-1 text-gray-400 hover:text-red-500"
                                        title="このメッセージを通報"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </button>
                                )}
                                <div
                                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${isOwn
                                        ? 'bg-komaba-orange text-white rounded-br-md'
                                        : 'bg-white text-gray-900 shadow-sm rounded-bl-md'
                                        }`}
                                >
                                    <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                                    <p className={`text-xs mt-1 ${isOwn ? 'text-orange-100' : 'text-gray-400'}`}>
                                        {timeSince(message.createdAt)}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 bg-white">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="メッセージを入力..."
                        className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-komaba-orange focus:border-transparent"
                        disabled={isSending}
                    />
                    <button
                        type="submit"
                        disabled={!inputText.trim() || isSending}
                        className="bg-komaba-orange text-white px-6 py-2 rounded-full hover:brightness-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isSending ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        )}
                    </button>
                </div>
            </form>

            {/* Report Modal */}
            <ReportModal
                isOpen={!!reportingMessage}
                onClose={() => setReportingMessage(null)}
                onSubmit={handleReportSubmit}
                isSubmitting={isReporting}
            />
        </div>
    );
};

export default ChatWindow;

