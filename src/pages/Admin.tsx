import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Loader2, Trash2, Phone, Users, Baby } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Admin() {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 1. Грузим список выездов
  useEffect(() => {
    supabase.from('events').select('*').order('date', { ascending: true })
      .then(({ data }) => setEvents(data || []));
  }, []);

  // 2. Когда выбрали выезд — грузим список участников
  useEffect(() => {
    if (!selectedEventId) return;
    setLoading(true);
    supabase.from('registrations').select('*').eq('event_id', selectedEventId)
      .then(({ data }) => {
        setRegistrations(data || []);
        setLoading(false);
      });
  }, [selectedEventId]);

  // Удаление участника (если кто-то слился)
  const handleDelete = async (id: number) => {
    if(!confirm('Точно удалить этого гряземеса?')) return;
    await supabase.from('registrations').delete().eq('id', id);
    setRegistrations(prev => prev.filter(r => r.id !== id));
  };

  return (
    <div className="min-h-screen bg-offroad-black text-white p-4 pb-24">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-black text-offroad-orange">АДМИНКА</h1>
        <Link to="/" className="text-xs text-gray-500">На главную</Link>
      </div>

      {/* Выбор выезда */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
        {events.map(ev => (
          <button
            key={ev.id}
            onClick={() => setSelectedEventId(ev.id)}
            className={`whitespace-nowrap px-4 py-2 rounded-lg border text-sm font-bold transition-colors ${
              selectedEventId === ev.id 
              ? 'bg-offroad-orange border-offroad-orange text-white' 
              : 'bg-offroad-dark border-gray-700 text-gray-400'
            }`}
          >
            {ev.title}
          </button>
        ))}
      </div>

      {/* Список участников */}
      {selectedEventId ? (
        <div className="bg-offroad-dark border border-gray-800 rounded-xl p-4 min-h-[50vh]">
          <div className="flex justify-between mb-4 border-b border-gray-700 pb-2">
            <h2 className="font-bold">Список экипажей</h2>
            <span className="text-offroad-orange font-mono">{registrations.length} шт.</span>
          </div>

          {loading ? <Loader2 className="animate-spin mx-auto"/> : (
            <div className="space-y-3">
              {registrations.length === 0 && <p className="text-gray-500 text-center">Никто еще не записался :(</p>}
              
              {registrations.map(reg => (
                <div key={reg.id} className="bg-black/40 p-3 rounded-lg flex justify-between items-start">
                  <div>
                    <div className="font-bold text-white flex items-center gap-2">
                      {reg.first_name} 
                      <span className="text-gray-500 text-xs font-normal">@{reg.username}</span>
                    </div>
                    <div className="text-gray-400 text-xs mt-1 flex items-center gap-3">
                      <span className="flex items-center gap-1"><Phone size={10}/> {reg.phone}</span>
                      {reg.guests_count > 0 && <span className="flex items-center gap-1 text-yellow-500"><Users size={10}/> +{reg.guests_count}</span>}
                      {reg.has_children && <span className="flex items-center gap-1 text-pink-400"><Baby size={10}/> Дети</span>}
                    </div>
                  </div>
                  <button onClick={() => handleDelete(reg.id)} className="text-red-900 hover:text-red-500 p-1">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="text-gray-500 text-center mt-10">👈 Выбери выезд сверху</p>
      )}
    </div>
  );
}