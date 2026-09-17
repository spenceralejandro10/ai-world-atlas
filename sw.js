/* Emergency recovery service worker: network only, clear stale caches, then unregister. */
self.addEventListener('install',event=>{self.skipWaiting()});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{try{const keys=await caches.keys();await Promise.all(keys.map(key=>caches.delete(key)));await self.clients.claim();await self.registration.unregister()}catch{}})())});
self.addEventListener('fetch',event=>{if(event.request.method==='GET')event.respondWith(fetch(event.request))});
