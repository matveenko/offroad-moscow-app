import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Loader2, X, Link as LinkIcon, Archive, AlertTriangle, Baby } from 'lucide-react';
import { toast } from 'sonner';

interface EventData {
  id?: number;
  title: string;
  date: string;
  location: string;
  price: number;
  description: string;
  image_url?: string | null;
  report_link?: string | null;
  is_archived?: boolean;
  warning_text?: string | null;
  children_allowed?: boolean; // <-- НОВОЕ ПОЛЕ
}

interface AdminFormProps {
  event?: EventData;
  onClose: () => void;
  onSave: () => void;
}

export default function AdminForm({ event, onClose, onSave }: AdminFormProps) {
  const [formData, setFormData] = useState<EventData>({
    title: event?.title || '',
    date: event?.date ? event.date.split('T')[0] : '',
    location: event?.location || '',
    price: event?.price || 0,
    description: event?.description || '',
    image_url: event?.image_url || '',
    report_link: event?.report_link || '',
    is_archived: event?.is_archived || false,
    warning_text: event?.warning_text || '',
    children_allowed: event?.children_allowed ?? true, // <-- По дефолту можно
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const dataToSave = { 
        ...formData, 
        price: Number(formData.price),
        report_link: formData.report_link || null,
        warning_text: formData.warning_text || null,
        children_allowed: formData.children_allowed
    };

    try {
      let result;
      if (event?.id) {
        result = await supabase.from('events').update(dataToSave).eq('id', event.id);
      } else {
        result = await supabase.from('events').insert([dataToSave]);
      }

      if (result.error) throw result.error;
      
      toast.success(event?.id ? 'Сохранено!' : 'Создано!');
      onSave();
      onClose();
    } catch (error: any) {
      toast.error(`Ошибка: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-offroad-dark w-full max-w-md rounded-2xl border border-gray-700 p-6 animate-in slide-in-from-bottom-10 fade-in duration-300 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">{event?.id ? 'Редактировать' : 'Новый выезд'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24}/></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* НАСТРОЙКИ (АРХИВ + ДЕТИ) */}
          <div className="grid grid-cols-2 gap-3">
             {/* АРХИВ */}
            <div 
                onClick={() => setFormData(prev => ({ ...prev, is_archived: !prev.is_archived }))}
                className={`cursor-pointer p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-2 transition-colors ${formData.is_archived ? 'bg-offroad-orange/20 border-offroad-orange' : 'bg-black/30 border-gray-700'}`}
            >
                <Archive size={20} className={formData.is_archived ? 'text-offroad-orange' : 'text-gray-500'}/>
                <span className={`text-xs font-bold ${formData.is_archived ? 'text-offroad-orange' : 'text-gray-400'}`}>
                    {formData.is_archived ? 'В АРХИВЕ' : 'АКТИВЕН'}
                </span>
            </div>

            {/* ДЕТИ */}
            <div 
                onClick={() => setFormData(prev => ({ ...prev, children_allowed: !prev.children_allowed }))}
                className={`cursor-pointer p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-2 transition-colors ${formData.children_allowed ? 'bg-green-900/20 border-green-600' : 'bg-red-900/20 border-red-600'}`}
            >
                <Baby size={20} className={formData.children_allowed ? 'text-green-500' : 'text-red-500'}/>
                <span className={`text-xs font-bold ${formData.children_allowed ? 'text-green-500' : 'text-red-500'}`}>
                    {formData.children_allowed ? 'ДЕТИ: ДА' : 'ДЕТИ: НЕТ'}
                </span>
            </div>
          </div>

          {/* Основные поля */}
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Название</label>
            <input type="text" name="title" value={formData.title} onChange={handleChange} required className="bg-black/50 border border-gray-700 rounded-xl px-3 py-3 w-full outline-none text-white focus:border-offroad-orange"/>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Картинка (URL)</label>
            <input type="text" name="image_url" value={formData.image_url || ''} onChange={handleChange} placeholder="https://..." className="bg-black/50 border border-gray-700 rounded-xl px-3 py-3 w-full outline-none text-white focus:border-offroad-orange"/>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Дата</label>
              <input type="date" name="date" value={formData.date} onChange={handleChange} required className="bg-black/50 border border-gray-700 rounded-xl px-3 py-3 w-full outline-none text-white focus:border-offroad-orange"/>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Цена (₽)</label>
              <input type="number" name="price" value={formData.price} onChange={handleChange} required className="bg-black/50 border border-gray-700 rounded-xl px-3 py-3 w-full outline-none text-white focus:border-offroad-orange"/>
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Место</label>
            <input type="text" name="location" value={formData.location} onChange={handleChange} required className="bg-black/50 border border-gray-700 rounded-xl px-3 py-3 w-full outline-none text-white focus:border-offroad-orange"/>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Описание</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows={4} className="bg-black/50 border border-gray-700 rounded-xl px-3 py-3 w-full outline-none text-white resize-none focus:border-offroad-orange"/>
          </div>

          {/* ПРЕДУПРЕЖДЕНИЕ */}
          <div>
            <label className="text-sm text-red-400 mb-1 flex items-center gap-2 font-bold"><AlertTriangle size={14}/> Текст предупреждения</label>
            <textarea 
                name="warning_text" 
                value={formData.warning_text || ''} 
                onChange={handleChange} 
                rows={2} 
                placeholder="Если пусто — будет стандартный текст."
                className="bg-black/50 border border-red-900/50 rounded-xl px-3 py-3 w-full outline-none text-white resize-none focus:border-red-500"
            />
          </div>

          {/* ССЫЛКА НА ОТЧЕТ */}
          <div className="pt-2 border-t border-gray-700">
            <label className="text-sm text-offroad-orange mb-1 flex items-center gap-2 font-bold"><LinkIcon size={14}/> Ссылка на отчет</label>
            <input type="text" name="report_link" value={formData.report_link || ''} onChange={handleChange} placeholder="https://t.me/channel/123" className="bg-black/50 border border-gray-700 rounded-xl px-3 py-3 w-full outline-none text-white focus:border-offroad-orange"/>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-offroad-orange text-white font-bold py-3 rounded-xl mt-4 flex justify-center items-center gap-2">
            {loading ? <Loader2 className="animate-spin"/> : 'Сохранить'}
          </button>
        </form>
      </div>
    </div>
  );
}