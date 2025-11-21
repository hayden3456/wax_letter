# How to Implement Background AI Image Generation

## The Problem

Currently, the image generation uses regular `fetch()` which gets **cancelled** when the user navigates away from the page. The `keepalive: true` flag helps but doesn't guarantee the request continues after navigation.

## Solution Options

### Option 1: Service Worker (Recommended for True Background Processing)

This allows the image generation to continue even if the user closes the tab.

#### Step 1: Create a Service Worker

Create `static/sw.js`:

```javascript
// Service Worker for background image generation
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

// Intercept fetch requests for image generation
self.addEventListener('fetch', (event) => {
    // Only handle image generation requests
    if (event.request.url.includes('/api/generate-seal')) {
        event.respondWith(
            fetch(event.request).then(response => {
                // Clone the response so we can cache it
                const responseClone = response.clone();
                
                // Cache the response
                caches.open('image-generation-v1').then(cache => {
                    cache.put(event.request, responseClone);
                });
                
                return response;
            }).catch(error => {
                // If fetch fails, try to get from cache
                return caches.match(event.request);
            })
        );
    }
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
    if (event.data.type === 'GENERATE_IMAGE') {
        const { fileData, fileName } = event.data;
        
        // Convert data URL back to File
        fetch(fileData)
            .then(res => res.blob())
            .then(blob => {
                const formData = new FormData();
                formData.append('logo', new File([blob], fileName, { type: blob.type }));
                
                return fetch('/api/generate-seal', {
                    method: 'POST',
                    body: formData
                });
            })
            .then(response => response.json())
            .then(data => {
                // Send result back to all clients
                self.clients.matchAll().then(clients => {
                    clients.forEach(client => {
                        client.postMessage({
                            type: 'IMAGE_GENERATED',
                            image: data.image
                        });
                    });
                });
            })
            .catch(error => {
                console.error('Background generation failed:', error);
            });
    }
});
```

#### Step 2: Register Service Worker in `src/routes/+layout.svelte`

```javascript
import { onMount } from 'svelte';
import { browser } from '$app/environment';

onMount(() => {
    if (browser && 'serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('Service Worker registered:', registration);
            })
            .catch(error => {
                console.error('Service Worker registration failed:', error);
            });
    }
});
```

#### Step 3: Update `src/routes/+page.svelte` to Use Service Worker

Replace the `generateImageInBackground` function:

```javascript
async function generateImageInBackground(file) {
    // Save file to localStorage
    const reader = new FileReader();
    reader.onload = async (e) => {
        if (e.target && typeof e.target.result === 'string') {
            const fileData = e.target.result;
            localStorage.setItem(STORAGE_KEYS.UPLOADED_FILE + '_data', fileData);
            localStorage.setItem(STORAGE_KEYS.UPLOADED_FILE + '_name', file.name);
            localStorage.setItem(STORAGE_KEYS.IS_GENERATING, 'true');
            
            // Try to use Service Worker for background processing
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'GENERATE_IMAGE',
                    fileData: fileData,
                    fileName: file.name
                });
                
                // Listen for completion
                navigator.serviceWorker.addEventListener('message', (event) => {
                    if (event.data.type === 'IMAGE_GENERATED') {
                        generatedImage = event.data.image;
                        hasUploadedFile = true;
                        isGenerating = false;
                        stopLoadingAnimation();
                        saveState();
                        localStorage.removeItem(STORAGE_KEYS.IS_GENERATING);
                    }
                });
            } else {
                // Fallback to regular fetch
                await generateImageWithFetch(file);
            }
        }
    };
    reader.readAsDataURL(file);
    
    isGenerating = true;
    startLoadingAnimation();
    hasUploadedFile = true;
    saveState();
}

async function generateImageWithFetch(file) {
    try {
        const formData = new FormData();
        formData.append('logo', file);
        
        const response = await fetch('/api/generate-seal', {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            const data = await response.json();
            generatedImage = data.image;
            hasUploadedFile = true;
            await saveState();
        }
    } catch (error) {
        console.error('Error generating image:', error);
    } finally {
        isGenerating = false;
        stopLoadingAnimation();
        await saveState();
    }
}
```

