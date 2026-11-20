const PREFIX='backhoe-field-',CACHE=PREFIX+'v05-shadow-20261120f';
const assets=['./','./index.html','./contact-05.html','./skate-park-01.html','./terrain-04.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-180.png','./offline.html'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(assets)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;
 if(event.request.mode==='navigate'){
  // Each edition has its own cache key; opening 05 must never overwrite completed 03.1.
  event.respondWith(fetch(event.request).then(async response=>{if(response.ok){const cache=await caches.open(CACHE);await cache.put(event.request,response.clone());}return response;}).catch(async()=>await caches.match(event.request,{ignoreSearch:true})||await caches.match('./offline.html')));
 }else event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request)));
});
