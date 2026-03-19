import api from './api';

export const login = async (email, password) => {
  const response = await api.post('/login', { email, password });
  return response.data;
};

export const register = async (userData) => {
  const payload = {
    name:           userData.username,
    email:          userData.email,
    phone:          userData.phone,
    password:       userData.password,
    role:           userData.role,
    guardian_email: userData.guardian_email || '',
    patient_email:  userData.patient_email  || '',
    specialization: userData.specialization || '',
    hospital:       userData.hospital       || '',
    experience:     userData.experience     || '',
    fee:            userData.fee            || '',
  };
  const response = await api.post('/register', payload);
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const getCurrentUser = () => {
  try {
    const user = localStorage.getItem('user');

    if (!user || user === "undefined") return null;

    return JSON.parse(user);
  } catch (error) {
    console.error("Invalid user in localStorage:", error);
    localStorage.removeItem('user'); // cleanup corrupted data
    return null;
  }
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};