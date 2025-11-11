import { Item } from '../types';
import { fetchJson } from './apiClient';

const API_BASE_URL = '/api';

// Separate function for uploading an image
const uploadImage = async (imageFile: File): Promise<{ url: string }> => {
  const formData = new FormData();
  formData.append('image', imageFile);
  
  // Use a different endpoint for upload, not under /api
  return fetchJson('/upload', {
    method: 'POST',
    body: formData,
  });
};

export const fetchItems = async (userId?: string): Promise<Item[]> => {
  let url = `${API_BASE_URL}/items`;
  if (userId) {
    url += `?userId=${userId}`;
  }
  return fetchJson(url);
};

export const fetchItemById = async (itemId: string): Promise<Item> => {
  return fetchJson(`${API_BASE_URL}/items/${itemId}`);
};

export const createItem = async (itemData: Omit<Item, 'id' | 'postedAt' | 'imageUrl' | 'isSoldOut' | 'userId'>, imageFile: File, exhibitorName: string): Promise<Item> => {
  // 1. Upload the image and get the URL
  const { url: imageUrl } = await uploadImage(imageFile);

  // 2. Prepare the full item data, including the new image URL
  const fullItemData = { 
    ...itemData, 
    imageUrl,
    exhibitorName,
    isSoldOut: false 
  };

  // 3. Post the complete item data to the items API
  return fetchJson(`${API_BASE_URL}/items`, {
    method: 'POST',
    body: JSON.stringify(fullItemData),
    headers: { 'Content-Type': 'application/json' },
  });
};

export const updateItem = async (itemId: string, itemData: Partial<Item>, imageFile?: File): Promise<Item> => {
  let dataToUpdate = { ...itemData };

  // If a new image file is provided, upload it and update the imageUrl
  if (imageFile) {
    const { url: newImageUrl } = await uploadImage(imageFile);
    dataToUpdate.imageUrl = newImageUrl;
  }

  return fetchJson(`${API_BASE_URL}/items/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify(dataToUpdate),
    headers: { 'Content-Type': 'application/json' },
  });
};

// The backend returns 204 No Content, so the promise should be void
export const deleteItemById = async (itemId: string): Promise<void> => {
  await fetchJson(`${API_BASE_URL}/items/${itemId}`, { method: 'DELETE' });
};

// AI Description Generation
export interface GenerateDescriptionRequest {
  name: string;
  category: string;
  price: number;
  exhibitorName?: string;
  boothDetail?: string;
}

export interface GenerateDescriptionResponse {
  description: string;
  remaining: number;
}

export const generateDescription = async (data: GenerateDescriptionRequest): Promise<GenerateDescriptionResponse> => {
  return fetchJson(`${API_BASE_URL}/ai/generate-description`, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  });
};

export interface AIUsageResponse {
  remaining: number;
  used: number;
  limit: number;
}

export const getAIUsage = async (): Promise<AIUsageResponse> => {
  return fetchJson(`${API_BASE_URL}/ai/usage`);
};