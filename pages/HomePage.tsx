import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as api from '../services/itemApi';
import { Item, ItemCategory } from '../types';
import ItemCard from '../components/ItemCard';
import ItemDetailModal from '../components/ItemDetailModal';

const HomePage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priceFilter, setPriceFilter] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<string>('newest');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: items = [], isLoading, isError, error } = useQuery<Item[], Error>({
    queryKey: ['items'],
    queryFn: () => api.fetchItems(),
  });

  const filteredItems = useMemo(() => {
    let result = items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (item.user && item.user.name.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      const matchesPrice = priceFilter === 'all' || (priceFilter === 'free' && item.price === 0);
      const matchesAvailability = availabilityFilter === 'all' ||
                                   (availabilityFilter === 'available' && !item.isSoldOut) ||
                                   (availabilityFilter === 'soldOut' && item.isSoldOut);
      return matchesSearch && matchesCategory && matchesPrice && matchesAvailability;
    });

    // ソート処理
    if (sortOrder === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortOrder === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else {
      // newest - 投稿日時の降順（新しい順）
      result.sort((a, b) => {
        const dateA = a.postedAt instanceof Date ? a.postedAt : new Date(a.postedAt);
        const dateB = b.postedAt instanceof Date ? b.postedAt : new Date(b.postedAt);
        return dateB.getTime() - dateA.getTime();
      });
    }

    return result;
  }, [items, searchTerm, categoryFilter, priceFilter, availabilityFilter, sortOrder]);

  const categoryOptions = [
    { value: 'all', label: 'すべて' },
    { value: ItemCategory.FOOD, label: ItemCategory.FOOD },
    { value: ItemCategory.GOODS, label: ItemCategory.GOODS },
    { value: ItemCategory.OTHER, label: ItemCategory.OTHER },
  ];

  const priceOptions = [
    { value: 'all', label: 'すべて' },
    { value: 'free', label: '無料のみ' },
  ];

  const availabilityOptions = [
    { value: 'all', label: 'すべて' },
    { value: 'available', label: '在庫あり' },
    { value: 'soldOut', label: '売り切れ' },
  ];

  const sortOptions = [
    { value: 'newest', label: '新しい順' },
    { value: 'price-asc', label: '価格の安い順' },
    { value: 'price-desc', label: '価格の高い順' },
  ];

  const handleItemClick = (item: Item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  if (isLoading) return <div className="flex justify-center items-center h-64"><div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-komaba-orange"></div></div>;
  if (isError) return <div className="text-center text-red-500 mt-8">商品の読み込みに失敗しました: {error.message}</div>;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white p-6 rounded-lg shadow-xl mb-8 space-y-6">
        {/* Filter UI remains the same */}
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">キーワード検索</label>
          <input
            id="search"
            type="text"
            placeholder="商品名, 説明, 団体名..."
            className="border border-gray-300 p-2 rounded-md w-full focus:ring-ut-blue focus:border-ut-blue transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-col md:flex-row md:space-x-8 space-y-6 md:space-y-0 md:items-start">
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">カテゴリ</h3>
            <div className="flex flex-wrap gap-2">
              {categoryOptions.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setCategoryFilter(value)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ease-in-out transform hover:scale-105 ${
                    categoryFilter === value 
                      ? 'bg-komaba-orange text-white shadow-md' 
                      : 'bg-komaba-orange-light text-komaba-orange hover:brightness-105'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-3">
             <h3 className="text-sm font-medium text-gray-700">価格</h3>
            <div className="flex flex-wrap gap-2">
              {priceOptions.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setPriceFilter(value)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ease-in-out transform hover:scale-105 ${
                    priceFilter === value
                      ? 'bg-komaba-orange text-white shadow-md'
                      : 'bg-komaba-orange-light text-komaba-orange hover:brightness-105'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
             <h3 className="text-sm font-medium text-gray-700">在庫状況</h3>
            <div className="flex flex-wrap gap-2">
              {availabilityOptions.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setAvailabilityFilter(value)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ease-in-out transform hover:scale-105 ${
                    availabilityFilter === value
                      ? 'bg-komaba-orange text-white shadow-md'
                      : 'bg-komaba-orange-light text-komaba-orange hover:brightness-105'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
             <h3 className="text-sm font-medium text-gray-700">並び替え</h3>
            <div className="flex flex-wrap gap-2">
              {sortOptions.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setSortOrder(value)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ease-in-out transform hover:scale-105 ${
                    sortOrder === value
                      ? 'bg-komaba-orange text-white shadow-md'
                      : 'bg-komaba-orange-light text-komaba-orange hover:brightness-105'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredItems.map(item => <ItemCard key={item.id} item={item} onClick={handleItemClick} />)}
        </div>
      ) : (
        <div className="text-center text-gray-500 mt-8">
          <p>該当する商品が見つかりません。</p>
        </div>
      )}

      <ItemDetailModal
        item={selectedItem}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />

      {/* 公式マップへのフローティングボタン */}
      <a
        href="https://www.komabasai.net/76/visitor/access"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 group z-50"
      >
        <div className="flex items-center gap-0 bg-gradient-to-r from-komaba-orange to-orange-500 text-white font-semibold rounded-full shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden">
          {/* アイコン部分（常に表示） */}
          <div className="flex items-center justify-center w-14 h-14 flex-shrink-0">
            <span className="text-2xl">🗺️</span>
          </div>

          {/* テキスト部分（モバイルでは常に表示、PCではホバー時に展開） */}
          <div className="max-w-xs md:max-w-0 md:group-hover:max-w-xs transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap">
            <div className="px-4 flex items-center gap-2">
              <span>公式マップ</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </div>
          </div>
        </div>
      </a>
    </div>
  );
};

export default HomePage;
