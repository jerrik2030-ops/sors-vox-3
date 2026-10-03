import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Info } from 'lucide-react';

export function Donation() {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full py-8">
      
      <div className="flex items-center space-x-4 mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 bg-white rounded-full border border-neutral-200 hover:bg-neutral-50 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-3xl font-bold tracking-tight">Support Sors Vox</h1>
      </div>

      <div className="bg-white p-8 sm:p-10 rounded-[2.5rem] border border-neutral-200 shadow-sm text-center">
        
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <Heart className="w-8 h-8 fill-current" />
        </div>
        
        <h2 className="text-2xl font-bold mb-4">Help us keep the servers running</h2>
        <p className="text-neutral-500 mb-10 max-w-md mx-auto leading-relaxed">
          Sors Vox is currently free and without advertisements. If you enjoy meeting new people here, consider making a donation to support the platform's development.
        </p>

        <div className="bg-neutral-900 rounded-3xl p-8 max-w-sm mx-auto shadow-2xl relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          
          <h3 className="text-white font-bold text-lg mb-6 tracking-wide">SCAN TO DONATE</h3>
          
          <div className="bg-white p-4 rounded-2xl mx-auto w-64 h-64 flex items-center justify-center relative shadow-inner">
             {/* Note: Ensure the user's uploaded QR code image is placed in the public folder and named donation-qr.jpg */}
             <img 
               src="/IMG_20260916_125452.jpg" 
               alt="Donation QR Code" 
               className="w-full h-full object-contain rounded-xl"
               onError={(e) => {
                 (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23f5f5f5"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%23888">QR Code Placeholder</text></svg>';
               }}
             />
          </div>
          
          <div className="mt-8 flex items-center justify-center space-x-2 text-neutral-400 text-sm font-medium">
            <Info className="w-4 h-4" />
            <span>Any amount is appreciated</span>
          </div>
        </div>

      </div>
    </div>
  );
}
