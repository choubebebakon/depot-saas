import api from './axios';

function buildApiCall(fn) {
  return async (...args) => {
    const signal = args[args.length - 1] instanceof AbortSignal ? args.pop() : undefined;
    return fn(...args, { signal });
  };
}

export const userApi = {
  getProfile: buildApiCall(async (_, { signal }) => {
    const response = await api.get('/auth/me', { signal });
    return response.data;
  }),

  updateProfile: buildApiCall(async (data, { signal }) => {
    const response = await api.put('/auth/me', data, { signal });
    return response.data;
  }),

  uploadAvatar: buildApiCall(async (file, { signal }) => {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await api.post('/auth/avatar', formData, {
      signal,
    });
    return response.data;
  }),

  changePassword: buildApiCall(async (data, { signal }) => {
    const response = await api.post('/auth/change-password', data, { signal });
    return response.data;
  }),

  toggle2FA: buildApiCall(async (enabled, { signal }) => {
    const response = await api.post('/auth/2fa', { enabled }, { signal });
    return response.data;
  }),

  getPreferences: buildApiCall(async (_, { signal }) => {
    const response = await api.get('/auth/preferences', { signal });
    return response.data;
  }),

  updatePreferences: buildApiCall(async (data, { signal }) => {
    const response = await api.put('/auth/preferences', data, { signal });
    return response.data;
  }),
};

export default userApi;
