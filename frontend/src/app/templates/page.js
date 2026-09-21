"use client";

import { useState } from "react";
import Link from "next/link";
import { Camera, Image as ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { templates } from "@/lib/templates";

export default function TemplatesPage() {
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  return (
    <div className="min-h-[100dvh] p-6 md:p-12">
      <nav className="mb-12 flex items-center justify-between">
         <Link href="/" className="font-archivo text-2xl uppercase tracking-tighter hover:underline decoration-4 underline-offset-4">
           ← Kembali
         </Link>
      </nav>

      <div className="max-w-[1200px] mx-auto">
        <div className="inline-block bg-primary text-text-dark brutal-border px-3 py-1 font-black text-xs uppercase tracking-widest mb-4 brutal-shadow-sm">
          Langkah 1
        </div>
        <h1 className="font-archivo text-4xl md:text-6xl uppercase tracking-tighter mb-4">Pilih Template</h1>
        <p className="text-gray-700 mb-12 font-medium text-lg max-w-2xl">
          Pilih layout frame untuk photobooth kamu. Nanti kamu akan foto sesuai dengan jumlah slot yang ada di template ini.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {templates.map((t, idx) => {
            // Colors for Neo-brutalism loop
            const colors = ['bg-primary', 'bg-secondary', 'bg-success', 'bg-accent'];
            const hoverColor = colors[idx % colors.length];
            
            return (
              <div key={t.id} className="bg-white brutal-border brutal-shadow p-5 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_#111111] transition-all flex flex-col group relative">
                
                {/* Visual Layout Container (Uniform Card Size) */}
                <div className="aspect-[3/4] brutal-border w-full mb-5 relative overflow-hidden bg-gray-200 flex items-center justify-center p-4 shadow-inner">
                  
                  {/* Actual Scaled Template Preview */}
                  <div 
                    className="relative shadow-md overflow-hidden"
                    style={{ 
                      width: t.canvas.width > t.canvas.height ? '100%' : 'auto',
                      height: t.canvas.height >= t.canvas.width ? '100%' : 'auto',
                      aspectRatio: `${t.canvas.width} / ${t.canvas.height}`,
                      backgroundColor: '#F5F5F5',
                    }}
                  >
                     {/* Canvas Texture Overlay */}
                     <div className="absolute inset-0 opacity-[0.15] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9IiMwMDAiIC8+PC9zdmc+')] mix-blend-overlay pointer-events-none"></div>
                     
                     {/* Photo Slots using percentages */}
                     <div className="absolute inset-0 w-full h-full">
                        {t.slots.map((slot, i) => (
                          <div 
                            key={i} 
                            className="absolute bg-gray-300 overflow-hidden flex items-center justify-center shadow-inner" 
                            style={{
                               left: `${(slot.x / t.canvas.width) * 100}%`,
                               top: `${(slot.y / t.canvas.height) * 100}%`,
                               width: `${(slot.width / t.canvas.width) * 100}%`,
                               height: `${(slot.height / t.canvas.height) * 100}%`,
                               borderRadius: '4px',
                               border: '1px solid rgba(0,0,0,0.1)'
                            }} 
                          >
                            <Camera className="w-3 h-3 text-gray-500/40" />
                          </div>
                        ))}
                     </div>
                     
                     {/* Frame PNG Preview */}
                     <img 
                       src={t.image} 
                       alt="Frame"
                       className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                       style={{ zIndex: 10 }}
                       onError={(e) => {
                         e.currentTarget.style.display = 'none';
                       }}
                     />
                     
                     {/* Photobooth Footer Text */}
                     <div 
                       className="absolute bottom-[2%] w-full text-center font-inter tracking-widest z-5 flex flex-col items-center justify-center"
                       style={{ color: '#111111' }}
                     >
                       <span className="font-archivo text-[6px] uppercase font-bold leading-none">UBHARA JAYA</span>
                       <span className="text-[3.5px] font-bold mt-0.5">ubharajaya.ac.id</span>
                     </div>
                  </div>
                  
                  {/* Hover backdrop fill */}
                   <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-black pointer-events-none z-30"></div>
                </div>
                
                <h2 className="font-archivo text-xl uppercase mb-1">{t.name}</h2>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-5 flex-1">{t.slots.length} Photos • {t.id}</p>
                
                <Button 
                  onClick={() => setSelectedTemplate(t)}
                  className="w-full bg-text-dark text-white hover:bg-black group-hover:-translate-y-1 transition-transform"
                >
                  Pilih Template
                </Button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Source Selection Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white brutal-border brutal-shadow w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b-4 border-black flex items-center justify-between bg-primary">
              <h3 className="font-archivo text-xl uppercase tracking-tighter">Pilih Sumber Foto</h3>
              <button 
                onClick={() => setSelectedTemplate(null)}
                className="w-8 h-8 flex items-center justify-center brutal-border bg-white hover:bg-gray-200 active:translate-y-1 transition-transform"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-4">
              <p className="font-medium text-sm text-gray-700 mb-2">
                Kamu memilih template <strong>{selectedTemplate.name}</strong>. Mau ambil foto dari mana?
              </p>
              
              <Link href={`/booth?template=${selectedTemplate.id}`} onClick={() => setSelectedTemplate(null)} className="block w-full">
                <Button className="w-full h-16 flex items-center justify-start gap-4 text-left group">
                  <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center brutal-border group-hover:rotate-12 transition-transform">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-archivo text-lg uppercase tracking-tight">Gunakan Kamera</div>
                    <div className="text-xs font-medium opacity-80">Foto langsung gaya photobooth</div>
                  </div>
                </Button>
              </Link>

              <Link href={`/editor?template=${selectedTemplate.id}`} onClick={() => setSelectedTemplate(null)} className="block w-full">
                <Button className="w-full h-16 flex items-center justify-start gap-4 text-left bg-secondary text-black hover:bg-[#a67cff] group">
                  <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center brutal-border group-hover:-rotate-12 transition-transform">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-archivo text-lg uppercase tracking-tight">Upload Galeri</div>
                    <div className="text-xs font-medium opacity-80">Pilih foto yang sudah ada</div>
                  </div>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
