import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Instagram, MessageCircle, Shield } from 'lucide-react';
import VisitorCounter from './VisitorCounter';

const Footer = () => (
  <footer className="mt-8 bg-white dark:bg-brand-charcoal border-t border-green-100 dark:border-green-900/30 pb-24 md:pb-8">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <Link to="/" className="flex items-center gap-3 mb-3">
            <img
              src="/logo.png"
              alt="নিত্য বাজার"
              className="w-10 h-10 rounded-xl"
              loading="lazy"
            />
            <div>
              <span className="font-bold text-brand-charcoal dark:text-white">নিত্য বাজার</span>
              <p className="text-xs text-brand-green">অনলাইন শপিং</p>
            </div>
          </Link>
          <p className="text-sm text-muted-foreground leading-relaxed">
            আপনার নিত্যদিনের বিশ্বস্ত অনলাইন বাজার। জেনুইন পণ্য এবং দ্রুত হোম ডেলিভারি।
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-brand-charcoal dark:text-white mb-3">দ্রুত লিংক</h3>
          <ul className="space-y-2 text-sm">
            <li><Link to="/shop" className="text-muted-foreground hover:text-brand-green transition-colors">শপ</Link></li>
            <li><Link to="/categories" className="text-muted-foreground hover:text-brand-green transition-colors">ক্যাটাগরি</Link></li>
            <li><Link to="/cart" className="text-muted-foreground hover:text-brand-green transition-colors">কার্ট</Link></li>
            <li><Link to="/account" className="text-muted-foreground hover:text-brand-green transition-colors">অ্যাকাউন্ট</Link></li>
            <li>
              <Link to="/admin/login" className="text-muted-foreground hover:text-brand-green transition-colors inline-flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" />
                অ্যাডমিন লগইন
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-brand-charcoal dark:text-white mb-3">যোগাযোগ</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><Mail className="w-4 h-4 text-brand-green shrink-0" />hmhasibulhasan1@gmail.com</li>
            <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-brand-green shrink-0" />01346-405590</li>
            <li className="flex items-center gap-2"><MapPin className="w-4 h-4 text-brand-green shrink-0" />Dhanmondi, Dhaka</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-brand-charcoal dark:text-white mb-3">নীতিমালা ও সামাজিক</h3>
          <ul className="space-y-2 text-sm mb-4">
            <li><span className="text-muted-foreground cursor-default">সেবার শর্তাবলি</span></li>
            <li><span className="text-muted-foreground cursor-default">গোপনীয়তা নীতি</span></li>
          </ul>
          <div className="flex gap-3">
            <a href="#" className="w-9 h-9 rounded-full bg-brand-gray dark:bg-white/10 flex items-center justify-center text-brand-green hover:bg-green-100 transition-colors" aria-label="Facebook">
              <Facebook className="w-4 h-4" />
            </a>
            <a href="#" className="w-9 h-9 rounded-full bg-brand-gray dark:bg-white/10 flex items-center justify-center text-brand-green hover:bg-green-100 transition-colors" aria-label="Instagram">
              <Instagram className="w-4 h-4" />
            </a>
            <a href="https://wa.me/8801706003435" className="w-9 h-9 rounded-full bg-brand-gray dark:bg-white/10 flex items-center justify-center text-brand-green hover:bg-green-100 transition-colors" aria-label="WhatsApp">
              <MessageCircle className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
      <VisitorCounter />
      <div className="pt-2 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} নিত্য বাজার. সর্বস্বত্ব সংরক্ষিত।
      </div>
    </div>
  </footer>
);

export default Footer;
