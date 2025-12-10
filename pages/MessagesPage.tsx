import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import * as messageApi from '../services/messageApi';
import { Conversation, Message } from '../types';
import ConversationList from '../components/ConversationList';
import ChatWindow from '../components/ChatWindow';

const MessagesPage: React.FC = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);

    // Get initial conversation ID from URL params
    const initialConversationId = searchParams.get('id');

    // Fetch conversations list
    const { data: conversations = [], isLoading: isLoadingConversations } = useQuery<Conversation[]>({
        queryKey: ['conversations'],
        queryFn: () => messageApi.fetchConversations(),
    });

    // Load conversation from URL param on mount
    useEffect(() => {
        if (initialConversationId && conversations.length > 0 && !selectedConversation) {
            const conversation = conversations.find(c => c.id === initialConversationId);
            if (conversation) {
                handleSelectConversation(conversation);
            }
        }
    }, [initialConversationId, conversations, selectedConversation]);

    // Fetch messages for selected conversation
    const fetchMessages = useCallback(async (conversationId: string) => {
        setIsLoadingMessages(true);
        try {
            const data = await messageApi.fetchConversation(conversationId);
            setMessages(data.messages);
            // Update conversation with full data
            setSelectedConversation(data.conversation);
            // Invalidate conversations to update unread count
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
        } catch (error) {
            console.error('Error fetching messages:', error);
            toast.error('メッセージの取得に失敗しました');
        } finally {
            setIsLoadingMessages(false);
        }
    }, [queryClient]);

    const handleSelectConversation = (conversation: Conversation) => {
        setSelectedConversation(conversation);
        setMessages([]);
        fetchMessages(conversation.id);
        // Update URL without full navigation
        navigate(`/messages?id=${conversation.id}`, { replace: true });
    };

    // Send message mutation
    const sendMessageMutation = useMutation({
        mutationFn: (text: string) => {
            if (!selectedConversation) throw new Error('No conversation selected');
            return messageApi.sendMessage(selectedConversation.id, text);
        },
        onSuccess: (newMessage) => {
            setMessages(prev => [...prev, newMessage]);
            // Update conversation list
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
        },
        onError: () => {
            toast.error('メッセージの送信に失敗しました');
        },
    });

    const handleSendMessage = (text: string) => {
        sendMessageMutation.mutate(text);
    };

    // Mobile view: show either list or chat
    const [showChat, setShowChat] = useState(false);

    useEffect(() => {
        if (selectedConversation) {
            setShowChat(true);
        }
    }, [selectedConversation]);

    const handleBackToList = () => {
        setShowChat(false);
        setSelectedConversation(null);
        navigate('/messages', { replace: true });
    };

    return (
        <div className="container mx-auto px-0 sm:px-4 py-0 sm:py-8 h-[calc(100vh-4rem)]">
            <div className="bg-white rounded-none sm:rounded-lg shadow-lg h-full flex overflow-hidden">
                {/* Conversation List - Hidden on mobile when chat is open */}
                <div className={`w-full md:w-80 border-r border-gray-200 flex-shrink-0 flex flex-col ${showChat ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-4 border-b border-gray-200 bg-gray-50">
                        <h1 className="text-lg font-bold text-gray-900">メッセージ</h1>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <ConversationList
                            conversations={conversations}
                            selectedId={selectedConversation?.id || null}
                            onSelect={handleSelectConversation}
                            isLoading={isLoadingConversations}
                        />
                    </div>
                </div>

                {/* Chat Window - Hidden on mobile when list is shown */}
                <div className={`flex-1 flex flex-col ${!showChat ? 'hidden md:flex' : 'flex'}`}>
                    {/* Mobile back button */}
                    {showChat && (
                        <button
                            onClick={handleBackToList}
                            className="md:hidden p-4 border-b border-gray-200 flex items-center gap-2 text-gray-600 hover:text-gray-900"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            戻る
                        </button>
                    )}
                    <ChatWindow
                        conversation={selectedConversation}
                        messages={messages}
                        onSendMessage={handleSendMessage}
                        isLoading={isLoadingMessages}
                        isSending={sendMessageMutation.isPending}
                    />
                </div>
            </div>
        </div>
    );
};

export default MessagesPage;
