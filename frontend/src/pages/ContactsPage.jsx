import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, MapPin, Phone, Mail, Instagram, MessageCircle,
  Clock, Send, Sparkles, ChevronRight, Globe, Heart, Navigation
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '../lib/api';
import { toast } from 'sonner';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const RESTAURANT_COORDS = [55.751574, 37.573856];

function RouteMap() {
  const mapRef = useRef(null);
  const instanceRef = useRef(null);

  useEffect(() => {
    if (instanceRef.current) return;
    const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: false }).setView(RESTAURANT_COORDS, 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '' }).addTo(map);
    map.attributionControl.setPrefix('');

    const icon = L.divIcon({
      className: '',
      html: `<div style="
        width:42px;height:42px;border-radius:50% 50% 50% 0;
        background:linear-gradient(135deg,#f59e0b,#ea580c);
        transform:rotate(-45deg);border:3px solid #fff;
        box-shadow:0 4px 15px rgba(245,158,11,0.6)">
        <span style="display:block;transform:rotate(45deg);text-align:center;line-height:36px;font-size:14px;font-weight:900;color:#000;font-family:sans-serif">LOOK</span>
      </div>`,
      iconSize: [42, 42], iconAnchor: [21, 42],
    });

    L.marker(RESTAURANT_COORDS, { icon })
      .addTo(map)
      .bindPopup('<b style="color:#f59e0b">Ресторан LOOK</b><br>ул. Гастрономическая, д. 1', { maxWidth: 200 })
      .openPopup();

    instanceRef.current = map;
    return () => { map.remove(); instanceRef.current = null; };
  }, []);

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
}

const contactCards = [
  {
    icon: MapPin,
    title: 'Наш адрес',
    value: 'г. Москва, ул. Гастрономическая, д. 1',
    subtitle: 'Рядом с м. Арбатская',
    gradient: 'from-amber-500 to-orange-600',
    bg: 'bg-amber-500/10',
  },
  {
    icon: Phone,
    title: 'Телефон',
    value: '+7 (999) 123-45-67',
    subtitle: 'Ежедневно с 10:00 до 00:00',
    gradient: 'from-green-500 to-emerald-600',
    bg: 'bg-green-500/10',
  },
  {
    icon: Mail,
    title: 'Email',
    value: 'hello@lookrestaurant.com',
    subtitle: 'Ответим в течение часа',
    gradient: 'from-blue-500 to-indigo-600',
    bg: 'bg-blue-500/10',
  },
];

const schedule = [
  { day: 'Понедельник — Четверг', time: '12:00 — 23:00' },
  { day: 'Пятница', time: '12:00 — 02:00' },
  { day: 'Суббота', time: '11:00 — 02:00' },
  { day: 'Воскресенье', time: '11:00 — 23:00' },
];

const socials = [
  { icon: Instagram, label: 'Instagram', handle: '@look_restaurant', color: 'from-pink-500 to-purple-600' },
  { icon: MessageCircle, label: 'Telegram', handle: '@look_restoran', color: 'from-blue-400 to-cyan-500' },
];

