import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Loader2, Trash2, Phone, Plus, Edit, LogOut } from 'lucide-react';;
import { useNavigate } from 'react-router-dom';
import AdminForm from '../components/AdminForm';
import { toast } from 'sonner';

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

export default function Admin() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingRegs, setLoadingRegs] = useState(false);
  
  // Модалка
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | undefined>(undefined);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) fetchRegistrations(selectedEventId);
  }, [selectedEventId]);

  async function fetchEvents() {
    setLoadingEvents(true);
    const { data, error } = await supabase.from('events').select('*').order('date', { ascending: true });
    if (error) toast.error('Ошибка загрузки');
    else setEvents(data || []);
    setLoadingEvents(false);
  }

  async function fetchRegistrations(eventId: number) {
    setLoadingRegs(true);
    const { data, error } = await supabase.from('registrations').select('*').eq('event_id', eventId).order('created_at');
    if (error) toast.error('Ошибка загрузки людей');
    else setRegistrations(data || []);
    setLoadingRegs(false);
  }

  async function deleteEvent(id: number) {
    if (!confirm('Удалить выезд? Все записи людей тоже пропадут!')) return;
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) toast.error('Не удалось удалить');
    else {
      toast.success('Выезд удален');
      setEvents(prev => prev.filter(e => e.id !== id));
      if (selectedEventId === id) setSelectedEventId(null);
    }
  }

  async function deleteRegistration(id: number) {
    if (!confirm('Удалить участника?')) return;
    const { error } = await supabase.from('registrations').delete().eq('id', id);
    if (error) toast.error('Ошибка');
    else {
      toast.success('Участник удален');
      setRegistrations(prev => prev.filter(r => r.id !== id));
    }
  }

  const handleSave = () => {
    fetchEvents();
    if (selectedEventId) fetchRegistrations(selectedEventId);
  };

  return (
    <div className="min-h-screen bg-offroad-black text-white p-4 pb-24">
      {/* Хедер */}
      <div className="flex justify-between items-center mb-6 sticky top-0 bg-offroad-black/90 z-40 py-2 backdrop-blur">
        <h1 className="text-2xl font-black text-offroad-orange">АДМИНКА</h1>
        <div className="flex gap-3">
            <button onClick={() => { setEditingEvent(undefined); setIsFormOpen(true); }} className="bg-offroad-orange px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-1">
                <Plus size={16}/> Создать
            </button>
            <button onClick={() => navigate('/')} className="text-gray-500 hover:text-white"><LogOut size={20}/></button>
        </div>
      </div>

      {/* Список выездов (Горизонтальный скролл) */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
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
            
            {/* Кнопки управления на карточке */}
            <div className="absolute top-2 right-2 flex gap-1">
                <button onClick={(e) => { e.stopPropagation(); setEditingEvent(ev); setIsFormOpen(true); }} className="p-1 hover:text-white text-inherit opacity-70 hover:opacity-100"><Edit size={14}/></button>
                <button onClick={(e) => { e.stopPropagation(); deleteEvent(ev.id); }} className="p-1 hover:text-red-300 text-inherit opacity-70 hover:opacity-100"><Trash2 size={14}/></button>
            </div>
          </div>
        ))}
      </div>

      {/* Список людей */}
      <div className="bg-offroad-dark border border-gray-800 rounded-xl p-4 min-h-[50vh]">
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

      {/* Форма */}
      {isFormOpen && <AdminForm event={editingEvent} onClose={() => setIsFormOpen(false)} onSave={handleSave} />}
    </div>
  );
}