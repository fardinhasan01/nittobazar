import React from 'react';
import { MessageCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const FloatingContactButton = () => {
  const messengerLink = "https://www.facebook.com/people/AB-Gadgets/100092730792089/";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <a
          href={messengerLink}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-24 left-4 z-40 bg-brand-orange text-white p-3.5 rounded-full shadow-xl shadow-orange-500/30 transition-all duration-300 hover:scale-105 md:bottom-8 md:left-auto md:right-4"
          aria-label="Message us on Facebook"
        >
          <MessageCircle className="w-6 h-6" />
        </a>
      </TooltipTrigger>
      <TooltipContent>
        <p>Message us on Facebook</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default FloatingContactButton; 