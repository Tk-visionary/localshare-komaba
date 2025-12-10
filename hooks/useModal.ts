import { useEffect } from 'react';

/**
 * モーダルの共通ロジックを提供するフック
 * - ESCキーでモーダルを閉じる
 * - モーダル表示中はbodyのスクロールを防止
 */
export const useModal = (isOpen: boolean, onClose: () => void) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);
};
