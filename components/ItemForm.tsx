import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Item, ItemCategory, BoothArea, User } from '../types';
import CustomSelect from './CustomSelect';
import * as api from '../services/itemApi';
import * as profileApi from '../services/profileApi';

type ItemFormData = Omit<Item, 'id' | 'postedAt' | 'userId' | 'imageUrl' | 'isSoldOut' | 'user'>;

interface ItemFormProps {
  onSubmit: (formData: ItemFormData, imageFile?: File) => void;
  isSubmitting: boolean;
  existingItem?: Item | null;
}

const ItemForm: React.FC<ItemFormProps> = ({ onSubmit, isSubmitting, existingItem }) => {
  const [formData, setFormData] = useState<ItemFormData>({
    name: '',
    description: '',
    category: ItemCategory.FOOD,
    price: 0,
    boothArea: BoothArea.MAIN_GATE,
    boothDetail: '',
    exhibitorName: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [useDisplayName, setUseDisplayName] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Fetch user profile for displayName
  const { data: profile } = useQuery<User>({
    queryKey: ['profile'],
    queryFn: () => profileApi.fetchProfile(),
  });

  // カテゴリのオプション（アイコン付き）
  const categoryOptions = [
    { value: ItemCategory.FOOD, label: '飲食物', icon: '🍴' },
    { value: ItemCategory.GOODS, label: '物品', icon: '📦' },
    { value: ItemCategory.OTHER, label: 'その他', icon: '⭐' },
  ];

  // エリアのオプション（アイコン付き）
  const areaOptions = [
    { value: BoothArea.MAIN_GATE, label: '正門・時計台エリア', icon: '🏛️' },
    { value: BoothArea.GINKGO_AVENUE, label: 'いちょう並木エリア', icon: '🍂' },
    { value: BoothArea.KOMABA_HALL, label: '900番講堂エリア', icon: '🎤' },
    { value: BoothArea.CP_PLAZA, label: 'コミュニケーション・プラザエリア', icon: '💬' },
    { value: BoothArea.BUILDING_1, label: '1号館エリア', icon: '🏢' },
    { value: BoothArea.BUILDING_7, label: '7号館エリア', icon: '🏢' },
    { value: BoothArea.BUILDING_10, label: '10号館エリア', icon: '🏢' },
    { value: BoothArea.BUILDING_11, label: '11号館エリア', icon: '🏢' },
    { value: BoothArea.BUILDING_13, label: '13号館エリア', icon: '🏢' },
    { value: BoothArea.GROUND, label: 'グラウンドエリア', icon: '⚽' },
    { value: BoothArea.OTHER, label: 'その他', icon: '📍' },
  ];

  useEffect(() => {
    if (existingItem) {
      setFormData({
        name: existingItem.name,
        description: existingItem.description,
        category: existingItem.category,
        price: existingItem.price,
        boothArea: existingItem.boothArea,
        boothDetail: existingItem.boothDetail,
        exhibitorName: existingItem.exhibitorName,
      });
      setImagePreview(existingItem.imageUrl);
    }
  }, [existingItem]);



  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'price' ? parseInt(value) : value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateDescription = async () => {
    if (!formData.name || !formData.category) {
      toast.error('商品名とカテゴリを入力してから生成してください');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await api.generateDescription({
        name: formData.name,
        category: formData.category,
        price: formData.price,
        exhibitorName: formData.exhibitorName || undefined,
        boothDetail: formData.boothDetail || undefined,
        existingDescription: formData.description || undefined,
      });

      setFormData(prev => ({ ...prev, description: result.description }));
      toast.success(`説明文を生成しました（残り${result.remaining}回）`);
    } catch (error: any) {
      console.error('Description generation error:', error);
      const message = error.message || '説明文の生成に失敗しました';
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile && !existingItem) {
      alert('商品画像をアップロードしてください。');
      return;
    }
    onSubmit(formData, imageFile || undefined);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-lg shadow-lg">
      {/* Form fields remain the same */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">商品名</label>
        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-ut-blue focus:border-ut-blue sm:text-sm" />
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">商品説明</label>
          <button
            type="button"
            onClick={handleGenerateDescription}
            disabled={isGenerating || !formData.name || !formData.category}
            className="text-sm px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                生成中...
              </>
            ) : (
              <>
                ✨ AIで生成
              </>
            )}
          </button>
        </div>
        <textarea name="description" id="description" value={formData.description} onChange={handleChange} required rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-ut-blue focus:border-ut-blue sm:text-sm"></textarea>
        <p className="mt-1 text-xs text-gray-500">※ 商品名とカテゴリで生成可能。価格・出店団体名を入力するとより精度が上がります。個数・数量（例: 30膳x3セット）を先に入力してから生成すると、その情報も含まれます（1日3回まで）</p>
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700">カテゴリ</label>
        <CustomSelect
          id="category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          options={categoryOptions}
          required
        />
      </div>

      <div>
        <label htmlFor="price" className="block text-sm font-medium text-gray-700">価格 (円)</label>
        <input type="number" name="price" id="price" value={formData.price} onChange={handleChange} required min="0" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-ut-blue focus:border-ut-blue sm:text-sm" />
      </div>

      <div>
        <label htmlFor="image" className="block text-sm font-medium text-gray-700">商品画像</label>
        <input type="file" name="image" id="image" accept="image/*" onChange={handleImageChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-komaba-orange-light file:text-komaba-orange hover:file:bg-komaba-orange/40" />
        {(imagePreview) && <img src={imagePreview} alt="Preview" className="mt-4 h-40 w-40 object-cover rounded-lg shadow-md" />}
      </div>

      <fieldset className="border border-gray-300 p-4 rounded-md">
        <legend className="text-sm font-medium text-gray-700 px-2">出店場所</legend>
        <div className="space-y-4">
          <div>
            <label htmlFor="boothArea" className="block text-sm font-medium text-gray-700">エリア</label>
            <CustomSelect
              id="boothArea"
              name="boothArea"
              value={formData.boothArea}
              onChange={handleChange}
              options={areaOptions}
              required
            />
          </div>
          <div>
            <label htmlFor="boothDetail" className="block text-sm font-medium text-gray-700">詳細（教室名、テント番号など）</label>
            <input type="text" name="boothDetail" id="boothDetail" value={formData.boothDetail} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-ut-blue focus:border-ut-blue sm:text-sm" />
          </div>
        </div>
      </fieldset>

      <div>
        <label htmlFor="exhibitorName" className="block text-sm font-medium text-gray-700">出店団体名</label>
        <input
          type="text"
          name="exhibitorName"
          id="exhibitorName"
          value={formData.exhibitorName}
          onChange={handleChange}
          required
          disabled={useDisplayName}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-ut-blue focus:border-ut-blue sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
        />
        {/* Checkbox to use profile displayName */}
        {profile?.displayName && (
          <label className="flex items-center gap-2 mt-2 cursor-pointer">
            <input
              type="checkbox"
              checked={useDisplayName}
              onChange={(e) => {
                setUseDisplayName(e.target.checked);
                if (e.target.checked && profile.displayName) {
                  setFormData(prev => ({ ...prev, exhibitorName: profile.displayName! }));
                }
              }}
              className="w-4 h-4 text-komaba-orange rounded border-gray-300 focus:ring-komaba-orange"
            />
            <span className="text-sm text-gray-600">
              プロフィールの表示名「{profile.displayName}」を使用
            </span>
          </label>
        )}
      </div>

      <button ref={buttonRef} type="submit" disabled={isSubmitting} className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-komaba-orange hover:brightness-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ut-blue disabled:bg-komaba-orange/50 disabled:cursor-not-allowed" style={{ minHeight: '48px' }}>
        {isSubmitting ? '処理中...' : existingItem ? '更新する' : '出品する'}
      </button>
    </form>
  );
};

export default ItemForm;