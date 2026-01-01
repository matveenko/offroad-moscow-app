import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Loader2, X, Link as LinkIcon, Archive, AlertTriangle } from 'lucide-react';
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
  warning_text?: string | null; // <-- НОВОЕ ПОЛЕ
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
    warning_text: event?.warning_text || '', // <-- Инициализация
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
        warning_text: formData.warning_text || null
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
          
          {/* АРХИВ */}
          <div 
            onClick={() => setFormData(prev => ({ ...prev, is_archived: !prev.is_archived }))}
            className={`cursor-pointer p-4 rounded-xl border flex items-center justify-between transition-colors ${formData.is_archived ? 'bg-offroad-orange/20 border-offroad-orange' : 'bg-black/30 border-gray-700'}`}
          >
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${formData.is_archived ? 'bg-offroad-orange text-white' : 'bg-gray-800 text-gray-500'}`}>
                    <Archive size={20}/>
                </div>
                <div>
                    <div className={`font-bold ${formData.is_archived ? 'text-offroad-orange' : 'text-gray-300'}`}>
                        {formData.is_archived ? 'В АРХИВЕ' : 'АКТИВНЫЙ ВЫЕЗД'}
                    </div>
                    <div className="text-xs text-gray-500">
                        {formData.is_archived ? 'Скрыт в "Прошедшие"' : 'Виден в календаре'}
                    </div>
                </div>
            </div>
            <div className={`w-6 h-6 rounded border flex items-center justify-center ${formData.is_archived ? 'bg-offroad-orange border-offroad-orange' : 'border-gray-600'}`}>
                {formData.is_archived && <X size={16} className="text-white rotate-45"/>}
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

          {/* ПРЕДУПРЕЖДЕНИЕ (НОВОЕ) */}
          <div>
            <label className="text-sm text-red-400 mb-1 flex items-center gap-2 font-bold"><AlertTriangle size={14}/> Текст предупреждения (красная плашка)</label>
            <textarea 
                name="warning_text" 
                value={formData.warning_text || ''} 
                onChange={handleChange} 
                rows={2} 
                placeholder="Если пусто — будет стандартный текст про грязь и ошибки."
                className="bg-black/50 border border-red-900/50 rounded-xl px-3 py-3 w-full outline-none text-white resize-none focus:border-red-500"
            />
          </div>

          {/* ССЫЛКА НА ОТЧЕТ */}
          <div className="pt-2 border-t border-gray-700">
            <label className="text-sm text-offroad-orange mb-1 flex items-center gap-2 font-bold"><LinkIcon size={14}/> Ссылка на отчет (Telegram)</label>
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