### Option 2: Background Sync API (Simpler, but less reliable)

This uses the Background Sync API which is simpler but has limited browser support.

#### Update `generateImageInBackground`:

```javascript
async function generateImageInBackground(file) {
    // Save file data
    const reader = new FileReader();
    reader.onload = async (e) => {
        if (e.target && typeof e.target.result === 'string') {
            const fileData = e.target.result;
            localStorage.setItem(STORAGE_KEYS.UPLOADED_FILE + '_data', fileData);
            localStorage.setItem(STORAGE_KEYS.UPLOADED_FILE + '_name', file.name);
            localStorage.setItem(STORAGE_KEYS.IS_GENERATING, 'true');
            
            // Try Background Sync
            if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
                const registration = await navigator.serviceWorker.ready;
                await registration.sync.register('generate-image');
            } else {
                // Fallback to regular fetch
                await generateImageWithFetch(file);
            }
        }
    };
    reader.readAsDataURL(file);
    
    isGenerating = true;
    startLoadingAnimation();
    hasUploadedFile = true;
    saveState();
}
```

### Option 3: Polling/Resume on Return (Simplest, Works Everywhere)

This doesn't run in true background, but resumes when the user returns to the page.

#### The current implementation already does this, but needs improvement:

```javascript
async function generateImageInBackground(file) {
    // Save file immediately
    const reader = new FileReader();
    reader.onload = (e) => {
        if (e.target && typeof e.target.result === 'string') {
            localStorage.setItem(STORAGE_KEYS.UPLOADED_FILE + '_data', e.target.result);
            localStorage.setItem(STORAGE_KEYS.UPLOADED_FILE + '_name', file.name);
            localStorage.setItem(STORAGE_KEYS.IS_GENERATING, 'true');
        }
    };
    reader.readAsDataURL(file);
    
    // Mark as generating
    isGenerating = true;
    startLoadingAnimation();
    hasUploadedFile = true;
    saveState();
    
    // Start the fetch (will be cancelled if user navigates away)
    try {
        const formData = new FormData();
        formData.append('logo', file);
        
        const response = await fetch('/api/generate-seal', {
            method: 'POST',
            body: formData,
            keepalive: true  // Helps but doesn't guarantee continuation
        });
        
        if (response.ok) {
            const data = await response.json();
            generatedImage = data.image;
            hasUploadedFile = true;
            await saveState();
            localStorage.removeItem(STORAGE_KEYS.IS_GENERATING);
        }
    } catch (error) {
        // If cancelled, the file is saved and will resume on return
        console.log('Generation may have been cancelled, will resume on return');
    } finally {
        isGenerating = false;
        stopLoadingAnimation();
        await saveState();
    }
}

// On page load, check for pending generation
async function loadState() {
    // ... existing code ...
    
    // If there's a pending generation, continue it
    if (localStorage.getItem(STORAGE_KEYS.IS_GENERATING) === 'true') {
        const savedFileData = localStorage.getItem(STORAGE_KEYS.UPLOADED_FILE + '_data');
        const savedFileName = localStorage.getItem(STORAGE_KEYS.UPLOADED_FILE + '_name');
        
        if (savedFileData) {
            // Resume generation
            continuePendingGeneration();
        }
    }
}
```

## Recommended Approach

**For your use case, I recommend Option 3 (Polling/Resume)** because:
1. It works in all browsers
2. Simpler to implement and maintain
3. Users typically return to the page to see results anyway
4. The generation completes quickly enough that true background processing isn't critical

**If you need true background processing**, use **Option 1 (Service Worker)**.

## Key Points for Next Agent

1. **Current Issue**: Regular `fetch()` is cancelled when user navigates away
2. **Solution**: Use Service Worker OR save state and resume on return
3. **File Location**: `src/routes/+page.svelte` - `generateImageInBackground()` function
4. **State Management**: Already saves to localStorage, just needs better resume logic
5. **Cloud Storage**: Already implemented in `src/lib/firestoreService.js`

## Testing

To test background processing:
1. Upload a file on homepage
2. Immediately navigate to another page
3. Return to homepage
4. Check if generation resumed and completed

