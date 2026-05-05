export function fireDeviceEvent(action: string, payload: any) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('alphaDesk', {
      detail: { action, payload },
    })
  );
}

export function listenDeviceResponse(
  callback: (action: string, data: any) => void
) {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: any) => {
    callback(e.detail?.action, e.detail);
  };
  window.addEventListener('alphaDesk-response', handler);
  return () => window.removeEventListener('alphaDesk-response', handler);
}
