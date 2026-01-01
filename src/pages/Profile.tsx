import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import WebApp from '@twa-dev/sdk';
import { Loader2, Trophy, Calendar, Clock, AlertCircle, Car, Plus, Trash2, Settings, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getOptimizedUrl } from '../utils';
import { toast } from 'sonner';

interface Booking {
  id: number;
  event: { id: number; title: string; date: string; location: string; image_url?: string; price: number; };
}

interface Car {
  id: number;
  model: string;
  tires: string;
  has_winch: boolean;
  description: string;
}

export default function Profile() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  // Форма добавления авто
  const [showCarForm, setShowCarForm] = useState(false);
  const [newCar, setNewCar] = useState({ model: '', tires: '', has_winch: false });

  useEffect(() => {
    let currentUser = WebApp.initDataUnsafe.user;
    // currentUser = { id: 12345, first_name: "Андрэ", username: "boss", photo_url: "" } as any; // Тест

    if (currentUser) {
      setUser(currentUser);
      fetchData(currentUser.id.toString());
    } else {
      setLoading(false);
    }
  }, []);

  async function fetchData(userId: string) {
    // 1. Брони
    const { data: bookingData } = await supabase
      .from('registrations')
      .select('id, event:events(*)')
      .eq('user_id', userId);
    
    if (bookingData) {
        const formatted = bookingData.map((item: any) => ({ id: item.id, event: item.event }));
        setBookings(formatted);
    }

    // 2. Гараж
    const { data: garageData } = await supabase
        .from('garage')
        .select('*')
        .eq('user_id', userId);
    
    if (garageData) setCars(garageData);

    setLoading(false);
  }

  const handleAddCar = async () => {
      if (!newCar.model) return toast.error('Введи название тачки!');
      
      const { error } = await supabase.from('garage').insert([{
          user_id: user.id.toString(),
          model: newCar.model,
          tires: newCar.tires,
          has_winch: newCar.has_winch
      }]);

      if (error) {
          toast.error('Ошибка добавления');
      } else {
          toast.success('Тачка в гараже!');
          setShowCarForm(false);
          setNewCar({ model: '', tires: '', has_winch: false });
          fetchData(user.id.toString()); // Обновить список
      }
  };

  const handleDeleteCar = async (id: number) => {
      if(!confirm('Продал ласточку? Удаляем?')) return;
      await supabase.from('garage').delete().eq('id', id);
      setCars(prev => prev.filter(c => c.id !== id));
      toast.success('Удалено');
  };

  const getRank = (count: number) => {
    if (count === 0) return { title: 'Асфальтовый житель', color: 'text-gray-400', icon: '🚗' };
    if (count < 3) return { title: 'Любитель грязи', color: 'text-yellow-500', icon: '🚜' };
    if (count < 10) return { title: 'Опытный джипер', color: 'text-offroad-orange', icon: '💪' };
    return { title: 'Король Болота', color: 'text-purple-500', icon: '👑' };
  };

  if (loading) return <div className="flex h-screen items-center justify-center text-offroad-orange"><Loader2 className="animate-spin" size={40} /></div>;

  if (!user) return <div className="p-6 text-center pt-20"><AlertCircle size={48} className="mx-auto text-gray-500 mb-4"/><h2 className="text-xl font-bold">Профиль недоступен</h2><p className="text-gray-400 mt-2">Зайди через Telegram.</p></div>;

  const rank = getRank(bookings.length);
  const now = new Date();
  const upcoming = bookings.filter(b => new Date(b.event.date) >= now);
  const history = bookings.filter(b => new Date(b.event.date) < now);

  return (
    <div className="min-h-screen bg-offroad-black text-white p-4 pb-24 max-w-md mx-auto">
      {/* Шапка */}
      <div className="flex items-center gap-4 mb-8 pt-4">
        <div className="w-20 h-20 rounded-full bg-gray-800 border-2 border-offroad-orange overflow-hidden flex items-center justify-center">
            {user.photo_url ? <img src={user.photo_url} alt="Ava" className="w-full h-full object-cover"/> : <span className="text-2xl font-bold text-offroad-orange">{user.first_name[0]}</span>}
        </div>
        <div>
            <h1 className="text-2xl font-black font-display">{user.first_name}</h1>
            <div className={`text-sm font-bold flex items-center gap-1 ${rank.color}`}>{rank.icon} {rank.title}</div>
            <p className="text-xs text-gray-500 mt-1">@{user.username}</p>
        </div>
      </div>

      {/* --- ГАРАЖ --- */}
      <div className="mb-8">
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2 font-display uppercase tracking-wide"><Car size={20} className="text-offroad-orange"/> Мой Гараж</h2>
        
        <div className="space-y-3">
            {cars.map(car => (
                <div key={car.id} className="bg-offroad-dark border border-gray-700 p-4 rounded-xl flex justify-between items-center shadow-md">
                    <div>
                        <div className="font-bold text-lg text-white">{car.model}</div>
                        <div className="text-xs text-gray-400 flex gap-3 mt-1">
                            <span className="flex items-center gap-1 bg-gray-800 px-2 py-0.5 rounded"><Settings size={10}/> {car.tires || 'Сток'}</span>
                            {car.has_winch && <span className="flex items-center gap-1 text-green-400 bg-green-900/20 px-2 py-0.5 rounded"><Wrench size={10}/> Лебедка</span>}
                        </div>
                    </div>
                    <button onClick={() => handleDeleteCar(car.id)} className="p-2 text-gray-600 hover:text-red-500"><Trash2 size={18}/></button>
                </div>
            ))}

            {/* Кнопка добавления */}
            {!showCarForm ? (
                <button onClick={() => setShowCarForm(true)} className="w-full py-3 border-2 border-dashed border-gray-700 rounded-xl text-gray-500 flex items-center justify-center gap-2 hover:border-offroad-orange hover:text-offroad-orange transition-colors font-bold text-sm">
                    <Plus size={18}/> Добавить тачку
                </button>
            ) : (
                <div className="bg-gray-900 p-4 rounded-xl border border-gray-700 animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-3">
                        <input value={newCar.model} onChange={e => setNewCar({...newCar, model: e.target.value})} placeholder="Марка и модель (УАЗ Патриот)" className="w-full bg-black border border-gray-700 rounded-lg p-2 text-white outline-none focus:border-offroad-orange"/>
                        <div className="flex gap-3">
                            <input value={newCar.tires} onChange={e => setNewCar({...newCar, tires: e.target.value})} placeholder="Колеса (33 MT)" className="w-1/2 bg-black border border-gray-700 rounded-lg p-2 text-white outline-none focus:border-offroad-orange"/>
                            <button onClick={() => setNewCar({...newCar, has_winch: !newCar.has_winch})} className={`w-1/2 rounded-lg border flex items-center justify-center gap-2 text-sm font-bold ${newCar.has_winch ? 'bg-offroad-orange border-offroad-orange text-white' : 'bg-black border-gray-700 text-gray-500'}`}>
                                {newCar.has_winch ? 'Лебедка есть' : 'Нет лебедки'}
                            </button>
                        </div>
                        <div className="flex gap-2 pt-2">
                            <button onClick={() => setShowCarForm(false)} className="flex-1 bg-gray-800 py-2 rounded-lg text-sm">Отмена</button>
                            <button onClick={handleAddCar} className="flex-1 bg-white text-black font-bold py-2 rounded-lg text-sm">Сохранить</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="bg-offroad-dark border border-gray-800 p-4 rounded-xl text-center">
            <div className="text-2xl font-black text-white font-display">{bookings.length}</div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">Выездов</div>
        </div>
        <div className="bg-offroad-dark border border-gray-800 p-4 rounded-xl text-center">
            <div className="text-2xl font-black text-white font-display">{upcoming.length}</div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">Планы</div>
        </div>
      </div>

      {/* Списки выездов */}
      {upcoming.length > 0 && (
        <div className="mb-8">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2 font-display uppercase tracking-wide"><Calendar size={18} className="text-offroad-orange"/> Скоро едем</h2>
            <div className="space-y-3">
                {upcoming.map(b => (
                    <Link to={`/event/${b.event.id}`} key={b.id} className="block bg-offroad-dark border border-gray-700 rounded-xl p-4 flex gap-4 hover:bg-gray-800 transition">
                        <div className="w-16 h-16 bg-gray-900 rounded-lg shrink-0 overflow-hidden">
                             <img src={getOptimizedUrl(b.event.image_url, 100)} className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display='none'}/>
                        </div>
                        <div>
                            <h3 className="font-bold leading-tight">{b.event.title}</h3>
                            <div className="text-xs text-gray-400 mt-1">{new Date(b.event.date).toLocaleDateString('ru-RU')}</div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
      )}

      <div>
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2 font-display uppercase tracking-wide"><Clock size={18} className="text-gray-500"/> История</h2>
        {history.length === 0 ? <p className="text-gray-500 text-sm">Пока пусто.</p> : (
            <div className="space-y-3 opacity-70 hover:opacity-100 transition-opacity">
                {history.map(b => (
                    <div key={b.id} className="bg-black/30 border border-gray-800 rounded-xl p-4 flex justify-between items-center">
                        <div><h3 className="font-bold text-gray-300">{b.event.title}</h3><div className="text-xs text-gray-500">{new Date(b.event.date).toLocaleDateString('ru-RU')}</div></div>
                        <Trophy size={20} className="text-gray-600"/>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}