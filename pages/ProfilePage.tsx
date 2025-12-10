import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import * as profileApi from '../services/profileApi';
import { User } from '../types';

// Preset avatars - using emoji-based colored circles
const PRESET_AVATARS = [
    { id: 'orange', color: 'bg-orange-500', emoji: '🍊' },
    { id: 'blue', color: 'bg-blue-500', emoji: '🌊' },
    { id: 'green', color: 'bg-green-500', emoji: '🌿' },
    { id: 'purple', color: 'bg-purple-500', emoji: '🍇' },
    { id: 'pink', color: 'bg-pink-500', emoji: '🌸' },
    { id: 'yellow', color: 'bg-yellow-500', emoji: '⭐' },
    { id: 'red', color: 'bg-red-500', emoji: '🔥' },
    { id: 'teal', color: 'bg-teal-500', emoji: '💎' },
];

const ProfilePage: React.FC = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [displayName, setDisplayName] = useState('');
    const [displayPicture, setDisplayPicture] = useState<string | null>(null);
    const [avatarMode, setAvatarMode] = useState<'none' | 'preset' | 'upload'>('none');
    const [isUploading, setIsUploading] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Fetch profile
    const { data: profile, isLoading } = useQuery<User>({
        queryKey: ['profile'],
        queryFn: () => profileApi.fetchProfile(),
    });

    // Set initial values when profile loads
    useEffect(() => {
        if (profile) {
            setDisplayName(profile.displayName || '');
            setDisplayPicture(profile.displayPicture || null);
            // Determine avatar mode from existing picture
            if (profile.displayPicture) {
                if (profile.displayPicture.startsWith('preset:')) {
                    setAvatarMode('preset');
                } else {
                    setAvatarMode('upload');
                }
            } else {
                setAvatarMode('none');
            }
        }
    }, [profile]);

    // Track changes
    useEffect(() => {
        if (profile) {
            const nameChanged = displayName !== (profile.displayName || '');
            const pictureChanged = displayPicture !== (profile.displayPicture || null);
            setHasChanges(nameChanged || pictureChanged);
        }
    }, [displayName, displayPicture, profile]);

    // Handle image upload
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            toast.error('画像サイズは2MB以下にしてください');
            return;
        }

        setIsUploading(true);
        try {
            // Upload to /upload endpoint
            const formData = new FormData();
            formData.append('image', file);

            const response = await fetch('/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${await getIdToken()}`,
                },
                body: formData,
            });

            if (!response.ok) throw new Error('Upload failed');

            const data = await response.json();
            setDisplayPicture(data.url);
            setAvatarMode('upload');
            toast.success('画像をアップロードしました');
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('画像のアップロードに失敗しました');
        } finally {
            setIsUploading(false);
        }
    };

    // Get Firebase ID token for upload
    const getIdToken = async () => {
        const { auth } = await import('../services/firebase');
        return auth.currentUser?.getIdToken();
    };

    // Handle preset avatar selection
    const handlePresetSelect = (presetId: string) => {
        setDisplayPicture(`preset:${presetId}`);
        setAvatarMode('preset');
    };

    // Clear avatar
    const handleClearAvatar = () => {
        setDisplayPicture(null);
        setAvatarMode('none');
    };

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: (data: { displayName?: string; displayPicture?: string }) =>
            profileApi.updateProfile(data),
        onSuccess: () => {
            toast.success('プロフィールを更新しました');
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            setHasChanges(false);
        },
        onError: () => {
            toast.error('プロフィールの更新に失敗しました');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateMutation.mutate({
            displayName: displayName.trim() || undefined,
            displayPicture: displayPicture || undefined,
        });
    };

    // Render avatar based on mode and value
    const renderAvatar = (picture: string | null, name: string, size: 'sm' | 'lg' = 'lg') => {
        const sizeClasses = size === 'lg' ? 'w-16 h-16 text-2xl' : 'w-10 h-10 text-base';

        if (picture?.startsWith('preset:')) {
            const presetId = picture.replace('preset:', '');
            const preset = PRESET_AVATARS.find(p => p.id === presetId);
            if (preset) {
                return (
                    <div className={`${sizeClasses} ${preset.color} rounded-full flex items-center justify-center`}>
                        <span>{preset.emoji}</span>
                    </div>
                );
            }
        }

        if (picture && !picture.startsWith('preset:')) {
            return (
                <img
                    src={picture}
                    alt={name}
                    className={`${sizeClasses} rounded-full object-cover`}
                />
            );
        }

        // Default: first letter
        return (
            <div className={`${sizeClasses} rounded-full bg-komaba-orange/20 flex items-center justify-center`}>
                <span className="text-komaba-orange font-medium">
                    {name?.charAt(0) || 'ユ'}
                </span>
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-komaba-orange"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-komaba-orange to-orange-400 text-white p-6">
                    <h1 className="text-2xl font-bold">プロフィール設定</h1>
                    <p className="text-orange-100 text-sm mt-1">メッセージで表示される名前とアバターを設定できます</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Avatar Section */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            アバター
                        </label>

                        {/* Current Avatar */}
                        <div className="flex items-center gap-4 mb-4">
                            {renderAvatar(displayPicture, displayName)}
                            {displayPicture && (
                                <button
                                    type="button"
                                    onClick={handleClearAvatar}
                                    className="text-sm text-red-500 hover:text-red-700"
                                >
                                    削除
                                </button>
                            )}
                        </div>

                        {/* Preset Avatars */}
                        <div className="mb-4">
                            <p className="text-sm text-gray-500 mb-2">プリセットから選択:</p>
                            <div className="flex flex-wrap gap-2">
                                {PRESET_AVATARS.map((preset) => (
                                    <button
                                        key={preset.id}
                                        type="button"
                                        onClick={() => handlePresetSelect(preset.id)}
                                        className={`w-12 h-12 ${preset.color} rounded-full flex items-center justify-center text-xl transition-transform hover:scale-110 ${displayPicture === `preset:${preset.id}` ? 'ring-4 ring-komaba-orange ring-offset-2' : ''
                                            }`}
                                    >
                                        {preset.emoji}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Upload Button */}
                        <div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {isUploading ? (
                                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                )}
                                画像をアップロード
                            </button>
                            <p className="text-xs text-gray-500 mt-1">2MB以下のJPG/PNG</p>
                        </div>
                    </div>

                    {/* Display Name */}
                    <div>
                        <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                            表示名
                        </label>
                        <input
                            type="text"
                            id="displayName"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="メッセージで表示される名前（未設定の場合は匿名）"
                            maxLength={50}
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-komaba-orange focus:border-transparent"
                        />
                        <p className="mt-2 text-sm text-gray-500">
                            設定しない場合、「ユーザーXXXXXXXX」と表示されます
                        </p>
                    </div>

                    {/* Preview */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-gray-500 mb-3">メッセージでの表示プレビュー</h3>
                        <div className="flex items-center gap-3">
                            {renderAvatar(displayPicture, displayName, 'sm')}
                            <span className="font-medium text-gray-900">
                                {displayName || `ユーザー${profile?.id?.substring(0, 8) || 'XXXXXXXX'}`}
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                        >
                            戻る
                        </button>
                        <button
                            type="submit"
                            disabled={!hasChanges || updateMutation.isPending}
                            className="flex-1 py-3 bg-komaba-orange text-white rounded-lg hover:brightness-90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {updateMutation.isPending ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                '保存'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfilePage;
