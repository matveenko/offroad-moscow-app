import { HashRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Calendar, Map, Home, User, ChevronRight, Loader2, CloudRain, PlayCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import WebApp from '@twa-dev/sdk';
import { Toaster } from 'sonner';

// Импорт страниц
import EventDetails from './pages/EventDetails';
import Admin from './pages/Admin';
import Profile from './pages/Profile';

// --- ТИПЫ ---
interface Story {
  id: number;
  title: string;
  image_url: string;
  link: string;
}

interface Event {
  id: number;
  title: string;
  date: string;
  location: string;
  price: number;
  image_url?: string;
}

// --- КОМПОНЕНТЫ ---

const HomePage = () => {
  const user = WebApp.initDataUnsafe.user;
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStories = async () => {
      const { data } = await supabase.from('stories').select('*').order('created_at', { ascending: false }).limit(5);
      setStories(data || []);
      setLoading(false);
    };
    fetchStories();
  }, []);

  // Обертка max-w-md mx-auto держит форму мобилки даже на ПК
  return (
    <div className="max-w-md mx-auto w-full space-y-6 pb-32 animate-in fade-in duration-500 pt-6">
      
      {/* 1. Хедер */}
      <header className="flex justify-between items-center px-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tighter">
            {user?.first_name || 'Бродяга'}
            <span className="text-offroad-orange">.</span>
          </h1>
          <p className="text-gray-500 text-xs font-medium">Готов месить?</p>
        </div>
        
        {/* Виджет */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-2 flex items-center gap-2 shadow-lg">
          <CloudRain size={18} className="text-blue-400" />
          <div>
             <div className="text-[10px] text-gray-400 font-bold uppercase leading-none">Грязь</div>
             <div className="text-xs text-white font-black leading-none">9/10</div>
          </div>
        </div>
      </header>

      {/* 2. ГЛАВНЫЙ БАННЕР */}
      <div className="px-4"> 
        <div className="relative w-full h-[450px] rounded-[32px] overflow-hidden shadow-2xl group isolate">
            
            {/* Картинка: ГРЯЗЬ */}
            <div className="absolute inset-0 bg-gray-800">
                <img 
                    src="https://images.unsplash.com/photo-1519245659620-e859806a8d3b?q=80&w=800&auto=format&fit=crop" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    alt="Offroad"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
            </div>
            
            {/* Градиент */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>

            {/* Контент */}
            <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col items-start z-10">
                
                <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full mb-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-offroad-orange animate-pulse"></div>
                    <span className="text-white text-[10px] font-bold uppercase tracking-wider">Сезон Открыт</span>
                </div>

                <h2 className="text-4xl font-black text-white leading-[0.9] mb-3 drop-shadow-xl">
                  ВРЕМЯ<br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-offroad-orange to-red-500">ГРЯЗИ</span>
                </h2>
                
                <p className="text-gray-300 text-sm font-medium mb-6 max-w-[90%] drop-shadow-md">
                  Лес, колея и лебедка. Всё как ты любишь.
                </p>

                <Link to="/events" className="w-full bg-offroad-orange text-white font-black uppercase tracking-wide py-4 rounded-xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(249,115,22,0.4)] active:scale-[0.98] transition-all">
                   <span>Календарь</span>
                   <ChevronRight size={18} />
                </Link>
            </div>
        </div>
      </div>

      {/* 3. Лента новостей */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4 px-6 flex items-center gap-2">
          <PlayCircle size={18} className="text-offroad-orange"/>
          <span>Хроники</span>
        </h3>
        
        {loading ? (
            <div className="flex gap-3 px-6 overflow-hidden">
                {[1,2,3].map(i => <div key={i} className="w-28 h-40 bg-gray-800 rounded-xl animate-pulse shrink-0"/>)}
            </div>
        ) : stories.length === 0 ? (
           <div className="mx-6 bg-offroad-dark border border-gray-800 rounded-xl p-6 text-center">
               <p className="text-gray-500 text-sm">Новостей пока нет 🤷‍♂️</p>
           </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-6 scrollbar-hide px-6 snap-x">
            {stories.map(story => (
              <a href={story.link} key={story.id} target="_blank" className="snap-start flex-shrink-0 w-32 h-48 group relative rounded-2xl overflow-hidden bg-gray-900 shadow-lg active:scale-95 transition-transform border border-white/5">
                <img 
                    src={story.image_url} 
                    className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500" 
                    onError={(e) => e.currentTarget.style.display='none'}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-white text-[11px] font-bold leading-tight line-clamp-3 drop-shadow-md">{story.title}</p>
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
    <div className="p-6 pb-32 animate-in fade-in max-w-md mx-auto w-full">
      <h1 className="text-3xl font-black text-white mb-6">Календарь</h1>
      {loading ? (
        <div className="flex justify-center mt-10 text-offroad-orange animate-spin"><Loader2 size={40} /></div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <Link to={`/event/${event.id}`} key={event.id} className="block group">
              <div className="bg-offroad-dark border border-gray-800 rounded-xl overflow-hidden relative h-40 shadow-lg">
                <img src={event.image_url} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-50 transition-opacity" onError={(e) => e.currentTarget.style.display='none'}/>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-4 w-full">
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-offroad-orange text-xs font-bold uppercase tracking-wider mb-1 block shadow-black drop-shadow-md">
                        {new Date(event.date).toLocaleDateString('ru-RU')}
                      </span>
                      <h3 className="font-bold text-xl leading-none text-white shadow-black drop-shadow-md">{event.title}</h3>
                      <div className="flex items-center mt-2 text-gray-300 text-xs shadow-black drop-shadow-md">
                         <Map size={12} className="mr-1" /> {event.location}
                      </div>
                    </div>
                    <div className="bg-offroad-orange/90 backdrop-blur px-2 py-1 rounded text-xs font-bold text-white shadow-lg">
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
  const topics = [
    { title: 'Правила чата', link: 'https://t.me/offroad_moscow/1' },
    { title: 'Как подготовить авто', link: 'https://t.me/offroad_moscow/2' },
    { title: 'Контакты админов', link: 'https://t.me/offroad_moscow/4' },
  ];

  return (
    <div className="p-6 pb-32 animate-in fade-in max-w-md mx-auto w-full">
      <h1 className="text-3xl font-black text-white mb-6">База Знаний</h1>
      <div className="space-y-3">
        {topics.map((topic, index) => (
          <a href={topic.link} target="_blank" rel="noopener noreferrer" key={index} className="block bg-offroad-dark border border-gray-800 p-5 rounded-xl flex justify-between items-center active:bg-gray-800 active:scale-[0.98] transition-all">
            <span className="font-bold text-gray-200">{topic.title}</span>
            <ChevronRight size={16} className="text-offroad-orange"/>
          </a>
        ))}
      </div>
    </div>
  );
};

const TabBar = () => {
  const location = useLocation();
  if (location.pathname.includes('/event/') || location.pathname === '/admin') return null;
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#1a1a1a]/95 backdrop-blur-md border-t border-gray-800 pb-safe z-50">
      <div className="flex justify-around items-center h-20 px-2 max-w-md mx-auto">
        <Link to="/" className={`flex flex-col items-center p-2 rounded-xl transition-all ${isActive('/') ? 'text-offroad-orange' : 'text-gray-500'}`}>
          <Home size={24} strokeWidth={isActive('/') ? 2.5 : 2} />
          <span className="text-[10px] mt-1 font-medium">Главная</span>
        </Link>
        <Link to="/events" className={`flex flex-col items-center p-2 rounded-xl transition-all ${isActive('/events') ? 'text-offroad-orange' : 'text-gray-500'}`}>
          <Calendar size={24} strokeWidth={isActive('/events') ? 2.5 : 2} />
          <span className="text-[10px] mt-1 font-medium">Выезды</span>
        </Link>
        <Link to="/nav" className={`flex flex-col items-center p-2 rounded-xl transition-all ${isActive('/nav') ? 'text-offroad-orange' : 'text-gray-500'}`}>
          <Map size={24} strokeWidth={isActive('/nav') ? 2.5 : 2} />
          <span className="text-[10px] mt-1 font-medium">Инфо</span>
        </Link>
        <Link to="/profile" className={`flex flex-col items-center p-2 rounded-xl transition-all ${isActive('/profile') ? 'text-offroad-orange' : 'text-gray-500'}`}>
          <User size={24} strokeWidth={isActive('/profile') ? 2.5 : 2} />
          <span className="text-[10px] mt-1 font-medium">Я</span>
        </Link>
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
          
          {/* Редирект для неизвестных страниц */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <TabBar />
      </div>
    </Router>
  );
}

export default App;