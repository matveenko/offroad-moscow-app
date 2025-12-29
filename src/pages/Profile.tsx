import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import WebApp from '@twa-dev/sdk';
import { Loader2, Trophy, MapPin, Calendar, Clock, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

// Типы данных
interface Booking {
  id: number;
  event: {
    id: number;
    title: string;
    date: string;
    location: string;
    image_url?: string;
    price: number;
  };
}

export default function Profile() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // 1. Получаем юзера (из Телеги или Мок для браузера)
    let currentUser = WebApp.initDataUnsafe.user;
    
    // ДЛЯ ТЕСТОВ В БРАУЗЕРЕ (Если открыл не в телеге — раскомментируй строку ниже)
    // currentUser = { id: 12345, first_name: "Андрэ", username: "boss", photo_url: "" } as any;

    if (currentUser) {
      setUser(currentUser);
      fetchUserBookings(currentUser.id.toString());
    } else {
      setLoading(false);
    }
  }, []);

  async function fetchUserBookings(userId: string) {
    // Хитрый запрос: берем регистрации И вложенные данные о событии
    const { data, error } = await supabase
      .from('registrations')
      .select('id, event:events(*)') // Join таблицы events
      .eq('user_id', userId);

    if (error) {
      console.error('Ошибка:', error);
    } else {
      // Сортируем: сначала новые
      const formatted = (data || []).map((item: any) => ({
        id: item.id,
        event: item.event // Supabase возвращает объект event внутри
      }));
      setBookings(formatted);
    }
    setLoading(false);
  }

  // Логика рангов
  const getRank = (count: number) => {
    if (count === 0) return { title: 'Асфальтовый житель', color: 'text-gray-400', icon: '🚗' };
    if (count < 3) return { title: 'Любитель грязи', color: 'text-yellow-500', icon: '🚜' };
    if (count < 10) return { title: 'Опытный джипер', color: 'text-offroad-orange', icon: '💪' };
    return { title: 'Король Болота', color: 'text-purple-500', icon: '👑' };
  };

  if (loading) return <div className="flex h-screen items-center justify-center text-offroad-orange"><Loader2 className="animate-spin" size={40} /></div>;

  if (!user) {
    return (
      <div className="p-6 text-center pt-20">
        <AlertCircle size={48} className="mx-auto text-gray-500 mb-4"/>
        <h2 className="text-xl font-bold">Профиль недоступен</h2>
        <p className="text-gray-400 mt-2">Зайди через Telegram, чтобы видеть свою статистику.</p>
      </div>
    );
  }

  const rank = getRank(bookings.length);
  const now = new Date();
  
  // Разделяем на будущие и прошедшие
  const upcoming = bookings.filter(b => new Date(b.event.date) >= now);
  const history = bookings.filter(b => new Date(b.event.date) < now);

  return (
    <div className="min-h-screen bg-offroad-black text-white p-4 pb-24">
      
      {/* Шапка профиля */}
      <div className="flex items-center gap-4 mb-8 pt-4">
        <div className="w-20 h-20 rounded-full bg-gray-800 border-2 border-offroad-orange overflow-hidden flex items-center justify-center">
            {/* Фотка из телеги или заглушка */}
            {user.photo_url ? (
                <img src={user.photo_url} alt="Ava" className="w-full h-full object-cover"/>
            ) : (
                <span className="text-2xl font-bold text-offroad-orange">{user.first_name[0]}</span>
            )}
        </div>
        <div>
            <h1 className="text-2xl font-black">{user.first_name}</h1>
            <div className={`text-sm font-bold flex items-center gap-1 ${rank.color}`}>
                {rank.icon} {rank.title}
            </div>
            <p className="text-xs text-gray-500 mt-1">@{user.username}</p>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="bg-offroad-dark border border-gray-800 p-4 rounded-xl text-center">
            <div className="text-2xl font-black text-white">{bookings.length}</div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">Всего выездов</div>
        </div>
        <div className="bg-offroad-dark border border-gray-800 p-4 rounded-xl text-center">
            <div className="text-2xl font-black text-white">{upcoming.length}</div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">Запланировано</div>
        </div>
      </div>

      {/* Секция: Мои билеты (Будущее) */}
      {upcoming.length > 0 && (
        <div className="mb-8">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Calendar size={18} className="text-offroad-orange"/> Скоро едем
            </h2>
            <div className="space-y-3">
                {upcoming.map(b => (
                    <Link to={`/event/${b.event.id}`} key={b.id} className="block bg-offroad-dark border border-gray-700 rounded-xl p-4 flex gap-4 hover:bg-gray-800 transition">
                        <div className="w-16 h-16 bg-gray-900 rounded-lg shrink-0 overflow-hidden">
                             {b.event.image_url ? <img src={b.event.image_url} className="w-full h-full object-cover"/> : <div className="w-full h-full bg-gray-800"/>}
                        </div>
                        <div>
                            <h3 className="font-bold leading-tight">{b.event.title}</h3>
                            <div className="text-xs text-gray-400 mt-1">{new Date(b.event.date).toLocaleDateString('ru-RU')}</div>
                            <div className="text-xs text-offroad-orange mt-1 font-bold">Оплачено: {b.event.price} ₽</div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
      )}

      {/* Секция: История (Прошлое) */}
      <div>
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Clock size={18} className="text-gray-500"/> История грязи
        </h2>
        {history.length === 0 ? (
            <p className="text-gray-500 text-sm">Пока пусто. Самое время записаться!</p>
        ) : (
            <div className="space-y-3 opacity-70 hover:opacity-100 transition-opacity">
                {history.map(b => (
                    <div key={b.id} className="bg-black/30 border border-gray-800 rounded-xl p-4 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-gray-300">{b.event.title}</h3>
                            <div className="text-xs text-gray-500">{new Date(b.event.date).toLocaleDateString('ru-RU')}</div>
                        </div>
                        <Trophy size={20} className="text-gray-600"/>
                    </div>
                ))}
            </div>
        )}
      </div>

    </div>
  );
}