import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

interface EventData {
  id?: number;
  title: string;
  date: string;
  location: string;
  price: number;
  description: string;
  image_url?: string | null;
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
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const dataToSave = { ...formData, price: Number(formData.price) };

    try {
      let result;
      if (event?.id) {
        // Редактируем старый
        result = await supabase.from('events').update(dataToSave).eq('id', event.id);
      } else {
        // Создаем новый
        result = await supabase.from('events').insert([dataToSave]);
      }

      if (result.error) throw result.error;
      
      toast.success(event?.id ? 'Выезд обновлен!' : 'Выезд создан!');
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
          
          {/* Ссылка на картинку */}
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Ссылка на фото (URL)</label>
            <input 
              type="text" 
              name="image_url" 
              value={formData.image_url || ''} 
              onChange={handleChange} 
              placeholder="https://..."
              className="bg-black/50 border border-gray-700 rounded-xl px-3 py-3 w-full outline-none placeholder:text-gray-600 text-white"
            />
            {/* Превьюшка */}
            {formData.image_url && (
              <div className="mt-2 h-32 rounded-xl overflow-hidden border border-gray-700 relative">
                <img 
                    src={formData.image_url} 
                    className="w-full h-full object-cover" 
                    onError={(e) => e.currentTarget.style.display = 'none'} 
                />
              </div>
            )}
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Название</label>
            <input type="text" name="title" value={formData.title} onChange={handleChange} required className="bg-black/50 border border-gray-700 rounded-xl px-3 py-3 w-full outline-none text-white"/>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Дата</label>
              <input type="date" name="date" value={formData.date} onChange={handleChange} required className="bg-black/50 border border-gray-700 rounded-xl px-3 py-3 w-full outline-none text-white"/>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Цена (₽)</label>
              <input type="number" name="price" value={formData.price} onChange={handleChange} required className="bg-black/50 border border-gray-700 rounded-xl px-3 py-3 w-full outline-none text-white"/>
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Место</label>
            <input type="text" name="location" value={formData.location} onChange={handleChange} required className="bg-black/50 border border-gray-700 rounded-xl px-3 py-3 w-full outline-none text-white"/>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Описание</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="bg-black/50 border border-gray-700 rounded-xl px-3 py-3 w-full outline-none text-white resize-none"/>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-offroad-orange text-white font-bold py-3 rounded-xl mt-4 flex justify-center items-center gap-2">
            {loading ? <Loader2 className="animate-spin"/> : 'Сохранить'}
          </button>
        </form>
      </div>
    </div>
  );
}