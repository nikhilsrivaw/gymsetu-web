import React from 'react';
import { PLAY_STORE_URL, APP_STORE_URL } from '../lib/constants';
import { trackEvent } from '../lib/analytics';

interface AppStoreBadgesProps {
  className?: string;
  theme?: 'dark' | 'light'; // dark = white text on black, light = black text on white
}

export const AppStoreBadges = ({ className = '', theme = 'dark' }: AppStoreBadgesProps) => {
  const bg = theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black';
  const fill = theme === 'dark' ? 'fill-white' : 'fill-black';

  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      <a
        href={PLAY_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackEvent('app_download_click', { store: 'play_store' })}
        className={`flex items-center gap-2 ${bg} border-2 border-current px-4 py-2.5 hover:opacity-80 transition-opacity`}
        aria-label="Download GymSetu on Google Play"
      >
        <svg viewBox="0 0 24 24" className={`w-5 h-5 ${fill} flex-shrink-0`} aria-hidden="true">
          <path d="M3.18 23.76c.38.21.82.24 1.24.1l12.69-7.33-2.79-2.79-11.14 10zM.49 1.24C.18 1.64 0 2.2 0 2.9v18.2c0 .7.18 1.26.49 1.66l.09.08 10.2-10.2v-.24L.58 1.16l-.09.08zM20.13 10.4l-2.74-1.58-3.07 3.07 3.07 3.06 2.76-1.59c.79-.45.79-1.51-.02-2.96zM4.42.14L17.11 7.47l-2.79 2.79L3.18.26C3.56.12 4 .05 4.42.14z" />
        </svg>
        <div className="text-left">
          <div className="font-mono text-[8px] uppercase font-bold opacity-60">GET IT ON</div>
          <div className="font-archivo text-sm uppercase leading-tight">GOOGLE PLAY</div>
        </div>
      </a>

      <a
        href={APP_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackEvent('app_download_click', { store: 'app_store' })}
        className={`flex items-center gap-2 ${bg} border-2 border-current px-4 py-2.5 hover:opacity-80 transition-opacity`}
        aria-label="Download GymSetu on the App Store"
      >
        <svg viewBox="0 0 24 24" className={`w-5 h-5 ${fill} flex-shrink-0`} aria-hidden="true">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98l-.09.06c-.22.14-2.2 1.28-2.18 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.87M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
        </svg>
        <div className="text-left">
          <div className="font-mono text-[8px] uppercase font-bold opacity-60">DOWNLOAD ON THE</div>
          <div className="font-archivo text-sm uppercase leading-tight">APP STORE</div>
        </div>
      </a>
    </div>
  );
};
