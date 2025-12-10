import React from 'react';

// Preset avatars - using emoji-based colored circles
export const PRESET_AVATARS = [
    { id: 'orange', color: 'bg-orange-500', emoji: '🍊' },
    { id: 'blue', color: 'bg-blue-500', emoji: '🌊' },
    { id: 'green', color: 'bg-green-500', emoji: '🌿' },
    { id: 'purple', color: 'bg-purple-500', emoji: '🍇' },
    { id: 'pink', color: 'bg-pink-500', emoji: '🌸' },
    { id: 'yellow', color: 'bg-yellow-500', emoji: '⭐' },
    { id: 'red', color: 'bg-red-500', emoji: '🔥' },
    { id: 'teal', color: 'bg-teal-500', emoji: '💎' },
];

interface AvatarProps {
    picture?: string | null;
    name?: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const sizeMap = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
};

const Avatar: React.FC<AvatarProps> = ({ picture, name, size = 'md', className = '' }) => {
    const sizeClasses = sizeMap[size];

    // Handle preset avatars (format: "preset:id")
    if (picture?.startsWith('preset:')) {
        const presetId = picture.replace('preset:', '');
        const preset = PRESET_AVATARS.find(p => p.id === presetId);
        if (preset) {
            return (
                <div className={`${sizeClasses} ${preset.color} rounded-full flex items-center justify-center flex-shrink-0 ${className}`}>
                    <span>{preset.emoji}</span>
                </div>
            );
        }
    }

    // Handle uploaded image URLs
    if (picture && !picture.startsWith('preset:')) {
        return (
            <img
                src={picture}
                alt={name || 'User'}
                className={`${sizeClasses} rounded-full object-cover flex-shrink-0 ${className}`}
            />
        );
    }

    // Default: first letter avatar
    return (
        <div className={`${sizeClasses} rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0 ${className}`}>
            <span className="text-gray-600 font-medium">
                {name?.charAt(0) || 'ユ'}
            </span>
        </div>
    );
};

export default Avatar;
