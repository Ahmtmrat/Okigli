// Düğün lokasyonu - tüm site burayı okur

export const VENUE = {
  name: 'Prof. Dr. Erdal İnönü Kent Parkı',
  address: 'Lara Cd., Antalya 07160',
  city: 'Antalya',
  // Google Maps'ten alıp güncelle:
  // 1. Google Maps'te mekanı bul
  // 2. Sağ tık -> "Buradan ne var?" veya mekana tıkla
  // 3. URL'de @36.xxx,30.xxx şeklinde koordinat görünür
  // 4. Veya: Paylaş > Linki yer alır, "place_id"den de bulunur
  lat: 36.8543,
  lng: 30.7619,
} as const;

export const WEDDING = {
  bride: 'Diba',
  groom: 'Kadir',
  // ISO formatında, +03:00 Türkiye saati
  datetime: '2026-07-18T18:30:00+03:00',
  // İnsan okunabilir
  dateText: '18 Temmuz 2026',
  timeText: '18:30',
  dayText: 'Cumartesi',
} as const;

/**
 * Mobil cihazda yerleşik harita uygulamasını açar (iOS Apple Maps, Android Google Maps),
 * masaüstünde Google Maps web'e yönlendirir.
 */
export function getDirectionsUrl(): string {
  // Google Maps universal link - iOS/Android/web hepsinde çalışır
  return `https://www.google.com/maps/dir/?api=1&destination=${VENUE.lat},${VENUE.lng}&destination_place_id=`;
}
