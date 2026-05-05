import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  ArrowLeft, User, Mail, Phone, Save, LogOut,
  Star, Calendar, ShoppingBag, Clock,
  MapPin, Users, MessageSquare, Package, ChevronRight, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { api } from '../lib/api';

const statusConfig = {
  'pending': { label: 'Ожидается', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  'confirmed': { label: 'Подтверждено', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
  'cancelled': { label: 'Отменено', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
  'new': { label: 'Новый', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  'preparing': { label: 'Готовится', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  'delivering': { label: 'Доставляется', color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
  'completed': { label: 'Доставлен', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
};

export function ProfilePage({ onNavigate, userData, onUpdateUser }) {
  const [formData, setFormData] = useState(userData);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('info');

  const [reviews, setReviews] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!userData.id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [revs, res, ords] = await Promise.all([
          api.getUserReviews(userData.id),
          api.getUserReservations(userData.id),
          api.getUserOrders(userData.id),
        ]);
        setReviews(revs);
        setReservations(res);
        setOrders(ords);
      } catch (err) {
        console.error('Failed to fetch user data:', err);
      }
      setLoading(false);
    };
    fetchData();
  }, [userData.id]);

  const handleSave = () => {
    onUpdateUser(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
    toast.success('Данные сохранены');
  };

  const handleLogout = () => {
    onNavigate('auth');
  };

  const handleCancelReservation = async (id) => {
    setCancellingId(id);
    try {
      await api.cancelReservation(id);
      setReservations(prev => prev.map(r => r.id === id ? { ...r, status: 'cancelled' } : r));
      toast.success('Бронирование отменено');
    } catch (err) {
      console.error(err);
      toast.error('Не удалось отменить бронирование');
    } finally {
      setCancellingId(null);
    }
  };

  const tabs = [
    { id: 'info', label: 'Профиль', icon: User, count: null },
    { id: 'orders', label: 'Доставка', icon: ShoppingBag, count: orders.length },
    { id: 'reservations', label: 'Брони', icon: Calendar, count: reservations.length },
    { id: 'reviews', label: 'Отзывы', icon: Star, count: reviews.length },
  ];

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '—';

  const getStatus = (status) => statusConfig[status] || { label: status, color: 'text-gray-400', bg: 'bg-white/5 border-white/10' };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none z-0">
        <motion.div
          animate={{ x: [-50, 50, -50], y: [-50, 50, -50] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 right-[-10%] w-[500px] h-[500px] bg-amber-600/5 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{ x: [50, -50, 50], y: [50, -50, 50] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-0 left-[-10%] w-[600px] h-[600px] bg-orange-700/5 rounded-full blur-[120px]"
        />
      </div>

      <header className="fixed top-0 left-0 right-0 z-50 glassmorphism-dark border-b border-white/5 py-3">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <motion.button
            whileHover={{ x: -5 }}
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 text-gray-400 hover:text-amber-400 transition-colors group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium tracking-wider uppercase text-xs">Назад</span>
          </motion.button>
          <img src="/logo.png" alt="Look" className="w-24 h-24 object-contain invert cursor-pointer drop-shadow-[0_0_15px_rgba(251,191,36,0.5)] hover:drop-shadow-[0_0_25px_rgba(251,191,36,0.8)] transition-all" onClick={() => onNavigate('home')} />
          <div className="w-20" />
        </div>
      </header>

      <main className="flex-1 relative z-10 pt-24 pb-20">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glassmorphism-dark rounded-3xl p-8 md:p-10 mb-8 border border-white/10 relative overflow-hidden flex flex-col md:flex-row items-center gap-8"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-500/20 to-transparent blur-3xl rounded-full" />
            <div className="relative group">
              <div className="absolute inset-0 bg-amber-500 rounded-full blur-md opacity-30 group-hover:opacity-50 transition-opacity" />
              <div className="relative w-32 h-32 rounded-full border border-amber-500/50 bg-[#1a1a1a] flex items-center justify-center overflow-hidden">
                <User size={48} className="text-amber-400" />
              </div>
            </div>
            <div className="text-center md:text-left flex-1">
              <h1 className="text-4xl font-black text-white mb-2">{userData.name}</h1>
              <p className="text-amber-500/80 tracking-widest text-sm uppercase">{userData.email || 'guest@look.ru'}</p>
            </div>
            <div className="flex gap-4">
              <div className="text-center px-6 py-4 glassmorphism rounded-2xl">
                <div className="text-2xl font-bold text-amber-400">{orders.length + reservations.length}</div>
                <div className="text-xs text-gray-500 uppercase tracking-widest">Заказов</div>
              </div>
              <div className="text-center px-6 py-4 glassmorphism rounded-2xl">
                <div className="text-2xl font-bold text-amber-400">{avgRating}</div>
                <div className="text-xs text-gray-500 uppercase tracking-widest">Рейтинг</div>
              </div>
            </div>
          </motion.div>

          <div className="flex items-center gap-2 pb-4 mb-4">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide flex-1">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex items-center gap-2 px-6 py-4 rounded-2xl text-sm font-medium transition-colors whitespace-nowrap ${
                      isActive ? 'text-amber-400' : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-white/5 border border-white/10 rounded-2xl shadow-[0_0_15px_rgba(251,191,36,0.1)]"
                      />
                    )}
                    <tab.icon size={18} className="relative z-10" />
                    <span className="relative z-10">{tab.label}</span>
                    {tab.count !== null && tab.count > 0 && (
                      <span className="relative z-10 ml-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold">{tab.count}</span>
                    )}
                  </button>
                );
              })}
            </div>
            {userData.email?.toLowerCase() === '123@123.com' && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  sessionStorage.setItem('look_admin', '1');
                  window.location.pathname = '/admin';
                }}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-400 hover:border-amber-500/70 hover:from-amber-500/30 hover:to-orange-500/30 transition-all text-sm font-bold whitespace-nowrap shadow-[0_0_20px_rgba(245,158,11,0.15)] shrink-0"
              >
                <ShieldCheck size={16} />
                Админ панель
              </motion.button>
            )}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="glassmorphism-dark rounded-3xl p-8 border border-white/10"
            >
              {activeTab === 'info' && (
                <div className="max-w-xl">
                  <h2 className="text-2xl font-bold mb-8 text-white">Личные данные</h2>
                  <div className="space-y-6">
                    <div className="space-y-2 group">
                      <Label className="text-gray-500 text-xs uppercase tracking-widest flex items-center gap-2 group-focus-within:text-amber-400">
                        <User size={14} /> Имя
                      </Label>
                      <Input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="bg-black/50 border-white/10 text-white focus:border-amber-500 h-14 rounded-xl px-4" />
                    </div>
                    <div className="space-y-2 group">
                      <Label className="text-gray-500 text-xs uppercase tracking-widest flex items-center gap-2 group-focus-within:text-amber-400">
                        <Mail size={14} /> Email
                      </Label>
                      <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="bg-black/50 border-white/10 text-white focus:border-amber-500 h-14 rounded-xl px-4" />
                    </div>
                    <div className="space-y-2 group">
                      <Label className="text-gray-500 text-xs uppercase tracking-widest flex items-center gap-2 group-focus-within:text-amber-400">
                        <Phone size={14} /> Телефон
                      </Label>
                      <Input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="bg-black/50 border-white/10 text-white focus:border-amber-500 h-14 rounded-xl px-4" />
                    </div>
                    <div className="flex gap-4 pt-6">
                      <Button onClick={handleSave} className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-bold h-14 px-8 rounded-xl">
                        <Save size={18} className="mr-2" />
                        {isSaved ? 'Сохранено!' : 'Сохранить изменения'}
                      </Button>
                      <Button variant="outline" onClick={handleLogout} className="border-red-500/30 text-red-400 hover:bg-red-500/10 h-14 px-8 rounded-xl">
                        <LogOut size={18} className="mr-2" /> Выйти
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'orders' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-3"><ShoppingBag size={24} className="text-amber-500" /> История доставок</h2>
                  {loading ? (
                    <div className="flex justify-center py-16"><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, ease: "linear", duration: 1 }} className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full" /></div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-16">
                      <Package size={64} className="text-gray-700 mx-auto mb-6" />
                      <p className="text-gray-500 text-lg mb-2">Заказов пока нет</p>
                      <Button onClick={() => onNavigate('home')} className="bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl px-8 py-3 mt-4">Перейти в меню <ChevronRight size={18} className="ml-1" /></Button>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {orders.map((order, i) => {
                        const st = getStatus(order.status);
                        return (
                          <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-black/40 rounded-2xl border border-white/5 p-6 hover:border-amber-500/30 transition-colors">
                            <div className="flex justify-between items-start mb-4 border-b border-white/5 pb-4">
                              <div>
                                <p className="text-amber-500 font-bold mb-1 tracking-wider uppercase text-sm">Заказ #{order.id}</p>
                                <div className="flex items-center gap-2 text-gray-500 text-xs"><Clock size={12} />{new Date(order.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                              </div>
                              <span className={`px-4 py-1 rounded-full border ${st.bg} ${st.color} text-xs font-semibold uppercase tracking-wider`}>{st.label}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3 flex-1 min-w-0"><MapPin size={16} className="text-gray-500 shrink-0" /><p className="text-gray-400 text-sm truncate">{order.address}</p></div>
                              <p className="text-2xl font-black text-white whitespace-nowrap">{order.total_amount.toLocaleString()} ₽</p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'reservations' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-3"><Calendar size={24} className="text-amber-500" /> Мои бронирования</h2>
                  {loading ? (
                    <div className="flex justify-center py-16"><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, ease: "linear", duration: 1 }} className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full" /></div>
                  ) : reservations.length === 0 ? (
                    <div className="text-center py-16">
                      <Calendar size={64} className="text-gray-700 mx-auto mb-6" />
                      <p className="text-gray-500 text-lg mb-2">Бронирований пока нет</p>
                      <Button onClick={() => onNavigate('home')} className="bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl px-8 py-3 mt-4">Забронировать <ChevronRight size={18} className="ml-1" /></Button>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {reservations.map((res, i) => {
                        const st = getStatus(res.status);
                        const isCancelled = res.status === 'cancelled';
                        const isPast = new Date(res.date) < new Date(new Date().toDateString());
                        const canCancel = !isCancelled && !isPast;
                        const isCancelling = cancellingId === res.id;
                        return (
                          <motion.div key={res.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`rounded-2xl border p-6 transition-colors ${isCancelled ? 'bg-white/[0.02] border-white/5 opacity-60' : 'bg-black/40 border-white/5 hover:border-amber-500/30'}`}>
                            <div className="flex justify-between items-start mb-4 border-b border-white/5 pb-4">
                              <div>
                                <p className="text-amber-500 font-bold mb-1 tracking-wider uppercase text-sm">Бронь #{res.id}</p>
                                <div className="flex items-center gap-2 text-gray-500 text-xs"><Clock size={12} />Создано: {new Date(res.created_at).toLocaleDateString('ru-RU')}</div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`px-4 py-1 rounded-full border ${st.bg} ${st.color} text-xs font-semibold uppercase tracking-wider`}>{st.label}</span>
                                {canCancel && (
                                  <button onClick={() => handleCancelReservation(res.id)} disabled={isCancelling} className="px-3 py-1 rounded-full border border-red-500/30 text-red-400 text-xs font-semibold uppercase tracking-wider hover:bg-red-500/10 transition-colors disabled:opacity-50">
                                    {isCancelling ? '...' : 'Отменить'}
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-8">
                              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20"><Calendar className="text-amber-500 w-7 h-7" /></div>
                              <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div><p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Дата</p><p className="text-white font-semibold">{new Date(res.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</p></div>
                                <div><p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Время</p><p className="text-white font-semibold">{res.time}</p></div>
                                <div><p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Гости</p><div className="flex items-center gap-1"><Users size={14} className="text-amber-400" /><p className="text-white font-semibold">{res.guests_count}</p></div></div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-3"><MessageSquare size={24} className="text-amber-500" /> Мои отзывы</h2>
                  {loading ? (
                    <div className="flex justify-center py-16"><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, ease: "linear", duration: 1 }} className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full" /></div>
                  ) : reviews.length === 0 ? (
                    <div className="text-center py-16">
                      <Star size={64} className="text-gray-700 mx-auto mb-6" />
                      <p className="text-gray-500 text-lg mb-2">Вы ещё не оставляли отзывов</p>
                      <Button onClick={() => onNavigate('home')} className="bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl px-8 py-3 mt-4">Оставить отзыв <ChevronRight size={18} className="ml-1" /></Button>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-6">
                      {reviews.map((rev, i) => (
                        <motion.div key={rev.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }} className="bg-black/40 rounded-2xl border border-white/5 p-6 hover:border-amber-500/30 transition-colors">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex gap-1">{[...Array(5)].map((_, j) => (<Star key={j} size={16} className={j < rev.rating ? "text-amber-500 fill-amber-500" : "text-gray-600"} />))}</div>
                            <span className="text-gray-600 text-xs">{new Date(rev.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</span>
                          </div>
                          <p className="text-gray-300 font-light leading-relaxed">{rev.text}</p>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
