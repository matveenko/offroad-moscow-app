import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { ArrowLeft, MapPin, Calendar, CheckSquare, Loader2, AlertTriangle } from 'lucide-react';

interface Event {
  id: number;
  title: string;
  date: string;
  location: string;
  price: number;
  description: string; // Мы добавим это поле в базу позже, пока будет пусто
}

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvent() {
      if (!id) return;
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (error) console.error(error);
      else setEvent(data);
      setLoading(false);
    }
    fetchEvent();
  }, [id]);

  if (loading) return <div className="flex h-screen items-center justify-center text-offroad-orange"><Loader2 className="animate-spin" size={40} /></div>;
  if (!event) return <div className="p-6 text-white">Выезд не найден. <button onClick={() => navigate(-1)} className="text-offroad-orange">Назад</button></div>;

  return (
    <div className="min-h-screen bg-offroad-black text-white pb-24 relative">
      {/* Кнопка Назад */}
      <div className="absolute top-4 left-4 z-10">
        <button onClick={() => navigate(-1)} className="bg-black/50 backdrop-blur p-2 rounded-full text-white hover:bg-offroad-orange transition">
          <ArrowLeft size={24} />
        </button>
      </div>

      {/* Обложка (Заглушка пока, потом сделаем фото) */}
      <div className="h-64 bg-gradient-to-b from-gray-700 to-offroad-black relative">
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
           <span className="text-9xl font-black">MUD</span>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-offroad-black to-transparent"></div>
      </div>

      <div className="px-6 -mt-10 relative z-10">
        <h1 className="text-3xl font-black leading-tight mb-2">{event.title}</h1>
        
        <div className="flex gap-4 mb-6">
          <div className="bg-offroad-dark px-3 py-1 rounded border border-gray-700 text-xs flex items-center gap-2">
            <Calendar size={14} className="text-offroad-orange"/>
            {new Date(event.date).toLocaleDateString('ru-RU')}
          </div>
          <div className="bg-offroad-dark px-3 py-1 rounded border border-gray-700 text-xs flex items-center gap-2">
             <MapPin size={14} className="text-offroad-orange"/>
             {event.location}
          </div>
        </div>

        <div className="space-y-6">
          {/* Описание */}
          <div className="bg-offroad-dark p-4 rounded-xl border border-gray-800">
            <h3 className="font-bold text-lg mb-2 text-offroad-orange">О замесе</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              {event.description || "Организаторы ленивые жопы и не добавили описание. Но будет грязно, весело и, возможно, потребуется трактор. Готовь тросы!"}
            </p>
          </div>

          {/* Чек-лист (Хардкод для примера) */}
          <div className="bg-offroad-dark p-4 rounded-xl border border-gray-800">
             <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
               <CheckSquare size={20} className="text-offroad-orange"/>
               Что брать?
             </h3>
             <ul className="space-y-2 text-sm text-gray-300">
               <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-offroad-orange mt-1.5"/> Динамический трос</li>
               <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-offroad-orange mt-1.5"/> Сапоги (болотники)</li>
               <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-offroad-orange mt-1.5"/> Запас еды на сутки</li>
               <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-offroad-orange mt-1.5"/> Хорошее настроение</li>
             </ul>
          </div>

          {/* Предупреждение */}
          <div className="bg-red-900/20 p-4 rounded-xl border border-red-900/50 flex gap-3">
            <AlertTriangle className="text-red-500 shrink-0" size={24} />
            <p className="text-xs text-red-200">
              Это оффроуд. Машина может поцарапаться, утонуть или сломаться. Мы не несем ответственности за твой картер.
            </p>
          </div>
        </div>
      </div>

      {/* Футер с кнопкой оплаты */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-gray-800 p-4 pb-8 z-50 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-gray-400">Стоимость участия</p>
          <p className="text-2xl font-bold text-white">{event.price} ₽</p>
        </div>
        <button className="flex-1 bg-offroad-orange text-white font-bold py-3 rounded-xl shadow-[0_0_15px_rgba(249,115,22,0.4)] active:scale-95 transition-transform">
          Купить билет
        </button>
      </div>
    </div>
  );
}