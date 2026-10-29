/* ArtExtreme · Notificações push (carregado pelo service worker do PWA) */

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { body: event.data ? event.data.text() : '' }
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'ArtExtreme', {
      body: data.body || 'Você tem uma novidade no painel.',
      icon: '/pwa-192x192.png',
      badge: '/badge-96x96.png',
      tag: data.tag || 'artextreme',
      renotify: true,
      vibrate: [120, 60, 120],
      data: { url: data.url || '/admin' },
    }),
  )
})

// Toque na notificação: abre o painel (ou traz o app para frente se já estiver aberto)
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = new URL(event.notification.data?.url || '/admin', self.location.origin).href

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      const open = windows.find((w) => w.url.startsWith(self.location.origin))
      if (open) {
        await open.focus()
        if (!open.url.startsWith(url)) await open.navigate(url).catch(() => {})
        return
      }
      await self.clients.openWindow(url)
    })(),
  )
})
