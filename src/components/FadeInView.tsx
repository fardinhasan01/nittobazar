import React from 'react';
import { motion } from 'framer-motion';

interface FadeInViewProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

const FadeInView: React.FC<FadeInViewProps> = ({ children, className = '', delay = 0 }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-40px' }}
    transition={{ duration: 0.3, delay, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
);

export default FadeInView;
