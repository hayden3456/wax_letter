// Service Worker - Unregistering to prevent 404 errors
// This service worker unregisters itself since it's not needed

self.addEventListener('install', (event) => {
    // Skip waiting and unregister immediately
    self.skipWaiting();
    event.waitUntil(
        self.registration.unregister().then(() => {
            return self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                    client.postMessage({ type: 'SW_UNREGISTERED' });
                });
            });
        })
    );
});

self.addEventListener('activate', (event) => {
    // Unregister and claim clients
    event.waitUntil(
        self.registration.unregister().then(() => {
            return self.clients.claim();
        })
    );
});

