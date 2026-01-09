import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { ArrowLeft, Loader2, User, Car, Users } from 'lucide-react'; // Добавил иконки
import { getOptimizedUrl } from '../utils';

interface Participant {
  id: number;
  first_name: string;
  username: string | null;
  avatar_url?: string;
  car_info?: string; // <-- Добавили поле
  created_at: string;
}

export default function Participants() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [eventName, setEventName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;

      // 1. Название выезда
      const { data: eventData } = await supabase
        .from('events')
        .select('title')
        .eq('id', id)
        .single();
      
      if (eventData) setEventName(eventData.title);

      // 2. Список людей + ИНФА О МАШИНЕ
      const { data: partData } = await supabase
        .from('registrations')
        .select('id, first_name, username, avatar_url, car_info, created_at') // <-- Запрашиваем car_info
        .eq('event_id', id)
        .order('created_at', { ascending: true });
      
      if (partData) setParticipants(partData);
      setLoading(false);
    }
    fetchData();
  }, [id]);

  return (
    <div className="min-h-screen bg-offroad-black text-white p-4 max-w-5xl mx-auto font-sans">
      
      {/* Хедер */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="bg-black/50 backdrop-blur-md p-2 rounded-full text-white hover:bg-offroad-orange transition border border-white/10">
          <ArrowLeft size={24} />
        </button>
        <div className="min-w-0">
            <h1 className="font-display font-bold text-xl leading-none">Участники</h1>
            <p className="text-xs text-gray-500 truncate">{eventName}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center mt-20 text-offroad-orange animate-spin">
            <Loader2 size={40} />
        </div>
      ) : (
        <div className="space-y-3">
            {participants.length === 0 ? (
                <div className="text-center text-gray-500 mt-20">
                    <User size={48} className="mx-auto mb-2 opacity-50"/>
                    <p>Пока никого... Будь первым!</p>
                </div>
            ) : (
                <>
                    <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2 ml-1">
                        Всего: {participants.length} экип.
                    </div>
                    {participants.map((p, index) => {
                        // Определяем, это машина или пассажир, чтобы выбрать иконку
                        const isPassenger = !p.car_info || p.car_info === 'Пассажир' || p.car_info === 'Пешеход / Пассажир';
                        
                        return (
                          <div key={p.id} className="bg-offroad-dark border border-gray-800 p-3 rounded-xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: `${index * 50}ms` }}>
                              {/* Аватарка */}
                              <div className="w-12 h-12 rounded-full bg-gray-700 overflow-hidden shrink-0 border border-gray-600">
                                  {p.avatar_url ? (
                                      <img src={getOptimizedUrl(p.avatar_url, 100)} className="w-full h-full object-cover"/>
                                  ) : (
                                      <div className="w-full h-full flex items-center justify-center bg-offroad-orange text-white font-bold text-lg">
                                          {p.first_name[0]}
                                      </div>
                                  )}
                              </div>
                              
                              {/* Инфо */}
                              <div className="flex-1 min-w-0">
                                  <div className="font-bold text-white text-lg truncate leading-tight">{p.first_name}</div>
                                  
                                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                                    {/* Никнейм */}
                                    {p.username && (
                                        <div className="text-offroad-orange text-xs truncate font-medium">@{p.username}</div>
                                    )}
                                    
                                    {/* Машина или Статус */}
                                    {p.car_info && (
                                        <div className={`text-xs flex items-center gap-1 truncate ${isPassenger ? 'text-gray-500' : 'text-gray-300'}`}>
                                            {isPassenger ? <Users size={10}/> : <Car size={10} className="text-offroad-orange"/>}
                                            {p.car_info}
                                        </div>
                                    )}
                                  </div>
                              </div>

                              {/* Порядковый номер */}
                              <div className="text-gray-700 font-display text-xl font-bold opacity-50">
                                  #{index + 1}
                              </div>
                          </div>
                        );
                    })}
                </>
            )}
        </div>
      )}
    </div>
  );
}