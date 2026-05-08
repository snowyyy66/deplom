import { useState, useEffect } from 'react';
import { Toaster } from 'sonner';
import { AuthPage } from './pages/AuthPage';
import { HomePage } from './pages/HomePage';
import { OrderPage } from './pages/OrderPage';
import { ProfilePage } from './pages/ProfilePage';
import { AboutPage } from './pages/AboutPage';
import { ContactsPage } from './pages/ContactsPage';
import { AdminPage } from './pages/AdminPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { getAdminToken, setAdminToken } from './lib/api';

function App() {
  const [currentPage, setCurrentPage] = useState('auth');
  const [isAdminAuthed, setIsAdminAuthed] = useState(() => !!getAdminToken());

  // /admin route detection
  if (window.location.pathname === '/admin') {
    if (!isAdminAuthed) return <AdminLoginPage onLogin={() => { setIsAdminAuthed(true); }} />;
    return <AdminPage onLogout={() => { setAdminToken(null); setIsAdminAuthed(false); window.location.pathname = '/'; }} />;
  }
  const [initialOrderType, setInitialOrderType] = useState(null);
  const [initialPromoCode, setInitialPromoCode] = useState('');
  const [cart, setCart] = useState([]);
  const [userData, setUserData] = useState(() => {
    const saved = localStorage.getItem('look_restaurant_user');
    return saved ? JSON.parse(saved) : { name: 'Гость', email: '', phone: '' };
  });

  useEffect(() => {
    if (userData.email) {
      localStorage.setItem('look_restaurant_user', JSON.stringify(userData));
      if (currentPage === 'auth') setCurrentPage('home');
    } else {
      localStorage.removeItem('look_restaurant_user');
    }
  }, [userData]);

  const handleAuth = (data) => {
    setUserData(data);
    setCart([]); // Clear cart only on fresh login
    setCurrentPage('home');
  };

  const handleUpdateUser = (data) => {
    setUserData(data);
  };

  const navigateTo = (page, orderType, promoCode) => {
    if (orderType) setInitialOrderType(orderType);
    else setInitialOrderType(null);
    if (promoCode) setInitialPromoCode(promoCode);
    else setInitialPromoCode('');
    setCurrentPage(page);
  };

  const addToCart = (itemId) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === itemId);
      return existing
        ? prev.map(i => i.id === itemId ? { ...i, quantity: i.quantity + 1 } : i)
        : [...prev, { id: itemId, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter(i => i.id !== itemId);
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white dark overflow-x-hidden">
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: { background: '#111', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' },
        }}
      />
      {currentPage === 'auth' && <AuthPage onAuth={handleAuth} />}
      {currentPage === 'home' && (
        <HomePage
          onNavigate={navigateTo}
          userData={userData}
          cart={cart}
          addToCart={addToCart}
          removeFromCart={removeFromCart}
        />
      )}
      {currentPage === 'order' && (
        <OrderPage
          onNavigate={navigateTo}
          userData={userData}
          initialOrderType={initialOrderType}
          initialPromoCode={initialPromoCode}
          cart={cart}
          setCart={setCart}
          addToCart={addToCart}
          removeFromCart={removeFromCart}
        />
      )}
      {currentPage === 'profile' && (
        <ProfilePage
          onNavigate={navigateTo}
          userData={userData}
          onUpdateUser={handleUpdateUser}
        />
      )}
      {currentPage === 'about' && (
        <AboutPage onNavigate={navigateTo} userData={userData} />
      )}
      {currentPage === 'contacts' && (
        <ContactsPage onNavigate={navigateTo} />
      )}
    </div>
  );
}

export default App;
