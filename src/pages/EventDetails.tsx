import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import WebApp from '@twa-dev/sdk';
import { ArrowLeft, MapPin, Calendar, Loader2, AlertTriangle, CheckCircle, CheckSquare, X, Users, Baby, Phone } from 'lucide-react';

interface Event {
  id: number;
  title: string;
  date: string;
  location: string;
  price: number;
  description: string;
  image_url?: string;
}

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  
  // Состояние формы
  const [showModal, setShowModal] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [formData, setFormData] = useState({
    guests: 0,
    children: false,
    phone: ''
  });

  useEffect(() => {
    async function fetchEvent() {
      if (!id) return;
      
      const { data: eventData, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (error) console.error(error);
      else setEvent(eventData);

      // Проверка регистрации
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
    const user = WebApp.initDataUnsafe.user;
    // Для тестов в браузере раскомментируй строку ниже:
    // const user = { id: 12345, first_name: "Test", username: "tester" }; 

    if (!user) {
      alert("Запись доступна только через Telegram!");
      return;
    }

    if (!formData.phone) {
      WebApp.showAlert('Укажи телефон для связи!');
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
          username: user.username,
          guests_count: formData.guests,   // <-- Новые данные
          has_children: formData.children, // <-- Новые данные
          phone: formData.phone            // <-- Новые данные
        }
      ]);

    if (error) {
      alert("Ошибка: " + error.message);
    } else {
      setIsRegistered(true);
      setShowModal(false);
      WebApp.HapticFeedback.notificationOccurred('success');
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

      {/* Картинка с заглушкой */}
      <div className="h-72 relative bg-gray-800">
        <img 
          src={event.image_url || "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1000&q=80"} 
          alt={event.title} 
          className="w-full h-full object-cover"
          onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1000&q=80"; }}
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

      {/* ФУТЕР */}
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
            onClick={() => setShowModal(true)} // Открываем модалку
            className="flex-1 bg-offroad-orange hover:bg-orange-600 text-white font-bold py-3 rounded-xl shadow-[0_0_15px_rgba(249,115,22,0.4)] active:scale-95 transition-all"
          >
            Вписаться
          </button>
        )}
      </div>

      {/* МОДАЛКА ЗАПИСИ */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-offroad-dark w-full max-w-md rounded-2xl border border-gray-700 p-6 animate-in slide-in-from-bottom-10 fade-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Пара вопросов</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white"><X size={24}/></button>
            </div>

            <div className="space-y-4">
              {/* Телефон */}
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Твой телефон (для чата)</label>
                <div className="flex items-center bg-black/50 border border-gray-700 rounded-xl px-3 py-3">
                  <Phone size={18} className="text-gray-500 mr-2"/>
                  <input 
                    type="tel" 
                    placeholder="+7 999 000 00 00"
                    className="bg-transparent text-white w-full outline-none placeholder:text-gray-600"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>

              {/* Гости */}
              <div className="flex justify-between items-center bg-black/50 border border-gray-700 rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <Users size={18} className="text-offroad-orange"/>
                  <span className="text-sm">Еду не один (+пассажиры)</span>
                </div>
                <div className="flex items-center gap-3">
                   <button onClick={() => setFormData(p => ({...p, guests: Math.max(0, p.guests - 1)}))} className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xl font-bold">-</button>
                   <span className="w-4 text-center">{formData.guests}</span>
                   <button onClick={() => setFormData(p => ({...p, guests: p.guests + 1}))} className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xl font-bold">+</button>
                </div>
              </div>

              {/* Дети */}
              <div 
                className={`flex justify-between items-center border rounded-xl p-3 transition-colors cursor-pointer ${formData.children ? 'bg-offroad-orange/20 border-offroad-orange' : 'bg-black/50 border-gray-700'}`}
                onClick={() => setFormData(p => ({...p, children: !p.children}))}
              >
                <div className="flex items-center gap-2">
                  <Baby size={18} className={formData.children ? "text-offroad-orange" : "text-gray-500"}/>
                  <span className="text-sm">Со мной будут дети</span>
                </div>
                <div className={`w-5 h-5 rounded border flex items-center justify-center ${formData.children ? 'bg-offroad-orange border-offroad-orange' : 'border-gray-500'}`}>
                  {formData.children && <CheckSquare size={14} className="text-white" />} 
                </div>
              </div>

              <button 
                onClick={handleBooking}
                disabled={bookingLoading}
                className="w-full bg-offroad-orange text-white font-bold py-3 rounded-xl mt-4 flex justify-center items-center gap-2"
              >
                {bookingLoading ? <Loader2 className="animate-spin"/> : 'Подтвердить запись'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}