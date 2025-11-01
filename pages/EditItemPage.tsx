import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import ItemForm from '../components/ItemForm';
import { Item } from '../types';
import * as api from '../services/itemApi';

interface EditItemPageProps {}

const EditItemPage: React.FC<EditItemPageProps> = () => {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();

  // Fetch the specific item's data
  const { data: item, isLoading, isError } = useQuery<Item, Error>({
    queryKey: ['item', itemId],
    queryFn: () => api.fetchItemById(itemId!),
    enabled: !!itemId, // Only run if itemId is present
  });

  // Mutation for updating the item
  const { mutate: updateItem, isPending } = useMutation<Item, Error, { itemData: Partial<Item>; imageFile?: File }>(
    {
      mutationFn: async ({ itemData, imageFile }) => {
        return api.updateItem(itemId!, itemData, imageFile);
      },
      onSuccess: (updatedItem) => {
        toast.success('商品情報を更新しました！');
        // Invalidate and refetch queries to ensure data consistency
        queryClient.invalidateQueries({ queryKey: ['items'] });
        // Directly update the cache for the specific item to avoid a network call
        queryClient.setQueryData(['item', itemId], updatedItem);
        navigate('/my-items');
      },
      onError: (error) => {
        toast.error(`更新中にエラーが発生しました: ${error.message}`);
      },
    }
  );

  const handleSubmit = (formData: Omit<Item, 'id' | 'postedAt' | 'userId' | 'imageUrl' | 'isSoldOut' | 'user'>, imageFile?: File) => {
    if (!item) return;

    const changedData: Partial<Item> = {};
    // Type assertion for keys to ensure type safety
    const keys = Object.keys(formData) as (keyof typeof formData)[];

    for (const key of keys) {
      // Compare form data with the original item data
      if (formData[key] !== item[key]) {
        (changedData as any)[key] = formData[key];
      }
    }

    // If no data has changed and no new image is provided, do nothing.
    if (Object.keys(changedData).length === 0 && !imageFile) {
      toast('変更された項目がありません。');
      return;
    }

    updateItem({ itemData: changedData, imageFile });
  };

  if (isLoading) return <div className="flex justify-center items-center h-64"><div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-komaba-orange"></div></div>;
  if (isError) return <div className="text-center text-red-500 mt-8">商品の読み込みに失敗しました。</div>;
  if (!item) return <div className="text-center text-gray-500 mt-8">商品が見つかりません。</div>;

  // Ensure the logged-in user is the owner of the item
  if (currentUser?.id !== item.userId) {
    return <div className="text-center text-red-500 mt-8">この商品を編集する権限がありません。</div>;
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">商品を編集する</h1>
        <ItemForm onSubmit={handleSubmit} isSubmitting={isPending} existingItem={item} />
      </div>
    </div>
  );
};

export default EditItemPage;
