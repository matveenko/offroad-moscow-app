// Лечилка для картинок в Telegram (обход 403 Forbidden и сжатие)
export const getOptimizedUrl = (url?: string | null, width = 800) => {
  if (!url) return '';
  // Если это уже прокси или локальная картинка - не трогаем
  if (url.includes('wsrv.nl')) return url;
  
  // Пропускаем через прокси: сжимаем, конвертируем в WebP
  return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=${width}&q=80&output=webp`;
};