// src/services/api.ts
const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api';

const handleResponse = async (res: Response) => {
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
};

export const fetchDashboardStats = async () => {
  const res = await fetch(`${API_BASE}/dashboard`);
  return handleResponse(res);
};

export const fetchInspections = async () => {
  const res = await fetch(`${API_BASE}/inspections`);
  return handleResponse(res);
};

export const fetchProducts = async () => {
  const res = await fetch(`${API_BASE}/products`);
  return handleResponse(res);
};

export const fetchRules = async () => {
  const res = await fetch(`${API_BASE}/rules`);
  return handleResponse(res);
};

export const updateRule = async (id: string, is_enabled: boolean) => {
  const res = await fetch(`${API_BASE}/rules/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_enabled }),
  });
  return handleResponse(res);
};

export const analyzeImage = async (formData: FormData) => {
  const res = await fetch(`${API_BASE}/inspections/analyze`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse(res);
};

export const saveInspection = async (data: any) => {
  const res = await fetch(`${API_BASE}/inspections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};
