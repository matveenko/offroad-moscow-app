import { HashRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Calendar, Map, Home, User, ChevronRight, Loader2, CloudRain, PlayCircle, X, ExternalLink, BookOpen } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import WebApp from '@twa-dev/sdk';
import { Toaster } from 'sonner';

import EventDetails from './pages/EventDetails';
import Admin from './pages/Admin';
import Profile from './pages/Profile';

// --- ТИПЫ ---
interface Story { id: number; title: string; image_url: string; link: string; }
interface Event { id: number; title: string; date: string; location: string; price: number; image_url?: string; }
interface WikiArticle { id: number; title: string; content: string; image_url?: string; telegram_link?: string; }

// --- ХЕЛПЕР ДЛЯ КАРТИНОК (ЛЕЧИТ БАГИ В ТЕЛЕГЕ) ---
const getOptimizedUrl = (url?: string | null, width = 800) => {
  if (!url) return '';
  // Если это уже прокси или локальная картинка - не трогаем
  if (url.includes('wsrv.nl')) return url;
  
  // Пропускаем через прокси: сжимаем, конвертируем в WebP и лечим CORS
  return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=${width}&q=80&output=webp`;
};

// --- КОМПОНЕНТЫ ---

const HomePage = () => {
  const user = WebApp.initDataUnsafe.user;
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [bannerUrl, setBannerUrl] = useState('https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=1200');

  useEffect(() => {
    const loadData = async () => {
        const { data: storiesData } = await supabase.from('stories').select('*').order('created_at', { ascending: false }).limit(5);
        if (storiesData) setStories(storiesData);

        const { data: settingsData } = await supabase.from('app_settings').select('value').eq('key', 'home_banner').single();
        if (settingsData) setBannerUrl(settingsData.value);

        setLoading(false);
    };
    loadData();
  }, []);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 pb-32 animate-in fade-in duration-500 pt-6">
      
      {/* Хедер */}
      <header className="flex justify-between items-center px-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter">
            {user?.first_name || 'Бродяга'}
            <span className="text-offroad-orange">.</span>
          </h1>
          <p className="text-gray-500 text-sm font-medium">Готов месить?</p>
        </div>
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3 flex items-center gap-3 shadow-lg">
          <CloudRain size={24} className="text-blue-400" />
          <div>
             <div className="text-[10px] text-gray-400 font-bold uppercase leading-none mb-1">Грязь</div>
             <div className="text-sm text-white font-black leading-none">9/10</div>
          </div>
        </div>
      </header>

      {/* ГЛАВНЫЙ БАННЕР */}
      <div className="px-4"> 
        <div className="relative w-full aspect-[4/5] sm:aspect-video md:h-[500px] rounded-[32px] overflow-hidden shadow-2xl group isolate bg-gray-800">
            <img 
                src={getOptimizedUrl(bannerUrl, 1200)} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                alt="Offroad Jeep"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col items-start z-10">
                <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full mb-4">
                    <div className="w-2 h-2 rounded-full bg-offroad-orange animate-pulse"></div>
                    <span className="text-white text-xs font-bold uppercase tracking-wider">Сезон Открыт</span>
                </div>
                <h2 className="text-5xl sm:text-6xl font-black text-white leading-[0.9] mb-4 drop-shadow-xl">
                  ВРЕМЯ<br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-offroad-orange to-red-500">ГРЯЗИ</span>
                </h2>
                <Link to="/events" className="w-full sm:w-auto bg-offroad-orange text-white font-black uppercase tracking-wide py-4 px-8 rounded-xl flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(249,115,22,0.4)] active:scale-[0.98] transition-all hover:bg-orange-600 hover:shadow-[0_0_30px_rgba(249,115,22,0.6)]">
                   <span>Открыть Календарь</span>
                   <ChevronRight size={20} />
                </Link>
            </div>
        </div>
      </div>

      {/* Лента новостей */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4 px-6 flex items-center gap-2">
          <PlayCircle size={24} className="text-offroad-orange"/>
          <span>Хроники</span>
        </h3>
        
        {loading ? (
            <div className="flex gap-4 px-6 overflow-hidden">
                {[1,2,3].map(i => <div key={i} className="w-32 h-48 bg-gray-800 rounded-2xl animate-pulse shrink-0"/>)}
            </div>
        ) : stories.length === 0 ? (
           <div className="mx-6 bg-offroad-dark border border-gray-800 rounded-2xl p-8 text-center">
               <p className="text-gray-500 text-base">Новостей пока нет 🤷‍♂️</p>
           </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-8 scrollbar-hide px-6 snap-x">
            {stories.map(story => (
              <a href={story.link} key={story.id} target="_blank" className="snap-start flex-shrink-0 w-36 h-52 group relative rounded-2xl overflow-hidden bg-gray-900 shadow-lg active:scale-95 transition-transform border border-white/5">
                <img 
                    src={getOptimizedUrl(story.image_url, 400)} 
                    className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-white text-xs font-bold leading-tight line-clamp-3 drop-shadow-md">{story.title}</p>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

const EventsPage = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('events').select('*').order('date', { ascending: true })
      .then(({ data }) => { setEvents(data || []); setLoading(false); });
  }, []);

  return (
    <div className="p-6 pb-32 animate-in fade-in w-full max-w-5xl mx-auto">
      <h1 className="text-3xl font-display font-black text-white mb-6 uppercase tracking-wide">Календарь</h1>
      
      {loading ? (
        <div className="flex justify-center mt-10 text-offroad-orange animate-spin"><Loader2 size={40} /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event) => (
            <Link to={`/event/${event.id}`} key={event.id} className="block group">
              <div className="bg-offroad-dark border border-gray-800 rounded-2xl overflow-hidden relative h-52 shadow-lg transition-transform hover:-translate-y-1">
                {/* Картинка */}
                <img 
                    src={getOptimizedUrl(event.image_url, 600)} 
                    className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-60 transition-opacity" 
                    onError={(e) => e.currentTarget.style.display='none'}
                />
                
                {/* Градиент */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                
                {/* Контент */}
                <div className="absolute bottom-0 left-0 p-5 w-full">
                  {/* flex-row чтобы они стояли в ряд, items-end чтобы ровнялись по низу */}
                  <div className="flex justify-between items-end gap-4">
                    
                    {/* ЛЕВАЯ ЧАСТЬ (Текст): flex-1 и min-w-0 не дают тексту ломать верстку */}
                    <div className="flex-1 min-w-0">
                      <span className="text-offroad-orange text-xs font-bold uppercase tracking-wider mb-1 block shadow-black drop-shadow-md font-sans">
                        {new Date(event.date).toLocaleDateString('ru-RU')}
                      </span>
                      <h3 className="font-display font-bold text-xl leading-tight text-white shadow-black drop-shadow-md uppercase break-words">
                        {event.title}
                      </h3>
                      <div className="flex items-center mt-2 text-gray-300 text-xs shadow-black drop-shadow-md font-sans truncate">
                         <Map size={12} className="mr-1 shrink-0" /> 
                         <span className="truncate">{event.location}</span>
                      </div>
                    </div>

                    {/* ПРАВАЯ ЧАСТЬ (Цена): shrink-0 запрещает сжимать кнопку */}
                    <div className="shrink-0 bg-offroad-orange px-3 py-2 rounded-xl text-sm font-display font-bold text-white shadow-lg flex items-center justify-center min-w-[70px]">
                      {event.price} ₽
                    </div>

                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

const NavPage = () => {
  const [articles, setArticles] = useState<WikiArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<WikiArticle | null>(null);

  useEffect(() => {
    supabase.from('wiki').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setArticles(data || []); setLoading(false); });
  }, []);

  return (
    <div className="p-6 pb-32 animate-in fade-in w-full max-w-5xl mx-auto">
      <h1 className="text-3xl font-black text-white mb-6">База Знаний</h1>
      
      {loading ? <Loader2 className="animate-spin mx-auto text-offroad-orange"/> : (
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {articles.map((art) => (
              <div key={art.id} onClick={() => setSelectedArticle(art)} className="bg-offroad-dark border border-gray-800 p-5 rounded-2xl flex items-center justify-between active:bg-gray-800 active:scale-[0.98] transition-all cursor-pointer group hover:border-gray-600">
                <div className="flex items-center gap-4">
                    {art.image_url && <img src={getOptimizedUrl(art.image_url, 100)} className="w-12 h-12 rounded-lg object-cover bg-gray-800"/>}
                    <span className="font-bold text-gray-200 text-lg leading-tight">{art.title}</span>
                </div>
                <ChevronRight size={20} className="text-offroad-orange group-hover:translate-x-1 transition-transform"/>
              </div>
            ))}
            {articles.length === 0 && <p className="text-gray-500">Пока пусто. Админ ленится.</p>}
         </div>
      )}

      {selectedArticle && (
        <div className="fixed inset-0 z-[60] bg-offroad-black flex flex-col animate-in slide-in-from-bottom-10 duration-300">
            <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-offroad-black/90 backdrop-blur">
                <h2 className="font-bold text-lg truncate pr-4">{selectedArticle.title}</h2>
                <button onClick={() => setSelectedArticle(null)} className="p-2 bg-gray-800 rounded-full hover:bg-gray-700"><X size={20}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 pb-20 max-w-5xl mx-auto w-full">
                {selectedArticle.image_url && (
                    <img src={getOptimizedUrl(selectedArticle.image_url, 800)} className="w-full h-64 sm:h-96 object-cover rounded-2xl mb-6 bg-gray-800"/>
                )}
                <div className="prose prose-invert max-w-none text-gray-300 whitespace-pre-wrap leading-7 font-normal">
                    {selectedArticle.content}
                </div>
            </div>
            {selectedArticle.telegram_link && (
                <div className="p-4 border-t border-gray-800 bg-offroad-black pb-8">
                    <a href={selectedArticle.telegram_link} target="_blank" className="flex items-center justify-center gap-2 w-full max-w-md mx-auto bg-[#2AABEE] text-white font-bold py-3 rounded-xl hover:bg-[#229ED9] transition-colors">
                        <ExternalLink size={18}/> Читать / Обсудить в Telegram
                    </a>
                </div>
            )}
        </div>
      )}
    </div>
  );
};

const TabBar = () => {
  const location = useLocation();
  if (location.pathname.includes('/event/') || location.pathname === '/admin') return null;
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#1a1a1a]/95 backdrop-blur-md border-t border-gray-800 pb-safe z-50">
      <div className="flex justify-around items-center h-20 px-2 w-full max-w-5xl mx-auto">
        <Link to="/" className={`flex flex-col items-center p-2 rounded-xl transition-all ${isActive('/') ? 'text-offroad-orange' : 'text-gray-500'}`}><Home size={24} strokeWidth={isActive('/') ? 2.5 : 2} /><span className="text-[10px] mt-1 font-medium">Главная</span></Link>
        <Link to="/events" className={`flex flex-col items-center p-2 rounded-xl transition-all ${isActive('/events') ? 'text-offroad-orange' : 'text-gray-500'}`}><Calendar size={24} strokeWidth={isActive('/events') ? 2.5 : 2} /><span className="text-[10px] mt-1 font-medium">Выезды</span></Link>
        <Link to="/nav" className={`flex flex-col items-center p-2 rounded-xl transition-all ${isActive('/nav') ? 'text-offroad-orange' : 'text-gray-500'}`}><BookOpen size={24} strokeWidth={isActive('/nav') ? 2.5 : 2} /><span className="text-[10px] mt-1 font-medium">Wiki</span></Link>
        <Link to="/profile" className={`flex flex-col items-center p-2 rounded-xl transition-all ${isActive('/profile') ? 'text-offroad-orange' : 'text-gray-500'}`}><User size={24} strokeWidth={isActive('/profile') ? 2.5 : 2} /><span className="text-[10px] mt-1 font-medium">Я</span></Link>
      </div>
    </nav>
  );
};

function App() {
  return (
    <Router>
      <Toaster position="top-center" richColors theme="dark" />
      <div className="min-h-screen bg-offroad-black text-white font-sans selection:bg-offroad-orange selection:text-white">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/event/:id" element={<EventDetails />} />
          <Route path="/nav" element={<NavPage />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <TabBar />
      </div>
    </Router>
  );
}

export default App;