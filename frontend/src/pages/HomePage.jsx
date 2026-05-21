import { Button } from '@/components/ui/button';
import {
  Star, ShoppingBag, Calendar,
  Plus, Minus, User, ArrowRight,
  MessageSquare, Send, Quote,
  UtensilsCrossed, Phone
} from 'lucide-react';
import { useEffect, useState, useMemo, useRef } from 'react';
import { api } from '../lib/api';
import { motion, useScroll, useTransform, AnimatePresence, useInView } from 'framer-motion';

// Компонент reveal-анимации текста (строка едет снизу, как на avetool.cc)
function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={inView ? { y: 0, opacity: 1 } : {}}
        transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay }}
      >
        {children}
      </motion.div>
    </div>
  );
}

import { toast } from 'sonner';

export function HomePage({ onNavigate, userData, cart, addToCart, removeFromCart }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [priceSort, setPriceSort] = useState(null);
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [reviews, setReviews] = useState([]);
  const [newReviewName, setNewReviewName] = useState(userData?.name || '');
  const [newReviewText, setNewReviewText] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const { scrollY, scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);
  const [navScrolled, setNavScrolled] = useState(false);

  const cartTotal = useMemo(() => cart.reduce((a, c) => a + c.quantity, 0), [cart]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!newReviewName || !newReviewText) return;
    setIsSubmittingReview(true);
    try {
      const added = await api.submitReview({ author_name: newReviewName, rating: newReviewRating, text: newReviewText, user_id: userData.id });
      setReviews(prev => [added, ...prev]);
      setNewReviewText('');
      setNewReviewRating(5);
      toast.success('Отзыв опубликован!');
    } catch(err) { console.error(err); toast.error('Не удалось отправить отзыв'); }
    setIsSubmittingReview(false);
  };

  useEffect(() => {
    const unsubscribe = scrollY.on('change', v => setNavScrolled(v > 50));
    Promise.all([
      api.getMenu().then(data => setDishes(data)),
      api.getReviews().then(data => setReviews(data))
    ]).then(() => setLoading(false)).catch(console.error);
    return unsubscribe;
  }, []);

  const menuCategories = useMemo(() => [
    { id: 'all', name: 'Все', count: dishes.length },
    ...Array.from(new Set(dishes.map(d => d.category))).map(cat => ({
      id: cat, name: cat, count: dishes.filter(d => d.category === cat).length
    }))
  ], [dishes]);

  const filteredDishes = useMemo(() => dishes
    .filter(dish => activeCategory === 'all' || dish.category === activeCategory)
    .sort((a, b) => priceSort === 'asc' ? a.price - b.price : priceSort === 'desc' ? b.price - a.price : 0),
  [dishes, activeCategory, priceSort]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, ease: "linear", duration: 1 }}
          className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500/10 rounded-full blur-[120px] mix-blend-screen animate-blob" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-600/10 rounded-full blur-[120px] mix-blend-screen animate-blob animation-delay-2000" />
      </div>

      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${navScrolled ? 'glassmorphism-dark border-b border-white/5 py-2' : 'bg-transparent py-4'}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate('home')}
              className="relative group flex items-center"
            >
              <img
                src="/logo.png"
                alt="Look"
                className="w-32 h-32 object-contain invert drop-shadow-[0_0_18px_rgba(251,191,36,0.7)] group-hover:drop-shadow-[0_0_32px_rgba(251,191,36,1)] transition-[filter] duration-300"
              />
            </motion.button>

            <div className="hidden md:flex items-center gap-8">
              {['Меню', 'О нас', 'Контакты'].map((item, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (item === 'Меню') {
                      document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
                    } else if (item === 'О нас') {
                      onNavigate('about');
                    } else if (item === 'Контакты') {
                      onNavigate('contacts');
                    }
                  }}
                  className="relative text-gray-300 hover:text-amber-400 transition-colors group text-sm font-medium tracking-wide uppercase"
                >
                  {item}
                  <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-amber-400 transition-all duration-300 group-hover:w-full" />
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onNavigate('profile')}
                className="flex items-center gap-2 px-4 py-2 rounded-full glassmorphism hover:bg-white/10 transition-colors"
              >
                <User size={18} className="text-amber-400" />
                <span className="text-sm hidden sm:inline text-gray-200">{userData.name}</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                onClick={() => onNavigate('order', 'delivery')}
                className="relative text-amber-500 hover:text-amber-400 p-2 hidden md:block"
              >
                <ShoppingBag size={22} />
                <AnimatePresence>
                  {cartTotal > 0 && (
                    <motion.span
                      initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                      className="absolute top-0 right-0 w-4 h-4 rounded-full bg-orange-600 text-white text-[10px] flex items-center justify-center font-black"
                    >
                      {cartTotal}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={() => onNavigate('order', 'reservation')}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-semibold shadow-[0_0_20px_rgba(245,158,11,0.4)] border-none"
                >
                  <Calendar size={18} className="mr-2" />
                  <span className="hidden sm:inline">Забронировать</span>
                  <span className="sm:hidden">Бронь</span>
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <motion.section
        style={{ opacity: heroOpacity }}
        className="relative min-h-screen flex items-center justify-center pt-20"
      >
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[url('/hero-bg.jpg')] bg-cover bg-center bg-no-repeat opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-background/80 to-background" />
        </div>

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto mt-10">

          <div className="text-6xl md:text-8xl font-black mb-8 leading-tight tracking-tight">
            <div className="overflow-hidden">
              <motion.span
                initial={{ y: '110%' }}
                animate={{ y: 0 }}
                transition={{ delay: 0.3, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                className="block text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]"
              >Искусство</motion.span>
            </div>
            <div className="overflow-hidden">
              <motion.span
                initial={{ y: '110%' }}
                animate={{ y: 0 }}
                transition={{ delay: 0.48, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                className="block bg-gradient-to-r from-amber-300 via-amber-500 to-orange-500 bg-clip-text text-transparent"
                style={{ WebkitBackgroundClip: 'text', paddingRight: '0.15em' }}
              >в каждом блюде</motion.span>
            </div>
          </div>

          <div className="overflow-hidden mb-12">
            <motion.p
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.68, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="text-xl text-gray-400 max-w-2xl mx-auto font-light"
            >
              Премиальный опыт, где современная эстетика встречается с непревзойденными кулинарными шедеврами.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
          >
            <Button
              onClick={() => onNavigate('order', 'reservation')}
              className="bg-gradient-to-r from-amber-500 to-orange-600 text-black font-bold px-10 py-7 text-lg rounded-full glow-amber hover:scale-105 transition-transform duration-300"
            >
              Забронировать стол
              <ArrowRight size={20} className="ml-2" />
            </Button>
            <Button
              variant="outline"
              onClick={() => onNavigate('order', 'delivery')}
              className="border-white/20 text-white bg-white/5 backdrop-blur-md hover:bg-white/10 hover:border-amber-500/50 px-10 py-7 text-lg rounded-full transition-all duration-300"
            >
              <ShoppingBag size={20} className="mr-2" />
              Доставка
            </Button>
          </motion.div>
        </div>
      </motion.section>

      {/* Menu Section */}
      <section id="menu" className="py-32 px-4 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Reveal><span className="text-amber-500 text-sm font-bold tracking-[0.2em] uppercase">Наше меню</span></Reveal>
            <Reveal delay={0.1}><h2 className="text-5xl font-black mt-4 mb-6">Гастрономическое шоу</h2></Reveal>
            <Reveal delay={0.2}><div className="w-24 h-1 bg-gradient-to-r from-amber-500 to-orange-500 mx-auto rounded-full" /></Reveal>
          </div>

          {/* Filter */}
          <div className="flex flex-wrap justify-center gap-4 mb-16 relative z-20">
            {menuCategories.map((category) => (
              <motion.button
                key={category.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveCategory(category.id)}
                className={`px-8 py-3 rounded-full text-sm font-medium transition-all duration-300 ${activeCategory === category.id
                  ? 'bg-amber-500 text-black glow-amber border border-transparent'
                  : 'glassmorphism text-gray-400 hover:text-white hover:border-amber-500/30'
                  }`}
              >
                {category.name} <span className="opacity-50 ml-1">({category.count})</span>
              </motion.button>
            ))}
          </div>

          {/* Сортировка по цене */}
          <div className="flex justify-center gap-3 mb-10">
            {[
              { key: 'asc',  label: '↑ Сначала дешевле' },
              { key: 'desc', label: '↓ Сначала дороже' },
            ].map(({ key, label }) => (
              <motion.button
                key={key}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPriceSort(priceSort === key ? null : key)}
                className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  priceSort === key
                    ? 'bg-amber-500 text-black glow-amber border border-transparent'
                    : 'glassmorphism text-gray-400 hover:text-white hover:border-amber-500/30'
                }`}
              >
                {label}
              </motion.button>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
            {filteredDishes.map((dish, index) => (
              <motion.div
                key={`${dish.id}-${activeCategory}-${priceSort}`}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: Math.min(index * 0.04, 0.3) }}
                className="group relative glassmorphism-dark rounded-2xl overflow-hidden hover:border-amber-500/50 transition-colors duration-500 flex flex-row sm:flex-col"
              >
                <div className="relative w-32 sm:w-full h-32 sm:h-52 shrink-0 overflow-hidden">
                  <motion.div whileHover={{ scale: 1.08 }} transition={{ duration: 0.6 }} className="w-full h-full">
                    <img src={dish.image_url} alt={dish.name} className="w-full h-full object-cover" />
                  </motion.div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 hidden sm:block" />

                  {/* Название и тег — только на десктопе поверх картинки */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 hidden sm:block">
                    {dish.tag && (
                      <span className="inline-block px-2 py-0.5 mb-2 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                        {dish.tag}
                      </span>
                    )}
                    <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors leading-tight">
                      {dish.name}
                    </h3>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Название показываем только в мобильном горизонтальном виде */}
                    <p className="font-bold text-white sm:hidden mb-1 leading-tight">{dish.name}</p>
                    <p className="text-gray-400 text-xs sm:text-sm line-clamp-2 mb-3 font-light leading-relaxed">{dish.description}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-lg sm:text-2xl font-black text-white">{dish.price} ₽</span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star size={11} className="text-amber-400 fill-amber-400" />
                        <span className="text-xs text-gray-400">{dish.rating}</span>
                      </div>
                    </div>
                    {cart.find(c => c.id === dish.id) ? (
                      <div className="flex items-center gap-1 bg-black/60 rounded-full p-0.5 border border-amber-500/30">
                        <button onClick={(e) => { e.stopPropagation(); removeFromCart(dish.id); }} className="w-7 h-7 flex items-center justify-center hover:text-amber-500"><Minus size={13} /></button>
                        <span className="font-bold text-xs w-4 text-center">{cart.find(c => c.id === dish.id)?.quantity}</span>
                        <button onClick={(e) => { e.stopPropagation(); addToCart(dish.id); }} className="w-7 h-7 flex items-center justify-center bg-amber-500 text-black rounded-full"><Plus size={13} /></button>
                      </div>
                    ) : (
                      <button onClick={(e) => { e.stopPropagation(); addToCart(dish.id); }} className="w-9 h-9 rounded-full glassmorphism flex items-center justify-center text-amber-500 hover:bg-amber-500 hover:text-black transition-all">
                        <Plus size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-24 px-4 bg-black/40 relative z-10 border-t border-white/5" id="reviews">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row gap-16 items-start">

            {/* Reviews Form */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="w-full md:w-1/3 glassmorphism-dark p-8 rounded-[2rem] border border-white/5 sticky top-28"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center">
                  <MessageSquare size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Оставьте отзыв</h3>
                  <p className="text-gray-400 text-sm">Ваше мнение делает нас лучше</p>
                </div>
              </div>

              <form onSubmit={handleSubmitReview} className="space-y-6">
                <div>
                  <label className="text-xs uppercase tracking-widest text-gray-500 mb-2 block">Ваше имя</label>
                  <input
                    type="text" required
                    value={newReviewName} onChange={e => setNewReviewName(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 h-12 rounded-xl px-4 text-white focus:border-amber-500/50 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest text-gray-500 mb-2 block">Оценка</label>
                  <div className="flex gap-2">
                    {[1,2,3,4,5].map(v => (
                      <button type="button" key={v} onClick={() => setNewReviewRating(v)} className="hover:scale-110 transition-transform">
                        <Star size={24} className={newReviewRating >= v ? "text-amber-500 fill-amber-500" : "text-gray-600"} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest text-gray-500 mb-2 block">Комментарий</label>
                  <textarea
                    required rows={4}
                    value={newReviewText} onChange={e => setNewReviewText(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-amber-500/50 outline-none transition-colors resize-none"
                  />
                </div>
                <Button type="submit" disabled={isSubmittingReview} className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold h-12 rounded-xl flex items-center justify-center gap-2">
                  {isSubmittingReview ? "Отправка..." : "Отправить"} <Send size={16} />
                </Button>
              </form>
            </motion.div>

            {/* Reviews List */}
            <div className="w-full md:w-2/3 flex flex-col gap-6">
              <Reveal><h2 className="text-4xl font-black text-white mb-6">Говорят о <span className="text-amber-500">нас</span></h2></Reveal>

              <div className="flex flex-col gap-6 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
                <AnimatePresence>
                  {reviews.length === 0 ? (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-gray-500 text-lg">Пока нет отзывов. Станьте первым!</motion.p>
                  ) : (
                    reviews.map((rev, i) => (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.08, 0.4) }}
                        key={rev.id}
                        className="glassmorphism p-6 rounded-[2rem] border border-white/5 relative group hover:border-amber-500/30 transition-colors"
                      >
                        <Quote size={40} className="absolute top-6 right-6 text-white/5 group-hover:text-amber-500/10 transition-colors" />
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-black font-black text-xl shadow-lg">
                            {rev.author_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-lg font-bold text-white">{rev.author_name}</h4>
                            <div className="flex gap-1 mt-1">
                              {[...Array(5)].map((_, idx) => (
                                <Star key={idx} size={12} className={idx < rev.rating ? "text-amber-500 fill-amber-500" : "text-gray-600"} />
                              ))}
                            </div>
                          </div>
                          <span className="ml-auto text-xs text-gray-500">{new Date(rev.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-gray-300 font-light leading-relaxed">{rev.text}</p>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Interactive CTA Banner */}
      <section className="py-24 px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="relative rounded-[3rem] overflow-hidden group cursor-pointer"
            onClick={() => onNavigate('order', 'delivery', 'LOOK20')}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-orange-800" />
            <div className="absolute inset-0 bg-[url('/hero-bg.jpg')] bg-cover bg-center opacity-20 mix-blend-overlay group-hover:scale-110 transition-transform duration-1000" />
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-500" />

            <div className="relative p-12 md:p-20 text-center flex flex-col items-center">
              <span className="text-amber-300 font-bold tracking-[0.2em] uppercase mb-4">Специальное предложение</span>
              <h3 className="text-4xl md:text-6xl font-black text-white mb-8 group-hover:scale-105 transition-transform duration-500">
                Скидка 20% на первый заказ
              </h3>
              <div className="inline-flex items-center justify-center bg-white text-black px-10 py-5 rounded-full text-lg font-bold hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transition-shadow">
                Активировать LOOK20
                <ArrowRight className="ml-2" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>


      {/* Мобильная нижняя навигация */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/5" style={{background:'rgba(10,10,10,0.92)',backdropFilter:'blur(20px)'}}>
        <div className="flex items-center justify-around px-2 py-2">
          {[
            { icon: UtensilsCrossed, label: 'Меню', action: () => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' }) },
            { icon: Calendar, label: 'Бронь', action: () => onNavigate('order', 'reservation') },
            { icon: ShoppingBag, label: 'Доставка', action: () => onNavigate('order', 'delivery'), badge: cartTotal },
            { icon: User, label: 'О нас', action: () => onNavigate('about') },
            { icon: Phone, label: 'Контакты', action: () => onNavigate('contacts') },
          ].map(({ icon: Icon, label, action, badge }) => (
            <button key={label} onClick={action} className="flex flex-col items-center gap-1 px-3 py-2 text-gray-500 hover:text-amber-400 transition-colors relative">
              <div className="relative">
                <Icon size={20} strokeWidth={1.5} />
                {badge > 0 && <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-amber-500 text-black text-[8px] font-black flex items-center justify-center">{badge}</span>}
              </div>
              <span className="text-[9px] uppercase tracking-wide font-medium">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
