import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Loader2, Trash2, Plus, Edit, LogOut, PlayCircle, BookOpen, Calendar as CalIcon, Phone, Users, Baby, Settings, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminForm from '../components/AdminForm';
import { toast } from 'sonner';

// --- ТИПЫ ---
interface Event { id: number; title: string; date: string; location: string; price: number; description: string; image_url?: string | null; }
interface Registration { id: number; event_id: number; user_id: string; first_name: string | null; username: string | null; guests_count: number; has_children: boolean; phone: string | null; created_at: string; }
interface Story { id: number; title: string; link: string; image_url?: string; }
interface WikiArticle { id: number; title: string; content: string; image_url?: string; telegram_link?: string; }

export default function Admin() {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null); // Сессия админа
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<'events' | 'stories' | 'wiki' | 'settings'>('events');

  // Данные
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [wiki, setWiki] = useState<WikiArticle[]>([]);
  const [bannerUrl, setBannerUrl] = useState('');
  
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [, setLoading] = useState(false); 
  const [loadingRegs, setLoadingRegs] = useState(false);

  // Формы
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | undefined>(undefined);
  
  const [storyForm, setStoryForm] = useState({ title: '', link: '', image_url: '' });
  const [editingStoryId, setEditingStoryId] = useState<number | null>(null);

  const [wikiForm, setWikiForm] = useState({ title: '', content: '', image_url: '', telegram_link: '' });
  const [editingWikiId, setEditingWikiId] = useState<number | null>(null);

  // 1. Проверяем, залогинен ли уже
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadAllData();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) loadAllData();
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([fetchEvents(), fetchStories(), fetchWiki(), fetchSettings()]);
    setLoading(false);
  };

  // 2. Логин через Supabase
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) toast.error('Ошибка входа: ' + error.message);
    else toast.success('Добро пожаловать, Босс');
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  // --- FETCHERS ---
  async function fetchEvents() {
    const { data } = await supabase.from('events').select('*').order('date', { ascending: true });
    setEvents(data || []);
  }
  async function fetchStories() {
    const { data } = await supabase.from('stories').select('*').order('created_at', { ascending: false });
    setStories(data || []);
  }
  async function fetchWiki() {
    const { data } = await supabase.from('wiki').select('*').order('created_at', { ascending: false });
    setWiki(data || []);
  }
  async function fetchRegistrations(eventId: number) {
    setLoadingRegs(true);
    const { data } = await supabase.from('registrations').select('*').eq('event_id', eventId).order('created_at');
    setRegistrations(data || []);
    setLoadingRegs(false);
  }
  async function fetchSettings() {
    const { data } = await supabase.from('app_settings').select('value').eq('key', 'home_banner').single();
    if (data) setBannerUrl(data.value);
  }

  // --- DELETERS ---
  const deleteItem = async (table: string, id: number, callback: () => void) => {
    if (!confirm('Удалить?')) return;
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (!error) { toast.success('Удалено'); callback(); } else toast.error('Ошибка доступа');
  };

  // --- HANDLERS ---
  const handleStorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = editingStoryId 
      ? await supabase.from('stories').update(storyForm).eq('id', editingStoryId)
      : await supabase.from('stories').insert([storyForm]);
    
    if (!error) { toast.success('Сохранено'); setStoryForm({title:'',link:'',image_url:''}); setEditingStoryId(null); fetchStories(); }
    else toast.error('Ошибка');
  };

  const handleWikiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = editingWikiId
      ? await supabase.from('wiki').update(wikiForm).eq('id', editingWikiId)
      : await supabase.from('wiki').insert([wikiForm]);

    if (!error) { toast.success('Статья сохранена'); setWikiForm({title:'',content:'',image_url:'',telegram_link:''}); setEditingWikiId(null); fetchWiki(); }
    else toast.error('Ошибка');
  };

  const handleSettingsSave = async () => {
      const { error } = await supabase.from('app_settings').upsert({ key: 'home_banner', value: bannerUrl });
      if (!error) toast.success('Баннер обновлен!');
      else toast.error('Ошибка');
  };

  // --- ЭКРАН ВХОДА ---
  if (!session) return (
    <div className="min-h-screen bg-offroad-black flex items-center justify-center p-4">
      <form onSubmit={handleLogin} className="bg-offroad-dark border border-gray-800 p-8 rounded-2xl w-full max-w-sm shadow-2xl">
        <h2 className="text-xl font-bold text-white text-center mb-6">ВХОД ДЛЯ ОРГОВ</h2>
        <div className="space-y-4">
            <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="Email" 
                className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-offroad-orange"
            />
            <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Пароль" 
                className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-offroad-orange"
            />
            <button disabled={authLoading} className="w-full bg-offroad-orange hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors flex justify-center">
                {authLoading ? <Loader2 className="animate-spin"/> : 'Войти'}
            </button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen bg-offroad-black text-white p-4 pb-24 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6 sticky top-0 bg-offroad-black/90 z-40 py-2 backdrop-blur">
        <h1 className="text-2xl font-black text-offroad-orange">АДМИНКА</h1>
        <button onClick={handleLogout}><LogOut size={20} className="text-gray-500 hover:text-white"/></button>
      </div>

      {/* ТАБЫ */}
      <div className="flex gap-2 mb-6 bg-gray-900 p-1 rounded-xl overflow-x-auto">
        <button onClick={() => setActiveTab('events')} className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'events' ? 'bg-gray-700 text-white' : 'text-gray-500'}`}><CalIcon size={16}/> Выезды</button>
        <button onClick={() => setActiveTab('wiki')} className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'wiki' ? 'bg-gray-700 text-white' : 'text-gray-500'}`}><BookOpen size={16}/> Wiki</button>
        <button onClick={() => setActiveTab('stories')} className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'stories' ? 'bg-gray-700 text-white' : 'text-gray-500'}`}><PlayCircle size={16}/> News</button>
        <button onClick={() => setActiveTab('settings')} className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'settings' ? 'bg-gray-700 text-white' : 'text-gray-500'}`}><Settings size={16}/> Настройки</button>
      </div>

      {/* --- ВКЛАДКА: ВЫЕЗДЫ --- */}
      {activeTab === 'events' && (
        <>
          <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
             <button onClick={() => { setEditingEvent(undefined); setIsEventFormOpen(true); }} className="flex-shrink-0 bg-offroad-orange px-4 py-3 rounded-xl font-bold flex items-center gap-1 text-white shadow-lg shadow-orange-900/20"><Plus size={18}/> New</button>
             {events.map(ev => (
               <div key={ev.id} onClick={() => {setSelectedEventId(ev.id); fetchRegistrations(ev.id)}} className={`flex-shrink-0 relative px-4 py-3 rounded-xl border cursor-pointer min-w-[150px] group ${selectedEventId === ev.id ? 'bg-offroad-orange/10 border-offroad-orange' : 'bg-offroad-dark border-gray-700'}`}>
                 <div className="font-bold text-sm pr-12">{ev.title}</div>
                 <div className="text-[10px] opacity-60 mt-1">{new Date(ev.date).toLocaleDateString()}</div>
                 <div className="absolute top-2 right-2 flex gap-1">
                    <button onClick={(e) => { e.stopPropagation(); setEditingEvent(ev); setIsEventFormOpen(true); }} className="p-1.5 bg-gray-800 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"><Edit size={14}/></button>
                    <button onClick={(e) => { e.stopPropagation(); deleteItem('events', ev.id, fetchEvents); }} className="p-1.5 bg-gray-800 rounded-md text-gray-400 hover:text-red-400 hover:bg-gray-700 transition-colors"><Trash2 size={14}/></button>
                 </div>
               </div>
             ))}
          </div>
          <div className="bg-offroad-dark border border-gray-800 rounded-xl p-4 min-h-[30vh]">
            <h2 className="font-bold mb-4">Участники {selectedEventId && `(${registrations.length})`}</h2>
            {loadingRegs ? <Loader2 className="animate-spin mx-auto"/> : (
                <div className="space-y-2">
                    {registrations.map(reg => (
                        <div key={reg.id} className="bg-black/40 p-3 rounded-lg flex justify-between items-center">
                            <div>
                                <div className="font-bold text-sm text-white">{reg.first_name} <span className="text-gray-500 font-normal">@{reg.username}</span></div>
                                <div className="text-xs text-gray-400 mt-1 flex items-center gap-3">
                                    <span className="flex items-center gap-1"><Phone size={10}/> {reg.phone}</span>
                                    {reg.guests_count > 0 && <span className="flex items-center gap-1 text-yellow-500"><Users size={10}/> +{reg.guests_count}</span>}
                                    {reg.has_children && <span className="flex items-center gap-1 text-pink-400"><Baby size={10}/> Дети</span>}
                                </div>
                            </div>
                            <button onClick={() => deleteItem('registrations', reg.id, () => fetchRegistrations(reg.event_id))} className="text-gray-600 hover:text-red-500 p-2"><Trash2 size={16}/></button>
                        </div>
                    ))}
                    {!selectedEventId && <p className="text-gray-500 text-sm">👈 Выбери выезд сверху</p>}
                </div>
            )}
          </div>
        </>
      )}

      {/* --- ВКЛАДКА: WIKI --- */}
      {activeTab === 'wiki' && (
        <div className="space-y-6">
            <div className="bg-offroad-dark border border-gray-800 rounded-xl p-4">
                <h3 className="font-bold mb-4 text-offroad-orange">{editingWikiId ? 'Редактировать статью' : 'Новая статья'}</h3>
                <form onSubmit={handleWikiSubmit} className="space-y-3">
                    <input value={wikiForm.title} onChange={e => setWikiForm({...wikiForm, title: e.target.value})} placeholder="Заголовок" className="w-full bg-black/50 border border-gray-700 rounded-lg p-2 text-white outline-none focus:border-offroad-orange" required/>
                    <input value={wikiForm.image_url} onChange={e => setWikiForm({...wikiForm, image_url: e.target.value})} placeholder="Картинка (URL)" className="w-full bg-black/50 border border-gray-700 rounded-lg p-2 text-white outline-none focus:border-offroad-orange"/>
                    <textarea value={wikiForm.content} onChange={e => setWikiForm({...wikiForm, content: e.target.value})} placeholder="Текст статьи" rows={5} className="w-full bg-black/50 border border-gray-700 rounded-lg p-2 text-white outline-none focus:border-offroad-orange" required/>
                    <input value={wikiForm.telegram_link} onChange={e => setWikiForm({...wikiForm, telegram_link: e.target.value})} placeholder="Ссылка на ТГ пост" className="w-full bg-black/50 border border-gray-700 rounded-lg p-2 text-white outline-none focus:border-offroad-orange"/>
                    <div className="flex gap-2">
                        {editingWikiId && <button type="button" onClick={() => {setEditingWikiId(null); setWikiForm({title:'',content:'',image_url:'',telegram_link:''})}} className="flex-1 bg-gray-600 rounded-lg py-2">Отмена</button>}
                        <button className="flex-1 bg-offroad-orange font-bold rounded-lg py-2">Сохранить</button>
                    </div>
                </form>
            </div>
            <div className="space-y-2">
                {wiki.map(art => (
                    <div key={art.id} className="bg-offroad-dark border border-gray-800 p-3 rounded-lg flex justify-between items-center">
                        <div className="truncate pr-4 font-bold">{art.title}</div>
                        <div className="flex gap-2">
                            <button onClick={() => {setEditingWikiId(art.id); setWikiForm({title: art.title, content: art.content, image_url: art.image_url || '', telegram_link: art.telegram_link || ''}); window.scrollTo(0,0);}} className="p-2 bg-gray-800 rounded hover:bg-gray-700"><Edit size={16}/></button>
                            <button onClick={() => deleteItem('wiki', art.id, fetchWiki)} className="p-2 bg-gray-800 rounded hover:bg-gray-700 text-red-400"><Trash2 size={16}/></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* --- ВКЛАДКА: НОВОСТИ --- */}
      {activeTab === 'stories' && (
        <div className="space-y-6">
            <div className="bg-offroad-dark border border-gray-800 rounded-xl p-4">
                <form onSubmit={handleStorySubmit} className="space-y-3">
                    <input value={storyForm.title} onChange={e => setStoryForm({...storyForm, title: e.target.value})} placeholder="Заголовок" className="w-full bg-black/50 border border-gray-700 rounded-lg p-2 text-white outline-none focus:border-offroad-orange" required/>
                    <div className="flex gap-2">
                        <input value={storyForm.link} onChange={e => setStoryForm({...storyForm, link: e.target.value})} placeholder="Ссылка" className="w-1/2 bg-black/50 border border-gray-700 rounded-lg p-2 text-white outline-none focus:border-offroad-orange" required/>
                        <input value={storyForm.image_url} onChange={e => setStoryForm({...storyForm, image_url: e.target.value})} placeholder="Фото URL" className="w-1/2 bg-black/50 border border-gray-700 rounded-lg p-2 text-white outline-none focus:border-offroad-orange" required/>
                    </div>
                    <div className="flex gap-2">
                        {editingStoryId && <button type="button" onClick={() => {setEditingStoryId(null); setStoryForm({title:'',link:'',image_url:''})}} className="flex-1 bg-gray-600 rounded-lg py-2">Отмена</button>}
                        <button className="flex-1 bg-offroad-orange font-bold rounded-lg py-2">Сохранить</button>
                    </div>
                </form>
            </div>
            <div className="space-y-2">
                {stories.map(s => (
                    <div key={s.id} className="flex justify-between items-center bg-black/40 p-2 rounded-lg border border-gray-800">
                        <div className="flex items-center gap-2"><img src={s.image_url} className="w-8 h-8 rounded bg-gray-700" onError={(e) => e.currentTarget.style.display='none'}/> <span className="text-xs truncate max-w-[150px]">{s.title}</span></div>
                        <div className="flex gap-2">
                            <button onClick={() => {setEditingStoryId(s.id); setStoryForm({title:s.title, link:s.link, image_url:s.image_url||''})}} className="p-2 bg-gray-800 rounded hover:bg-gray-700"><Edit size={14}/></button>
                            <button onClick={() => deleteItem('stories', s.id, fetchStories)} className="p-2 bg-gray-800 rounded hover:bg-gray-700 text-red-400"><Trash2 size={14}/></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* --- ВКЛАДКА: НАСТРОЙКИ --- */}
      {activeTab === 'settings' && (
        <div className="bg-offroad-dark border border-gray-800 rounded-xl p-6">
            <h3 className="font-bold mb-4 text-offroad-orange flex items-center gap-2"><Settings size={20}/> Глобальные настройки</h3>
            <div className="space-y-4">
                <div>
                    <label className="text-sm text-gray-400 mb-1 block">Главный баннер (Картинка)</label>
                    <input value={bannerUrl} onChange={e => setBannerUrl(e.target.value)} className="w-full bg-black/50 border border-gray-700 rounded-lg p-2 text-white outline-none focus:border-offroad-orange" placeholder="https://..."/>
                    {bannerUrl && <img src={bannerUrl} className="mt-2 w-full h-32 object-cover rounded-lg border border-gray-700"/>}
                </div>
                <button onClick={handleSettingsSave} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
                    <Save size={18}/> Сохранить настройки
                </button>
            </div>
        </div>
      )}

      {isEventFormOpen && <AdminForm event={editingEvent} onClose={() => setIsEventFormOpen(false)} onSave={() => {fetchEvents(); setIsEventFormOpen(false);}} />}
    </div>
  );
}