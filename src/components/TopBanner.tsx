import React from 'react';

const bannerText =
  'প্রোডাক্ট হাতে পেয়ে টাকা দিবেন 💰 | বাংলাদেশের সকল স্থানে ডেলিভারি 🚚 | বিশেষ অফার চলমান! | দ্রুত অর্ডার করুন!';

const TopBanner = () => (
  <div className="top-banner-orange">
    <div className="marquee-orange">{bannerText}</div>
  </div>
);

export default TopBanner;
