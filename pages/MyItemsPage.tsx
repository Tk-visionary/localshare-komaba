import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../services/itemApi';
import { ITEM_STATUS } from '../constants';
import { Item } from '../types';
import ItemCard from '../components/ItemCard';
import ItemDetailModal from '../components/ItemDetailModal';
import ConfirmModal from '../components/ConfirmModal';
import LoadingSpinner from '../components/LoadingSpinner';

const MyItemsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const { data: myItems = [], isLoading, isError, error } = useQuery<Item[], Error>({
    queryKey: ['items', currentUser?.id],
    queryFn: () => api.fetchItems(currentUser!.id),
    enabled: !!currentUser,
  });

  const updateItemMutation = useMutation<Item, Error, { id: string; data: Partial<Item> }>({
    mutationFn: ({ id, data }) => api.updateItem(id, data),
    onSuccess: (data) => {
      const newStatus = data.isSoldOut ? ITEM_STATUS.SOLD_OUT : ITEM_STATUS.AVAILABLE;
      toast.success(`商品を「${newStatus}」に更新しました。`);
      queryClient.invalidateQueries({ queryKey: ['items', currentUser?.id] });
    },
    onError: (error) => {
      toast.error(`ステータスの更新に失敗しました: ${error.message}`);
    },
  });

  const deleteItemMutation = useMutation<void, Error, string>({
    mutationFn: (id: string) => api.deleteItemById(id),
    onSuccess: () => {
      toast.success('商品を削除しました。');
      queryClient.invalidateQueries({ queryKey: ['items', currentUser?.id] });
    },
    onError: (error) => {
      toast.error(`商品の削除に失敗しました: ${error.message}`);
    },
  });

  const handleToggleSoldOut = (id: string, newStatus: boolean) => {
    updateItemMutation.mutate({ id, data: { isSoldOut: newStatus } });
  };

  const handleDelete = (id: string) => {
    setItemToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteItemMutation.mutate(itemToDelete);
    }
    setIsConfirmOpen(false);
    setItemToDelete(null);
  };

  const cancelDelete = () => {
    setIsConfirmOpen(false);
    setItemToDelete(null);
  };

  const handleEdit = (id: string) => {
    navigate(`/edit-item/${id}`);
  };

  const handleItemClick = (item: Item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const handleItemUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ['items', currentUser?.id] });
    queryClient.invalidateQueries({ queryKey: ['items'] }); // Also update main items list
  };

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <div className="text-center text-red-500 mt-8">商品の読み込みに失敗しました: {error.message}</div>;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">マイ出品リスト</h1>
      {myItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {myItems.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              onToggleSoldOut={handleToggleSoldOut}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onClick={handleItemClick}
            />
          ))}
        </div>
      ) : (
        <div className="text-center mt-12 bg-white p-10 rounded-xl shadow-lg max-w-lg mx-auto">
          <h2 className="text-2xl font-bold text-gray-700 mb-3">まだ出品した商品はありません</h2>
          <p className="text-gray-500 mb-6">最初の商品を出品して、他の人にシェアしましょう！</p>
          <button
            onClick={() => navigate('/post-item')}
            className="bg-komaba-orange hover:bg-komaba-orange-dark text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg"
          >
            最初の商品を出品する
          </button>
        </div>
      )}

      <ItemDetailModal
        item={selectedItem}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onItemUpdate={handleItemUpdate}
      />

      <ConfirmModal
        isOpen={isConfirmOpen}
        title="商品を削除"
        message="この商品を本当に削除しますか？"
        warningMessage="この操作は取り消すことができません。"
        confirmText="削除する"
        cancelText="キャンセル"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        isDangerous={true}
      />
    </div>
  );
};

export default MyItemsPage;