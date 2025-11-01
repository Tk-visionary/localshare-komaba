import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import ItemForm from '../components/ItemForm';
import { Item } from '../types';
import * as api from '../services/itemApi';

interface PostItemPageProps {}

interface CreateItemPayload {
  formData: Omit<Item, 'id' | 'postedAt' | 'userId' | 'imageUrl' | 'isSoldOut'>;
  imageFile: File;
}

const PostItemPage: React.FC<PostItemPageProps> = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();

  const { mutate: createItem, isPending } = useMutation<Item, Error, CreateItemPayload>({
    mutationFn: ({ formData, imageFile }) => {
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      // The exhibitorName is now part of the formData
      return api.createItem(formData, imageFile, formData.exhibitorName);
    },
    onSuccess: () => {
      toast.success('商品が正常に出品されました！');
      // Invalidate both the general items list and the user-specific items list
      queryClient.invalidateQueries({ queryKey: ['items'] });
      navigate('/my-items');
    },
    onError: (error) => {
      toast.error(`出品中にエラーが発生しました: ${error.message}`);
      console.error(error);
    },
  });

  const handleSubmit = (formData: Omit<Item, 'id' | 'postedAt' | 'userId' | 'imageUrl' | 'isSoldOut' | 'user'>, imageFile?: File) => {
    if (!imageFile) {
      toast.error('商品画像をアップロードしてください。');
      return;
    }
    createItem({ formData, imageFile });
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">新しい商品を出品する</h1>
            <ItemForm onSubmit={handleSubmit} isSubmitting={isPending} />
        </div>
    </div>
  );
};

export default PostItemPage;