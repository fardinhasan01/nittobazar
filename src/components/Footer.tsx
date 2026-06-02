import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Instagram, MessageCircle, Shield } from 'lucide-react';
import VisitorCounter from './VisitorCounter';

const Footer = () => (
  <footer className="mt-8 bg-white dark:bg-brand-charcoal border-t border-orange-100 dark:border-orange-900/30 pb-24 md:pb-8">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <Link to="/" className="flex items-center gap-3 mb-3">
            <img
              src="/lovable-uploads/d3afd300-289e-412e-ab42-87bdeed21cda.png"
              alt="AB Gadgets"
              className="w-10 h-10 rounded-xl"
              loading="lazy"
            />
            <div>
              <span className="font-bold text-brand-charcoal dark:text-white">AB GADGETS</span>
              <p className="text-xs text-brand-orange">Premium Gadgets</p>
            </div>
          </Link>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your trusted destination for premium tech across Bangladesh. Genuine products, fast delivery.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-brand-charcoal dark:text-white mb-3">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            <li><Link to="/shop" className="text-muted-foreground hover:text-brand-orange transition-colors">Shop</Link></li>
            <li><Link to="/categories" className="text-muted-foreground hover:text-brand-orange transition-colors">Categories</Link></li>
            <li><Link to="/cart" className="text-muted-foreground hover:text-brand-orange transition-colors">Cart</Link></li>
            <li><Link to="/account" className="text-muted-foreground hover:text-brand-orange transition-colors">My Account</Link></li>
            <li>
              <Link to="/admin/login" className="text-muted-foreground hover:text-brand-orange transition-colors inline-flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" />
                Admin Login
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-brand-charcoal dark:text-white mb-3">Contact</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><Mail className="w-4 h-4 text-brand-orange shrink-0" />saifuldipu8@gmail.com</li>
            <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-brand-orange shrink-0" />01706003435</li>
            <li className="flex items-center gap-2"><MapPin className="w-4 h-4 text-brand-orange shrink-0" />Dhanmondi, Dhaka</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-brand-charcoal dark:text-white mb-3">Legal & Social</h3>
          <ul className="space-y-2 text-sm mb-4">
            <li><span className="text-muted-foreground cursor-default">Terms of Service</span></li>
            <li><span className="text-muted-foreground cursor-default">Privacy Policy</span></li>
          </ul>
          <div className="flex gap-3">
            <a href="#" className="w-9 h-9 rounded-full bg-brand-gray dark:bg-white/10 flex items-center justify-center text-brand-orange hover:bg-orange-100 transition-colors" aria-label="Facebook">
              <Facebook className="w-4 h-4" />
            </a>
            <a href="#" className="w-9 h-9 rounded-full bg-brand-gray dark:bg-white/10 flex items-center justify-center text-brand-orange hover:bg-orange-100 transition-colors" aria-label="Instagram">
              <Instagram className="w-4 h-4" />
            </a>
            <a href="https://wa.me/8801706003435" className="w-9 h-9 rounded-full bg-brand-gray dark:bg-white/10 flex items-center justify-center text-brand-orange hover:bg-orange-100 transition-colors" aria-label="WhatsApp">
              <MessageCircle className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
      <VisitorCounter />
      <div className="pt-2 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} AB Gadgets. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
