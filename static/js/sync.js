// Sync Manager - Handles offline queue synchronization

class SyncManager {
    constructor() {
        this.syncing = false;
        this.maxRetries = 3;
        this.retryDelay = 2000; // 2 seconds
    }

    /**
     * Process all pending items in sync queue
     */
    async processSyncQueue() {
        if (this.syncing) {
            console.log('⏳ Sync already in progress...');
            return;
        }

        if (!navigator.onLine) {
            console.log('⚠️ Device is offline, skipping sync');
            return;
        }

        this.syncing = true;
        console.log('🔄 Starting sync...');

        try {
            let pending = await offlineDB.getPendingSyncItems();
            // Sort by timestamp to ensure chronological order
            pending.sort((a, b) => a.timestamp - b.timestamp);

            console.log(`Found ${pending.length} items to sync`);

            for (const item of pending) {
                try {
                    await this.syncItem(item);
                    // Mark as completed
                    item.status = 'completed';
                    await offlineDB.put('sync_queue', item);
                } catch (error) {
                    console.error('❌ Sync failed for item:', item.id, error);

                    // Increment retry count
                    item.retries = (item.retries || 0) + 1;

                    if (item.retries >= this.maxRetries) {
                        item.status = 'failed';
                        console.error(`❌ Max retries reached for item ${item.id}`);
                    }

                    await offlineDB.put('sync_queue', item);
                }
            }

            console.log('✅ Sync completed');
        } catch (error) {
            console.error('❌ Sync process error:', error);
        } finally {
            this.syncing = false;
        }
    }

    /**
     * Sync a single queue item
     * @param {Object} item - Queue item from IndexedDB
     */
    async syncItem(item) {
        console.log(`📤 Syncing item ${item.id} (type: ${item.type})`);

        switch (item.type) {
            case 'CREATE_CHECKLIST':
                await this.syncChecklist(item);
                break;
            case 'CREATE_UNIT':
                await this.syncUnit(item);
                break;
            case 'CHANGE_ORDER_STATUS':
                await this.syncOrderStatus(item);
                break;
            default:
                console.warn('Unknown sync type:', item.type);
        }
    }

    /**
     * Sync a checklist with its media files
     * @param {Object} item - Queue item containing checklist data
     */
    async syncChecklist(item) {
        const { checklistData, mediaIds } = item.payload;

        // Step 1: Upload checklist JSON
        console.log('📝 Uploading checklist data...');
        const response = await api.createChecklist(checklistData);
        const checklistId = response.id;
        console.log(`✅ Checklist created with ID: ${checklistId}`);

        // Step 2: Upload associated media files
        if (mediaIds && mediaIds.length > 0) {
            console.log(`📸 Uploading ${mediaIds.length} media files...`);

            for (const mediaId of mediaIds) {
                try {
                    await this.uploadMediaBlob(mediaId, checklistId, 'CHECKLIST');
                } catch (error) {
                    console.error(`❌ Failed to upload media ${mediaId}:`, error);
                    // Continue with other files even if one fails
                }
            }
        }

        // Step 3: Clean up local storage
        await offlineDB.delete('checklists', item.payload.localChecklistId);
        console.log('🧹 Local checklist data cleaned up');
    }

    /**
     * Upload a media blob from IndexedDB
     * @param {string} mediaId - Media ID in IndexedDB
     * @param {number} relatedId - Server-side checklist/order ID
     * @param {string} relatedType - "CHECKLIST" or "ORDER"
     */
    async uploadMediaBlob(mediaId, relatedId, relatedType) {
        // Get media blob from IndexedDB
        const mediaData = await offlineDB.get('media', mediaId);

        if (!mediaData) {
            console.warn(`Media ${mediaId} not found in IndexedDB`);
            return;
        }

        // Upload to server
        const response = await api.uploadMedia(
            relatedId,
            relatedType,
            mediaData.type, // "IMAGE" or "VIDEO"
            mediaData.blob,
            mediaData.filename
        );

        console.log(`✅ Media uploaded: ${response.id}`);

        // Delete from local IndexedDB
        await offlineDB.delete('media', mediaId);
    }

    /**
     * Sync a unit (simple example)
     */
    async syncUnit(item) {
        const unitData = item.payload;
        const response = await api.createUnit(unitData);
        console.log(`✅ Unit synced: ${response.eco_number}`);
    }

    /**
     * Sync order status change
     */
    async syncOrderStatus(item) {
        const { orderId, status, timestamp, reason, product_id, quantity } = item.payload;
        const response = await api.changeOrderStatus(orderId, status, timestamp, reason, product_id, quantity);
        console.log(`✅ Order ${orderId} status synced: ${status} (original: ${timestamp})`);
    }

    /**
     * Retry with exponential backoff
     * @param {Function} fn - Function to retry
     * @param {number} retries - Number of retries left
     */
    async retryWithBackoff(fn, retries = this.maxRetries) {
        try {
            return await fn();
        } catch (error) {
            if (retries <= 0) throw error;

            const delay = this.retryDelay * (this.maxRetries - retries + 1);
            console.log(`⏱️ Retrying in ${delay}ms... (${retries} retries left)`);

            await new Promise(resolve => setTimeout(resolve, delay));
            return this.retryWithBackoff(fn, retries - 1);
        }
    }
}

// Global sync manager instance
const syncManager = new SyncManager();
