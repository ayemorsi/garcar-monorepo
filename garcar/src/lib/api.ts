const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export interface Notification {
  _id: string;
  type: 'new_booking' | 'booking_confirmed' | 'booking_cancelled' | 'booking_completed';
  title: string;
  message: string;
  bookingId?: string;
  read: boolean;
  createdAt: string;
}

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

function getRefreshTokenStored() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refreshToken');
}

/** Decode a JWT payload without verifying the signature (routing use only). */
export function decodeJwt(token: string): { userId?: string; isVerified?: boolean } | null {
  try {
    const payload = token.split('.')[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

let refreshPromise: Promise<string> | null = null;

async function attemptTokenRefresh(): Promise<string> {
  // Deduplicate concurrent refresh attempts
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const refreshToken = getRefreshTokenStored();
    if (!refreshToken) throw new Error('No refresh token');
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) throw new Error('Refresh failed');
    const { token } = await res.json();
    localStorage.setItem('token', token);
    return token;
  })();
  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

async function request<T>(path: string, options: RequestInit = {}, isRetry = false): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.body && !(options.body instanceof FormData)
      ? { 'Content-Type': 'application/json' }
      : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  // Auto-refresh on 401 (but not on the refresh endpoint itself or on retry)
  if (res.status === 401 && !isRetry && path !== '/auth/refresh') {
    try {
      await attemptTokenRefresh();
      return request<T>(path, options, true);
    } catch {
      // Refresh failed — clear session and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('refreshToken');
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
      throw new Error('Session expired. Please log in again.');
    }
  }

  // Backend returns plain text on some routes (register, errors), JSON on others
  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await res.json()
    : await res.text();

  if (!res.ok) {
    const message = typeof data === 'string' ? data : (data as { message?: string }).message ?? 'Request failed';
    throw new Error(message);
  }
  return data as T;
}

