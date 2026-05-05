import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';
import { ArrowLeft, Flame, Gem, Trophy, Heart, Sparkles, Gift, Wine, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';

// const celebrityGuests = [
//   {
//     name: 'Криштиану Роналду',
//     role: 'Легенда мирового футбола',
//     image: '/guest-ronaldo.jpg',
//     quote: 'Лучший ресторан, в котором я когда-либо бывал. Невероятная атмосфера и изысканные блюда.',
//     date: 'Октябрь 2024',
//     revealed: true,
//   },
//   {
//     name: 'Хасбик',
//     role: 'Интернет-звезда и боец',
//     image: '/guest-hasbik-final.png',
//     quote: 'Атмосфера — огонь! Сюда хочется возвращаться снова и снова. Еда на высшем уровне!',
//     date: 'Ноябрь 2024',
//     revealed: true,
//   },
//   {
//     name: 'Джейсон Стетхем',
//     role: 'Голливудский актёр',
//     image: '/guest-statham.png',
//     quote: 'Можно забыть вкус еды, но нельзя забыть место, где тебя уважают. LOOK — это уровень.',
//     date: 'Декабрь 2024',
//     revealed: true,
//   },
//   {
//     name: 'Михаил Литвин',
//     role: 'Блогер и предприниматель',
//     image: '/guest-litvin.png',
//     quote: 'Самый стильный ресторан, в котором я когда-либо был. Стейки — просто космос!',
//     date: 'Январь 2025',
//     revealed: true,
//   },
//   {
//     name: 'Влад Куертов',
//     role: 'Инфлюенсер',
//     image: '/guest-kuertov.png',
//     quote: 'Люкс-атмосфера и невероятные десерты. Рекомендую всем своим подписчикам!',
//     date: 'Февраль 2025',
//     revealed: true,
//   },
// ];

const galleryPhotos = [
  { src: '/about-interior.jpg', label: 'Интерьер', desc: 'Гармония света и тени' },
  { src: '/new-bar-1.jpg', label: 'Бар', desc: 'Авторские коктейли' },
  { src: '/hero-bg.jpg', label: 'Экстерьер', desc: 'Вечерний вид LOOK' },
  { src: '/new-details-1.jpg', label: 'Детали', desc: 'Роскошь в каждом штрихе' },
  { src: '/about-plating.jpg', label: 'Подача', desc: 'Филигранное мастерство' },
];

const creativeFeatures = [
  {
    icon: Flame, title: 'Живой огонь', desc: 'Готовим на открытом огне — хосперы, мангалы и дровяные печи создают неповторимый вкус.',
    gradient: 'from-red-500/20 to-orange-500/20', accent: 'text-orange-400', accentBg: 'bg-orange-500/20',
    stat: '800°C', statLabel: 'Температура хоспера'
  },
  {
    icon: Gem, title: 'Редкие ингредиенты', desc: 'Трюфели, японский вагю A5, шафран — мы ищем самые драгоценные продукты по всему миру.',
    gradient: 'from-violet-500/20 to-indigo-500/20', accent: 'text-violet-400', accentBg: 'bg-violet-500/20',
    stat: '12+', statLabel: 'Стран-поставщиков'
  },
  {
    icon: Trophy, title: 'Мишленовский уровень', desc: 'Наши шеф-повара прошли стажировки в 3-звёздочных ресторанах Европы и Азии.',
    gradient: 'from-amber-500/20 to-yellow-500/20', accent: 'text-amber-400', accentBg: 'bg-amber-500/20',
    stat: '7', statLabel: 'Наград в 2024'
  },
  {
    icon: Wine, title: 'Винная карта', desc: 'Более 300 позиций вин из 18 регионов мира. Персональный сомелье для каждого стола.',
    gradient: 'from-rose-500/20 to-pink-500/20', accent: 'text-rose-400', accentBg: 'bg-rose-500/20',
    stat: '300+', statLabel: 'Позиций вин'
  },
  {
    icon: Utensils, title: 'Авторская подача', desc: 'Каждое блюдо — произведение искусства. Мы уделяем внимание каждой детали на тарелке.',
    gradient: 'from-cyan-500/20 to-teal-500/20', accent: 'text-cyan-400', accentBg: 'bg-cyan-500/20',
    stat: '45+', statLabel: 'Блюд в меню'
  },
  {
    icon: Heart, title: 'Душевная атмосфера', desc: 'Живая музыка по выходным, приглушённый свет свечей и запах свежих цветов.',
    gradient: 'from-pink-500/20 to-red-500/20', accent: 'text-pink-400', accentBg: 'bg-pink-500/20',
    stat: '∞', statLabel: 'Тёплых моментов'
  },
];

export function AboutPage({ onNavigate, userData }) {
  const [easterEggFound, setEasterEggFound] = useState(false);
  const [promoStatus, setPromoStatus] = useState({
    look20_available: true,
    look15_available: false,
    has_found_easter_egg: false,
    lookrun_available: false,
  });

  useEffect(() => {
    if (userData.email) {
      api.getPromoStatus(userData.email).then(setPromoStatus).catch(console.error);
    }
  }, [userData.email]);

  const handleEasterEggClick = async () => {
    setEasterEggFound(true);
    if (userData.email && !promoStatus.has_found_easter_egg) {
      try {
        await api.markEasterEggAsFound(userData.email);
        setPromoStatus(prev => ({ ...prev, has_found_easter_egg: true }));
      } catch (err) {
        console.error("Failed to mark easter egg as found", err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden relative pb-20">
      {/* Background Ambient Glows — с двух сторон */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-5%] left-[-8%] w-[45%] h-[55%] bg-amber-500/22 rounded-full blur-[110px]" />
        <div className="absolute top-[20%] right-[-8%] w-[40%] h-[50%] bg-orange-600/18 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[5%] w-[40%] h-[45%] bg-orange-500/14 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[35%] h-[40%] bg-amber-400/12 rounded-full blur-[90px]" />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glassmorphism-dark border-b border-white/5 h-20 flex items-center">
        <div className="max-w-7xl mx-auto w-full px-6 grid grid-cols-3 items-center">
          <div>
            <button
              onClick={() => onNavigate('home')}
              className="w-12 h-12 rounded-full glassmorphism flex items-center justify-center hover:bg-white/10 transition-colors text-amber-500"
            >
              <ArrowLeft size={24} />
            </button>
          </div>
          <div className="flex justify-center">
            <img
              src="/logo.png" alt="Look"
              className="w-24 h-24 object-contain invert cursor-pointer drop-shadow-[0_0_15px_rgba(251,191,36,0.5)] hover:drop-shadow-[0_0_25px_rgba(251,191,36,0.8)] transition-all"
              onClick={() => onNavigate('home')}
            />
          </div>
          <div />
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 px-6 max-w-7xl mx-auto z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto mb-16"
        >
          <h1 className="text-5xl md:text-7xl font-black mb-8 leading-tight tracking-tighter">
            <span className="text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">Искусство</span>
            <br />
            <span className="bg-gradient-to-r from-amber-300 via-amber-500 to-orange-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(245,158,11,0.3)]">
              гастрономии
            </span>
          </h1>
          <p className="text-xl text-gray-400 font-light leading-relaxed">
            Мы — не просто ресторан. Мы команда энтузиастов, которые создают шедевры каждый день. Наша миссия — подарить вам незабываемые впечатления от каждого кусочка.
          </p>
        </motion.div>

        {/* ===== CREATIVE FEATURES GRID ===== */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-16 z-20">
          {creativeFeatures.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: i * 0.08, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -6 }}
              className="group relative rounded-2xl p-7 overflow-hidden cursor-default border border-white/[0.12]"
              style={{background:'rgba(255,255,255,0.07)',backdropFilter:'blur(24px)'}}
            >
              {/* Верхняя линия-акцент (gradient) */}
              <div className={`absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r ${feature.gradient.replace('/20','')}`} />
              {/* Свет с двух сторон */}
              <div className={`absolute left-0 top-0 bottom-0 w-[1.5px] bg-gradient-to-b from-transparent via-white/25 to-transparent`} />
              <div className={`absolute right-0 top-0 bottom-0 w-[1.5px] bg-gradient-to-b from-transparent via-white/15 to-transparent`} />
              <div className={`absolute -left-8 top-1/2 -translate-y-1/2 w-16 h-24 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full blur-[30px] bg-gradient-to-r ${feature.gradient} pointer-events-none`} />
              <div className={`absolute -right-8 top-1/2 -translate-y-1/2 w-16 h-24 opacity-0 group-hover:opacity-80 transition-opacity duration-500 rounded-full blur-[30px] bg-gradient-to-l ${feature.gradient} pointer-events-none`} />

              {/* Большая цифра — фоновый водяной знак */}
              <span className={`absolute -bottom-4 -right-2 text-[90px] font-black leading-none select-none ${feature.accent} opacity-[0.04] group-hover:opacity-[0.09] transition-opacity duration-500`}>
                {feature.stat}
              </span>

              {/* Hover glow */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl`} />

              <div className="relative z-10">
                {/* Иконка без фона — просто иконка с линией */}
                <div className="flex items-center justify-between mb-7">
                  <div className={`${feature.accent} group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon size={26} strokeWidth={1.5} />
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-black ${feature.accent} leading-none`}>{feature.stat}</div>
                    <div className="text-[9px] uppercase tracking-[0.15em] text-gray-600 mt-0.5">{feature.statLabel}</div>
                  </div>
                </div>

                {/* Тонкая разделяющая линия */}
                <div className={`h-px bg-gradient-to-r ${feature.gradient.replace('/20', '/40')} mb-5`} />

                <h3 className="text-lg font-bold text-white mb-2 tracking-tight">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed font-light">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ===== CELEBRITY GUESTS SECTION =====
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-32 mb-16 relative"
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <Crown className="text-amber-500" size={28} />
            <span className="text-amber-500 text-sm font-bold tracking-[0.2em] uppercase">Почётные гости</span>
            <Crown className="text-amber-500" size={28} />
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6 text-center">
            Кто <span className="text-amber-500">выбирает</span> LOOK
          </h2>
          <p className="text-gray-400 text-lg font-light text-center mb-16 max-w-2xl mx-auto">
            Наши двери всегда открыты для тех, кто ценит настоящее мастерство и незабываемые впечатления
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {celebrityGuests.map((guest, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -12, scale: 1.05 }}
                onClick={() => setSelectedGuest(i)}
                className="cursor-pointer group relative"
              >
                <div className={`relative rounded-[2rem] overflow-hidden aspect-[3/4] border-2 transition-all duration-500 ${
                  'border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.15)] hover:border-amber-500/60 hover:shadow-[0_0_40px_rgba(245,158,11,0.3)]'
                }`}>
                  <motion.img
                    src={guest.image}
                    alt={guest.name}
                    className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                  <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-amber-500 text-black text-[10px] font-black uppercase tracking-wider">
                    VIP
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3 className="text-lg font-bold text-white leading-tight mb-1">{guest.name}</h3>
                    <p className="text-xs text-amber-400 font-medium">{guest.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div> */}

        {/* Selected Guest Modal */}
        {/* <AnimatePresence>
          {selectedGuest !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
              onClick={() => setSelectedGuest(null)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 40, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 40, opacity: 0 }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="max-w-2xl w-full glassmorphism-dark rounded-[3rem] overflow-hidden border border-white/10 relative"
              >
                <button
                  onClick={() => setSelectedGuest(null)}
                  className="absolute top-6 right-6 z-20 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white hover:text-amber-500 transition-colors"
                >
                  <X size={20} />
                </button>
                <div className="h-[450px] relative overflow-hidden">
                  <motion.img
                    src={celebrityGuests[selectedGuest].image}
                    alt=""
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="w-full h-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="p-8 md:p-10 -mt-20 relative z-10"
                >
                  <p className="text-amber-500 text-xs font-bold tracking-[0.2em] uppercase mb-2">{celebrityGuests[selectedGuest].date}</p>
                  <h3 className="text-3xl md:text-4xl font-black text-white mb-2">{celebrityGuests[selectedGuest].name}</h3>
                  <p className="text-gray-400 mb-6">{celebrityGuests[selectedGuest].role}</p>
                  <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                    <p className="text-gray-300 italic font-light leading-relaxed text-lg">
                      «{celebrityGuests[selectedGuest].quote}»
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence> */}

        {/* ===== CULINARY TEAM SECTION ===== */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-32 relative"
        >
          <div className="grid md:grid-cols-2 gap-12 items-center text-left">
            <div>
              <span className="text-amber-500 text-sm font-bold tracking-[0.2em] uppercase mb-4 block">За каждой тарелкой стоит история</span>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-8 leading-tight">Команда, которая <span className="text-amber-500">творит чудеса</span></h2>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: '15+', label: 'Лет опыта' },
                  { value: '8', label: 'Шеф-поваров' },
                  { value: '50к+', label: 'Довольных гостей' },
                ].map((stat, i) => (
                  <div key={i} className="glassmorphism rounded-2xl p-4 text-center border border-white/5">
                    <div className="text-2xl font-black text-amber-400">{stat.value}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 80, clipPath: 'inset(100% 0 0 0)' }}
              whileInView={{ opacity: 1, y: 0, clipPath: 'inset(0% 0 0 0)' }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative group"
            >
              {/* Decorative corner frame */}
              <div className="absolute -top-4 -left-4 w-20 h-20 border-t-2 border-l-2 border-amber-500/40 rounded-tl-2xl transition-all duration-700 group-hover:w-28 group-hover:h-28 group-hover:border-amber-500/80" />
              <div className="absolute -bottom-4 -right-4 w-20 h-20 border-b-2 border-r-2 border-amber-500/40 rounded-br-2xl transition-all duration-700 group-hover:w-28 group-hover:h-28 group-hover:border-amber-500/80" />

              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <motion.img
                  src="/about-chef.jpg"
                  alt="Our Team"
                  className="w-full"
                  whileHover={{ scale: 1.08 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <p className="text-amber-400 text-xs font-bold tracking-[0.3em] uppercase">Look Kitchen</p>
                  <p className="text-white/60 text-sm mt-1">Страсть к совершенству</p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* ===== GALLERY WITH EASTER EGG ===== */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-32 mb-16 relative"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center justify-center gap-4 mb-4">
              <Sparkles className="text-amber-500" size={24} />
              <span className="text-amber-500 text-sm font-bold tracking-[0.2em] uppercase">Галерея</span>
              <Sparkles className="text-amber-500" size={24} />
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 drop-shadow-[0_0_20px_rgba(255,255,255,0.2)] text-center">Мир через объектив <span className="text-amber-500">LOOK</span></h2>
            <p className="text-gray-400 text-lg font-light text-center mb-12 max-w-2xl mx-auto">Каждое мгновение в нашем ресторане — произведение искусства</p>
          </motion.div>

          {/* Мобильная галерея — простая сетка */}
          <div className="grid grid-cols-2 gap-3 sm:hidden mb-4">
            {galleryPhotos.map((photo, i) => (
              <div key={i} className="relative rounded-2xl overflow-hidden aspect-square">
                <img src={photo.src} alt={photo.label} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <p className="absolute bottom-2 left-3 text-white text-xs font-bold">{photo.label}</p>
              </div>
            ))}
          </div>

          {/* Bento-style 5-photo grid — только десктоп */}
          <div className="hidden sm:grid grid-cols-6 auto-rows-[260px] gap-3 p-5 rounded-[2.5rem] border border-white/[0.08] shadow-2xl relative" style={{background:'rgba(255,255,255,0.04)',backdropFilter:'blur(16px)'}}>

            {[
              { span: 'col-span-3 row-span-2', i: 0, delay: 0,    large: true },
              { span: 'col-span-2 row-span-1', i: 1, delay: 0.15, large: false },
              { span: 'col-span-1 row-span-1', i: 2, delay: 0.25, large: false },
              { span: 'col-span-2 row-span-1', i: 3, delay: 0.35, large: false },
              { span: 'col-span-1 row-span-1', i: 4, delay: 0.45, large: false },
            ].map(({ span, i, delay, large }) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 1.06, filter: 'blur(12px)' }}
                whileInView={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay }}
                whileHover={{ scale: 1.03 }}
                onClick={i === 3 && userData.email && !promoStatus.has_found_easter_egg ? handleEasterEggClick : undefined}
                className={`${span} rounded-2xl overflow-hidden group relative ${i === 3 && userData.email && !promoStatus.has_found_easter_egg ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <img
                  src={galleryPhotos[i].src}
                  alt={galleryPhotos[i].label}
                  className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-[1.4s] ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-500" />
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: delay + 0.4, duration: 0.5 }}
                  className={`absolute bottom-0 left-0 right-0 ${large ? 'p-8' : 'p-4'}`}
                >
                  <p className="text-[10px] text-amber-400 font-bold tracking-[0.25em] uppercase mb-1 opacity-80">{galleryPhotos[i].desc}</p>
                  <p className={`font-bold text-white ${large ? 'text-2xl' : 'text-sm'}`}>{galleryPhotos[i].label}</p>
                </motion.div>
                <div className="absolute inset-0 border border-white/0 group-hover:border-amber-500/20 rounded-2xl transition-all duration-700 pointer-events-none" />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 50 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 100 }}
          className="mt-20 p-12 glassmorphism border border-amber-500/20 rounded-[3rem] bg-gradient-to-br from-amber-500/10 to-orange-500/5 shadow-[0_0_50px_rgba(245,158,11,0.15)] overflow-hidden relative"
        >
          <div className="absolute inset-0 bg-[url('/about-interior.jpg')] opacity-10 bg-cover bg-center mix-blend-overlay" />
          <h2 className="text-3xl md:text-5xl font-black mb-6 relative z-10">Готовы к <span className="text-amber-500 text-glow">впечатлениям?</span></h2>
          <Button
            onClick={() => onNavigate('order', 'reservation')}
            className="relative z-10 bg-amber-500 hover:bg-amber-400 text-black font-black px-12 py-8 text-xl rounded-full tracking-widest uppercase transition-all shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:shadow-[0_0_50px_rgba(245,158,11,0.6)] hover:-translate-y-1"
          >
            Забронировать стол
          </Button>
        </motion.div>
      </section>

      {/* ===== EASTER EGG MODAL ===== */}
      <AnimatePresence>
        {easterEggFound && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
            onClick={() => setEasterEggFound(false)}
          >
            <motion.div
              initial={{ scale: 0.5, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0.5, rotate: 10, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-lg w-full text-center relative"
            >
              {/* Glow background */}
              <div className="absolute inset-0 bg-amber-500/20 blur-[100px] rounded-full" />

              <div className="relative glassmorphism-dark rounded-[3rem] p-10 md:p-14 border-2 border-amber-500/30 shadow-[0_0_80px_rgba(245,158,11,0.25)] overflow-hidden">
                {/* Top decorative line */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />

                {/* Animated sparkles background */}
                <div className="absolute inset-0 overflow-hidden">
                  {[...Array(20)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1 h-1 bg-amber-400 rounded-full"
                      initial={{
                        x: Math.random() * 400,
                        y: Math.random() * 500,
                        opacity: 0
                      }}
                      animate={{
                        opacity: [0, 1, 0],
                        scale: [0, 1.5, 0],
                      }}
                      transition={{
                        duration: 2 + Math.random() * 2,
                        repeat: Infinity,
                        delay: Math.random() * 2
                      }}
                    />
                  ))}
                </div>

                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                  className="relative z-10"
                >
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 mx-auto flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(245,158,11,0.5)]">
                    <Gift className="text-black w-12 h-12" />
                  </div>

                  <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
                    Поздравляем!
                  </h2>
                  <p className="text-lg text-gray-300 mb-8 font-light leading-relaxed">
                    Вы нашли секретную пасхалку! В награду — персональный промокод на скидку <span className="text-amber-400 font-bold">15%</span> на любой заказ
                  </p>

                  <div className="bg-black/50 rounded-2xl p-6 border-2 border-dashed border-amber-500/40 mb-8">
                    <p className="text-xs text-gray-500 uppercase tracking-[0.3em] mb-2">Ваш промокод</p>
                    <p className="text-4xl md:text-5xl font-black bg-gradient-to-r from-amber-300 via-amber-500 to-orange-500 bg-clip-text text-transparent tracking-widest">
                      LOOK15
                    </p>
                  </div>

                  <Button
                    onClick={() => {
                      setEasterEggFound(false);
                      onNavigate('order', 'delivery', 'LOOK15');
                    }}
                    className="bg-gradient-to-r from-amber-500 to-orange-600 text-black font-black px-10 py-6 text-lg rounded-full uppercase tracking-wider shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:shadow-[0_0_50px_rgba(245,158,11,0.6)] hover:-translate-y-1 transition-all"
                  >
                    <Sparkles size={20} className="mr-2" />
                    Использовать сейчас
                  </Button>

                  <button
                    onClick={() => setEasterEggFound(false)}
                    className="block mx-auto mt-4 text-gray-500 hover:text-white transition-colors text-sm"
                  >
                    Закрыть и запомнить код
                  </button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
