import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import WebApp from '@twa-dev/sdk';
import { 
  ArrowLeft, MapPin, Calendar, Loader2, AlertTriangle, CheckCircle, 
  X, Users, Baby, Phone, Share2, Navigation, ExternalLink, 
  Car as CarIcon, Anchor, MessageSquare, CreditCard, Trash2, Home, 
  PlusCircle, ChevronRight 
} from 'lucide-react'; // Убрал CheckSquare, он не использовался
import { toast } from 'sonner';
import { getOptimizedUrl } from '../utils';
import confetti from 'canvas-confetti';

// --- КОШЕЛЕК ЮМАНИ ---
const YOOMONEY_WALLET = "4100119444513570"; 

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
  warning_text?: string;
  children_allowed?: boolean;
}

interface Participant {
  id: number;
  first_name: string;
  avatar_url?: string;
}

interface GarageCar {
  id: number;
  model: string;
  tires?: string;
  has_winch: boolean;
  description?: string;
}

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Данные
  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [userCars, setUserCars] = useState<GarageCar[]>([]);
  
  // Состояния
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null); // pending | paid
  const [regId, setRegId] = useState<number | null>(null); // ID заявки для отмены
  
  const [showModal, setShowModal] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  
  // Выбранная машина
  const [selectedCarId, setSelectedCarId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    guests: 1, // Минимум 1 взрослый (водитель)
    children: 0,
    children_ages: '',
    phone: '+7 ('
  });

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      const user = WebApp.initDataUnsafe.user;
      
      // 1. Грузим событие
      const { data: eventData, error } = await supabase.from('events').select('*').eq('id', id).single();
      if (error) console.error(error); else setEvent(eventData);

      // 2. Грузим участников
      const { data: partData } = await supabase.from('registrations').select('id, first_name, avatar_url').eq('event_id', id);
      if (partData) setParticipants(partData);

      if (user) {
        const userId = user.id.toString();

        // 3. Проверяем регистрацию
        const { data: regData } = await supabase
          .from('registrations')
          .select('*')
          .eq('event_id', id)
          .eq('user_id', userId)
          .single();
        
        if (regData) {
            setIsRegistered(true);
            setPaymentStatus(regData.payment_status);
            setRegId(regData.id);
        }

        // 4. Грузим гараж
        const { data: garageData } = await supabase
          .from('garage')
          .select('*')
          .eq('user_id', userId);

        if (garageData) {
          setUserCars(garageData);
          if (garageData.length === 1) {
            setSelectedCarId(garageData[0].id);
          }
        }
      }
      
      // Автозаполнение телефона
      const savedPhone = localStorage.getItem('user_phone');
      if (savedPhone) {
          setFormData(prev => ({ ...prev, phone: savedPhone }));
      }

      setLoading(false);
    }
    fetchData();
  }, [id]);

  // --- УМНАЯ НАВИГАЦИЯ ---
  const handleBack = () => {
    if (location.state?.fromApp) {
        navigate(-1);
    } else {
        navigate('/');
    }
  };

  // --- МАСКА ТЕЛЕФОНА ---
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (!val) val = '7';
    if (val[0] === '8') val = '7' + val.slice(1);
    if (val[0] !== '7') val = '7' + val;

    val = val.slice(0, 11);

    let formatted = '+7';
    if (val.length > 1) formatted += ' (' + val.slice(1, 4);
    if (val.length >= 5) formatted += ') ' + val.slice(4, 7);
    if (val.length >= 8) formatted += '-' + val.slice(7, 9);
    if (val.length >= 10) formatted += '-' + val.slice(9, 11);

    setFormData({ ...formData, phone: formatted });
  };

  // --- ЗАПИСЬ И ОПЛАТА ---
  const handleBooking = async () => {
    const user = WebApp.initDataUnsafe.user;
    if (!user) { toast.error("Только через Telegram!"); return; }
    
    // ЖЕСТКАЯ ПРОВЕРКА ГАРАЖА
    if (userCars.length === 0) {
        toast.error('У тебя нет машин! Добавь в Профиле.');
        navigate('/profile'); // Кидаем добавлять тачку
        return;
    }

    if (!selectedCarId) { 
        toast.error('Выбери машину!'); 
        return; 
    }

    if (formData.phone.length < 18) { toast.error('Введите корректный номер телефона!'); return; }
    if (formData.children > 0 && formData.children_ages.trim().length === 0) { toast.error('Укажите возраст детей!'); return; }

    setBookingLoading(true);
    localStorage.setItem('user_phone', formData.phone);

    // Инфо о машине
    let carInfoString = "Неизвестно";
    const car = userCars.find(c => c.id === selectedCarId);
    if (car) {
       carInfoString = `${car.model} (${car.tires}")`;
    }

    // 1. Создаем запись (статус pending)
    const { data: regData, error } = await supabase
      .from('registrations')
      .insert([
        { 
          event_id: event?.id, 
          user_id: user.id.toString(), 
          first_name: user.first_name, 
          username: user.username,
          guests_count: formData.guests,
          children_count: formData.children, 
          has_children: formData.children > 0,
          children_ages: formData.children > 0 ? formData.children_ages : null,
          phone: formData.phone,
          avatar_url: user.photo_url,
          car_info: carInfoString,
          payment_status: event?.price === 0 ? 'paid' : 'pending'
        }
      ])
      .select()
      .single();

    if (error) {
      toast.error("Ошибка записи: " + error.message);
      setBookingLoading(false);
      return;
    }

    // 2. ЕСЛИ ПЛАТНО -> ЮМАНИ
    if (event?.price && event.price > 0) {
        const label = `reg_${regData.id}`; 
        const successURL = `https://t.me/OffroadMoscow_bot/app?startapp=event_${event?.id}`;
        const yooMoneyUrl = `https://yoomoney.ru/quickpay/confirm?receiver=${YOOMONEY_WALLET}&label=${label}&quickpay-form=shop&targets=${encodeURIComponent("Взнос: " + event?.title)}&sum=${event?.price}&paymentType=AC&successURL=${encodeURIComponent(successURL)}`;

        WebApp.openLink(yooMoneyUrl);
        toast.info('Переходим к оплате...');
        setPaymentStatus('pending');
    } 
    // 3. ЕСЛИ БЕСПЛАТНО -> УСПЕХ
    else {
        toast.success('Ура! Ты в команде!');
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#f97316', '#ffffff'] });
        setPaymentStatus('paid');
    }

    setIsRegistered(true);
    setRegId(regData.id);
    setShowModal(false);
    
    setParticipants(prev => [...prev, { id: Date.now(), first_name: user.first_name, avatar_url: user.photo_url }]);
    setBookingLoading(false);
  };

  // --- ОТМЕНА ЗАЯВКИ ---
  const handleCancelBooking = async () => {
    if (!regId) return;
    if (!confirm('Отменить заявку и попробовать снова?')) return;

    const { error } = await supabase.from('registrations').delete().eq('id', regId);
    
    if (error) {
        toast.error('Ошибка отмены');
    } else {
        setIsRegistered(false);
        setPaymentStatus(null);
        setRegId(null);
        toast.success('Отменено');
        const user = WebApp.initDataUnsafe.user;
        if (user) {
          setParticipants(prev => prev.filter(p => p.first_name !== user.first_name));
        }
    }
  };

  const handleShare = () => {
      const botUsername = 'OffroadMoscow_bot'; 
      const appName = 'app'; 
      const startParam = `event_${event?.id}`;
      const link = `https://t.me/${botUsername}/${appName}?startapp=${startParam}`;
      const text = `Го месить грязь! 🚜\n${event?.title}`;
      const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`;
      WebApp.openTelegramLink(shareUrl);
  };

  const openMap = () => {
      if (!event) return;
      const url = `https://yandex.ru/maps/?text=${encodeURIComponent(event.location)}`;
      WebApp.openLink(url);
  };

  const updateGuests = (delta: number) => {
    setFormData(prev => {
        const newVal = prev.guests + delta;
        if (newVal < 1) return prev; 
        if (newVal > 5) { toast.warning('Максимум 5 взрослых!'); return prev; }
        return { ...prev, guests: newVal };
    });
  };

  const updateChildren = (delta: number) => {
    setFormData(prev => {
        const newVal = prev.children + delta;
        if (newVal < 0) return prev;
        if (newVal > 5) { toast.warning('Куда столько детей?!'); return prev; }
        if (newVal === 0) return { ...prev, children: 0, children_ages: '' };
        return { ...prev, children: newVal };
    });
  };

  if (loading) return <div className="flex h-screen items-center justify-center text-offroad-orange"><Loader2 className="animate-spin" size={40} /></div>;
  if (!event) return <div className="p-6 text-white">Выезд не найден.</div>;

  return (
    <div className="min-h-screen bg-offroad-black text-white pb-32 relative w-full max-w-5xl mx-auto font-sans">
      
      {/* Навигация */}
      <div className="absolute top-4 left-4 z-20 flex justify-between w-full pr-8 max-w-5xl mx-auto pointer-events-none">
        <div className="pointer-events-auto flex w-full justify-between px-4 sm:px-0">
            <button onClick={handleBack} className="bg-black/50 backdrop-blur-md p-2.5 rounded-full text-white hover:bg-offroad-orange transition border border-white/10 shadow-lg">
                {location.state?.fromApp ? <ArrowLeft size={24} /> : <Home size={24} />}
            </button>
            <button onClick={handleShare} className="bg-black/50 backdrop-blur-md p-2.5 rounded-full text-white hover:bg-offroad-orange transition border border-white/10 shadow-lg">
                <Share2 size={24} />
            </button>
        </div>
      </div>

      {/* Картинка */}
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

      {/* Контент */}
      <div className="px-5 sm:px-8 -mt-24 relative z-10 max-w-4xl mx-auto">
        <h1 className="text-3xl sm:text-5xl font-display font-black leading-tight mb-4 drop-shadow-xl uppercase italic tracking-wide text-white">
            {event.title}
        </h1>
        
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-xs sm:text-sm flex items-center gap-2 font-medium shadow-lg">
            <Calendar size={16} className="text-offroad-orange"/>
            {new Date(event.date).toLocaleDateString('ru-RU')}
          </div>
          <button onClick={openMap} className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-xs sm:text-sm flex items-center gap-2 font-medium hover:bg-white/20 transition-colors active:scale-95 shadow-lg">
             <MapPin size={16} className="text-offroad-orange"/>
             {event.location} <Navigation size={12} className="opacity-50"/>
          </button>
        </div>

        {/* Участники (КЛИКАБЕЛЬНЫЙ БЛОК) */}
        {participants.length > 0 && (
            <div 
                onClick={() => navigate(`/event/${id}/participants`)} 
                className="mb-8 flex items-center justify-between bg-white/5 p-3 rounded-2xl border border-white/5 backdrop-blur-sm shadow-lg cursor-pointer hover:bg-white/10 transition-colors group"
            >
                <div className="flex items-center gap-3">
                    <div className="flex -space-x-3">
                        {participants.slice(0, 5).map((p) => (
                            <div key={p.id} className="w-10 h-10 rounded-full border-2 border-offroad-dark bg-gray-700 overflow-hidden relative z-10">
                                {p.avatar_url ? (
                                    <img src={getOptimizedUrl(p.avatar_url, 100)} className="w-full h-full object-cover"/>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-offroad-orange text-white font-bold text-xs">
                                        {p.first_name[0]}
                                    </div>
                                )}
                            </div>
                        ))}
                        {participants.length > 5 && (
                            <div className="w-10 h-10 rounded-full border-2 border-offroad-dark bg-gray-800 flex items-center justify-center text-xs font-bold text-white relative z-20">
                                +{participants.length - 5}
                            </div>
                        )}
                    </div>
                    <div className="text-sm text-gray-300 font-medium">
                        <span className="text-white font-bold">{participants.length}</span> {participants.length === 1 ? 'человек едет' : 'чел. едут'}
                    </div>
                </div>
                
                {/* Стрелочка */}
                <div className="bg-white/10 p-1.5 rounded-full text-gray-400 group-hover:text-white group-hover:bg-offroad-orange transition-all">
                     <ChevronRight size={16} />
                </div>
            </div>
        )}

        <div className="space-y-6">
          <div className="bg-offroad-dark p-6 sm:p-8 rounded-2xl border border-gray-800 shadow-sm">
            <h3 className="font-display font-bold text-xl mb-4 text-offroad-orange flex items-center gap-2 uppercase">
                О замесе
            </h3>
            <div className="text-gray-300 text-sm sm:text-base leading-7 whitespace-pre-wrap font-normal font-sans">
              {event.description || "Описания нет, но будет весело."}
            </div>
          </div>

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
              // ЛОГИКА ПОСЛЕ ОПЛАТЫ
              paymentStatus === 'paid' ? (
                  <button disabled className="flex-1 bg-green-600/20 border border-green-600 text-green-500 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 font-sans">
                    <CheckCircle size={20} /> Оплачено!
                  </button>
              ) : (
                  // ЖДЕМ ОПЛАТУ + КНОПКА ОТМЕНЫ
                  <div className="flex-1 flex gap-2">
                     <button onClick={() => toast.info('Проверь оплату в ЮMoney')} className="flex-1 bg-yellow-600/20 border border-yellow-600 text-yellow-500 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 font-sans animate-pulse">
                        <Loader2 size={20} className="animate-spin"/> Ждем...
                     </button>
                     <button onClick={handleCancelBooking} className="w-14 bg-gray-800 border border-gray-700 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-400 transition-colors">
                        <Trash2 size={20} />
                     </button>
                  </div>
              )
            ) : (
              <button onClick={() => setShowModal(true)} className="flex-1 bg-offroad-orange hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl shadow-[0_0_20px_rgba(249,115,22,0.4)] active:scale-95 transition-all font-display uppercase tracking-wide">
                {event.price === 0 ? 'Записаться бесплатно' : 'Вписаться'}
              </button>
            )}
        </div>
      </div>

      {/* МОДАЛКА */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-offroad-dark w-full max-w-md rounded-2xl border border-gray-700 p-6 animate-in slide-in-from-bottom-10 fade-in duration-300 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-display font-bold text-white uppercase">Регистрация</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white"><X size={24}/></button>
            </div>

            <div className="space-y-5 font-sans">
              
              {/* ВЫБОР МАШИНЫ */}
              {userCars.length > 0 ? (
                <div>
                   <label className="text-sm text-gray-400 mb-2 block font-medium">Твоя тачка</label>
                   <div className="space-y-2">
                      {userCars.map(car => (
                        <div 
                           key={car.id} 
                           onClick={() => setSelectedCarId(car.id)}
                           className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${selectedCarId === car.id ? 'bg-offroad-orange/10 border-offroad-orange' : 'bg-black/50 border-gray-700 hover:bg-gray-800'}`}
                        >
                            <div className="flex items-center gap-3">
                                <CarIcon className={selectedCarId === car.id ? 'text-offroad-orange' : 'text-gray-500'} size={20}/>
                                <div>
                                    <div className="font-bold text-white text-sm">{car.model}</div>
                                    <div className="text-xs text-gray-400 flex gap-2 items-center">
                                       {car.tires && <span>{car.tires}"</span>}
                                       {car.has_winch && <span className="flex items-center gap-1"><Anchor size={10} /> Лебедка</span>}
                                    </div>
                                </div>
                            </div>
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedCarId === car.id ? 'border-offroad-orange' : 'border-gray-600'}`}>
                                {selectedCarId === car.id && <div className="w-2.5 h-2.5 rounded-full bg-offroad-orange" />}
                            </div>
                        </div>
                      ))}
                   </div>
                </div>
              ) : (
                <div className="bg-yellow-900/20 border border-yellow-700/50 p-3 rounded-xl flex gap-3">
                    <AlertTriangle className="text-yellow-500 shrink-0" size={20}/>
                    <div className="text-xs text-yellow-200 leading-relaxed">
                        У тебя нет добавленных машин в гараже. Добавь тачку в профиле!
                        {/* ОШИБКА БЫЛА ТУТ: block mt-2 ... flex 
                            ИСПРАВИЛ: просто убрал block
                        */}
                        <button onClick={() => navigate('/profile')} className="mt-2 text-offroad-orange underline font-bold flex items-center gap-1"><PlusCircle size={14}/> Добавить сейчас</button>
                    </div>
                </div>
              )}

              {/* ТЕЛЕФОН */}
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">Твой телефон</label>
                <div className="flex items-center bg-black/50 border border-gray-700 rounded-xl px-3 py-3 focus-within:border-offroad-orange transition-colors">
                  <Phone size={18} className="text-gray-500 mr-3"/>
                  <input 
                    type="tel" 
                    placeholder="+7 (999) 000-00-00" 
                    className="bg-transparent text-white w-full outline-none placeholder:text-gray-600 font-medium" 
                    value={formData.phone} 
                    onChange={handlePhoneChange} 
                    maxLength={18}
                  />
                </div>
              </div>

              {/* ВЗРОСЛЫЕ */}
              <div className="flex justify-between items-center bg-black/50 border border-gray-700 rounded-xl p-3">
                <div className="flex items-center gap-2">
                    <Users size={18} className="text-offroad-orange"/>
                    <span className="text-sm font-medium">Взрослые (включая тебя)</span>
                </div>
                <div className="flex items-center gap-3">
                   <button onClick={() => updateGuests(-1)} className={`w-9 h-9 rounded-full flex items-center justify-center text-xl font-bold transition-colors ${formData.guests <= 1 ? 'bg-gray-800 text-gray-600' : 'bg-gray-700 hover:bg-gray-600 text-white'}`} disabled={formData.guests <= 1}>-</button>
                   <span className="w-6 text-center font-bold text-lg">{formData.guests}</span>
                   <button onClick={() => updateGuests(1)} className={`w-9 h-9 rounded-full flex items-center justify-center text-xl font-bold transition-colors ${formData.guests >= 5 ? 'bg-red-900/30 text-red-400 border border-red-900' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}>+</button>
                </div>
              </div>

              {/* ДЕТИ (ЕСЛИ РАЗРЕШЕНО) */}
              {event?.children_allowed !== false && (
                <div className="space-y-3">
                    <div className="flex justify-between items-center bg-black/50 border border-gray-700 rounded-xl p-3">
                    <div className="flex items-center gap-2">
                        <Baby size={18} className="text-offroad-orange"/>
                        <span className="text-sm font-medium">Дети</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => updateChildren(-1)} className={`w-9 h-9 rounded-full flex items-center justify-center text-xl font-bold transition-colors ${formData.children === 0 ? 'bg-gray-800 text-gray-600' : 'bg-gray-700 hover:bg-gray-600 text-white'}`} disabled={formData.children === 0}>-</button>
                        <span className="w-6 text-center font-bold text-lg">{formData.children}</span>
                        <button onClick={() => updateChildren(1)} className={`w-9 h-9 rounded-full flex items-center justify-center text-xl font-bold transition-colors ${formData.children >= 5 ? 'bg-red-900/30 text-red-400 border border-red-900' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}>+</button>
                    </div>
                    </div>

                    {/* ВОЗРАСТ ДЕТЕЙ */}
                    {formData.children > 0 && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                            <label className="text-sm text-gray-400 mb-1.5 block">Возраст детей (цифры через запятую)</label>
                            <div className="flex items-center bg-black/50 border border-gray-700 rounded-xl px-3 py-3 focus-within:border-offroad-orange transition-colors">
                                <MessageSquare size={18} className="text-gray-500 mr-3"/>
                                <input 
                                type="text" 
                                placeholder="Например: 5, 8, 12" 
                                className="bg-transparent text-white w-full outline-none placeholder:text-gray-600 font-medium" 
                                value={formData.children_ages} 
                                onChange={(e) => setFormData({...formData, children_ages: e.target.value})}
                                />
                            </div>
                        </div>
                    )}
                </div>
              )}

              {/* КНОПКА ЗАПИСИ (ТЕКСТ МЕНЯЕТСЯ ОТ ЦЕНЫ) */}
              {userCars.length > 0 ? (
                <button onClick={handleBooking} disabled={bookingLoading} className="w-full bg-offroad-orange text-white font-bold py-3.5 rounded-xl mt-2 flex justify-center items-center gap-2 shadow-lg shadow-orange-900/20 active:scale-[0.98] transition-transform uppercase tracking-wide font-display">
                    {bookingLoading ? <Loader2 className="animate-spin"/> : (
                        event?.price === 0 ? <><CheckCircle size={20}/> Записаться бесплатно</> : <><CreditCard size={20}/> Перейти к оплате</>
                    )}
                </button>
              ) : (
                <button onClick={() => navigate('/profile')} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl mt-2 flex justify-center items-center gap-2 shadow-lg active:scale-[0.98] transition-transform uppercase tracking-wide font-display">
                    <PlusCircle size={20}/> Добавить машину
                </button>
              )}
              
              {/* LEGAL LINK */}
              <div className="text-center pt-2">
                  <Link to="/legal" className="text-[10px] text-gray-500 underline hover:text-gray-300">
                      Нажимая кнопку, вы принимаете условия Соглашения
                  </Link>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}