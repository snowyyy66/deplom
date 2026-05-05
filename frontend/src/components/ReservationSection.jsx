import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, Calendar as CalendarIcon } from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { TableMap } from './TableMap';

const QUICK_WISHES = ["Детский стул", "Тихая зона", "День рождения", "Аллергия", "Сюрприз"];

const STEPS = [
  { label: "СТОЛ" },
  { label: "ДАННЫЕ" },
  { label: "ГОТОВО" },
];

export function ReservationSection({ userData, onSuccess, onBack }) {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1); // 1 = вперёд, -1 = назад
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [reservationData, setReservationData] = useState({
    date: undefined,
    time: '',
    guests: 2,
    table_number: undefined,
    name: userData.name || '',
    phone: userData.phone || '',
    notes: ''
  });
  const [availability, setAvailability] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (step === 3) {
      confetti({
        particleCount: 180,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#f59e0b', '#f97316', '#ffedd5', '#ffffff'],
      });
    }
  }, [step]);

  useEffect(() => {
    if (reservationData.date && reservationData.time) {
      const dateStr = format(reservationData.date, 'yyyy-MM-dd');
      api.checkAvailability(dateStr, reservationData.time)
        .then(setAvailability)
        .catch(console.error);
    }
  }, [reservationData.date, reservationData.time]);

  const goTo = (next) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!reservationData.date) return;
    try {
      await api.createReservation({
        user_id: userData.id ?? null,
        name: reservationData.name, phone: reservationData.phone,
        date: format(reservationData.date, 'yyyy-MM-dd'), time: reservationData.time,
        guests_count: reservationData.guests, table_number: reservationData.table_number, notes: reservationData.notes || null,
      });
      goTo(3);
      onSuccess();
    } catch (err) {
      setError(err.message || 'Ошибка бронирования. Попробуйте ещё раз.');
    }
  };

  const variants = {
    enter: (d) => ({ opacity: 0, x: d * 60 }),
    center: { opacity: 1, x: 0 },
    exit: (d) => ({ opacity: 0, x: d * -60 }),
  };

  return (
    <div className="w-full relative">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-0 mb-10">
        {STEPS.map((s, i) => {
          const num = i + 1;
          const isActive = step === num;
          const isDone = step > num;
          return (
            <div key={num} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300",
                  isActive ? "bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.5)]" :
                    isDone ? "bg-white/20 text-white" :
                      "bg-white/5 text-gray-600 border border-white/10"
                )}>
                  {isDone ? <Check className="w-3.5 h-3.5" /> : num}
                </div>
                <span className={cn(
                  "text-[9px] uppercase tracking-[0.2em] font-black transition-colors duration-300",
                  isActive ? "text-amber-500" : isDone ? "text-white/50" : "text-gray-700"
                )}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn(
                  "w-16 h-px mb-5 mx-2 transition-all duration-500",
                  isDone ? "bg-white/20" : "bg-white/5"
                )} />
              )}
            </div>
          );
        })}
      </div>

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.25, ease: "easeInOut" }}
        >
          {step === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12 items-stretch w-full">
              <TableMap
                availability={availability}
                selectedTable={reservationData.table_number}
                onTableSelect={(num) => setReservationData(prev => ({ ...prev, table_number: num }))}
              />
              <div className="rounded-[2rem] p-8 space-y-8 h-fit border border-white/[0.08]" style={{background:'rgba(255,255,255,0.03)',backdropFilter:'blur(32px)'}}>
                <h3 className="text-xl font-semibold text-white">Выбор стола</h3>
                <div className="space-y-8">
                  <div className="space-y-3">
                    <Label className="text-[10px] uppercase tracking-[0.2em] text-amber-500/80 font-medium">ДАТА ВИЗИТА</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" className="w-full h-14 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-6 text-left justify-start font-light text-base hover:bg-white/8 transition-all outline-none text-white">
                          {reservationData.date ? format(reservationData.date, "d MMMM", { locale: ru }) : "Выберите дату"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 border-white/10 bg-black shadow-2xl rounded-2xl z-[200]" side={isDesktop ? 'right' : 'bottom'} align="start" sideOffset={8}>
                        <CalendarPicker mode="single" selected={reservationData.date} onSelect={(date) => setReservationData({ ...reservationData, date })} locale={ru} disabled={(d) => d < new Date()} className="p-4 bg-black text-white"
                          classNames={{
                            day: cn("text-amber-500/80 hover:bg-amber-500 hover:text-black transition-all rounded-xl w-10 h-10 flex items-center justify-center text-sm font-medium"),
                            day_selected: "bg-amber-500 text-black font-black shadow-[0_0_20px_rgba(245,158,11,0.5)] !opacity-100",
                            day_today: "text-white border border-amber-500/50"
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] uppercase tracking-[0.2em] text-amber-500/80 font-medium">ВРЕМЯ</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {['11:00', '13:30', '16:00', '18:00', '19:30', '21:00', '22:30', '00:00'].map((time) => (
                        <button key={time} type="button" onClick={() => setReservationData({ ...reservationData, time })} className={cn("h-11 rounded-lg border transition-all text-xs font-black tracking-widest", reservationData.time === time ? 'bg-amber-500 text-black border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.4)]' : 'border-white/10 text-gray-600 hover:border-white/20')}>{time}</button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] uppercase tracking-[0.2em] text-amber-500/80 font-medium">ГОСТИ</Label>
                    <div className="flex items-center gap-4 bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10 h-14 justify-between px-8">
                      <button type="button" onClick={() => setReservationData({ ...reservationData, guests: Math.max(1, reservationData.guests - 1) })} className="text-2xl text-gray-600 hover:text-white">－</button>
                      <div className="text-2xl font-black text-white">{reservationData.guests}</div>
                      <button type="button" onClick={() => setReservationData({ ...reservationData, guests: Math.min(12, reservationData.guests + 1) })} className="text-2xl text-gray-600 hover:text-white">＋</button>
                    </div>
                  </div>
                </div>
                <div className="pt-8 border-t border-white/5 space-y-6">
                  <div className="flex justify-between items-end px-2">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-gray-600 font-black">ВАШ СТОЛ</p>
                    <p className="text-6xl font-black text-amber-500 leading-none tracking-tighter">{reservationData.table_number || "—"}</p>
                  </div>
                  <Button disabled={!reservationData.date || !reservationData.time || !reservationData.table_number} onClick={() => goTo(2)} className="w-full h-16 bg-amber-500 hover:bg-amber-600 text-black text-xl font-black uppercase tracking-[0.2em] rounded-xl shadow-[0_20px_50px_rgba(245,158,11,0.3)] transition-all">ПРОДОЛЖИТЬ</Button>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} className="relative rounded-[2rem] p-10 lg:p-14 max-w-4xl mx-auto border border-white/[0.08] overflow-hidden" style={{background:'rgba(255,255,255,0.03)',backdropFilter:'blur(32px)'}}>
              <div className="absolute -top-20 -left-20 w-72 h-72 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
              <div className="absolute -bottom-16 -right-16 w-56 h-56 bg-orange-600/8 rounded-full blur-[80px] pointer-events-none" />
              <h2 className="text-3xl font-bold text-white mb-2 text-center tracking-tight relative z-10">Подтверждение брони</h2>
              <p className="text-sm text-gray-500 text-center font-light mb-12 relative z-10">Проверьте контактные данные</p>
              <div className="space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-3">
                    <Label className="text-[10px] uppercase tracking-[0.2em] text-amber-500/80 font-medium pl-1">ИМЯ</Label>
                    <Input required placeholder="Введите имя..." value={reservationData.name} onChange={(e) => setReservationData({ ...reservationData, name: e.target.value })} className="h-14 bg-white/5 backdrop-blur-sm border-white/10 rounded-xl px-6 text-base font-light focus:border-amber-500/40 focus:bg-white/8 text-white transition-all" />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] uppercase tracking-[0.2em] text-amber-500/80 font-medium pl-1">ТЕЛЕФОН</Label>
                    <Input required type="tel" placeholder="+7 (___) ___ __ __" value={reservationData.phone} onChange={(e) => setReservationData({ ...reservationData, phone: e.target.value })} className="h-14 bg-white/5 backdrop-blur-sm border-white/10 rounded-xl px-6 text-base font-light focus:border-amber-500/40 focus:bg-white/8 text-white transition-all" />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] uppercase tracking-[0.2em] text-amber-500/80 font-medium pl-1">ОСОБЫЕ ПОЖЕЛАНИЯ</Label>
                  <textarea placeholder="Например: детский стул, день рождения..." value={reservationData.notes} onChange={(e) => setReservationData({ ...reservationData, notes: e.target.value })} className="w-full h-36 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 text-base font-light focus:border-amber-500/40 focus:bg-white/8 outline-none resize-none transition-all mb-5 text-white" />
                  <div className="flex flex-wrap gap-3 justify-center">
                    {QUICK_WISHES.map(wish => (
                      <button key={wish} type="button" onClick={() => setReservationData(p => ({ ...p, notes: p.notes ? `${p.notes}, ${wish}` : wish }))} className="px-6 py-2.5 rounded-full bg-black border border-white/10 text-[10px] uppercase tracking-[0.2em] text-gray-500 hover:text-amber-500 transition-all font-black">+{wish}</button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-6 py-4 text-red-400 text-sm font-medium">
                    {error}
                  </div>
                )}

                <div className="flex gap-6 pt-2">
                  <Button type="button" variant="ghost" onClick={() => goTo(1)} className="flex-1 h-12 rounded-xl text-sm font-medium text-gray-500 hover:text-white transition-colors">Назад</Button>
                  <Button type="submit" className="flex-[2] h-12 bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold rounded-xl shadow-[0_8px_30px_rgba(245,158,11,0.3)] tracking-wide transition-all">Забронировать</Button>
                </div>
              </div>
            </form>
          )}

          {step === 3 && (
            <div className="text-center py-20 flex flex-col items-center justify-center min-h-[600px] rounded-[4rem] border border-white/[0.12] relative overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(40px)' }}>
              {/* Боковые световые линии */}
              <div className="absolute left-0 top-0 bottom-0 w-[1.5px] bg-gradient-to-b from-transparent via-amber-500/40 to-transparent pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-[1.5px] bg-gradient-to-b from-transparent via-amber-500/25 to-transparent pointer-events-none" />
              <div className="absolute -left-16 top-1/2 -translate-y-1/2 w-32 h-64 bg-amber-500/8 rounded-full blur-[60px] pointer-events-none" />
              <div className="absolute -right-16 top-1/2 -translate-y-1/2 w-32 h-64 bg-orange-500/6 rounded-full blur-[60px] pointer-events-none" />
              {/* Верхняя линия */}
              <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className="w-32 h-32 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-12 shadow-[0_0_80px_rgba(245,158,11,0.15)]"
              >
                <CalendarIcon className="text-amber-500 w-16 h-16" />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-6xl md:text-7xl font-black text-white mb-6 uppercase tracking-tighter italic"
              >
                СТОЛ ЗАБРОНИРОВАН!
              </motion.h2>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl text-gray-500 font-light mb-16 italic text-center max-w-xl"
              >
                Ждём вас в ресторане.<br />
                <span className="text-amber-500 font-black block mt-2 text-4xl not-italic">
                  СТОЛИК №{reservationData.table_number}
                  {reservationData.date && <> · {format(reservationData.date, 'd MMMM', { locale: ru })}</>}
                  {reservationData.time && <> · {reservationData.time}</>}
                </span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="w-72"
              >
                <Button
                  onClick={onBack}
                  className="h-16 w-full bg-white/5 border border-white/10 rounded-xl font-black uppercase tracking-[0.3em] hover:bg-white/10 text-white"
                >
                  На главную
                </Button>
              </motion.div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
