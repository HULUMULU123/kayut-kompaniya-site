// Заглушка бронирования. Здесь будет реальная интеграция (например, Travelline).
export function submitBooking(payload) {
  console.info('[demo] submitBooking', payload);
  return new Promise((resolve) => setTimeout(() => resolve({ ok: true, demo: true }), 700));
}
