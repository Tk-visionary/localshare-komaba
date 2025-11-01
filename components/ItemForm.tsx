import React, { useState, useEffect, useRef } from 'react';

import { Item, ItemCategory, BoothArea } from '../types';

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
  const buttonRef = useRef<HTMLButtonElement>(null);

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
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">商品説明</label>
        <textarea name="description" id="description" value={formData.description} onChange={handleChange} required rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-ut-blue focus:border-ut-blue sm:text-sm"></textarea>
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700">カテゴリ</label>
        <select name="category" id="category" value={formData.category} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-ut-blue focus:border-ut-blue sm:text-sm">
          {Object.values(ItemCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
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
            <select name="boothArea" id="boothArea" value={formData.boothArea} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-ut-blue focus:border-ut-blue sm:text-sm">
              {Object.values(BoothArea).map(area => <option key={area} value={area}>{area}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="boothDetail" className="block text-sm font-medium text-gray-700">詳細（教室名、テント番号など）</label>
            <input type="text" name="boothDetail" id="boothDetail" value={formData.boothDetail} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-ut-blue focus:border-ut-blue sm:text-sm" />
          </div>
        </div>
      </fieldset>

      <div>
        <label htmlFor="exhibitorName" className="block text-sm font-medium text-gray-700">出店団体名</label>
        <input type="text" name="exhibitorName" id="exhibitorName" value={formData.exhibitorName} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-ut-blue focus:border-ut-blue sm:text-sm" />
      </div>

      <button ref={buttonRef} type="submit" disabled={isSubmitting} className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-komaba-orange hover:brightness-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ut-blue disabled:bg-komaba-orange/50 disabled:cursor-not-allowed" style={{ minHeight: '48px' }}>
        {isSubmitting ? '処理中...' : existingItem ? '更新する' : '出品する'}
      </button>
    </form>
  );
};

export default ItemForm;