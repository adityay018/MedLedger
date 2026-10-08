// MedLedger API Client
const API_BASE = 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }
    return data;
  } catch (error) {
    console.error(`API Error on [${endpoint}]:`, error);
    throw error;
  }
}

export const api = {
  // Health & Dashboard
  getHealth: () => request('/health'),
  getDashboard: () => request('/dashboard'),

  // Parties
  getParties: (role) => request(`/parties${role ? `?role=${role}` : ''}`),
  getPartyById: (id) => request(`/parties/${id}`),
  createParty: (data) => request('/parties', { method: 'POST', body: JSON.stringify(data) }),
  updateParty: (id, data) => request(`/parties/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteParty: (id) => request(`/parties/${id}`, { method: 'DELETE' }),

  // Drugs
  getDrugs: (search) => request(`/drugs${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  getDrugById: (id) => request(`/drugs/${id}`),
  createDrug: (data) => request('/drugs', { method: 'POST', body: JSON.stringify(data) }),
  updateDrug: (id, data) => request(`/drugs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDrug: (id) => request(`/drugs/${id}`, { method: 'DELETE' }),

  // Batches
  getBatches: (status) => request(`/batches${status ? `?status=${status}` : ''}`),
  getBatchById: (id) => request(`/batches/${id}`),
  createBatch: (data) => request('/batches', { method: 'POST', body: JSON.stringify(data) }),
  updateBatch: (id, data) => request(`/batches/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBatch: (id) => request(`/batches/${id}`, { method: 'DELETE' }),

  // Quality Tests
  getQualityTests: (batchId) => request(`/quality-tests${batchId ? `?batchId=${batchId}` : ''}`),
  createQualityTest: (data) => request('/quality-tests', { method: 'POST', body: JSON.stringify(data) }),

  // Packages & Verification
  getPackages: (status, qr) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (qr) params.append('qr', qr);
    const qStr = params.toString();
    return request(`/packages${qStr ? `?${qStr}` : ''}`);
  },
  getPackageById: (id) => request(`/packages/${id}`),
  createPackage: (data) => request('/packages', { method: 'POST', body: JSON.stringify(data) }),
  updatePackage: (id, data) => request(`/packages/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePackage: (id) => request(`/packages/${id}`, { method: 'DELETE' }),
  verifyPackage: (identifier) => request(`/packages/verify/${encodeURIComponent(identifier)}`),

  // Shipments
  getShipments: (status) => request(`/shipments${status ? `?status=${status}` : ''}`),
  getShipmentById: (id) => request(`/shipments/${id}`),
  createShipment: (data) => request('/shipments', { method: 'POST', body: JSON.stringify(data) }),
  updateShipment: (id, data) => request(`/shipments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteShipment: (id) => request(`/shipments/${id}`, { method: 'DELETE' }),

  // Recalls
  getRecalls: () => request('/recalls'),
  createRecall: (data) => request('/recalls', { method: 'POST', body: JSON.stringify(data) }),
  processRecall: (id) => request(`/recalls/${id}/process`, { method: 'POST' }),
  getRecallImpact: (id) => request(`/recalls/${id}/impact`),

  // Dispensing
  getDispensings: () => request('/dispensings'),
  createDispensing: (data) => request('/dispensings', { method: 'POST', body: JSON.stringify(data) }),

  // SQL Analytics
  getAnalyticsList: () => request('/analytics'),
  runAnalyticsQuery: (queryId) => request(`/analytics/${queryId}`)
};