export function ContactsPage({ onNavigate }) {
  const [formName, setFormName] = useState('');
  const [formContact, setFormContact] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName, contact: formContact, message: formMessage }),
      });
      setSent(true);
      setTimeout(() => setSent(false), 3000);
      setFormName('');
      setFormContact('');
      setFormMessage('');
    } catch {
      toast.error('Не удалось отправить сообщение');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden relative pb-20">
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-5%] left-[-8%] w-[42%] h-[50%] bg-amber-500/22 rounded-full blur-[110px]" />
        <div className="absolute top-[15%] right-[-8%] w-[40%] h-[50%] bg-orange-600/18 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-8%] left-[10%] w-[38%] h-[40%] bg-orange-500/14 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[35%] h-[38%] bg-amber-400/12 rounded-full blur-[90px]" />
      </div>

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

      <section className="relative pt-32 px-6 max-w-7xl mx-auto z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glassmorphism border border-white/10 mb-8">
            <Heart size={14} className="text-amber-400" />
            <span className="text-sm text-gray-300 tracking-wide uppercase font-medium">Мы рады каждому гостю</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-8 leading-tight tracking-tight">
            <span className="text-white">Будем</span>{' '}
            <span className="bg-gradient-to-r from-amber-300 via-amber-500 to-orange-500 bg-clip-text text-transparent">на связи</span>
          </h1>
          <p className="text-xl text-gray-400 font-light leading-relaxed">
            Если у вас есть пожелания, вопросы или вы хотите организовать мероприятие — свяжитесь с нами удобным способом.
          </p>
        </motion.div>

        {/* Контактные карточки */}
        <div className="grid md:grid-cols-3 gap-5 mb-20">
          {contactCards.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.12, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -6 }}
              className="group relative rounded-2xl p-7 overflow-hidden cursor-default border border-white/[0.12]"
              style={{background:'rgba(255,255,255,0.07)',backdropFilter:'blur(24px)'}}
            >
              {/* Верхняя линия */}
              <div className={`absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r ${card.gradient}`} />
              {/* Свет с двух сторон */}
              <div className="absolute left-0 top-0 bottom-0 w-[1.5px] bg-gradient-to-b from-transparent via-white/25 to-transparent" />
              <div className="absolute right-0 top-0 bottom-0 w-[1.5px] bg-gradient-to-b from-transparent via-white/15 to-transparent" />
              <div className={`absolute -left-8 top-1/2 -translate-y-1/2 w-16 h-24 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full blur-[30px] bg-gradient-to-r ${card.gradient} pointer-events-none`} />
              <div className={`absolute -right-8 top-1/2 -translate-y-1/2 w-16 h-24 opacity-0 group-hover:opacity-80 transition-opacity duration-500 rounded-full blur-[30px] bg-gradient-to-l ${card.gradient} pointer-events-none`} />

              {/* Hover glow */}
              <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-2xl`} />

              <div className="relative z-10">
                {/* Иконка */}
                <card.icon size={24} strokeWidth={1.5} className="text-amber-500 mb-6 group-hover:scale-110 transition-transform duration-300" />

                {/* Разделитель */}
                <div className={`h-px bg-gradient-to-r ${card.gradient} opacity-40 mb-5`} />

                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-600 mb-2 font-medium">{card.title}</p>
                <p className="text-lg font-bold text-white leading-snug group-hover:text-amber-400 transition-colors duration-300">{card.value}</p>
                <p className="text-sm text-gray-600 mt-1">{card.subtitle}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-20 text-left">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            {/* Часы работы */}
            <div className="relative rounded-2xl overflow-hidden border border-white/[0.12]" style={{background:'rgba(255,255,255,0.07)',backdropFilter:'blur(24px)'}}>
              <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-amber-500 to-orange-500" />
              <div className="absolute left-0 top-0 bottom-0 w-[1.5px] bg-gradient-to-b from-transparent via-white/25 to-transparent pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-[1.5px] bg-gradient-to-b from-transparent via-white/15 to-transparent pointer-events-none" />
              <div className="flex items-center gap-3 px-7 py-5 border-b border-white/5">
                <Clock size={16} strokeWidth={1.5} className="text-amber-500" />
                <span className="text-xs uppercase tracking-[0.2em] text-gray-500 font-medium">Часы работы</span>
                <span className="ml-auto text-xs text-gray-700">Ежедневно</span>
              </div>
              {schedule.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.6, ease: [0.16,1,0.3,1] }}
                  className="group flex justify-between items-center px-7 py-4 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors"
                >
                  <span className="text-gray-500 text-sm font-light group-hover:text-white transition-colors">{item.day}</span>
                  <span className="text-amber-400 font-bold tracking-wider text-sm tabular-nums">{item.time}</span>
                </motion.div>
              ))}
            </div>

            {/* Соцсети */}
            <div className="relative rounded-2xl overflow-hidden border border-white/[0.12]" style={{background:'rgba(255,255,255,0.07)',backdropFilter:'blur(24px)'}}>
              <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-amber-500 to-orange-500" />
              <div className="absolute left-0 top-0 bottom-0 w-[1.5px] bg-gradient-to-b from-transparent via-white/25 to-transparent pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-[1.5px] bg-gradient-to-b from-transparent via-white/15 to-transparent pointer-events-none" />
              <div className="flex items-center gap-3 px-7 py-5 border-b border-white/5">
                <Globe size={16} strokeWidth={1.5} className="text-amber-500" />
                <span className="text-xs uppercase tracking-[0.2em] text-gray-500 font-medium">Мы в соцсетях</span>
              </div>
              {socials.map((social, i) => (
                <motion.a
                  key={i} href="#"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ x: 5 }}
                  className="flex items-center gap-4 px-7 py-4 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors group"
                >
                  <social.icon size={17} strokeWidth={1.5} className="text-gray-600 group-hover:text-amber-400 transition-colors shrink-0" />
                  <span className="text-gray-300 text-sm font-medium group-hover:text-white transition-colors">{social.label}</span>
                  <span className="ml-auto text-gray-700 text-sm">{social.handle}</span>
                  <ChevronRight size={13} className="text-gray-800 group-hover:text-amber-500 transition-colors" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="rounded-2xl p-8 md:p-10 border border-white/[0.12] relative overflow-hidden"
          style={{background:'rgba(255,255,255,0.07)',backdropFilter:'blur(24px)'}}
          >
            <div className="absolute -top-16 -right-16 w-56 h-56 bg-amber-500/15 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
            <div className="absolute left-0 top-0 bottom-0 w-[1.5px] bg-gradient-to-b from-transparent via-amber-500/30 to-transparent pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-[1.5px] bg-gradient-to-b from-transparent via-amber-500/20 to-transparent pointer-events-none" />
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                <Send size={22} className="text-amber-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Напишите нам</h2>
                <p className="text-gray-500 text-sm">Ответим в течение часа</p>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {sent ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-16"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 mx-auto flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(34,197,94,0.3)]"
                  >
                    <Sparkles size={36} className="text-white" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-white mb-3">Отправлено!</h3>
                  <p className="text-gray-400">Мы свяжемся с вами в ближайшее время</p>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit}
                  className="space-y-5 relative z-10"
                >
                  <div>
                    <label className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-2 block font-medium">Имя</label>
                    <input
                      type="text" required
                      value={formName} onChange={e => setFormName(e.target.value)}
                      placeholder="Ваше имя"
                      className="w-full bg-white/5 backdrop-blur-sm border border-white/10 h-14 rounded-xl px-5 text-white focus:border-amber-500/40 focus:bg-white/8 outline-none transition-all placeholder:text-gray-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-2 block font-medium">Email или Телефон</label>
                    <input
                      type="text" required
                      value={formContact} onChange={e => setFormContact(e.target.value)}
                      placeholder="Удобный способ связи"
                      className="w-full bg-white/5 backdrop-blur-sm border border-white/10 h-14 rounded-xl px-5 text-white focus:border-amber-500/40 focus:bg-white/8 outline-none transition-all placeholder:text-gray-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-2 block font-medium">Сообщение</label>
                    <textarea
                      required rows={4}
                      value={formMessage} onChange={e => setFormMessage(e.target.value)}
                      placeholder="Как мы можем помочь?"
                      className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 text-white placeholder:text-gray-600 focus:border-amber-500/40 focus:bg-white/8 outline-none resize-none font-light transition-all"
                    />
                  </div>
                  <Button type="submit" disabled={sending} className="w-full h-16 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-bold uppercase tracking-wider text-sm shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_40px_rgba(245,158,11,0.4)] transition-all">
                    <Send size={18} className="mr-2" />
                    {sending ? 'Отправка...' : 'Отправить сообщение'}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Карта проезда */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-20 glassmorphism-dark rounded-3xl overflow-hidden border border-white/5"
        >
          <div className="flex items-center gap-3 px-8 py-5 border-b border-white/5">
            <Navigation size={20} className="text-amber-400" />
            <h3 className="text-xl font-bold text-white">Как нас найти</h3>
            <span className="ml-auto text-sm text-gray-500">ул. Гастрономическая, д. 1 · м. Арбатская</span>
          </div>
          <div className="h-[380px] w-full">
            <RouteMap />
          </div>
          <div className="px-8 py-4 flex flex-wrap gap-6 text-sm text-gray-400 border-t border-white/5">
            <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" /><span className="text-white">м. Арбатская</span> — 5 мин пешком</span>
            <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" /><span className="text-white">Парковка</span> — во дворе, бесплатно</span>
            <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" /><span className="text-white">Автобус</span> — ост. «Гастрономическая»</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="rounded-[3rem] overflow-hidden relative cursor-pointer group mb-8"
          onClick={() => onNavigate('order', 'reservation')}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-orange-800" />
          <div className="absolute inset-0 bg-[url('/about-interior.jpg')] bg-cover bg-center opacity-20 mix-blend-overlay group-hover:scale-110 transition-transform duration-1000" />
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-500" />
          <div className="relative p-12 md:p-16 text-center flex flex-col items-center">
            <span className="text-amber-300 font-bold tracking-[0.2em] uppercase mb-4 text-sm">Не откладывайте</span>
            <h3 className="text-3xl md:text-5xl font-black text-white mb-6 group-hover:scale-105 transition-transform duration-500">
              Забронируйте столик прямо сейчас
            </h3>
            <div className="inline-flex items-center justify-center bg-white text-black px-10 py-5 rounded-full text-lg font-bold hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transition-shadow">
              Забронировать
              <ChevronRight className="ml-2" />
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
