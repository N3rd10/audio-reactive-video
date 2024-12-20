// sw.js
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request).then((response) => {
            const newHeaders = new Headers(response.headers);
            newHeaders.set('Cache-Control', 'no-store');
            return new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers: newHeaders,
            });
        })
    );
});
