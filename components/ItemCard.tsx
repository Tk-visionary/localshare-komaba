import React from 'react';
import { Item } from '../types';
import { timeSince } from '../utils/date';
import { ITEM_STATUS } from '../constants';

interface ItemCardProps {
  item: Item;
  onToggleSoldOut?: (id: string, isSoldOut: boolean) => void;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
  onClick?: (item: Item) => void;
}

const ItemCard: React.FC<ItemCardProps> = ({ item, onToggleSoldOut, onDelete, onEdit, onClick }) => {

  const handleCardClick = (e: React.MouseEvent) => {
    // ボタンクリック時はモーダルを開かない
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    onClick?.(item);
  };

  return (
    <div
      className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:scale-105 hover:shadow-xl transition-all duration-300 ease-in-out relative cursor-pointer h-full flex flex-col"
      onClick={handleCardClick}
    >
      {item.isSoldOut && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-rose-600 blur-md opacity-60 rounded-xl"></div>
            <span className="relative inline-block text-white text-xl font-black tracking-wide transform -rotate-3 px-6 py-2.5 bg-gradient-to-br from-red-500 via-rose-500 to-red-600 shadow-2xl rounded-xl border-2 border-white/30">
              {ITEM_STATUS.SOLD_OUT}
            </span>
          </div>
        </div>
      )}

      {/* This wrapper div is crucial. It contains both the dimmed content and the always-interactive footer. */}
      <div className="flex flex-col h-full">
        {/* This div contains only the content that should be dimmed when sold out. */}
        <div className={`flex-1 ${item.isSoldOut ? 'filter grayscale opacity-75' : ''}`}>
          <img src={item.imageUrl} alt={item.name} className="w-full h-48 object-cover" loading="lazy" />
          <div className="p-4">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-bold text-gray-800">{item.name}</h3>
              <span className={`text-lg font-bold ${item.price === 0 ? 'text-komaba-teal' : 'text-komaba-orange'}`}>
                {item.price === 0 ? '無料' : `¥${item.price}`}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1 truncate">{item.description}</p>
            <div className="mt-3 text-sm text-gray-500 space-y-1">
              <p><span className="font-semibold">カテゴリ:</span> {item.category}</p>
              <p><span className="font-semibold">場所:</span> {item.boothArea} ({item.boothDetail})</p>
              <p><span className="font-semibold">出店者:</span> {item.exhibitorName}</p>
            </div>
          </div>
        </div>
        
        {/* The footer is outside the opacity wrapper, and its z-index allows it to be above the overlay. */}
        <div className="relative z-20 px-4 py-2 bg-komaba-orange-light flex justify-between items-center text-xs text-gray-500">
          <span>{timeSince(item.postedAt)}</span>
          {(onToggleSoldOut || onDelete || onEdit) && (
            <div className="flex flex-col space-y-2">
              {onToggleSoldOut && <button onClick={() => onToggleSoldOut(item.id, !item.isSoldOut)} className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200">{item.isSoldOut ? ITEM_STATUS.TOGGLE_TO_AVAILABLE : ITEM_STATUS.TOGGLE_TO_SOLD_OUT}</button>}
              {onEdit && <button onClick={() => onEdit(item.id)} className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200">編集</button>}
              {onDelete && <button onClick={() => onDelete(item.id)} className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200">削除</button>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemCard;
