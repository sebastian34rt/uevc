import { Facebook, Twitter, Link as LinkIcon, Share2 } from 'lucide-react';
import React, { useState } from 'react';

export default function ShareButtons({ title, text, url }: { title: string, text?: string, url?: string }) {
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const shareUrl = url || window.location.href;

  const handleNativeShare = async () => {
    if (isSharing) return;
    
    if (navigator.share) {
      setIsSharing(true);
      try {
        await navigator.share({
          title: title,
          text: text,
          url: shareUrl,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      } finally {
        setIsSharing(false);
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareFacebook = (e: React.MouseEvent) => {
    e.preventDefault();
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const shareTwitter = (e: React.MouseEvent) => {
    e.preventDefault();
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`, '_blank');
  };

  return (
    <div className="flex items-center gap-2 mt-4 relative z-20">
      <button 
        onClick={shareFacebook}
        className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors"
        aria-label="Compartir en Facebook"
        title="Compartir en Facebook"
      >
        <Facebook className="w-4 h-4" />
      </button>
      <button 
        onClick={shareTwitter}
        className="w-8 h-8 rounded-full bg-sky-50 text-sky-500 flex items-center justify-center hover:bg-sky-100 transition-colors"
        aria-label="Compartir en Twitter"
        title="Compartir en Twitter"
      >
        <Twitter className="w-4 h-4" />
      </button>
      <button 
        onClick={handleNativeShare}
        className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-600 flex items-center justify-center hover:bg-neutral-200 transition-colors relative"
        aria-label={navigator.share ? "Compartir" : "Copiar enlace"}
        title={navigator.share ? "Compartir" : "Copiar enlace"}
      >
        {navigator.share ? <Share2 className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
        {copied && (
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] py-1 px-2 rounded font-medium">
            Copiado
          </span>
        )}
      </button>
    </div>
  );
}
