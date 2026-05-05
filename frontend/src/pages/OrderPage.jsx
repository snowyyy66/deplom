import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft, Minus, Plus, ShoppingBag, Truck, Star, Gamepad2, X, TicketX, CheckCircle2, Gem, ChefHat, MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ReservationSection } from '../components/ReservationSection';
import { RestaurantRunnerGame } from '../components/RestaurantRunnerGame';
import { MapPickerModal } from '../components/MapPickerModal';
import { cn } from "@/lib/utils";

export function OrderPage({ onNavigate, userData, initialOrderType, initialPromoCode, cart, setCart, addToCart, removeFromCart }) {
  const orderType = initialOrderType || 'delivery';
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const [menuItems, setMenuItems] = useState([]);
  const [promoCode, setPromoCode] = useState(initialPromoCode || '');
  const [promoError, setPromoError] = useState(null);
  const [showUsedOverlay, setShowUsedOverlay] = useState(false);
  const [runnerGameOpen, setRunnerGameOpen] = useState(false);

  const [deliveryData, setDeliveryData] = useState({
    address: '', phone: userData.phone || '', name: userData.name || '', comment: ''
  });
  const [submitError, setSubmitError] = useState(null);
  const [mapOpen, setMapOpen] = useState(false);

  const [promoStatus, setPromoStatus] = useState({
    look20_available: true,
    look15_available: false,
    has_found_easter_egg: false,
    lookrun_available: false,
    lookrun_used: false,
  });

  useEffect(() => {
    api.getMenu().then(setMenuItems).catch(console.error);
    if (userData.email) {
      api.getPromoStatus(userData.email).then(setPromoStatus).catch(console.error);
    }

    if (step === 3) {
      confetti({
        particleCount: 200, spread: 100, origin: { y: 0.5 }, colors: ['#f59e0b', '#f97316', '#ffedd5']
      });
    }
  }, [step, userData.email]);

  const categories = ['Все', ...Array.from(new Set(menuItems.map(item => item.category)))];
  const filteredItems = selectedCategory === 'Все' ? menuItems : menuItems.filter(item => item.category === selectedCategory);

  const getCartTotal = () => {
    let total = cart.reduce((total, item) => total + (menuItems.find(m => m.id === item.id)?.price || 0) * item.quantity, 0);
    // Для визуального расчета итога проверяем доступность через promoStatus напрямую
    if (promoCode === 'LOOK20' && promoStatus.look20_available) total = Math.floor(total * 0.8);
    if (promoCode === 'LOOK15' && promoStatus.look15_available) total = Math.floor(total * 0.85);
    if (promoCode === 'LOOKRUN' && promoStatus.lookrun_available) total = Math.floor(total * 0.9);
    return total;
  };

  const getCartItemCount = () => cart.reduce((total, item) => total + item.quantity, 0);
  const getTotalTime = () => cart.reduce((total, item) => Math.max(total, menuItems.find(m => m.id === item.id)?.prep_time || 0), 0);

  const validatePromoOnSubmit = () => {
    if (!promoCode) return true;

    if (promoCode === 'LOOK20') {
      if (!promoStatus.look20_available) {
        setPromoError({ message: 'ТОЛЬКО ДЛЯ ПЕРВОГО ЗАКАЗА.', type: 'used' });
        setShowUsedOverlay(true);
        return false;
      }
    } else if (promoCode === 'LOOK15') {
      if (!promoStatus.has_found_easter_egg) {
        setPromoError({ message: 'ТАКОГО ПРОМОКОДА НЕ СУЩЕСТВУЕТ.', type: 'not_found' });
        return false;
      } else if (!promoStatus.look15_available) {
        setPromoError({ message: 'ВЫ УЖЕ ИСПОЛЬЗОВАЛИ ЭТОТ КОД.', type: 'used' });
        setShowUsedOverlay(true);
        return false;
      }
    } else if (promoCode === 'LOOKRUN') {
      if (!promoStatus.lookrun_available) {
        setPromoError({
          message: 'СНАЧАЛА ПРОЙДИТЕ МИНИ-ИГРУ «СПРИНТ ШЕФА».',
          type: 'not_found',
        });
        return false;
      }
    } else {
      setPromoError({ message: 'ТАКОГО ПРОМОКОДА НЕ СУЩЕСТВУЕТ.', type: 'not_found' });
      return false;
    }
    return true;
  };

  const handleDeliverySubmit = async (e) => {
    e.preventDefault();
    setPromoError(null);

    // Валидируем промо перед отправкой
    if (!validatePromoOnSubmit()) return;

    setSubmitError(null);
    try {
      await api.createOrder({
        user_id: userData.id ?? undefined,
        address: deliveryData.address,
        phone: deliveryData.phone,
        recipient_name: deliveryData.name,
        email: userData.email || '',
        promo_code: (promoCode && !promoError) ? promoCode : undefined,
        comment: deliveryData.comment || undefined,
        total_amount: getCartTotal(),
        items: cart.map(c => ({
          menu_item_id: c.id,
          quantity: c.quantity,
          price: menuItems.find(m => m.id === c.id)?.price || 0,
        })),
      });
      setStep(3);
      setCart([]);
    } catch (err) {
      setSubmitError(err.message || 'Ошибка оформления заказа');
    }
  };

  const UsedPromoOverlay = () => (
    <AnimatePresence>
      {showUsedOverlay && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          onClick={e => e.stopPropagation()}
        >
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={e => { e.stopPropagation(); setShowUsedOverlay(false); }}
            className="absolute inset-0 bg-black/95 backdrop-blur-md"
          />
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="relative bg-[#0A0A0A] border border-white/5 rounded-[3rem] p-12 max-w-sm w-full text-center shadow-2xl"
          >
            <div className="w-24 h-24 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-10 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
               <X className="text-red-500 w-12 h-12" strokeWidth={3} />
            </div>
            <h3 className="text-2xl font-black text-white uppercase italic tracking-widest mb-4">ВНИМАНИЕ</h3>
            <p className="text-gray-500 text-lg font-light mb-10 leading-tight">Этот промокод доступен только для <span className="text-white font-black">первого заказа</span> в нашем сервисе.</p>
            <button
              type="button"
              onClick={e => { e.stopPropagation(); setShowUsedOverlay(false); }}
              className="w-full h-14 bg-white/5 border border-white/10 rounded-xl font-black uppercase tracking-widest hover:bg-white/10 transition-all text-white"
            >
              Понятно
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  const Header = () => (
    <header className="fixed top-0 left-0 right-0 z-50 glassmorphism-dark border-b border-white/5 h-20 flex items-center">
      <div className="max-w-6xl mx-auto px-4 w-full flex items-center justify-between">
        <motion.button whileHover={{ x: -5 }} onClick={() => onNavigate('home')} className="flex items-center gap-2 text-gray-400 hover:text-amber-400 transition-colors uppercase text-xs tracking-wider font-bold"><ArrowLeft size={16} /> Назад</motion.button>
        <img src="/logo.png" alt="Look" className="w-24 h-24 invert drop-shadow-[0_0_15px_rgba(251,191,36,0.5)] hover:drop-shadow-[0_0_25px_rgba(251,191,36,0.8)] cursor-pointer transition-all" onClick={() => onNavigate('home')} />
        <div className="w-20 flex justify-end">
          {orderType === 'delivery' && (
            <button onClick={() => cart.length > 0 && setStep(2)} className="relative text-amber-500 hover:scale-110 transition-transform">
              <ShoppingBag size={24} />
              <AnimatePresence>{getCartItemCount() > 0 && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-orange-600 text-white text-[10px] flex items-center justify-center font-black">{getCartItemCount()}</motion.span>}</AnimatePresence>
            </button>
          )}
        </div>
      </div>
    </header>
  );

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-amber-500 selection:text-black relative overflow-hidden">
      {/* Фоновые световые пятна */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] bg-amber-600/10 rounded-full blur-[160px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[60%] bg-orange-700/10 rounded-full blur-[180px]" />
        <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] bg-amber-500/5 rounded-full blur-[120px]" />
      </div>
      <Header />
      <UsedPromoOverlay />
      <main className="pt-32 pb-24 px-4 max-w-6xl mx-auto relative z-10">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>

            {orderType === 'reservation' ? (
              <ReservationSection userData={userData} onSuccess={() => {}} onBack={() => onNavigate('home')} />
            ) : (
              <div className="max-w-6xl mx-auto">
                {step === 1 && (
                  <>
                    <div className="flex flex-wrap justify-center gap-3 mb-12">
                      {categories.map((category) => (
                        <button key={category} onClick={() => setSelectedCategory(category)} className={`px-6 py-3 rounded-full text-sm font-black uppercase tracking-wider transition-all duration-300 ${selectedCategory === category ? 'bg-amber-500 text-black shadow-lg' : 'bg-white/5 hover:bg-white/10 text-gray-400'}`}>
                          {category}
                        </button>
                      ))}
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredItems.map(item => {
                        const cartItem = cart.find(c => c.id === item.id);
                        return (
                          <motion.div layout key={item.id} className="glassmorphism-dark rounded-[2rem] p-4 flex gap-5 border border-white/5 hover:border-amber-500/30 transition-colors group">
                            <div className="w-32 h-32 rounded-2xl overflow-hidden shrink-0 relative">
                              <img src={item.image_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            </div>
                            <div className="flex flex-col justify-between py-1 flex-1 min-w-0">
                              <div>
                                <h3 className="text-lg font-black text-white mb-1 truncate">{item.name}</h3>
                                <div className="flex gap-2 items-center text-gray-500 text-xs">
                                  <span className="flex items-center gap-1"><Star size={12} className="text-amber-500 fill-amber-500"/> {item.rating}</span> • <span>{item.prep_time} мин</span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between mt-4">
                                <span className="text-xl font-black text-white">{item.price} ₽</span>
                                {cartItem ? (
                                  <div className="flex items-center gap-3 bg-white/10 rounded-full p-1 border border-white/10">
                                    <button onClick={() => removeFromCart(item.id)} className="w-7 h-7 flex items-center justify-center hover:text-amber-500 transition-colors"><Minus size={14} /></button>
                                    <span className="font-black text-sm w-4 text-center">{cartItem.quantity}</span>
                                    <button onClick={() => addToCart(item.id)} className="w-7 h-7 flex items-center justify-center bg-amber-500 text-black rounded-full shadow-lg"><Plus size={14} /></button>
                                  </div>
                                ) : (
                                  <button onClick={() => addToCart(item.id)} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-amber-500 hover:text-black transition-colors"><Plus size={18} /></button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    <AnimatePresence>
                      {cart.length > 0 && (
                        <motion.div initial={{ y: 200 }} animate={{ y: 0 }} exit={{ y: 200 }} className="fixed bottom-0 left-0 right-0 p-8 z-50 pointer-events-none">
                          <div className="max-w-4xl mx-auto bg-[#0A0A0A] border border-amber-500/30 rounded-[2.5rem] p-8 flex items-center justify-between shadow-[0_-30px_60px_rgba(0,0,0,0.8)] pointer-events-auto">
                            <div>
                               <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1 italic">{getCartItemCount()} БЛЮД В КОРЗИНЕ</p>
                               <span className="text-4xl font-black text-amber-500 leading-none">{getCartTotal()} ₽</span>
                            </div>
                            <Button onClick={() => setStep(2)} className="h-16 px-10 bg-amber-500 hover:bg-amber-600 text-black font-black uppercase tracking-widest text-lg rounded-2xl shadow-xl transition-all">К ОПЛАТЕ</Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}

                {step === 2 && (
                  <div className="grid lg:grid-cols-[1fr_520px] gap-8 items-start">
                    <form onSubmit={handleDeliverySubmit} className="relative rounded-[2rem] p-10 space-y-8 overflow-hidden border border-white/[0.08]" style={{background:'rgba(255,255,255,0.03)',backdropFilter:'blur(32px)'}}>
                      <div className="absolute -top-24 -left-24 w-64 h-64 bg-amber-500/15 rounded-full blur-[80px] pointer-events-none" />
                      <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-orange-600/10 rounded-full blur-[60px] pointer-events-none" />
                      <h2 className="text-2xl font-bold text-white tracking-tight relative z-10">Адрес доставки</h2>
                      <div className="space-y-8">
                        <div>
                          <div className="flex items-center justify-between pl-2 mb-1">
                            <Label className="text-[10px] uppercase tracking-[0.4em] text-amber-500 font-black">ГОРОД, УЛИЦА, ДОМ, КВАРТИРА</Label>
                            <button
                              type="button"
                              onClick={() => setMapOpen(true)}
                              className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-black text-amber-500/70 hover:text-amber-500 transition-colors"
                            >
                              <MapPin className="w-3 h-3" />
                              Выбрать на карте
                            </button>
                          </div>
                          <Input required value={deliveryData.address} onChange={(e) => setDeliveryData({ ...deliveryData, address: e.target.value })} className="h-14 bg-white/5 backdrop-blur-sm border-white/10 rounded-xl px-6 text-base font-light focus:border-amber-500/40 focus:bg-white/8 text-white transition-all" />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                           <div>
                              <Label className="text-[10px] uppercase tracking-[0.2em] text-amber-500/80 font-medium pl-1">ИМЯ</Label>
                              <Input required value={deliveryData.name} onChange={(e) => setDeliveryData({ ...deliveryData, name: e.target.value })} className="h-14 bg-white/5 backdrop-blur-sm border-white/10 rounded-xl px-6 text-base font-light focus:border-amber-500/40 focus:bg-white/8 text-white transition-all" />
                           </div>
                           <div>
                              <Label className="text-[10px] uppercase tracking-[0.2em] text-amber-500/80 font-medium pl-1">ТЕЛЕФОН</Label>
                              <Input required type="tel" value={deliveryData.phone} onChange={(e) => setDeliveryData({ ...deliveryData, phone: e.target.value })} className="h-14 bg-white/5 backdrop-blur-sm border-white/10 rounded-xl px-6 text-base font-light focus:border-amber-500/40 focus:bg-white/8 text-white transition-all" />
                           </div>
                        </div>
                        <div>
                        <Label className="text-[10px] uppercase tracking-[0.2em] text-amber-500/80 font-medium pl-1">АКТИВАЦИЯ ПРОМОКОДА</Label>
                        <p className="text-[11px] text-gray-500 pl-2 mb-3 font-medium leading-snug">
                          Введите промокод — скидка учтётся в итоге после проверки кода.
                        </p>
                        <Input placeholder="ПРОМОКОД..." value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} className="h-16 bg-white/5 backdrop-blur-sm border-white/10 rounded-xl px-6 text-2xl font-black uppercase text-amber-400 tracking-[0.25em] w-full focus:border-amber-500/40 focus:bg-white/8 transition-all" />
                        <AnimatePresence>
                          {promoError && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className={cn("mt-6 p-5 rounded-2xl border flex items-center gap-5 transition-all shadow-2xl", promoError.type === 'used' ? "bg-red-500/[0.03] border-red-500/20 shadow-red-500/5" : "bg-gray-500/[0.03] border-gray-500/20")}>
                               <div className={cn("w-14 h-14 rounded-xl border flex items-center justify-center shrink-0 shadow-inner", promoError.type === 'used' ? "bg-red-500/10 border-red-500/20" : "bg-gray-500/10 border-gray-500/20")}>
                                  {promoError.type === 'used' ? <X className="text-red-500 w-7 h-7" strokeWidth={3} /> : <TicketX className="text-gray-500 w-7 h-7" />}
                               </div>
                               <div>
                                  <p className={cn("text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-90", promoError.type === 'used' ? "text-red-400" : "text-gray-400")}>{promoError.type === 'used' ? "ОШИБКА АКТИВАЦИИ" : "ОШИБКА ВВОДА"}</p>
                                  <p className={cn("text-xs font-black italic tracking-widest uppercase", promoError.type === 'used' ? "text-red-500" : "text-gray-400")}>{promoError.message}</p>
                               </div>
                            </motion.div>
                          )}
                          {!promoError && promoCode === 'LOOK20' && promoStatus.look20_available && (
                             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-5 rounded-2xl border bg-green-500/[0.03] border-green-500/20 flex items-center gap-5 shadow-2xl shadow-green-500/5">
                               <div className="w-14 h-14 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
                                  <CheckCircle2 className="text-green-500 w-7 h-7" strokeWidth={3} />
                               </div>
                               <div>
                                  <p className="text-green-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-90">УСПЕШНО ПРИМЕНЕНО</p>
                                  <p className="text-green-400 text-xs font-black italic tracking-widest uppercase">Скидка -20% успешно применена!</p>
                               </div>
                             </motion.div>
                          )}
                          {!promoError && promoCode === 'LOOK15' && promoStatus.look15_available && (
                             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-5 rounded-2xl border bg-purple-500/[0.03] border-purple-500/20 flex items-center gap-5 shadow-2xl shadow-purple-500/5">
                               <div className="w-14 h-14 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                                  <Gem className="text-purple-500 w-7 h-7 animate-pulse" strokeWidth={2} />
                               </div>
                               <div>
                                  <p className="text-purple-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-90">СЕКРЕТНАЯ ПРИВИЛЕГИЯ</p>
                                  <p className="text-purple-400 text-xs font-black italic tracking-widest uppercase">Секретная привилегия -15% подтверждена!</p>
                               </div>
                             </motion.div>
                          )}
                          {!promoError && promoCode === 'LOOKRUN' && promoStatus.lookrun_available && (
                             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-5 rounded-2xl border bg-emerald-500/[0.03] border-emerald-500/25 flex items-center gap-5 shadow-2xl shadow-emerald-500/5">
                               <div className="w-14 h-14 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                                  <ChefHat className="text-emerald-400 w-7 h-7" strokeWidth={2} />
                               </div>
                               <div>
                                  <p className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-90">СПРИНТ ШЕФА</p>
                                  <p className="text-emerald-400 text-xs font-black italic tracking-widest uppercase">Скидка −10% за мини-игру применена!</p>
                               </div>
                             </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <div>
                        <Label className="text-[10px] uppercase tracking-[0.4em] text-amber-500 font-black pl-2 block mb-2">КОММЕНТАРИЙ КУРЬЕРУ</Label>
                        <textarea
                          value={deliveryData.comment}
                          onChange={(e) => setDeliveryData({ ...deliveryData, comment: e.target.value })}
                          className="w-full h-28 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 text-base font-light focus:border-amber-500/40 focus:bg-white/8 hover:border-white/20 outline-none resize-none text-white transition-all"
                          placeholder="Уточните детали доставки..."
                        />
                      </div>
                      </div>
                    </form>

                    <div className="relative rounded-[2rem] p-10 h-fit sticky top-32 w-full overflow-hidden border border-white/[0.08]" style={{background:'rgba(255,255,255,0.03)',backdropFilter:'blur(32px)'}}>
                      <div className="absolute -bottom-16 -right-16 w-56 h-56 bg-amber-500/15 rounded-full blur-[80px] pointer-events-none" />
                      <h3 className="text-sm font-medium uppercase tracking-[0.25em] text-gray-500 mb-8">Детализация заказа</h3>
                      <div className="space-y-6 mb-12 max-h-[450px] overflow-y-auto pr-3 custom-scrollbar">
                        {cart.map((cartItem) => {
                          const item = menuItems.find(m => m.id === cartItem.id);
                          return (
                            <div key={cartItem.id} className="flex gap-6 items-center bg-black/40 p-5 rounded-2xl border border-white/5 hover:border-amber-500/10 transition-all shadow-lg group/item">
                              <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 shadow-2xl border border-white/5">
                                <img src={item?.image_url} className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500" alt="" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-black text-xl text-white truncate uppercase tracking-tight mb-1">{item?.name}</p>
                                <div className="flex items-center justify-between">
                                   <p className="text-amber-500 font-black text-lg italic">{item?.price} ₽</p>
                                   <span className="bg-white/5 px-4 py-1.5 rounded-full text-gray-400 font-black text-xs tracking-widest uppercase border border-white/5">x{cartItem.quantity}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="border-t border-white/5 pt-8 space-y-4">
                        <div className="flex justify-between items-end mb-4 px-2">
                           <span className="text-gray-500 text-xs font-medium uppercase tracking-[0.2em] pb-1">Итого</span>
                           <span className="text-5xl font-bold text-white leading-none">{getCartTotal()} ₽</span>
                        </div>

                        <div className="space-y-4">
                          <AnimatePresence>
                            {submitError && (
                              <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-5"
                              >
                                {submitError.split('\n').map((msg, i) => (
                                  <p key={i} className="text-red-400 text-xs font-black uppercase tracking-widest leading-relaxed">
                                    {msg}
                                  </p>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                         <Button
                             onClick={handleDeliverySubmit}
                             className={cn(
                               "w-full h-24 bg-amber-500 hover:bg-amber-600 text-black font-black uppercase text-3xl rounded-[1.5rem] shadow-[0_15px_40px_rgba(245,158,11,0.3)] glow-amber transition-all italic tracking-tighter"
                             )}
                           >
                             ОПЛАТИТЬ
                           </Button>

                           <div className="rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-center">
                              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500/90 mb-2">Введите промокод</p>
                              <p className="text-xs leading-relaxed text-gray-500">
                                Поле ввода находится в форме слева («Активация промокода»). После ввода корректного кода итог обновится автоматически.
                              </p>
                           </div>

                           <button type="button" onClick={() => setStep(1)} className="w-full text-[11px] font-black uppercase tracking-[0.3em] text-gray-500 hover:text-white transition-colors py-4">Вернуться к меню</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="text-center py-20 flex flex-col items-center justify-center min-h-[600px] rounded-[4rem] border border-white/[0.12] relative overflow-hidden" style={{background:'rgba(255,255,255,0.05)',backdropFilter:'blur(40px)'}}>
                    {/* Свет с двух сторон */}
                    <div className="absolute left-0 top-0 bottom-0 w-[1.5px] bg-gradient-to-b from-transparent via-amber-500/40 to-transparent pointer-events-none" />
                    <div className="absolute right-0 top-0 bottom-0 w-[1.5px] bg-gradient-to-b from-transparent via-amber-500/25 to-transparent pointer-events-none" />
                    <div className="absolute -left-16 top-1/2 -translate-y-1/2 w-32 h-64 bg-amber-500/8 rounded-full blur-[60px] pointer-events-none" />
                    <div className="absolute -right-16 top-1/2 -translate-y-1/2 w-32 h-64 bg-orange-500/6 rounded-full blur-[60px] pointer-events-none" />
                    <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />
                    <div className="w-32 h-32 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-12 shadow-[0_0_80px_rgba(245,158,11,0.1)]">
                       <Truck className="text-amber-500 w-16 h-16" />
                    </div>
                    <h2 className="text-7xl font-black text-white mb-6 uppercase tracking-tighter italic">ЗАКАЗ В ПУТИ!</h2>
                    <p className="text-2xl text-gray-500 font-light mb-16 italic text-center max-w-xl">Ваш заказ принят кухней. Ожидайте доставку через<br/><span className="text-amber-500 font-black block mt-2 text-4xl">~{45 + getTotalTime()} МИНУТ</span></p>
                    <div className="flex flex-col gap-4 w-72">
                       <Button onClick={() => onNavigate('home')} className="h-16 w-full bg-white/5 border border-white/10 rounded-xl font-black uppercase tracking-[0.3em] hover:bg-white/10 text-white">На главную</Button>
                       {!promoStatus.lookrun_used ? (
                         <motion.button
                           type="button"
                           whileHover={{ scale: 1.05 }}
                           whileTap={{ scale: 0.95 }}
                           onClick={() => setRunnerGameOpen(true)}
                           className="w-full min-h-[5.5rem] bg-gradient-to-r from-amber-500 to-orange-600 text-black font-black uppercase tracking-wider rounded-xl flex flex-col items-center justify-center gap-2 px-4 py-3"
                         >
                           <Gamepad2 size={22} className="shrink-0" strokeWidth={2.5} aria-hidden />
                           <span className="text-center text-[11px] leading-tight sm:text-xs">
                             <span className="block">Сыграть и получить</span>
                             <span className="block">скидку −10%</span>
                           </span>
                         </motion.button>
                       ) : (
                         <div className="w-full min-h-[4rem] bg-white/5 border border-white/10 rounded-xl flex flex-col items-center justify-center gap-1 px-4 py-3 opacity-50 cursor-default">
                           <Gamepad2 size={20} className="text-gray-500" />
                           <span className="text-[10px] text-gray-500 uppercase tracking-wider text-center">
                             Скидка LOOKRUN уже использована
                           </span>
                         </div>
                       )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <RestaurantRunnerGame
        open={runnerGameOpen}
        onOpenChange={setRunnerGameOpen}
        userEmail={userData.email || ''}
        onRewardUnlocked={async () => {
          if (userData.email) {
            try {
              const s = await api.getPromoStatus(userData.email);
              setPromoStatus(s);
            } catch {
              /* ignore */
            }
          }
          setRunnerGameOpen(false);
        }}
      />
      <MapPickerModal
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        onConfirm={(addr) => setDeliveryData((d) => ({ ...d, address: addr }))}
      />
    </div>
  );
}