export const api = {
  register: (body: { username: string; password: string; building?: string; buildingId?: string; firstName?: string; lastName?: string }) =>
    request('/register', { method: 'POST', body: JSON.stringify(body) }),

  /** Returns the raw token plus decoded userId and isVerified. */
  login: async (body: { username: string; password: string }) => {
    const data = await request<{ token: string; refreshToken?: string }>('/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    const payload = decodeJwt(data.token);
    return {
      token: data.token,
      refreshToken: data.refreshToken ?? '',
      userId: payload?.userId ?? '',
      isVerified: payload?.isVerified ?? false,
    };
  },

  /** Submits residency verification document. Backend returns a message on success. */
  submitVerification: (userId: string, formData: FormData) =>
    request<{ message: string }>(`/verify/${userId}`, {
      method: 'POST',
      body: formData,
    }),

  getVerification: (userId: string) =>
    request(`/verification/${userId}`),

  // Cars
  getCars: (params?: { type?: string; minPrice?: number; maxPrice?: number; search?: string; startDate?: string; endDate?: string }) => {
    const qs = params ? '?' + new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== '')
        .map(([k, v]) => [k, String(v)])
    ).toString() : '';
    return request(`/cars${qs}`);
  },

  getCar: (id: string) => request(`/cars/${id}`),

  getCarAvailability: (id: string, year: number, month: number) =>
    request<{
      weeklySchedule: Record<string, boolean>;
      availableHoursStart: string;
      availableHoursEnd: string;
      blockedDates: string[];
      bookings: { startDate: string; endDate: string; status: string }[];
    }>(`/cars/${id}/availability?year=${year}&month=${month}`),

  updateCarAvailability: (id: string, body: {
    weeklySchedule: Record<string, boolean>;
    availableHoursStart: string;
    availableHoursEnd: string;
    blockedDates: string[];
  }) => request(`/cars/${id}/availability`, { method: 'PUT', body: JSON.stringify(body) }),

  getUserCars: () => request('/user-cars'),

  createCar: (body: object) =>
    request('/cars', { method: 'POST', body: JSON.stringify(body) }),

  updateCar: (id: string, body: object) =>
    request(`/cars/${id}`, { method: 'PUT', body: JSON.stringify(body) }),

  deleteCar: (id: string) =>
    request(`/cars/${id}`, { method: 'DELETE' }),

  // Bookings
  getBookings: () => request('/bookings'),
  getOwnerBookings: () => request('/bookings/owner'),
  getBooking: (id: string) => request(`/bookings/${id}`),
  createBooking: (body: { carId: string; startDate: string; endDate?: string; startTime?: string; endTime?: string; bookingType?: 'daily' | 'hourly'; message?: string }) =>
    request('/bookings', { method: 'POST', body: JSON.stringify(body) }),
  updateBookingStatus: (id: string, status: string) =>
    request(`/bookings/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),
  checkIn: (id: string, photos: File[]) => {
    const fd = new FormData();
    photos.forEach((f) => fd.append('photos', f));
    return request(`/bookings/${id}/checkin`, { method: 'POST', body: fd });
  },
  checkOut: (id: string, photos: File[]) => {
    const fd = new FormData();
    photos.forEach((f) => fd.append('photos', f));
    return request(`/bookings/${id}/checkout`, { method: 'POST', body: fd });
  },
  getBookingPhotos: (id: string) =>
    request<{ checkInPhotos: string[]; checkOutPhotos: string[]; checkedInAt: string; checkedOutAt: string }>(`/bookings/${id}/photos`),

  // Messages
  getConversations: () => request('/conversations'),
  getMessages: (otherUserId: string) => request(`/messages/${otherUserId}`),
  sendMessage: (body: { toUserId: string; content: string; bookingId?: string }) =>
    request('/messages', { method: 'POST', body: JSON.stringify(body) }),

  // Users
  getMe: () => request('/users/me'),
  updateMe: (body: { firstName?: string; lastName?: string; phone?: string; bio?: string }) =>
    request('/users/me', { method: 'PUT', body: JSON.stringify(body) }),
  updatePassword: (body: { currentPassword: string; newPassword: string }) =>
    request('/users/me/password', { method: 'PUT', body: JSON.stringify(body) }),
  getUser: (id: string) => request(`/users/${id}`),

  // VIN
  decodeVin: (vin: string) =>
    request<{ make: string; model: string; year: number; type: string; transmission: string; seats: number; trim: string; vehicleType: string }>(`/vin/${vin}`),

  // Host
  getHostStats: () => request('/host/stats'),

  // Uploads
  uploadImages: (files: File[]) => {
    const formData = new FormData();
    files.forEach((f) => formData.append('images', f));
    return request<{ urls: string[] }>('/upload', { method: 'POST', body: formData });
  },

  // Notifications
  getNotifications: () => request<{ notifications: Notification[]; unreadCount: number }>('/notifications'),
  markNotificationRead: (id: string) => request(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => request('/notifications/read-all', { method: 'PUT' }),

  // Admin
  adminGetStats: () => request('/admin/stats'),
  adminGetActivity: () => request('/admin/activity'),
  adminGetUsers: (params?: Record<string, string>) => {
    const qs = params && Object.keys(params).length
      ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/admin/users${qs}`);
  },
  adminGetUser: (id: string) => request(`/admin/users/${id}`),
  adminUpdateUser: (id: string, body: object) =>
    request(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  adminDeleteUser: (id: string) =>
    request(`/admin/users/${id}`, { method: 'DELETE' }),
  adminResetPassword: (id: string) =>
    request(`/admin/users/${id}/reset-password`, { method: 'PUT' }),
  adminGetListings: (params?: Record<string, string>) => {
    const qs = params && Object.keys(params).length
      ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/admin/listings${qs}`);
  },
  adminUpdateListing: (id: string, body: object) =>
    request(`/admin/listings/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  adminDeleteListing: (id: string) =>
    request(`/admin/listings/${id}`, { method: 'DELETE' }),
  adminGetBookings: (params?: Record<string, string>) => {
    const qs = params && Object.keys(params).length
      ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/admin/bookings${qs}`);
  },
  adminPromote: () =>
    request('/admin/promote', { method: 'POST' }),
  adminGetSettings: () =>
    request('/admin/settings'),
  adminUpdateSettings: (body: { registrationOpen?: boolean; requireApproval?: boolean }) =>
    request('/admin/settings', { method: 'PUT', body: JSON.stringify(body) }),
  adminGetPendingUsers: () =>
    request('/admin/pending-users'),
  adminApproveUser: (id: string) =>
    request(`/admin/users/${id}/approve`, { method: 'PUT' }),
  adminGetOnlineUsers: () =>
    request('/admin/online-users'),
  adminGetBuildings: () =>
    request('/admin/buildings'),
  adminAddBuilding: (body: { name: string; address: string }) =>
    request('/admin/buildings', { method: 'POST', body: JSON.stringify(body) }),
  adminUpdateBuilding: (id: string, body: { name?: string; address?: string; active?: boolean }) =>
    request(`/admin/buildings/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  adminDeleteBuilding: (id: string) =>
    request(`/admin/buildings/${id}`, { method: 'DELETE' }),

  // Reviews
  createReview: (body: {
    bookingId: string;
    vehicleRatings: { cleanliness: number; performance: number; accuracy: number };
    ownerRatings: { communication: number; handoff: number };
    publicNote?: string;
  }) => request('/reviews', { method: 'POST', body: JSON.stringify(body) }),
  getUserReviews: (userId: string) => request(`/reviews/user/${userId}`),
};
