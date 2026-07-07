import React from "react";
import { MessageCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const FACEBOOK_URL =
  "https://www.facebook.com/profile.php?id=61587970271939";

const FloatingContactButton: React.FC = () => {
  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <a
          href={FACEBOOK_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Message us on Facebook"
          title="Message us on Facebook"
          className="
            fixed
            bottom-24
            left-4
            md:bottom-8
            md:right-4
            md:left-auto
            z-50
            flex
            h-14
            w-14
            items-center
            justify-center
            rounded-full
            bg-brand-green
            text-white
            shadow-xl
            shadow-green-500/30
            transition-all
            duration-300
            hover:scale-110
            hover:shadow-green-500/50
            active:scale-95
            focus:outline-none
            focus:ring-2
            focus:ring-brand-green
            focus:ring-offset-2
          "
        >
          <MessageCircle className="h-6 w-6" strokeWidth={2.2} />
        </a>
      </TooltipTrigger>

      <TooltipContent side="top">
        <p>Message us on Facebook</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default FloatingContactButton;