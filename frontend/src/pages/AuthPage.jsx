import { useState } from 'react';
import { api } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function AuthPage({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [forgotStep, setForgotStep] = useState(1); // 1: email, 2: code, 3: new password
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const isLogin = mode === 'login';

  const handleForgotStep1 = async () => {
    if (!formData.email) {
      setError('Введите email');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.forgotPassword(formData.email);
      setForgotStep(2);
      setSuccess('Код отправлен на почту');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotStep2 = () => {
    if (resetCode.length !== 6) {
      setError('Введите 6-значный код');
      return;
    }
    setError(null);
    setForgotStep(3);
  };

  const handleForgotStep3 = async () => {
    if (!newPassword || newPassword.length < 6) {
      setError('Пароль должен быть не менее 6 символов');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.resetPassword({
        email: formData.email,
        code: resetCode,
        new_password: newPassword
      });
      setSuccess('Пароль успешно изменен');
      setTimeout(() => {
        setMode('login');
        setForgotStep(1);
        setSuccess(null);
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'forgot') return;

    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const { user } = await api.login(formData.email, formData.password);
        onAuth({ id: user.id, name: user.name, email: user.email, phone: user.phone, has_found_easter_egg: user.has_found_easter_egg });
      } else {
        const { user } = await api.register(formData.name, formData.email, formData.phone, formData.password);
        onAuth({ id: user.id, name: user.name, email: user.email, phone: user.phone, has_found_easter_egg: user.has_found_easter_egg });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderForgotFlow = () => (
    <div className="flex flex-col space-y-5">
      {forgotStep === 1 && (
        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
          <div className="space-y-2 group">
            <Label htmlFor="email" className="text-gray-500 flex items-center gap-2 text-xs uppercase tracking-widest group-focus-within:text-amber-500 transition-colors">
              <Mail size={14} /> Email для восстановления
            </Label>
            <Input
              id="email" type="email" placeholder="your@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="bg-black/50 border-white/8 text-white placeholder:text-white/15 h-14 rounded-xl focus:border-amber-500/40 transition-colors font-light px-5"
            />
          </div>
          <Button onClick={handleForgotStep1} disabled={loading} className="w-full bg-amber-500 text-black font-bold h-14 rounded-xl">
            {loading ? 'Отправка...' : 'Отправить код'}
          </Button>
        </motion.div>
      )}

      {forgotStep === 2 && (
        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
          <div className="space-y-2 group">
            <Label htmlFor="code" className="text-gray-500 flex items-center gap-2 text-xs uppercase tracking-widest group-focus-within:text-amber-500 transition-colors">
              <Lock size={14} /> Код из письма
            </Label>
            <Input
              id="code" type="text" placeholder="123456" maxLength={6}
              value={resetCode}
              onChange={(e) => setResetCode(e.target.value)}
              className="bg-black/50 border-white/8 text-white placeholder:text-white/15 h-14 rounded-xl focus:border-amber-500/40 transition-colors font-light text-center text-2xl tracking-[0.5em] px-5"
            />
          </div>
          <Button onClick={handleForgotStep2} className="w-full bg-amber-500 text-black font-bold h-14 rounded-xl">
            Подтвердить код
          </Button>
        </motion.div>
      )}

      {forgotStep === 3 && (
        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
          <div className="space-y-2 group">
            <Label htmlFor="new-password" className="text-gray-500 flex items-center gap-2 text-xs uppercase tracking-widest group-focus-within:text-amber-500 transition-colors">
              <Lock size={14} /> Новый пароль
            </Label>
            <Input
              id="new-password" type="password" placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="bg-black/50 border-white/8 text-white placeholder:text-white/15 h-14 rounded-xl focus:border-amber-500/40 transition-colors font-light px-5"
            />
          </div>
          <Button onClick={handleForgotStep3} disabled={loading} className="w-full bg-amber-500 text-black font-bold h-14 rounded-xl">
            {loading ? 'Смена пароля...' : 'Изменить пароль'}
          </Button>
        </motion.div>
      )}

      <button
        onClick={() => { setMode('login'); setForgotStep(1); setError(null); setSuccess(null); }}
        className="text-xs text-gray-500 hover:text-white transition-colors text-center"
      >
        Вернуться к входу
      </button>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden bg-background">

      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ x: [0, 70, 0], y: [0, -50, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[10%] left-[15%] w-[500px] h-[500px] bg-amber-500/8 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{ x: [0, -60, 0], y: [0, 60, 0], scale: [1, 1.3, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[5%] right-[10%] w-[600px] h-[600px] bg-orange-600/6 rounded-full blur-[150px]"
        />
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="absolute top-[50%] right-[30%] w-[300px] h-[300px] bg-violet-500/5 rounded-full blur-[100px]"
        />
      </div>      {/* Decorative geometric elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Vertical decorative lines - left side */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 2 }}
          className="absolute left-[8%] top-0 bottom-0 flex gap-4"
        >
          <div className="w-[1px] h-full bg-gradient-to-b from-transparent via-white/[0.04] to-transparent" />
          <div className="w-[1px] h-full bg-gradient-to-b from-transparent via-amber-500/[0.06] to-transparent mt-20" />
        </motion.div>

        {/* Vertical decorative lines - right side */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 2 }}
          className="absolute right-[8%] top-0 bottom-0 flex gap-4"
        >
          <div className="w-[1px] h-full bg-gradient-to-b from-transparent via-white/[0.04] to-transparent mt-10" />
          <div className="w-[1px] h-full bg-gradient-to-b from-transparent via-orange-500/[0.06] to-transparent" />
        </motion.div>

        {/* Horizontal accent lines */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 1, duration: 2, ease: [0.22, 1, 0.36, 1] }}
          className="absolute top-[20%] left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.03] to-transparent origin-center"
        />
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 1.3, duration: 2, ease: [0.22, 1, 0.36, 1] }}
          className="absolute bottom-[20%] left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.03] to-transparent origin-center"
        />

        {/* Small decorative crosses */}
        {[
          { x: '18%', y: '30%', delay: 0 },
          { x: '82%', y: '25%', delay: 1.5 },
          { x: '12%', y: '70%', delay: 3 },
          { x: '88%', y: '72%', delay: 4.5 },
        ].map((pos, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{ left: pos.x, top: pos.y }}
            animate={{ opacity: [0.1, 0.3, 0.1], rotate: [0, 90, 0] }}
            transition={{ duration: 6, repeat: Infinity, delay: pos.delay, ease: "easeInOut" }}
          >
            <div className="w-4 h-[1px] bg-amber-500/20 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            <div className="h-4 w-[1px] bg-amber-500/20 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </motion.div>
        ))}
      </div>



      <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col lg:flex-row items-center lg:items-center justify-between gap-12 lg:gap-24 px-4">
        {/* Left Column: Logo + Title */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center lg:items-start mb-2 lg:mb-16"
        >
          <div className="relative">
            {/* Pulsing glow */}
            <motion.div
              animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.3, 0.15] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-amber-500 blur-3xl rounded-full"
            />
            <img src="/logo.png" alt="Look" className="w-28 h-28 object-contain relative z-10 invert drop-shadow-[0_0_25px_rgba(251,191,36,0.8)]" />
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight mt-6 text-center lg:text-left"
          >
            {mode === 'forgot' ? 'Сброс пароля' : 'Добро пожаловать'}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-gray-500 text-sm mt-3 text-center lg:text-left"
          >
            {mode === 'forgot' ? 'Следуйте инструкциям для восстановления' : 'Войдите в аккаунт или создайте новый'}
          </motion.p>
        </motion.div>

        {/* Right Column: Auth Card */}
        <div className="w-full max-w-md flex flex-col">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="glassmorphism-dark rounded-3xl p-8 md:p-10 relative overflow-hidden border border-white/5 shadow-2xl"
          >


          {/* Top accent line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.8, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent origin-center"
          />
          {/* Bottom subtle line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 1, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent origin-center"
          />

          {/* Tabs */}
          <div className={`flex relative mb-6 bg-black/40 rounded-2xl p-1.5 border border-white/5 transition-opacity ${mode === 'forgot' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <motion.div
              className="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] rounded-xl bg-white/8 border border-white/10"
              animate={{ x: isLogin ? 0 : 'calc(100% + 6px)' }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-3.5 text-sm font-bold rounded-xl relative z-10 transition-colors duration-300 ${isLogin ? 'text-amber-400' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Вход
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-3.5 text-sm font-bold rounded-xl relative z-10 transition-colors duration-300 ${mode === 'register' ? 'text-amber-400' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Регистрация
            </button>
          </div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center"
                >
                  {error}
                </motion.div>
              )}

              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm text-center"
                >
                  {success}
                </motion.div>
              )}

              {mode === 'forgot' ? (
                renderForgotFlow()
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col">
                  <AnimatePresence initial={false}>
                    {mode === 'register' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-2 group mb-5">
                          <Label htmlFor="name" className="text-gray-500 flex items-center gap-2 text-xs uppercase tracking-widest group-focus-within:text-amber-500 transition-colors">
                            <User size={14} /> Имя
                          </Label>
                          <Input
                            id="name" type="text" placeholder="Александр"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="bg-black/50 border-white/8 text-white placeholder:text-white/15 h-14 rounded-xl focus:border-amber-500/40 transition-colors font-light px-5"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-2 group mb-5">
                    <Label htmlFor="email" className="text-gray-500 flex items-center gap-2 text-xs uppercase tracking-widest group-focus-within:text-amber-500 transition-colors">
                      <Mail size={14} /> Email
                    </Label>
                    <Input
                      id="email" type="email" placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="bg-black/50 border-white/8 text-white placeholder:text-white/15 h-14 rounded-xl focus:border-amber-500/40 transition-colors font-light px-5"
                    />
                  </div>

                  <AnimatePresence initial={false}>
                    {mode === 'register' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-2 group mb-5">
                          <Label htmlFor="phone" className="text-gray-500 flex items-center gap-2 text-xs uppercase tracking-widest group-focus-within:text-amber-500 transition-colors">
                            <Phone size={14} /> Телефон
                          </Label>
                          <Input
                            id="phone" type="tel" placeholder="+7 (999) 000-00-00"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="bg-black/50 border-white/8 text-white placeholder:text-white/15 h-14 rounded-xl focus:border-amber-500/40 transition-colors font-light px-5"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-2 group">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="password" className="text-gray-500 flex items-center gap-2 text-xs uppercase tracking-widest group-focus-within:text-amber-500 transition-colors">
                        <Lock size={14} /> Пароль
                      </Label>
                      <AnimatePresence>
                        {isLogin && (
                          <motion.button
                            onClick={() => { setMode('forgot'); setError(null); }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            type="button"
                            className="text-xs text-amber-500/60 hover:text-amber-400 transition-colors"
                          >
                            Забыли пароль?
                          </motion.button>
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        maxLength={100}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="bg-black/50 border-white/8 text-white placeholder:text-white/15 h-14 rounded-xl focus:border-amber-500/40 pr-14 transition-colors font-light tracking-widest px-5"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-amber-400 transition-colors w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/5"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-7">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-black font-bold h-14 rounded-xl shadow-[0_4px_25px_rgba(245,158,11,0.2)] hover:shadow-[0_4px_40px_rgba(245,158,11,0.4)] transition-all group overflow-hidden relative disabled:opacity-50"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                      <span className="relative flex items-center justify-center gap-2">
                        {loading ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, ease: "linear", duration: 0.8 }}
                            className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full"
                          />
                        ) : (
                          <>
                            {isLogin ? 'Войти в систему' : 'Создать аккаунт'}
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
                          </>
                        )}
                      </span>
                    </Button>
                  </div>
                </form>
              )}
            </motion.div>

        </motion.div>

        {/* Bottom text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center text-gray-600 text-xs mt-6 tracking-wide"
        >
          Продолжая, вы принимаете <span className="text-gray-400 hover:text-amber-400 cursor-pointer transition-colors">условия использования</span>
        </motion.p>
        </div>
      </div>
    </div>
  );
}
