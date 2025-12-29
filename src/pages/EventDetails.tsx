import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import WebApp from '@twa-dev/sdk'; // <-- Подключили Телегу
import { ArrowLeft, MapPin, Calendar, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';

interface Event {
  id: number;
  title: string;
  date: string;
  location: string;
  price: number;
  description: string;
  image_url: string; // <-- Новое поле
}

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    async function fetchEvent() {
      if (!id) return;
      
      // 1. Грузим сам ивент
      const { data: eventData, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (error) console.error(error);
      else setEvent(eventData);

      // 2. Проверяем, не записан ли уже юзер (если открыто в Телеге)
      if (WebApp.initDataUnsafe.user) {
        const userId = WebApp.initDataUnsafe.user.id.toString();
        const { data: regData } = await supabase
          .from('registrations')
          .select('*')
          .eq('event_id', id)
          .eq('user_id', userId)
          .single();
        
        if (regData) setIsRegistered(true);
      }

      setLoading(false);
    }
    fetchEvent();
  }, [id]);

  const handleBooking = async () => {
    // Если открыли в браузере, а не в телеге — ругаемся (или используем тестовые данные)
    const user = WebApp.initDataUnsafe.user;
    
    if (!user) {
      alert("Открой приложение в Телеграме, чтобы записаться!");
      return;
    }

    setBookingLoading(true);

    const { error } = await supabase
      .from('registrations')
      .insert([
        { 
          event_id: event?.id, 
          user_id: user.id.toString(),
          first_name: user.first_name,
          username: user.username 
        }
      ]);

    if (error) {
      alert("Ошибка записи: " + error.message);
    } else {
      setIsRegistered(true);
      WebApp.HapticFeedback.notificationOccurred('success'); // Вибрация
    }
    setBookingLoading(false);
  };

  if (loading) return <div className="flex h-screen items-center justify-center text-offroad-orange"><Loader2 className="animate-spin" size={40} /></div>;
  if (!event) return <div className="p-6 text-white">Выезд не найден.</div>;

  return (
    <div className="min-h-screen bg-offroad-black text-white pb-24 relative">
      <div className="absolute top-4 left-4 z-20">
        <button onClick={() => navigate(-1)} className="bg-black/50 backdrop-blur p-2 rounded-full text-white hover:bg-offroad-orange transition">
          <ArrowLeft size={24} />
        </button>
      </div>

      {/* ФОНОВАЯ КАРТИНКА */}
      <div className="h-72 relative bg-gray-800">
        <img 
          src={event.image_url || "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1000&q=80"} 
          alt={event.title} 
          className="w-full h-full object-cover"
          onError={(e) => {
            // Если картинка битая, ставим заглушку
            e.currentTarget.src = "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1000&q=80";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-offroad-black via-offroad-black/50 to-transparent"></div>
      </div>

      <div className="px-6 -mt-16 relative z-10">
        <h1 className="text-3xl font-black leading-tight mb-2 drop-shadow-lg">{event.title}</h1>
        
        <div className="flex gap-4 mb-6">
          <div className="bg-offroad-dark/90 backdrop-blur px-3 py-1 rounded border border-gray-700 text-xs flex items-center gap-2">
            <Calendar size={14} className="text-offroad-orange"/>
            {new Date(event.date).toLocaleDateString('ru-RU')}
          </div>
          <div className="bg-offroad-dark/90 backdrop-blur px-3 py-1 rounded border border-gray-700 text-xs flex items-center gap-2">
             <MapPin size={14} className="text-offroad-orange"/>
             {event.location}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-offroad-dark p-4 rounded-xl border border-gray-800">
            <h3 className="font-bold text-lg mb-2 text-offroad-orange">О замесе</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              {event.description || "Описания нет, но будет весело."}
            </p>
          </div>

          <div className="bg-red-900/20 p-4 rounded-xl border border-red-900/50 flex gap-3">
            <AlertTriangle className="text-red-500 shrink-0" size={24} />
            <p className="text-xs text-red-200">
              Грязь не прощает ошибок. Проверь буксировочные проушины.
            </p>
          </div>
        </div>
      </div>

      {/* КНОПКА ЗАПИСИ */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-gray-800 p-4 pb-8 z-50 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-gray-400">Взнос</p>
          <p className="text-2xl font-bold text-white">{event.price} ₽</p>
        </div>
        
        {isRegistered ? (
          <button disabled className="flex-1 bg-green-600/20 border border-green-600 text-green-500 font-bold py-3 rounded-xl flex items-center justify-center gap-2">
            <CheckCircle size={20} />
            Ты в деле!
          </button>
        ) : (
          <button 
            onClick={handleBooking}
            disabled={bookingLoading}
            className="flex-1 bg-offroad-orange hover:bg-orange-600 text-white font-bold py-3 rounded-xl shadow-[0_0_15px_rgba(249,115,22,0.4)] active:scale-95 transition-all flex justify-center"
          >
            {bookingLoading ? <Loader2 className="animate-spin"/> : 'Еду!'}
          </button>
        )}
      </div>
    </div>
  );
}