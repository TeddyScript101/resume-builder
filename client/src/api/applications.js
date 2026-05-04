const BASE = '/api/applications';

async function request(url, options = {}) {
  const res = await fetch(url, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}

export const getApplications = () => request(BASE);

export const getApplication = (id) => request(`${BASE}/${id}`);

export const createApplication = (body) =>
  request(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

export const updateApplication = (id, body) =>
  request(`${BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

export const deleteApplication = (id) =>
  request(`${BASE}/${id}`, { method: 'DELETE' });
