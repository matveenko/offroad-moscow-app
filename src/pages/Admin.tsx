import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Loader2, Trash2, Phone, Plus, Edit, LogOut, Lock, PlayCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminForm from '../components/AdminForm';
import { toast } from 'sonner';

// --- КОНФИГ ---
const ADMIN_PASSWORD = "mud!"; // Твой пароль

interface Event {
  id: number;
  title: string;
  date: string;
  location: string;
  price: number;
  description: string;
  image_url?: string | null;
}

interface Registration {
  id: number;
  event_id: number;
  user_id: string;
  first_name: string | null;
  username: string | null;
  guests_count: number;
  has_children: boolean;
  phone: string | null;
  created_at: string;
}

interface Story {
  id: number;
  title: string;
  link: string;
  image_url?: string;
}

export default function Admin() {
  const navigate = useNavigate();
  
  // Состояние авторизации
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  // Состояние данных
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [stories, setStories] = useState<Story[]>([]); // <-- Добавили новости
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingRegs, setLoadingRegs] = useState(false);
  
  // Модалка
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | undefined>(undefined);

  // Проверка авторизации
  useEffect(() => {
    const isAuth = localStorage.getItem('offroad_admin_auth');
    if (isAuth === 'true') {
      setIsAuthenticated(true);
      fetchEvents();
      fetchStories(); // <-- Грузим новости сразу
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem('offroad_admin_auth', 'true');
      toast.success('Добро пожаловать');
      fetchEvents();
      fetchStories();
    } else {
      toast.error('Неверный пароль');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('offroad_admin_auth');
    navigate('/');
  };

  // --- ФЕТЧЕРЫ ---
  useEffect(() => {
    if (isAuthenticated && selectedEventId) fetchRegistrations(selectedEventId);
  }, [selectedEventId, isAuthenticated]);

  async function fetchEvents() {
    setLoadingEvents(true);
    const { data } = await supabase.from('events').select('*').order('date', { ascending: true });
    setEvents(data || []);
    setLoadingEvents(false);
  }

  async function fetchRegistrations(eventId: number) {
    setLoadingRegs(true);
    const { data } = await supabase.from('registrations').select('*').eq('event_id', eventId).order('created_at');
    setRegistrations(data || []);
    setLoadingRegs(false);
  }

  async function fetchStories() {
    const { data } = await supabase.from('stories').select('*').order('created_at', { ascending: false });
    setStories(data || []);
  }

  // --- УДАЛЕНИЕ ---
  async function deleteEvent(id: number) {
    if (!confirm('Удалить выезд?')) return;
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (!error) {
      toast.success('Удалено');
      setEvents(prev => prev.filter(e => e.id !== id));
      if (selectedEventId === id) setSelectedEventId(null);
    }
  }

  async function deleteRegistration(id: number) {
    if (!confirm('Удалить участника?')) return;
    const { error } = await supabase.from('registrations').delete().eq('id', id);
    if (!error) {
      toast.success('Удален');
      setRegistrations(prev => prev.filter(r => r.id !== id));
    }
  }

  async function deleteStory(id: number) {
    if (!confirm('Удалить новость?')) return;
    const { error } = await supabase.from('stories').delete().eq('id', id);
    if (!error) {
        toast.success('Новость удалена');
        setStories(prev => prev.filter(s => s.id !== id));
    }
  }

  const handleSave = () => {
    fetchEvents();
    if (selectedEventId) fetchRegistrations(selectedEventId);
  };

  // --- ЭКРАН ВХОДА ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-offroad-black flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-offroad-dark border border-gray-800 p-8 rounded-2xl w-full max-w-sm">
          <div className="flex justify-center mb-6">
            <div className="bg-offroad-orange/20 p-4 rounded-full">
              <Lock size={32} className="text-offroad-orange" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-white text-center mb-6">Секретная зона</h2>
          <input 
            type="password" 
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            placeholder="Введите пароль"
            className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-offroad-orange mb-4"
          />
          <button type="submit" className="w-full bg-offroad-orange hover:bg-orange-600 text-white font-bold py-3 rounded-xl">Войти</button>
          <button type="button" onClick={() => navigate('/')} className="w-full mt-4 text-gray-500 text-sm hover:text-white">Назад</button>
        </form>
      </div>
    );
  }

  // --- ЭКРАН АДМИНКИ ---
  return (
    <div className="min-h-screen bg-offroad-black text-white p-4 pb-24">
      {/* Хедер */}
      <div className="flex justify-between items-center mb-6 sticky top-0 bg-offroad-black/90 z-40 py-2 backdrop-blur">
        <h1 className="text-2xl font-black text-offroad-orange">АДМИНКА</h1>
        <div className="flex gap-3">
            <button onClick={() => { setEditingEvent(undefined); setIsFormOpen(true); }} className="bg-offroad-orange px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-1">
                <Plus size={16}/> Создать
            </button>
            <button onClick={handleLogout} className="text-gray-500 hover:text-white"><LogOut size={20}/></button>
        </div>
      </div>

      {/* 1. Список выездов */}
      <h3 className="text-gray-400 text-xs font-bold uppercase mb-2">Управление выездами</h3>
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
        {loadingEvents && <Loader2 className="animate-spin"/>}
        {events.map(ev => (
          <div key={ev.id} 
            className={`flex-shrink-0 relative px-4 py-3 rounded-xl border cursor-pointer transition-all ${
              selectedEventId === ev.id 
              ? 'bg-offroad-orange border-offroad-orange text-white' 
              : 'bg-offroad-dark border-gray-700 text-gray-400 hover:border-gray-500'
            }`}
            onClick={() => setSelectedEventId(ev.id)}
          >
            <div className="font-bold text-sm pr-12">{ev.title}</div>
            <div className="text-[10px] opacity-70">{new Date(ev.date).toLocaleDateString('ru-RU')}</div>
            
            <div className="absolute top-2 right-2 flex gap-1">
                <button onClick={(e) => { e.stopPropagation(); setEditingEvent(ev); setIsFormOpen(true); }} className="p-1 hover:text-white opacity-70 hover:opacity-100"><Edit size={14}/></button>
                <button onClick={(e) => { e.stopPropagation(); deleteEvent(ev.id); }} className="p-1 hover:text-red-300 opacity-70 hover:opacity-100"><Trash2 size={14}/></button>
            </div>
          </div>
        ))}
      </div>

      {/* 2. Список людей */}
      <div className="bg-offroad-dark border border-gray-800 rounded-xl p-4 min-h-[30vh] mb-8">
        <h2 className="font-bold mb-4 flex justify-between">
            Участники 
            {selectedEventId && <span className="text-offroad-orange">{registrations.length}</span>}
        </h2>

        {loadingRegs ? <Loader2 className="animate-spin mx-auto"/> : (
            <div className="space-y-3">
                {!selectedEventId && <p className="text-gray-500 text-center text-sm">👈 Выбери выезд сверху</p>}
                {selectedEventId && registrations.length === 0 && <p className="text-gray-500 text-center text-sm">Пока пусто</p>}
                
                {registrations.map(reg => (
                    <div key={reg.id} className="bg-black/40 p-3 rounded-lg flex justify-between items-start">
                        <div>
                            <div className="font-bold text-sm text-white">{reg.first_name} <span className="text-gray-500 font-normal">@{reg.username}</span></div>
                            <div className="text-gray-400 text-xs mt-1 flex flex-wrap gap-2">
                                <span className="flex items-center gap-1"><Phone size={10}/> {reg.phone}</span>
                                {reg.guests_count > 0 && <span className="text-yellow-500">+ {reg.guests_count} чел.</span>}
                                {reg.has_children && <span className="text-pink-400">С детьми</span>}
                            </div>
                        </div>
                        <button onClick={() => deleteRegistration(reg.id)} className="text-gray-600 hover:text-red-500"><Trash2 size={16}/></button>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* 3. Управление новостями (Stories) */}
      <h3 className="text-gray-400 text-xs font-bold uppercase mb-2 flex items-center gap-2">
         <PlayCircle size={14}/> Новости (Stories)
      </h3>
      <div className="bg-offroad-dark border border-gray-800 rounded-xl p-4">
        {/* Форма добавления */}
        <form onSubmit={async (e) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const title = (form.elements.namedItem('st_title') as HTMLInputElement).value;
            const link = (form.elements.namedItem('st_link') as HTMLInputElement).value;
            const img = (form.elements.namedItem('st_img') as HTMLInputElement).value;
            
            const { error } = await supabase.from('stories').insert([{ title, link, image_url: img }]);
            if(error) toast.error('Ошибка: ' + error.message);
            else { 
                toast.success('Новость добавлена!'); 
                form.reset();
                fetchStories(); // Обновить список
            }
        }} className="space-y-3 mb-6">
            <input name="st_title" placeholder="Заголовок" required className="w-full bg-black/50 border border-gray-700 rounded-lg p-2 text-sm outline-none text-white focus:border-offroad-orange"/>
            <div className="flex gap-2">
                <input name="st_link" placeholder="Ссылка на пост (https://t.me/...)" required className="w-1/2 bg-black/50 border border-gray-700 rounded-lg p-2 text-sm outline-none text-white focus:border-offroad-orange"/>
                <input name="st_img" placeholder="Ссылка на фото" required className="w-1/2 bg-black/50 border border-gray-700 rounded-lg p-2 text-sm outline-none text-white focus:border-offroad-orange"/>
            </div>
            <button className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 rounded-lg text-sm transition-colors">Опубликовать</button>
        </form>

        {/* Список существующих новостей */}
        <div className="space-y-2">
            {stories.map(story => (
                <div key={story.id} className="flex justify-between items-center bg-black/40 p-2 rounded-lg border border-gray-800">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <img src={story.image_url} className="w-8 h-8 rounded object-cover bg-gray-700" />
                        <span className="text-xs truncate max-w-[150px]">{story.title}</span>
                    </div>
                    <button onClick={() => deleteStory(story.id)} className="text-gray-600 hover:text-red-500 p-1"><Trash2 size={14}/></button>
                </div>
            ))}
        </div>
      </div>

      {/* Модалка редактирования выезда */}
      {isFormOpen && <AdminForm event={editingEvent} onClose={() => setIsFormOpen(false)} onSave={handleSave} />}
    </div>
  );
}