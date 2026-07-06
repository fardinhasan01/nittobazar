import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initErrorMonitoring } from './lib/errorMonitoring';

initErrorMonitoring();
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import { WishlistProvider } from './context/WishlistContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <CartProvider>
        <WishlistProvider>
          <App />
        </WishlistProvider>
      </CartProvider>
    </ThemeProvider>
  </React.StrictMode>
);
