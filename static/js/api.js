// API Client - Handles all HTTP requests to backend
const API_BASE = window.location.origin + '/api/v1';

class APIClient {
    constructor() {
        this.token = localStorage.getItem('access_token');
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('access_token', token);
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem('access_token');
    }

    async request(endpoint, options = {}) {
        const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
        const headers = {
            ...options.headers,
        };
        if (!isFormData && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        // Note: Browsers automatically send HttpOnly cookies if backend is same-origin
        // We keep localStorage for non-sensitive UX/metadata if needed, 
        // but the token in cookies is what the backend now prioritizes for security.

        try {
            const response = await fetch(`${API_BASE}${endpoint}`, {
                ...options,
                headers,
                // Ensure cookies are sent even if on a slightly different subdomain/origin
                credentials: 'include',
            });

            if (!response.ok) {
                if (response.status === 401) {
                    this.clearToken();
                    window.location.href = '/static/index.html';
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    // Auth endpoints
    async login(email, password) {
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);

        const data = await this.request('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData,
        });

        this.setToken(data.access_token);
        return data;
    }

    async logout() {
        try {
            await this.request('/auth/logout', { method: 'POST' });
        } catch (e) {
            console.error('Logout request failed', e);
        }
        this.clearToken();
        window.location.href = '/static/index.html';
    }

    async register(userData) {
        return await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    }

    // Units endpoints
    async getUnits() {
        return await this.request('/units/');
    }

    async getFlota360Data() {
        return await this.request('/units/flota360');
    }

    async createUnit(unitData) {
        return await this.request('/units/', {
            method: 'POST',
            body: JSON.stringify(unitData),
        });
    }

    async deleteUnit(unitId) {
        return await this.request(`/units/${unitId}`, {
            method: 'DELETE',
        });
    }

    // Checklist endpoints
    async createChecklist(checklistData) {
        return await this.request('/checklists/', {
            method: 'POST',
            body: JSON.stringify(checklistData),
        });
    }

    async getChecklists() {
        return await this.request('/checklists/');
    }

    // Orders endpoints
    async getOrders() {
        return await this.request('/orders/');
    }

    async createOrder(orderData) {
        return await this.request('/orders/', {
            method: 'POST',
            body: JSON.stringify(orderData),
        });
    }

    async getOrder(orderId) {
        return await this.request(`/orders/${orderId}`);
    }

    async updateOrder(orderId, updateData) {
        return await this.request(`/orders/${orderId}`, {
            method: 'PATCH',
            body: JSON.stringify(updateData),
        });
    }

    async changeOrderStatus(orderId, status, timestamp = null, reason = null, productId = null, quantity = null) {
        const body = { status };
        if (timestamp) body.timestamp = timestamp;
        if (reason) body.reason = reason;
        if (productId) body.product_id = parseInt(productId);
        if (quantity) body.quantity = parseFloat(quantity);

        return await this.request(`/orders/${orderId}/status`, {
            method: 'PATCH',
            body: JSON.stringify(body),
        });
    }

    async getOrderTimeLogs(orderId) {
        return await this.request(`/orders/${orderId}/timelogs`);
    }

    // Media upload endpoint
    async uploadMedia(relatedId, relatedType, mediaType, blob, filename) {
        const formData = new FormData();
        formData.append('related_id', relatedId);
        formData.append('related_type', relatedType);
        formData.append('media_type', mediaType);
        formData.append('file', blob, filename);

        // Don't set Content-Type header, let browser set it with boundary
        const headers = {};
        const response = await fetch(`${API_BASE}/checklists/media`, {
            method: 'POST',
            headers,
            body: formData,
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    }

    // Users endpoints
    async getMe() {
        return await this.request('/users/me');
    }

    async getServiciosExcel(startDate = null, endDate = null) {
        let url = '/external/servicios-excel';
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        if (Array.from(params).length > 0) url += `?${params.toString()}`;
        return await this.request(url);
    }

    async getUsers(role = null) {
        let endpoint = '/users/';
        if (role) endpoint += `?role=${role}`;
        return await this.request(endpoint);
    }

    async createUser(userData) {
        return await this.request('/users/', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    }

    async uploadUserAvatar(userId, file) {
        const formData = new FormData();
        formData.append('file', file);
        return await this.request(`/users/${userId}/avatar`, {
            method: 'POST',
            body: formData,
        });
    }

    async deleteUser(userId) {
        return await this.request(`/users/${userId}`, {
            method: 'DELETE',
        });
    }

    async updateUnit(unitId, updateData) {
        return await this.request(`/units/${unitId}`, {
            method: 'PUT',
            body: JSON.stringify(updateData),
        });
    }

    async getDashboardActivity() {
        return await this.request('/dashboard/activity');
    }

    async getTechnicianStats(period) {
        return await this.request(`/dashboard/technician-stats?period=${period}`);
    }

    async getUnitTimeline(unitId) {
        return await this.request(`/units/${unitId}/timeline`);
    }

    async setChecklistPriority(checklistId) {
        return await this.request(`/checklists/${checklistId}/priority`, {
            method: 'PATCH'
        });
    }

    async scheduleOrder(orderId, date) {
        return await this.request(`/orders/${orderId}/schedule`, {
            method: 'PATCH',
            body: JSON.stringify({ scheduled_date: date })
        });
    }

    // Inventory & Warehouse
    async getProducts() {
        return await this.request('/products');
    }

    async createProduct(data) {
        return await this.request('/products', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateProduct(id, data) {
        return await this.request(`/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async getPurchaseOrders() {
        return await this.request('/purchases');
    }

    async createPurchaseOrder(data) {
        return await this.request('/purchases', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updatePurchaseOrderStatus(id, status) {
        return await this.request(`/purchases/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
    }

    async createStockMovement(data) {
        return await this.request('/stock/move', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // Dashboard Enhanced Endpoints
    async getTopPartsConsumed(limit = 5) {
        return await this.request(`/dashboard/top-parts-consumed?limit=${limit}`);
    }

    async getTopExpensiveParts(minPrice = 5000, limit = 5) {
        return await this.request(`/dashboard/top-expensive-parts?min_price=${minPrice}&limit=${limit}`);
    }

    async getTodayWorkload() {
        return await this.request('/dashboard/today-workload');
    }

    // Tires Module
    async getLlantasExcel(cuenta = null) {
        let url = '/external/llantas-excel';
        if (cuenta) {
            url += `?cuenta=${encodeURIComponent(cuenta)}`;
        }
        return await this.request(url);
    }
}

// Global API instance
const api = new APIClient();
