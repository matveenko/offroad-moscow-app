import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import WebApp from '@twa-dev/sdk';
import { Loader2, Trophy, Car, Plus, Trash2, Settings, Wrench, UserCheck, AlertOctagon, Calendar, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getOptimizedUrl } from '../utils';
import { toast } from 'sonner';

interface Booking { id: number; event: { id: number; title: string; date: string; location: string; image_url?: string; price: number; }; }
interface Car { id: number; model: string; tires: string; has_winch: boolean; description: string; }

export default function Profile() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  // Профиль (Никнейм)
  const [nickname, setNickname] = useState('');
  const [isProfileSaved, setIsProfileSaved] = useState(false);

  // Форма авто
  const [showCarForm, setShowCarForm] = useState(false);
  const [newCar, setNewCar] = useState({ model: '', tires: '', has_winch: false });

  useEffect(() => {
    let currentUser = WebApp.initDataUnsafe.user;
    if (currentUser) {
      setUser(currentUser);
      fetchData(currentUser.id.toString());
    } else {
      setLoading(false);
    }
  }, []);

  async function fetchData(userId: string) {
    // 1. Профиль (Ник)
    const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', userId).single();
    if (profile) {
        setNickname(profile.nickname || '');
        setIsProfileSaved(!!profile.nickname);
    } else {
        setNickname(WebApp.initDataUnsafe.user?.username || '');
    }

    // 2. Брони
    const { data: bookingData } = await supabase.from('registrations').select('id, event:events(*)').eq('user_id', userId);
    if (bookingData) {
        const formatted = bookingData.map((item: any) => ({ id: item.id, event: item.event }));
        setBookings(formatted);
    }

    // 3. Гараж
    const { data: garageData } = await supabase.from('garage').select('*').eq('user_id', userId);
    if (garageData) setCars(garageData);

    setLoading(false);
  }

  const handleSaveNickname = async () => {
      if (!nickname.trim()) return toast.error('Введи никнейм!');
      
      const { error } = await supabase.from('profiles').upsert({ 
          user_id: user.id.toString(),
          nickname: nickname,
          // Не перезаписываем флаг онбординга, если он уже true
      }, { onConflict: 'user_id' });

      if (error) toast.error('Ошибка сохранения');
      else {
          toast.success('Никнейм сохранен!');
          setIsProfileSaved(true);
      }
  };

  const handleAddCar = async () => {
      if (!newCar.model) return toast.error('Введи название тачки!');
      const { error } = await supabase.from('garage').insert([{
          user_id: user.id.toString(), model: newCar.model, tires: newCar.tires, has_winch: newCar.has_winch
      }]);
      if (error) toast.error('Ошибка');
      else {
          toast.success('Тачка добавлена!');
          setShowCarForm(false); setNewCar({ model: '', tires: '', has_winch: false });
          fetchData(user.id.toString());
      }
  };

  const handleDeleteCar = async (id: number) => {
      if(!confirm('Удаляем?')) return;
      await supabase.from('garage').delete().eq('id', id);
      setCars(prev => prev.filter(c => c.id !== id));
  };

  const getRank = (count: number) => {
    if (count === 0) return { title: 'Асфальтовый житель', color: 'text-gray-400', icon: '🚗' };
    if (count < 3) return { title: 'Любитель грязи', color: 'text-yellow-500', icon: '🚜' };
    return { title: 'Король Болота', color: 'text-purple-500', icon: '👑' };
  };

  if (loading) return <div className="flex h-screen items-center justify-center text-offroad-orange"><Loader2 className="animate-spin" size={40} /></div>;
  if (!user) return <div className="p-6 text-center pt-20 text-white">Зайди через Telegram.</div>;

  const rank = getRank(bookings.length);
  const now = new Date();
  const upcoming = bookings.filter(b => new Date(b.event.date) >= now);
  const history = bookings.filter(b => new Date(b.event.date) < now);

  return (
    <div className="min-h-screen bg-offroad-black text-white p-4 pb-24 max-w-md mx-auto animate-in fade-in">
      
      {/* Шапка */}
      <div className="flex items-center gap-4 mb-6 pt-4">
        <div className="w-20 h-20 rounded-full bg-gray-800 border-2 border-offroad-orange overflow-hidden flex items-center justify-center">
            {user.photo_url ? <img src={user.photo_url} className="w-full h-full object-cover"/> : <span className="text-2xl font-bold text-offroad-orange">{user.first_name[0]}</span>}
        </div>
        <div>
            <h1 className="text-2xl font-black font-display">{user.first_name}</h1>
            <div className={`text-sm font-bold flex items-center gap-1 ${rank.color}`}>{rank.icon} {rank.title}</div>
        </div>
      </div>

      {/* --- НИКНЕЙМ --- */}
      <div className={`tour-profile-nickname mb-6 p-4 rounded-xl border ${isProfileSaved ? 'bg-offroad-dark border-gray-700' : 'bg-red-900/20 border-red-500 animate-pulse'}`}>
        {/* Убрал block, оставил flex */}
        <label className="text-sm text-gray-400 mb-2 font-bold flex items-center gap-2">
            <UserCheck size={16}/> Твой Позывной (Ник)
            {!isProfileSaved && <span className="text-red-500 text-[10px] uppercase">Обязательно</span>}
        </label>
        <div className="flex gap-2">
            <input 
                value={nickname} 
                onChange={e => setNickname(e.target.value)} 
                placeholder="Например: Гряземес777" 
                className="flex-1 bg-black/50 border border-gray-600 rounded-lg px-3 py-2 text-white outline-none focus:border-offroad-orange"
            />
            <button onClick={handleSaveNickname} className="tour-profile-save bg-offroad-orange px-4 py-2 rounded-lg font-bold text-sm">OK</button>
        </div>
      </div>

      {/* --- ГАРАЖ --- */}
      <div className="tour-profile-garage mb-8">
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2 font-display uppercase tracking-wide"><Car size={20} className="text-offroad-orange"/> Мой Гараж</h2>
        
        {cars.length === 0 && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-500 rounded-xl flex items-center gap-3 text-red-200 text-xs">
                <AlertOctagon size={24} className="shrink-0"/>
                <div>Без машины ты не сможешь записаться на выезд! Добавь её прямо сейчас.</div>
            </div>
        )}

        <div className="space-y-3">
            {cars.map(car => (
                <div key={car.id} className="bg-offroad-dark border border-gray-700 p-4 rounded-xl flex justify-between items-center shadow-md">
                    <div>
                        <div className="font-bold text-lg text-white">{car.model}</div>
                        <div className="text-xs text-gray-400 flex gap-3 mt-1">
                            <span className="bg-gray-800 px-2 py-0.5 rounded"><Settings size={10} className="inline mr-1"/>{car.tires || 'Сток'}</span>
                            {car.has_winch && <span className="text-green-400 bg-green-900/20 px-2 py-0.5 rounded"><Wrench size={10} className="inline mr-1"/>Лебедка</span>}
                        </div>
                    </div>
                    <button onClick={() => handleDeleteCar(car.id)} className="text-gray-600 hover:text-red-500"><Trash2 size={18}/></button>
                </div>
            ))}

            {!showCarForm ? (
                <button onClick={() => setShowCarForm(true)} className="tour-add-car-btn w-full py-3 border-2 border-dashed border-gray-700 rounded-xl text-gray-500 flex items-center justify-center gap-2 hover:border-offroad-orange hover:text-offroad-orange transition-colors font-bold text-sm">
                    <Plus size={18}/> Добавить тачку
                </button>
            ) : (
                <div className="bg-gray-900 p-4 rounded-xl border border-gray-700 animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-3">
                        <input value={newCar.model} onChange={e => setNewCar({...newCar, model: e.target.value})} placeholder="Марка (УАЗ Патриот)" className="w-full bg-black border border-gray-700 rounded-lg p-2 text-white outline-none focus:border-offroad-orange"/>
                        <div className="flex gap-3">
                            <input value={newCar.tires} onChange={e => setNewCar({...newCar, tires: e.target.value})} placeholder="Колеса (33 MT)" className="w-1/2 bg-black border border-gray-700 rounded-lg p-2 text-white outline-none focus:border-offroad-orange"/>
                            <button onClick={() => setNewCar({...newCar, has_winch: !newCar.has_winch})} className={`w-1/2 rounded-lg border text-sm font-bold ${newCar.has_winch ? 'bg-offroad-orange border-offroad-orange' : 'bg-black border-gray-700 text-gray-500'}`}>{newCar.has_winch ? 'Лебедка есть' : 'Нет лебедки'}</button>
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

      {/* Списки выездов */}
      {upcoming.length > 0 && (
        <div className="mb-8">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2 font-display uppercase tracking-wide"><Calendar size={18} className="text-offroad-orange"/> Скоро едем</h2>
            <div className="space-y-3">
                {upcoming.map(b => (
                    // Убрал block, оставил flex
                    <Link to={`/event/${b.event.id}`} key={b.id} className="bg-offroad-dark border border-gray-700 rounded-xl p-4 flex gap-4 hover:bg-gray-800 transition">
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