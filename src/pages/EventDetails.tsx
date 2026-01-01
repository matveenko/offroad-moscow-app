import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import WebApp from '@twa-dev/sdk';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Loader2, 
  AlertTriangle, 
  CheckCircle, 
  CheckSquare, 
  X, 
  Users, 
  Baby, 
  Phone, 
  Share2, 
  Navigation, 
  ExternalLink 
} from 'lucide-react';
import { toast } from 'sonner';
import { getOptimizedUrl } from '../utils';
import confetti from 'canvas-confetti';

interface Event {
  id: number;
  title: string;
  date: string;
  location: string;
  price: number;
  description: string;
  image_url?: string;
  report_link?: string;
  is_archived?: boolean;
  warning_text?: string; // <-- Вернул поле
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

  // --- МАСКА ТЕЛЕФОНА ---
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length === 0) { setFormData({ ...formData, phone: '' }); return; }
    if (val.startsWith('7')) val = val.slice(1); else if (val.startsWith('8')) val = val.slice(1);
    
    val = val.slice(0, 10);
    let formatted = '+7';
    if (val.length > 0) formatted += ' (' + val.slice(0, 3);
    if (val.length >= 3) formatted += ') ' + val.slice(3, 6);
    if (val.length >= 6) formatted += '-' + val.slice(6, 8);
    if (val.length >= 8) formatted += '-' + val.slice(8, 10);

    setFormData({ ...formData, phone: formatted });
  };

  // --- ЗАПИСЬ НА ВЫЕЗД ---
  const handleBooking = async () => {
    const user = WebApp.initDataUnsafe.user;
    
    if (!user) {
      toast.error("Запись доступна только через Telegram!");
      return;
    }

    if (formData.phone.length < 18) {
      toast.error('Введите корректный номер телефона!');
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
          guests_count: formData.guests,
          has_children: formData.children,
          phone: formData.phone
        }
      ]);

    if (error) {
      toast.error("Ошибка записи: " + error.message);
    } else {
      setIsRegistered(true);
      setShowModal(false);
      toast.success('Ура! Ты в команде!');
      WebApp.HapticFeedback.notificationOccurred('success');
      
      // --- САЛЮТ ---
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#f97316', '#ffffff', '#000000'],
        disableForReducedMotion: true
      });
    }
    setBookingLoading(false);
  };

  // --- ШЕРИНГ ---
  const handleShare = () => {
      const botUsername = 'OffroadMoscow_bot'; 
      const appName = 'app'; 
      const startParam = `event_${event?.id}`;
      const link = `https://t.me/${botUsername}/${appName}?startapp=${startParam}`;
      
      const text = `Го месить грязь! 🚜\n${event?.title}`;
      const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`;
      
      WebApp.openTelegramLink(shareUrl);
  };

  // --- ОТКРЫТИЕ КАРТЫ ---
  const openMap = () => {
      if (!event) return;
      const url = `https://yandex.ru/maps/?text=${encodeURIComponent(event.location)}`;
      WebApp.openLink(url);
  };

  if (loading) return <div className="flex h-screen items-center justify-center text-offroad-orange"><Loader2 className="animate-spin" size={40} /></div>;
  if (!event) return <div className="p-6 text-white">Выезд не найден.</div>;

  return (
    // ГЛАВНЫЙ КОНТЕЙНЕР (Широкий)
    <div className="min-h-screen bg-offroad-black text-white pb-32 relative w-full max-w-5xl mx-auto font-sans">
      
      {/* КНОПКИ НАВИГАЦИИ */}
      <div className="absolute top-4 left-4 z-20 flex justify-between w-full pr-8 max-w-5xl mx-auto pointer-events-none">
        <div className="pointer-events-auto flex w-full justify-between px-4 sm:px-0">
            <button onClick={() => navigate(-1)} className="bg-black/50 backdrop-blur-md p-2.5 rounded-full text-white hover:bg-offroad-orange transition border border-white/10 shadow-lg">
                <ArrowLeft size={24} />
            </button>
            <button onClick={handleShare} className="bg-black/50 backdrop-blur-md p-2.5 rounded-full text-white hover:bg-offroad-orange transition border border-white/10 shadow-lg">
                <Share2 size={24} />
            </button>
        </div>
      </div>

      {/* КАРТИНКА */}
      <div className="h-80 sm:h-[450px] relative bg-gray-800 sm:rounded-b-[40px] overflow-hidden shadow-2xl">
        <img 
          src={getOptimizedUrl(event.image_url, 1200)} 
          alt={event.title} 
          className="w-full h-full object-cover"
          onError={(e) => { 
              e.currentTarget.src = "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80"; 
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-offroad-black via-offroad-black/50 to-transparent"></div>
      </div>

      {/* КОНТЕНТ */}
      <div className="px-5 sm:px-8 -mt-24 relative z-10 max-w-4xl mx-auto">
        
        {/* Заголовок */}
        <h1 className="text-3xl sm:text-5xl font-display font-black leading-tight mb-4 drop-shadow-xl uppercase italic tracking-wide text-white">
            {event.title}
        </h1>
        
        <div className="flex flex-wrap gap-3 mb-8">
          <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-xs sm:text-sm flex items-center gap-2 font-medium shadow-lg">
            <Calendar size={16} className="text-offroad-orange"/>
            {new Date(event.date).toLocaleDateString('ru-RU')}
          </div>
          
          <button onClick={openMap} className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-xs sm:text-sm flex items-center gap-2 font-medium hover:bg-white/20 transition-colors active:scale-95 shadow-lg">
             <MapPin size={16} className="text-offroad-orange"/>
             {event.location} <Navigation size={12} className="opacity-50"/>
          </button>
        </div>

        <div className="space-y-6">
          
          {/* ОПИСАНИЕ */}
          <div className="bg-offroad-dark p-6 sm:p-8 rounded-2xl border border-gray-800 shadow-sm">
            <h3 className="font-display font-bold text-xl mb-4 text-offroad-orange flex items-center gap-2 uppercase">
                О замесе
            </h3>
            <div className="text-gray-300 text-sm sm:text-base leading-7 whitespace-pre-wrap font-normal font-sans">
              {event.description || "Описания нет, но будет весело."}
            </div>
          </div>

          {/* ПРЕДУПРЕЖДЕНИЕ (ИЗ БАЗЫ) */}
          <div className="bg-red-900/20 p-5 rounded-xl border border-red-900/50 flex gap-4 items-start">
            <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={24} />
            <p className="text-sm text-red-200 leading-relaxed font-sans">
              {event.warning_text || "Грязь не прощает ошибок. Проверь буксировочные проушины, возьми тросы и сапоги."}
            </p>
          </div>
        </div>
      </div>

      {/* ФУТЕР */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#1a1a1a]/95 backdrop-blur-md border-t border-gray-800 p-4 pb-8 z-50">
          <div className="flex items-center justify-between gap-4 w-full max-w-4xl mx-auto">
            <div>
              <p className="text-xs text-gray-400 font-sans">{event.is_archived ? 'Статус' : 'Взнос с экипажа'}</p>
              <p className="text-2xl font-display font-bold text-white">
                  {event.is_archived ? 'Завершено' : `${event.price} ₽`}
              </p>
            </div>
            
            {/* ЛОГИКА КНОПКИ (АРХИВ / ЗАПИСЬ) */}
            {event.is_archived ? (
                event.report_link ? (
                    <a href={event.report_link} target="_blank" className="flex-1 bg-[#2AABEE] hover:bg-[#229ED9] text-white font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 font-sans uppercase tracking-wide transition-all">
                        <ExternalLink size={20}/> Отчет
                    </a>
                ) : (
                    <button disabled className="flex-1 bg-gray-800 text-gray-500 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 font-sans uppercase tracking-wide cursor-not-allowed">
                        Выезд прошел
                    </button>
                )
            ) : isRegistered ? (
              <button disabled className="flex-1 bg-green-600/20 border border-green-600 text-green-500 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 font-sans">
                <CheckCircle size={20} /> Ты в деле!
              </button>
            ) : (
              <button onClick={() => setShowModal(true)} className="flex-1 bg-offroad-orange hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl shadow-[0_0_20px_rgba(249,115,22,0.4)] active:scale-95 transition-all font-display uppercase tracking-wide">
                Вписаться
              </button>
            )}
        </div>
      </div>

      {/* МОДАЛКА РЕГИСТРАЦИИ */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-offroad-dark w-full max-w-md rounded-2xl border border-gray-700 p-6 animate-in slide-in-from-bottom-10 fade-in duration-300">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-display font-bold text-white uppercase">Регистрация</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white"><X size={24}/></button>
            </div>

            <div className="space-y-5 font-sans">
              
              {/* Телефон */}
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">Твой телефон</label>
                <div className="flex items-center bg-black/50 border border-gray-700 rounded-xl px-3 py-3 focus-within:border-offroad-orange transition-colors">
                  <Phone size={18} className="text-gray-500 mr-3"/>
                  <input type="tel" placeholder="+7 (999) 000-00-00" className="bg-transparent text-white w-full outline-none placeholder:text-gray-600 font-medium" value={formData.phone} onChange={handlePhoneChange} maxLength={18}/>
                </div>
              </div>

              {/* Гости */}
              <div className="flex justify-between items-center bg-black/50 border border-gray-700 rounded-xl p-3">
                <div className="flex items-center gap-2"><Users size={18} className="text-offroad-orange"/><span className="text-sm font-medium">Гости в машине</span></div>
                <div className="flex items-center gap-3">
                   <button onClick={() => setFormData(p => ({...p, guests: Math.max(0, p.guests - 1)}))} className={`w-9 h-9 rounded-full flex items-center justify-center text-xl font-bold transition-colors ${formData.guests === 0 ? 'bg-gray-800 text-gray-600' : 'bg-gray-700 hover:bg-gray-600 text-white'}`} disabled={formData.guests === 0}>-</button>
                   <span className="w-6 text-center font-bold text-lg">{formData.guests}</span>
                   <button onClick={() => { if (formData.guests >= 4) { toast.warning('Максимум 4 пассажира!'); return; } setFormData(p => ({...p, guests: p.guests + 1})); }} className={`w-9 h-9 rounded-full flex items-center justify-center text-xl font-bold transition-colors ${formData.guests >= 4 ? 'bg-red-900/30 text-red-400 border border-red-900' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}>+</button>
                </div>
              </div>

              {/* Дети */}
              <div className={`flex justify-between items-center border rounded-xl p-3 transition-colors cursor-pointer ${formData.children ? 'bg-offroad-orange/10 border-offroad-orange' : 'bg-black/50 border-gray-700'}`} onClick={() => setFormData(p => ({...p, children: !p.children}))}>
                <div className="flex items-center gap-3"><Baby size={20} className={formData.children ? "text-offroad-orange" : "text-gray-500"}/><span className="text-sm font-medium">Со мной будут дети</span></div>
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.children ? 'bg-offroad-orange border-offroad-orange' : 'border-gray-500'}`}>{formData.children && <CheckSquare size={14} className="text-white" />}</div>
              </div>

              {/* Кнопка подтверждения */}
              <button onClick={handleBooking} disabled={bookingLoading} className="w-full bg-offroad-orange text-white font-bold py-3.5 rounded-xl mt-2 flex justify-center items-center gap-2 shadow-lg shadow-orange-900/20 active:scale-[0.98] transition-transform uppercase tracking-wide font-display">
                {bookingLoading ? <Loader2 className="animate-spin"/> : 'Подтвердить запись'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}