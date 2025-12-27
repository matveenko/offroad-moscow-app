import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Calendar, Map, Home, User, ChevronRight, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

// Типы данных (чтобы TypeScript не ругался)
interface Event {
  id: number;
  title: string;
  date: string;
  location: string;
  price: number;
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

    {/* Статичный блок (потом тоже оживим) */}
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

  // Фетчим данные при загрузке страницы
  useEffect(() => {
    getEvents();
  }, []);

  async function getEvents() {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true }); // Сортируем по дате

      if (error) throw error;
      if (data) setEvents(data);
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 pb-24">
      <h1 className="text-3xl font-black text-white mb-6">Календарь</h1>
      
      {loading ? (
        <div className="flex justify-center mt-10 text-offroad-orange animate-spin">
          <Loader2 size={40} />
        </div>
      ) : events.length === 0 ? (
        <p className="text-gray-500">Пока тихо...</p>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <div key={event.id} className="bg-offroad-dark border border-gray-800 rounded-xl p-4 flex gap-4 hover:border-offroad-orange/50 transition-colors cursor-pointer">
              <div className="flex-col flex items-center justify-center bg-gray-900 rounded-lg w-16 h-16 border border-gray-700 shrink-0">
                {/* Форматируем дату JS */}
                <span className="text-offroad-orange font-bold text-xl">
                  {new Date(event.date).getDate()}
                </span>
                <span className="text-[10px] text-gray-500 uppercase">
                  {new Date(event.date).toLocaleString('default', { month: 'short' })}
                </span>
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight">{event.title}</h3>
                <div className="flex items-center mt-1 text-gray-400 text-xs">
                   <Map size={12} className="mr-1" /> {event.location}
                </div>
                <div className="mt-2 inline-block bg-gray-800 px-2 py-0.5 rounded text-[10px] text-gray-300">
                  {event.price} ₽
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const NavPage = () => (
  <div className="p-6 pb-24">
    <h1 className="text-3xl font-black text-white mb-6">Навигация</h1>
    <div className="space-y-2">
      {['Правила чата', 'Как подготовить авто', 'FAQ для новичков', 'Контакты оргов'].map((topic) => (
        <a href="#" key={topic} className="block bg-offroad-dark border border-gray-800 p-4 rounded-xl flex justify-between items-center active:bg-gray-800">
          <span className="font-medium">{topic}</span>
          <ChevronRight size={16} className="text-gray-500"/>
        </a>
      ))}
    </div>
  </div>
);

const TabBar = () => {
  const location = useLocation();
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
      <div className="min-h-screen bg-offroad-black text-white font-sans selection:bg-offroad-orange selection:text-white">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/nav" element={<NavPage />} />
        </Routes>
        <TabBar />
      </div>
    </Router>
  );
}

export default App;