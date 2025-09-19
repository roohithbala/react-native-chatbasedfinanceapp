import { API_BASE_URL } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface LocationPhoto {
  url: string;
  width?: number;
  height?: number;
  attribution?: string;
}

export interface BusinessHours {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
}

export interface Location {
  _id: string;
  name: string;
  address: string;
  coordinates: LocationCoordinates;
  category: 'restaurant' | 'store' | 'entertainment' | 'service' | 'transport' | 'healthcare' | 'education' | 'other';
  googlePlaceId?: string;
  rating?: number;
  priceLevel?: number;
  phoneNumber?: string;
  website?: string;
  businessHours?: BusinessHours;
  photos?: LocationPhoto[];
  tags: string[];
  userId: string;
  isPublic: boolean;
  notes?: string;
  visitCount: number;
  lastVisited?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocationFilters {
  category?: string;
  search?: string;
  sortBy?: 'createdAt' | 'name' | 'visitCount' | 'rating';
  sortOrder?: 'asc' | 'desc';
}

export interface LocationResponse {
  locations: Location[];
  totalPages: number;
  currentPage: number;
  total: number;
}

export interface CreateLocationData {
  name: string;
  address: string;
  coordinates: LocationCoordinates;
  category?: string;
  googlePlaceId?: string;
  rating?: number;
  priceLevel?: number;
  phoneNumber?: string;
  website?: string;
  businessHours?: BusinessHours;
  photos?: LocationPhoto[];
  tags?: string[];
  isPublic?: boolean;
  notes?: string;
}

export interface UpdateLocationData extends Partial<CreateLocationData> {}

class LocationsAPI {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getLocations(
    page: number = 1,
    limit: number = 20,
    filters: LocationFilters = {}
  ): Promise<LocationResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });

    return this.request<LocationResponse>(`/locations?${params}`);
  }

  async getNearbyLocations(
    longitude: number,
    latitude: number,
    maxDistance: number = 1000
  ): Promise<{ locations: Location[] }> {
    const params = new URLSearchParams({
      longitude: longitude.toString(),
      latitude: latitude.toString(),
      maxDistance: maxDistance.toString(),
    });

    return this.request<{ locations: Location[] }>(`/locations/nearby?${params}`);
  }

  async getPopularLocations(limit: number = 10): Promise<{ locations: Location[] }> {
    const params = new URLSearchParams({
      limit: limit.toString(),
    });

    return this.request<{ locations: Location[] }>(`/locations/popular?${params}`);
  }

  async getLocationsByCategory(
    category: string,
    limit: number = 20
  ): Promise<{ locations: Location[] }> {
    return this.request<{ locations: Location[] }>(`/locations/category/${category}?limit=${limit}`);
  }

  async getLocation(id: string): Promise<{ location: Location }> {
    return this.request<{ location: Location }>(`/locations/${id}`);
  }

  async createLocation(data: CreateLocationData): Promise<{ message: string; location: Location }> {
    return this.request<{ message: string; location: Location }>('/locations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateLocation(
    id: string,
    data: UpdateLocationData
  ): Promise<{ message: string; location: Location }> {
    return this.request<{ message: string; location: Location }>(`/locations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteLocation(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/locations/${id}`, {
      method: 'DELETE',
    });
  }

  async recordVisit(id: string): Promise<{ message: string; location: Location }> {
    return this.request<{ message: string; location: Location }>(`/locations/${id}/visit`, {
      method: 'POST',
    });
  }

  async addPhoto(
    id: string,
    photo: { url: string; width?: number; height?: number; attribution?: string }
  ): Promise<{ message: string; location: Location }> {
    return this.request<{ message: string; location: Location }>(`/locations/${id}/photos`, {
      method: 'POST',
      body: JSON.stringify(photo),
    });
  }
}

export const locationsAPI = new LocationsAPI();

export default locationsAPI;