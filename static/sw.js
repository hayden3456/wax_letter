// Service Worker for background image generation
// This allows image generation to continue even when user navigates away

self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    event.waitUntil(self.clients.claim());
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
    if (event.data.type === 'GENERATE_IMAGE') {
        console.log('Service Worker: Received image generation request');
        const { fileData, fileName, userId } = event.data;
        
        // Convert data URL back to blob and generate image
        fetch(fileData)
            .then(res => res.blob())
            .then(blob => {
                const formData = new FormData();
                formData.append('logo', new File([blob], fileName, { type: blob.type }));
                
                console.log('Service Worker: Starting image generation...');
                return fetch('/api/generate-seal', {
                    method: 'POST',
                    body: formData
                });
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Generation failed: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Service Worker: Image generated successfully');
                
                // Store the result in cache for retrieval
                return caches.open('image-generation-results-v1').then(cache => {
                    const resultData = {
                        image: data.image,
                        timestamp: Date.now(),
                        userId: userId
                    };
                    
                    // Store in cache with a specific key
                    const response = new Response(JSON.stringify(resultData));
                    return cache.put('/generation-result', response).then(() => {
                        console.log('Service Worker: Cached result saved');
                        return data;
                    });
                });
            })
            .then(data => {
                // Send result back to all clients (including pages on other routes)
                return self.clients.matchAll({ includeUncontrolled: true, type: 'window' })
                    .then(clients => {
                        console.log(`Service Worker: Notifying ${clients.length} clients`);
                        clients.forEach(client => {
                            client.postMessage({
                                type: 'IMAGE_GENERATED',
                                image: data.image,
                                success: true
                            });
                        });
                        return data;
                    });
            })
            .catch(error => {
                console.error('Service Worker: Generation failed:', error);
                
                // Notify clients of failure
                self.clients.matchAll().then(clients => {
                    clients.forEach(client => {
                        client.postMessage({
                            type: 'IMAGE_GENERATION_FAILED',
                            error: error.message,
                            success: false
                        });
                    });
                });
                
                // Don't clear pending flag - allow retry
            });
    } else if (event.data.type === 'CHECK_GENERATION_RESULT') {
        // Check if there's a cached result
        caches.open('image-generation-results-v1').then(cache => {
            cache.match('/generation-result').then(response => {
                if (response) {
                    response.json().then(data => {
                        // Send the cached result to the client
                        event.source.postMessage({
                            type: 'CACHED_GENERATION_RESULT',
                            image: data.image,
                            timestamp: data.timestamp
                        });
                        
                        // Clear the cache after retrieving
                        cache.delete('/generation-result');
                    });
                } else {
                    event.source.postMessage({
                        type: 'NO_CACHED_RESULT'
                    });
                }
            });
        });
    }
});

// Helper to clear pending generation flag
function clearPendingGeneration() {
    // This will be handled by the main thread when it receives the result
    console.log('Service Worker: Generation complete, clearing flags');
}

// Intercept fetch requests for the API (optional - for better offline support)
self.addEventListener('fetch', (event) => {
    // Let all requests pass through normally
    // We handle generation explicitly through postMessage
    return;
});

