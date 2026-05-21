import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, Calendar, Star, MessageSquare, UtensilsCrossed,
  LogOut, Plus, Trash2, Edit3, Save, X, Download, Eye,
  Users, TrendingUp, Package, ChevronRight, Check, Ticket, Power, CalendarIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { getAdminToken } from '../lib/api';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

function PromoDatePicker({ value, onChange, placeholder, disabled }) {
  const date = value ? new Date(value) : null;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="w-full h-[42px] bg-black/50 border border-white/10 rounded-xl px-3 text-left text-sm text-white hover:bg-black/70 transition-colors flex items-center justify-between gap-2">
          <span className={date ? '' : 'text-gray-500'}>
            {date ? format(date, 'd MMMM yyyy', { locale: ru }) : placeholder}
          </span>
          <div className="flex items-center gap-1.5">
            {date && (
              <span onClick={(e) => { e.stopPropagation(); onChange(''); }} className="text-gray-500 hover:text-white p-0.5 rounded transition-colors cursor-pointer">
                <X size={14} />
              </span>
            )}
            <CalendarIcon size={16} className="text-amber-500/80" />
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 border-white/10 bg-black shadow-2xl rounded-2xl z-[200]" align="start" sideOffset={8}>
        <CalendarPicker
          mode="single"
          selected={date ?? undefined}
          onSelect={(d) => onChange(d ? d.toISOString() : '')}
          locale={ru}
          disabled={disabled}
          className="p-4 bg-black text-white"
          classNames={{
            day: cn('text-amber-500/80 hover:bg-amber-500 hover:text-black transition-all rounded-xl w-10 h-10 flex items-center justify-center text-sm font-medium'),
            day_selected: 'bg-amber-500 text-black font-black shadow-[0_0_20px_rgba(245,158,11,0.5)] !opacity-100',
            day_today: 'text-white border border-amber-500/50',
            day_disabled: 'text-gray-700 opacity-40',
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

const adminFetch = (url, options = {}) =>
  fetch(url, { ...options, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getAdminToken()}`, ...(options.headers || {}) } });

const statusLabels = {
  pending: 'Ожидает', confirmed: 'Подтверждён', cancelled: 'Отменён',
  new: 'Новый', preparing: 'Готовится', delivering: 'Доставляется', completed: 'Выполнен',
};

const tabs = [
  { id: 'dashboard', label: 'Дашборд', icon: TrendingUp },
  { id: 'menu', label: 'Меню', icon: UtensilsCrossed },
  { id: 'orders', label: 'Заказы', icon: ShoppingBag },
  { id: 'reservations', label: 'Брони', icon: Calendar },
  { id: 'reviews', label: 'Отзывы', icon: Star },
  { id: 'messages', label: 'Сообщения', icon: MessageSquare },
  { id: 'promos', label: 'Промокоды', icon: Ticket },
];

const emptyPromo = { code: '', discount: 10, description: '', is_active: true, valid_from: '', valid_until: '', usage_limit: '' };

export function AdminPage({ onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [menu, setMenu] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [messages, setMessages] = useState([]);
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingDish, setEditingDish] = useState(null);
  const [showAddDish, setShowAddDish] = useState(false);
  const [newDish, setNewDish] = useState({ name: '', price: '', category: '', image_url: '', rating: '4.5', prep_time: '20', description: '', tag: '' });
  const [showAddPromo, setShowAddPromo] = useState(false);
  const [newPromo, setNewPromo] = useState(emptyPromo);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [m, o, r, rv, ms, pr] = await Promise.all([
        adminFetch('/api/admin/menu').then(r => r.json()),
        adminFetch('/api/admin/orders').then(r => r.json()),
        adminFetch('/api/admin/reservations').then(r => r.json()),
        adminFetch('/api/admin/reviews').then(r => r.json()),
        adminFetch('/api/admin/messages').then(r => r.json()),
        adminFetch('/api/admin/promos').then(r => r.json()),
      ]);
      setMenu(Array.isArray(m) ? m : []);
      setOrders(Array.isArray(o) ? o : []);
      setReservations(Array.isArray(r) ? r : []);
      setReviews(Array.isArray(rv) ? rv : []);
      setMessages(Array.isArray(ms) ? ms : []);
      setPromos(Array.isArray(pr) ? pr : []);
    } catch (e) {
      toast.error('Ошибка загрузки данных');
    }
    setLoading(false);
  };

  const handleAddDish = async () => {
    if (!newDish.name || !newDish.price || !newDish.category) return toast.error('Заполните обязательные поля');
    try {
      const res = await adminFetch('/api/admin/menu', {
        method: 'POST',
        body: JSON.stringify({ ...newDish, price: Number(newDish.price), rating: Number(newDish.rating), prep_time: Number(newDish.prep_time) }),
      });
      const created = await res.json();
      setMenu(prev => [...prev, created]);
      setNewDish({ name: '', price: '', category: '', image_url: '', rating: '4.5', prep_time: '20', description: '', tag: '' });
      setShowAddDish(false);
      toast.success('Блюдо добавлено');
    } catch { toast.error('Ошибка добавления'); }
  };

  const handleUpdateDish = async () => {
    try {
      const res = await adminFetch(`/api/admin/menu/${editingDish.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ ...editingDish, price: Number(editingDish.price), rating: Number(editingDish.rating), prep_time: Number(editingDish.prep_time) }),
      });
      const updated = await res.json();
      setMenu(prev => prev.map(d => d.id === updated.id ? updated : d));
      setEditingDish(null);
      toast.success('Блюдо обновлено');
    } catch { toast.error('Ошибка обновления'); }
  };

  const handleDeleteDish = async (id) => {
    if (!confirm('Удалить блюдо?')) return;
    try {
      await adminFetch(`/api/admin/menu/${id}`, { method: 'DELETE' });
      setMenu(prev => prev.filter(d => d.id !== id));
      toast.success('Блюдо удалено');
    } catch { toast.error('Ошибка удаления'); }
  };

  const handleOrderStatus = async (id, status) => {
    try {
      await adminFetch(`/api/admin/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
      toast.success('Статус обновлён');
    } catch { toast.error('Ошибка'); }
  };

  const handleReservationStatus = async (id, status) => {
    try {
      await adminFetch(`/api/admin/reservations/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
      setReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r));
      toast.success('Статус обновлён');
    } catch { toast.error('Ошибка'); }
  };

  const handleDeleteReview = async (id) => {
    if (!confirm('Удалить отзыв?')) return;
    try {
      await adminFetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
      setReviews(prev => prev.filter(r => r.id !== id));
      toast.success('Отзыв удалён');
    } catch { toast.error('Ошибка'); }
  };

  const promoPayload = (p) => ({
    code: p.code?.trim().toUpperCase(),
    discount: Number(p.discount),
    description: p.description || null,
    is_active: !!p.is_active,
    valid_from: p.valid_from || null,
    valid_until: p.valid_until || null,
    usage_limit: p.usage_limit === '' || p.usage_limit == null ? null : Number(p.usage_limit),
  });

  const handleAddPromo = async () => {
    const payload = promoPayload(newPromo);
    if (!payload.code) return toast.error('Введите код');
    if (!payload.discount || payload.discount < 1 || payload.discount > 100) return toast.error('Скидка от 1 до 100');
    try {
      const res = await adminFetch('/api/admin/promos', { method: 'POST', body: JSON.stringify(payload) });
      const created = await res.json();
      if (!res.ok) throw new Error(created.message || created.detail);
      setPromos(prev => [created, ...prev]);
      setNewPromo(emptyPromo);
      setShowAddPromo(false);
      toast.success('Промокод создан');
    } catch (e) { toast.error(e.message || 'Ошибка создания'); }
  };

  const handleTogglePromo = async (promo) => {
    try {
      const res = await adminFetch(`/api/admin/promos/${promo.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !promo.isActive }),
      });
      const updated = await res.json();
      setPromos(prev => prev.map(p => p.id === updated.id ? updated : p));
    } catch { toast.error('Ошибка'); }
  };

  const handleDeletePromo = async (id) => {
    if (!confirm('Удалить промокод?')) return;
    try {
      await adminFetch(`/api/admin/promos/${id}`, { method: 'DELETE' });
      setPromos(prev => prev.filter(p => p.id !== id));
      toast.success('Промокод удалён');
    } catch { toast.error('Ошибка удаления'); }
  };

  const handleExportCsv = async () => {
    try {
      const res = await adminFetch('/api/admin/menu/export-csv');
      const text = await res.text();
      const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'menu.csv'; a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV скачан');
    } catch { toast.error('Ошибка экспорта'); }
  };

  const DishForm = ({ dish, setDish, onSave, onCancel, title }) => (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glassmorphism-dark rounded-2xl p-6 border border-amber-500/30 mb-6">
      <h3 className="text-lg font-bold text-amber-400 mb-4">{title}</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { key: 'name', label: 'Название *', type: 'text' },
          { key: 'price', label: 'Цена ₽ *', type: 'number' },
          { key: 'category', label: 'Категория *', type: 'text' },
          { key: 'image_url', label: 'URL изображения', type: 'text' },
          { key: 'rating', label: 'Рейтинг', type: 'number' },
          { key: 'prep_time', label: 'Время (мин)', type: 'number' },
          { key: 'tag', label: 'Тег (хит/новинка)', type: 'text' },
        ].map(f => (
          <div key={f.key}>
            <label className="text-xs text-gray-500 uppercase tracking-widest mb-1 block">{f.label}</label>
            <input
              type={f.type} value={dish[f.key] || ''}
              onChange={e => setDish(d => ({ ...d, [f.key]: e.target.value }))}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:border-amber-500/50 outline-none"
            />
          </div>
        ))}
        <div className="col-span-2 md:col-span-3">
          <label className="text-xs text-gray-500 uppercase tracking-widest mb-1 block">Описание</label>
          <textarea
            value={dish.description || ''} rows={2}
            onChange={e => setDish(d => ({ ...d, description: e.target.value }))}
            className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:border-amber-500/50 outline-none resize-none"
          />
        </div>
      </div>
      <div className="flex gap-3 mt-4">
        <button onClick={onSave} className="flex items-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-xl font-bold text-sm transition-colors"><Save size={16} /> Сохранить</button>
        <button onClick={onCancel} className="flex items-center gap-2 px-5 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-sm transition-colors"><X size={16} /> Отмена</button>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">
      {/* Sidebar */}
      <aside className="w-64 bg-black/60 border-r border-white/5 flex flex-col h-screen sticky top-0">
        <div className="p-6 border-b border-white/5">
          <img src="/logo.png" alt="Look" className="w-24 h-24 object-contain mb-2 invert drop-shadow-[0_0_14px_rgba(251,191,36,0.6)]" />
          <p className="text-amber-500 text-xs font-bold tracking-[0.2em] uppercase">Панель управления</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/5">
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors">
            <LogOut size={18} /> Выйти
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, ease: "linear", duration: 1 }} className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>

              {/* DASHBOARD */}
              {activeTab === 'dashboard' && (
                <div>
                  <h1 className="text-3xl font-black mb-8">Дашборд</h1>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                      { label: 'Блюд в меню', value: menu.length, icon: UtensilsCrossed, color: 'text-amber-400' },
                      { label: 'Заказов', value: orders.length, icon: ShoppingBag, color: 'text-blue-400' },
                      { label: 'Бронирований', value: reservations.length, icon: Calendar, color: 'text-green-400' },
                      { label: 'Отзывов', value: reviews.length, icon: Star, color: 'text-violet-400' },
                    ].map((s, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glassmorphism-dark rounded-2xl p-6 border border-white/5">
                        <s.icon size={28} className={`${s.color} mb-3`} />
                        <div className="text-3xl font-black text-white">{s.value}</div>
                        <div className="text-gray-500 text-sm mt-1">{s.label}</div>
                      </motion.div>
                    ))}
                  </div>
                  <div className="glassmorphism-dark rounded-2xl p-6 border border-white/5">
                    <h2 className="text-lg font-bold mb-4 text-amber-400">Последние сообщения</h2>
                    {messages.length === 0 ? <p className="text-gray-500">Нет сообщений</p> : (
                      <div className="space-y-3">
                        {messages.slice(0, 3).map(m => (
                          <div key={m.id} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                            <MessageSquare size={16} className="text-amber-400 mt-0.5 shrink-0" />
                            <div><p className="text-white font-medium text-sm">{m.name} <span className="text-gray-500 font-normal">({m.contact})</span></p><p className="text-gray-400 text-sm">{m.message}</p></div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* MENU */}
              {activeTab === 'menu' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-black">Меню <span className="text-gray-600 text-lg font-normal">({menu.length})</span></h1>
                    <div className="flex gap-3">
                      <button onClick={handleExportCsv} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm text-gray-300 transition-colors border border-white/10">
                        <Download size={16} /> Экспорт CSV
                      </button>
                      <button onClick={() => setShowAddDish(true)} className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-xl font-bold text-sm transition-colors">
                        <Plus size={16} /> Добавить блюдо
                      </button>
                    </div>
                  </div>

                  {showAddDish && (
                    <DishForm dish={newDish} setDish={setNewDish} onSave={handleAddDish} onCancel={() => setShowAddDish(false)} title="Новое блюдо" />
                  )}

                  <div className="grid gap-3">
                    {menu.map(dish => (
                      <div key={dish.id}>
                        {editingDish?.id === dish.id ? (
                          <DishForm dish={editingDish} setDish={setEditingDish} onSave={handleUpdateDish} onCancel={() => setEditingDish(null)} title="Редактирование" />
                        ) : (
                          <motion.div layout className="flex items-center gap-4 glassmorphism-dark rounded-2xl p-4 border border-white/5 hover:border-amber-500/20 transition-colors">
                            {dish.image_url ? (
                              <img src={dish.image_url} alt={dish.name} className="w-16 h-16 object-cover rounded-xl shrink-0" onError={e => { e.target.style.display = 'none'; }} />
                            ) : (
                              <div className="w-16 h-16 bg-white/5 rounded-xl flex items-center justify-center shrink-0"><UtensilsCrossed size={24} className="text-gray-600" /></div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-white">{dish.name}</p>
                                {dish.tag && <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs">{dish.tag}</span>}
                              </div>
                              <p className="text-gray-500 text-sm">{dish.category} · {dish.prep_time} мин · {dish.rating}</p>
                            </div>
                            <p className="text-xl font-black text-amber-400 whitespace-nowrap">{dish.price} ₽</p>
                            <div className="flex gap-2 shrink-0">
                              <button onClick={() => setEditingDish({ ...dish })} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-amber-500/20 hover:text-amber-400 transition-colors"><Edit3 size={16} /></button>
                              <button onClick={() => handleDeleteDish(dish.id)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ORDERS */}
              {activeTab === 'orders' && (
                <div>
                  <h1 className="text-3xl font-black mb-6">Заказы <span className="text-gray-600 text-lg font-normal">({orders.length})</span></h1>
                  <div className="grid gap-4">
                    {orders.length === 0 ? <p className="text-gray-500">Нет заказов</p> : orders.map(order => {
                      const name = order.recipientName ?? order.recipient_name;
                      const total = order.totalAmount ?? order.total_amount;
                      const items = order.items ?? [];
                      return (
                        <div key={order.id} className="glassmorphism-dark rounded-2xl p-5 border border-white/5">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="font-bold text-amber-400">Заказ #{order.id}</p>
                              <p className="text-gray-500 text-sm">{name} · {order.phone}</p>
                              <p className="text-gray-600 text-xs">{order.address}</p>
                              {order.promoCode && <p className="text-green-500/70 text-xs mt-0.5">Промокод: {order.promoCode}</p>}
                            </div>
                            <p className="text-2xl font-black text-white whitespace-nowrap">{total?.toLocaleString()} ₽</p>
                          </div>
                          {items.length > 0 && (
                            <div className="mb-3 flex flex-wrap gap-2">
                              {items.map((item, idx) => (
                                <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300">
                                  <span className="text-amber-400 font-bold">{item.quantity}×</span>
                                  {item.menuItem?.name ?? `Блюдо #${item.menuItemId}`}
                                  <span className="text-gray-500">· {(item.price * item.quantity).toLocaleString()} ₽</span>
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-xs text-gray-500">Статус:</span>
                            {['new', 'preparing', 'delivering', 'completed', 'cancelled'].map(s => (
                              <button key={s} onClick={() => handleOrderStatus(order.id, s)}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${order.status === s ? 'bg-amber-500 text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
                                {statusLabels[s]}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* RESERVATIONS */}
              {activeTab === 'reservations' && (
                <div>
                  <h1 className="text-3xl font-black mb-6">Бронирования <span className="text-gray-600 text-lg font-normal">({reservations.length})</span></h1>
                  <div className="grid gap-4">
                    {reservations.length === 0 ? <p className="text-gray-500">Нет бронирований</p> : reservations.map(res => (
                      <div key={res.id} className="glassmorphism-dark rounded-2xl p-5 border border-white/5">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-bold text-amber-400">Бронь #{res.id}</p>
                            <p className="text-white font-medium">{res.name} · {res.phone}</p>
                            <p className="text-gray-500 text-sm">
                              {new Date(res.date).toLocaleDateString('ru-RU')} в {res.time} · {res.guests_count} гостей
                            </p>
                            {res.notes && <p className="text-gray-600 text-xs italic mt-1">«{res.notes}»</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-xs text-gray-500">Статус:</span>
                          {['pending', 'confirmed', 'cancelled'].map(s => (
                            <button key={s} onClick={() => handleReservationStatus(res.id, s)}
                              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${res.status === s ? 'bg-amber-500 text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
                              {statusLabels[s]}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* REVIEWS */}
              {activeTab === 'reviews' && (
                <div>
                  <h1 className="text-3xl font-black mb-6">Отзывы <span className="text-gray-600 text-lg font-normal">({reviews.length})</span></h1>
                  <div className="grid gap-4">
                    {reviews.length === 0 ? <p className="text-gray-500">Нет отзывов</p> : reviews.map(rev => (
                      <div key={rev.id} className="glassmorphism-dark rounded-2xl p-5 border border-white/5 flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-black font-black">{(rev.authorName ?? rev.author_name)?.[0]?.toUpperCase()}</div>
                            <div>
                              <p className="font-bold text-white">{rev.authorName ?? rev.author_name}</p>
                              <div className="flex gap-0.5">{[...Array(5)].map((_, j) => (<Star key={j} size={12} className={j < rev.rating ? "text-amber-500 fill-amber-500" : "text-gray-600"} />))}</div>
                            </div>
                            <span className="ml-auto text-xs text-gray-500">{(() => { const d = new Date(rev.createdAt ?? rev.created_at); return isNaN(d) ? '' : d.toLocaleDateString('ru-RU'); })()}</span>
                          </div>
                          <p className="text-gray-300 text-sm">{rev.text}</p>
                        </div>
                        <button onClick={() => handleDeleteReview(rev.id)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-400 transition-colors shrink-0"><Trash2 size={16} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* MESSAGES */}
              {activeTab === 'messages' && (
                <div>
                  <h1 className="text-3xl font-black mb-6">Сообщения <span className="text-gray-600 text-lg font-normal">({messages.length})</span></h1>
                  <div className="grid gap-4">
                    {messages.length === 0 ? <p className="text-gray-500">Нет сообщений</p> : messages.map(msg => (
                      <div key={msg.id} className="glassmorphism-dark rounded-2xl p-5 border border-white/5">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-black">{msg.name?.[0]?.toUpperCase()}</div>
                          <div>
                            <p className="font-bold text-white">{msg.name}</p>
                            <p className="text-amber-400 text-sm">{msg.contact}</p>
                          </div>
                          <span className="ml-auto text-xs text-gray-500">{new Date(msg.createdAt || msg.created_at).toLocaleDateString('ru-RU')}</span>
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed bg-white/5 rounded-xl p-4">{msg.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PROMOS */}
              {activeTab === 'promos' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-black">Промокоды <span className="text-gray-600 text-lg font-normal">({promos.length})</span></h1>
                    <button onClick={() => setShowAddPromo(v => !v)} className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-xl font-bold text-sm transition-colors">
                      <Plus size={16} /> Новый промокод
                    </button>
                  </div>

                  {showAddPromo && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glassmorphism-dark rounded-2xl p-6 border border-amber-500/30 mb-6">
                      <h3 className="text-lg font-bold text-amber-400 mb-4">Создать промокод</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-xs text-gray-500 uppercase tracking-widest mb-1 block">Код *</label>
                          <input value={newPromo.code} onChange={e => setNewPromo(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="SUMMER25" className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:border-amber-500/50 outline-none uppercase" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 uppercase tracking-widest mb-1 block">Скидка % *</label>
                          <input type="number" min="1" max="100" value={newPromo.discount} onChange={e => setNewPromo(p => ({ ...p, discount: e.target.value }))} className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:border-amber-500/50 outline-none" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 uppercase tracking-widest mb-1 block">Лимит использований</label>
                          <input type="number" min="1" placeholder="без лимита" value={newPromo.usage_limit} onChange={e => setNewPromo(p => ({ ...p, usage_limit: e.target.value }))} className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:border-amber-500/50 outline-none" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 uppercase tracking-widest mb-1 block">Действует с</label>
                          <PromoDatePicker
                            value={newPromo.valid_from}
                            onChange={(v) => {
                              if (!v) return setNewPromo(p => ({ ...p, valid_from: '' }));
                              const d = new Date(v); d.setHours(0, 0, 0, 0);
                              setNewPromo(p => ({ ...p, valid_from: d.toISOString() }));
                            }}
                            placeholder="С сегодняшнего дня"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 uppercase tracking-widest mb-1 block">Действует до</label>
                          <PromoDatePicker
                            value={newPromo.valid_until}
                            onChange={(v) => {
                              if (!v) return setNewPromo(p => ({ ...p, valid_until: '' }));
                              const d = new Date(v); d.setHours(23, 59, 59, 999);
                              setNewPromo(p => ({ ...p, valid_until: d.toISOString() }));
                            }}
                            placeholder="Без срока"
                            disabled={(d) => d < new Date(new Date().setHours(0,0,0,0))}
                          />
                        </div>
                        <div className="flex items-end">
                          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300">
                            <input type="checkbox" checked={newPromo.is_active} onChange={e => setNewPromo(p => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 accent-amber-500" />
                            Активен
                          </label>
                        </div>
                        <div className="col-span-1 md:col-span-3">
                          <label className="text-xs text-gray-500 uppercase tracking-widest mb-1 block">Описание</label>
                          <input value={newPromo.description} onChange={e => setNewPromo(p => ({ ...p, description: e.target.value }))} placeholder="Летняя акция" className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:border-amber-500/50 outline-none" />
                        </div>
                      </div>
                      <div className="flex gap-3 mt-4">
                        <button onClick={handleAddPromo} className="flex items-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-xl font-bold text-sm transition-colors"><Save size={16} /> Создать</button>
                        <button onClick={() => { setShowAddPromo(false); setNewPromo(emptyPromo); }} className="flex items-center gap-2 px-5 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-sm transition-colors"><X size={16} /> Отмена</button>
                      </div>
                    </motion.div>
                  )}

                  <div className="grid gap-3">
                    {promos.length === 0 ? <p className="text-gray-500">Пока нет промокодов</p> : promos.map(promo => {
                      const validFrom = promo.validFrom ? new Date(promo.validFrom) : null;
                      const validUntil = promo.validUntil ? new Date(promo.validUntil) : null;
                      const now = new Date();
                      const expired = validUntil && now > validUntil;
                      const notYet = validFrom && now < validFrom;
                      const statusBadge = !promo.isActive ? { text: 'Отключён', color: 'text-gray-500 bg-gray-500/10' }
                        : expired ? { text: 'Истёк', color: 'text-red-400 bg-red-500/10' }
                        : notYet ? { text: 'Ждёт активации', color: 'text-blue-400 bg-blue-500/10' }
                        : { text: 'Активен', color: 'text-green-400 bg-green-500/10' };
                      return (
                        <motion.div key={promo.id} layout className="flex items-center gap-4 glassmorphism-dark rounded-2xl p-4 border border-white/5 hover:border-amber-500/20 transition-colors">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center shrink-0">
                            <Ticket size={26} className="text-amber-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-black text-white text-lg tracking-wider">{promo.code}</p>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${statusBadge.color}`}>{statusBadge.text}</span>
                            </div>
                            {promo.description && <p className="text-gray-400 text-sm mt-0.5">{promo.description}</p>}
                            <p className="text-gray-600 text-xs mt-1">
                              {validFrom && <>с {validFrom.toLocaleDateString('ru-RU')} </>}
                              {validUntil && <>до {validUntil.toLocaleDateString('ru-RU')} </>}
                              {!validFrom && !validUntil && 'без срока'}
                              {promo.usageLimit != null && <> · лимит {promo.usageLimit}</>}
                            </p>
                          </div>
                          <p className="text-3xl font-black text-amber-400 whitespace-nowrap">−{promo.discount}%</p>
                          <div className="flex gap-2 shrink-0">
                            <button onClick={() => handleTogglePromo(promo)} title={promo.isActive ? 'Отключить' : 'Включить'} className={`w-9 h-9 flex items-center justify-center rounded-xl transition-colors ${promo.isActive ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}>
                              <Power size={16} />
                            </button>
                            <button onClick={() => handleDeletePromo(promo.id)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}
