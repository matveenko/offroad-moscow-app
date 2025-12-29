import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Calendar, Map, Home, User, ChevronRight, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import EventDetails from './pages/EventDetails';
import Admin from './pages/Admin';
import { Toaster } from 'sonner'; // <-- Уведомления

interface Event {
  id: number;
  title: string;
  date: string;
  location: string;
  price: number;
  image_url?: string;
}

const HomePage = () => (
  <div className="p-6 space-y-6 pb-24">
    <header className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-black text-offroad-orange uppercase tracking-tighter">Offroad<br/>Moscow</h1>
        <p className="text-xs text-gray-500 font-medium">Грязь лечебная</p>
      </div>
      <div className="w-10 h-10 bg-offroad-dark rounded-full flex items-center justify-center border border-gray-700">
        <User size={20} className="text-gray-400" />
      </div>
    </header>

    <div className="bg-gradient-to-br from-offroad-dark to-black border border-gray-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
      <div className="absolute top-0 right-0 w-20 h-20 bg-offroad-orange blur-3xl opacity-20 -mr-10 -mt-10"></div>
      <div className="relative z-10">
        <span className="bg-offroad-orange/20 text-offroad-orange text-[10px] font-bold px-2 py-1 rounded uppercase">Ближайший замес</span>
        <h2 className="text-xl font-bold mt-3 text-white leading-tight">Сезон открыт!</h2>
        <p className="text-gray-400 text-xs mt-2">Чекай календарь выездов 👇</p>
        <Link to="/events" className="block text-center mt-4 w-full bg-offroad-orange hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-all">
          Смотреть календарь
        </Link>
      </div>
    </div>
  </div>
);

const EventsPage = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('events').select('*').order('date', { ascending: true })
      .then(({ data }) => {
        setEvents(data || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-6 pb-24">
      <h1 className="text-3xl font-black text-white mb-6">Календарь</h1>
      
      {loading ? (
        <div className="flex justify-center mt-10 text-offroad-orange animate-spin"><Loader2 size={40} /></div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <Link to={`/event/${event.id}`} key={event.id} className="block group">
              <div className="bg-offroad-dark border border-gray-800 rounded-xl overflow-hidden relative h-40">
                <img src={event.image_url} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" onError={(e) => e.currentTarget.style.display='none'}/>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-4 w-full">
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-offroad-orange text-xs font-bold uppercase tracking-wider mb-1 block">
                        {new Date(event.date).toLocaleDateString('ru-RU')}
                      </span>
                      <h3 className="font-bold text-xl leading-none text-white shadow-black drop-shadow-md">{event.title}</h3>
                      <div className="flex items-center mt-2 text-gray-300 text-xs">
                         <Map size={12} className="mr-1" /> {event.location}
                      </div>
                    </div>
                    <div className="bg-offroad-orange px-2 py-1 rounded text-xs font-bold text-white">
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
    <div className="p-6 pb-24">
      <h1 className="text-3xl font-black text-white mb-6">База Знаний</h1>
      <div className="space-y-3">
        {topics.map((topic, index) => (
          <a href={topic.link} target="_blank" rel="noopener noreferrer" key={index} className="block bg-offroad-dark border border-gray-800 p-5 rounded-xl flex justify-between items-center active:bg-gray-800">
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
      <div className="flex justify-around items-center h-20 px-2">
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
      </div>
    </nav>
  );
};

function App() {
  return (
    <Router>
      <Toaster position="top-center" richColors />
      <div className="min-h-screen bg-offroad-black text-white font-sans selection:bg-offroad-orange selection:text-white">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/event/:id" element={<EventDetails />} />
          <Route path="/nav" element={<NavPage />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
        <TabBar />
      </div>
    </Router>
  );
}

export default App;