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

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.body && !(options.body instanceof FormData)
      ? { 'Content-Type': 'application/json' }
      : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

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
  register: (body: { username: string; password: string; building?: string; firstName?: string; lastName?: string }) =>
    request('/register', { method: 'POST', body: JSON.stringify(body) }),

  /** Returns the raw token plus decoded userId and isVerified. */
  login: async (body: { username: string; password: string }) => {
    const data = await request<{ token: string }>('/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    const payload = decodeJwt(data.token);
    return {
      token: data.token,
      userId: payload?.userId ?? '',
      isVerified: payload?.isVerified ?? false,
    };
  },

  /** Returns a fresh token with isVerified:true after document upload. */
  submitVerification: async (userId: string, formData: FormData) => {
    const data = await request<{ token: string }>(`/verify/${userId}`, {
      method: 'POST',
      body: formData,
    });
    const payload = decodeJwt(data.token);
    return {
      token: data.token,
      userId: payload?.userId ?? userId,
      isVerified: payload?.isVerified ?? false,
    };
  },

  getVerification: (userId: string) =>
    request(`/verification/${userId}`),

  // Cars
  getCars: (params?: { type?: string; minPrice?: number; maxPrice?: number; search?: string }) => {
    const qs = params ? '?' + new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== '')
        .map(([k, v]) => [k, String(v)])
    ).toString() : '';
    return request(`/cars${qs}`);
  },

  getCar: (id: string) => request(`/cars/${id}`),

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
