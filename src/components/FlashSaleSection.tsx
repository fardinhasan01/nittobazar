import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FadeInView from './FadeInView';

function getTimeLeft() {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const diff = end.getTime() - Date.now();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { h, m, s };
}

const FlashSaleSection = () => {
  const [time, setTime] = useState(getTimeLeft);

  useEffect(() => {
    const t = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => clearInterval(t);
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <section className="mx-4 my-6">
      <FadeInView>
        <div className="max-w-7xl mx-auto rounded-2xl bg-gradient-to-r from-brand-orange to-[#ff8534] p-5 sm:p-6 text-white shadow-xl shadow-orange-500/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Flame className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider opacity-90">Flash Sale</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold">Limited Time Offers</h2>
              <p className="text-sm text-white/85 mt-1 flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-red-300 animate-pulse" />
                Only a few items left — hurry!
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-sm font-mono bg-black/20 rounded-xl px-3 py-2 backdrop-blur-sm">
                <Clock className="w-4 h-4 mr-1 opacity-80" />
                <span>{pad(time.h)}</span>
                <span className="opacity-60">:</span>
                <span>{pad(time.m)}</span>
                <span className="opacity-60">:</span>
                <span>{pad(time.s)}</span>
              </div>
              <Link to="/shop">
                <Button className="bg-white text-brand-orange hover:bg-brand-gray font-semibold rounded-xl h-10 px-5 shadow-md transition-transform duration-300 hover:scale-[1.02]">
                  Shop Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </FadeInView>
    </section>
  );
};

export default FlashSaleSection;
