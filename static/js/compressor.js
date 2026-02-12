// Image and Video Compression Utilities

class MediaCompressor {
    constructor() {
        this.imageMaxWidth = 1280;
        this.imageMaxHeight = 1280;
        this.imageQuality = 0.8;
        this.videoMaxDuration = 20; // seconds
    }

    /**
     * Compress an image file
     * @param {File} file - Image file from input
     * @returns {Promise<Blob>} Compressed image blob
     */
    async compressImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                const img = new Image();

                img.onload = () => {
                    // Calculate new dimensions
                    let width = img.width;
                    let height = img.height;

                    if (width > this.imageMaxWidth || height > this.imageMaxHeight) {
                        const ratio = Math.min(this.imageMaxWidth / width, this.imageMaxHeight / height);
                        width = width * ratio;
                        height = height * ratio;
                    }

                    // Create canvas and compress
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob(
                        (blob) => {
                            console.log(`📷 Image compressed: ${(file.size / 1024).toFixed(1)}KB → ${(blob.size / 1024).toFixed(1)}KB`);
                            resolve(blob);
                        },
                        'image/jpeg',
                        this.imageQuality
                    );
                };

                img.onerror = reject;
                img.src = e.target.result;
            };

            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    /**
     * Validate and prepare video file
     * @param {File} file - Video file from input
     * @returns {Promise<Blob>} Video blob (basic validation, no compression for now)
     */
    async processVideo(file) {
        return new Promise((resolve, reject) => {
            // For MVP, we'll just validate size and duration
            // Full video compression would require WebCodecs API or server-side processing

            const video = document.createElement('video');
            video.preload = 'metadata';

            video.onloadedmetadata = () => {
                window.URL.revokeObjectURL(video.src);

                if (video.duration > this.videoMaxDuration) {
                    reject(new Error(`Video debe ser menor a ${this.videoMaxDuration} segundos`));
                    return;
                }

                console.log(`🎥 Video validated: ${(file.size / 1024 / 1024).toFixed(1)}MB, ${video.duration.toFixed(1)}s`);
                resolve(file); // Return original file for now
            };

            video.onerror = () => reject(new Error('Error al procesar video'));
            video.src = URL.createObjectURL(file);
        });
    }

    /**
     * Create thumbnail from video
     * @param {File} file - Video file
     * @returns {Promise<Blob>} Thumbnail image blob
     */
    async createVideoThumbnail(file) {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.preload = 'metadata';

            video.onloadeddata = () => {
                video.currentTime = 1; // Capture at 1 second
            };

            video.onseeked = () => {
                const canvas = document.createElement('canvas');
                canvas.width = 320;
                canvas.height = 240;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0, 320, 240);

                canvas.toBlob((blob) => {
                    window.URL.revokeObjectURL(video.src);
                    resolve(blob);
                }, 'image/jpeg', 0.7);
            };

            video.onerror = reject;
            video.src = URL.createObjectURL(file);
        });
    }
}

// Global compressor instance
const mediaCompressor = new MediaCompressor();
