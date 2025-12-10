import React from 'react';
import { Conversation } from '../types';
import { timeSince } from '../utils/date';
import Avatar from './Avatar';

interface ConversationListProps {
    conversations: Conversation[];
    selectedId: string | null;
    onSelect: (conversation: Conversation) => void;
    isLoading: boolean;
}

const ConversationList: React.FC<ConversationListProps> = ({
    conversations,
    selectedId,
    onSelect,
    isLoading,
}) => {
    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-komaba-orange"></div>
            </div>
        );
    }

    if (conversations.length === 0) {
        return (
            <div className="text-center text-gray-500 p-8">
                <p>メッセージはまだありません</p>
            </div>
        );
    }

    return (
        <div className="divide-y divide-gray-200">
            {conversations.map((conversation) => (
                <button
                    key={conversation.id}
                    onClick={() => onSelect(conversation)}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors flex items-start gap-3 ${selectedId === conversation.id ? 'bg-komaba-orange/10' : ''
                        }`}
                >
                    {/* Avatar */}
                    <Avatar
                        picture={conversation.otherUser?.picture}
                        name={conversation.otherUser?.name}
                        size="lg"
                    />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                            <span className="font-medium text-gray-900 truncate">
                                {conversation.otherUser?.name || 'Unknown User'}
                            </span>
                            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                                {timeSince(conversation.lastMessageAt)}
                            </span>
                        </div>

                        {/* Item badge */}
                        {conversation.item && (
                            <div className="flex items-center gap-1 mb-1">
                                <span className="text-xs bg-komaba-orange/20 text-komaba-orange px-2 py-0.5 rounded truncate max-w-[150px]">
                                    {conversation.item.name}
                                </span>
                            </div>
                        )}

                        {/* Last message */}
                        <p className="text-sm text-gray-600 truncate">
                            {conversation.lastMessage || 'メッセージなし'}
                        </p>

                        {/* Unread badge */}
                        {(conversation.unreadCount ?? 0) > 0 && (
                            <span className="inline-flex items-center justify-center w-5 h-5 text-xs bg-komaba-orange text-white rounded-full mt-1">
                                {conversation.unreadCount}
                            </span>
                        )}
                    </div>
                </button>
            ))}
        </div>
    );
};

export default ConversationList;
