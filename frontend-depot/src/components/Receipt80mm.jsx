import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function Receipt80mm({ vente, config, preview = false }) {
  if (!vente) return null;
  
  // Fallback si config n'est pas encore chargé
  const businessName = config?.nomEntreprise || 'GESTOCK';
  const businessAddress = config?.adresse || '';
  const businessPhone = config?.telephone || '';
  const businessSlogan = config?.slogan || '';
  const endMessage = config?.messageFin || 'Merci de votre fidélité !';

  const dateAchat = new Date(vente.createdAt || vente.date || new Date()).toLocaleDateString('fr-FR');
  const heureAchat = new Date(vente.createdAt || vente.date || new Date()).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const separator = "------------------------------------------";

  return (
    <div id="receipt-80mm" className={`bg-white text-black p-0 w-m] mx-auto font-mono text-[11px] leading-tight print:block shadow-none mb-10 overflow-hidden border border-slate-100 ${preview ? 'block' : 'hidden'}`}>
      <div className="flex flex-col items-center px-4 py-6 bg-white">
        {/* LOGO avec filtre B&W plus tolérant */}
        {config?.logo && (
          <div className="bg-white p-1 mb-4">
            <img 
              src={config.logo} 
              alt="Logo" 
              className="w-32 h-auto object-contain filter grayscale(100%) contrast(500%)" 
            />
          </div>
        )}

        {/* EN-TÃŠTE : HIÉRARCHIE VISUELLE FORTE */}
        <h1 className="text-[22px] font-black uppercase text-center leading-none mb-2 tracking-tighter text-black">
          {businessName}
        </h1>
        
        {businessSlogan && (
          <p className="text-[10px] italic mb-1 text-center font-bold px-2 text-black">
            {businessSlogan}
          </p>
        )}
        
        <div className="text-[10px] text-center space-y-0.5 mt-2 text-black">
          {businessAddress && <p>{businessAddress}</p>}
          {businessPhone && <p>TÉL: {businessPhone}</p>}
        </div>

        <div className="w-full text-center my-3">
          {separator}
        </div>

        {/* INFOS FACTURE & CLIENT */}
        <div className="w-full space-y-1 mb-3">
          <div className="flex justify-between">
            <span className="font-black">FACTURE NÂ°:</span>
            <span className="font-black">{vente.reference}</span>
          </div>
          <div className="flex justify-between">
            <span>DATE:</span>
            <span>{dateAchat} Ã  {heureAchat}</span>
          </div>
          <div className="flex justify-between border-t border-dotted border-black pt-1 mt-1">
            <span>CLIENT:</span>
            <span className="font-bold">{vente.client?.nom || 'PASSANT'}</span>
          </div>
        </div>

        <div className="w-full text-center mb-3">
          {separator}
        </div>

        {/* TABLEAU DES ARTICLES (ALIGNEMENT MONOSPACE) */}
        <div className="w-full mb-4">
          <div className="flex justify-between font-black mb-1">
            <span className="w-8">QTÉ</span>
            <span className="flex-1 text-left px-1">DÉSIGNATION</span>
            <span className="w-16 text-right">P.U</span>
            <span className="w-20 text-right">TOTAL</span>
          </div>
          <div className="border-t border-dotted border-black mb-2 opacity-50"></div>
          
          <div className="space-y-2">
            {vente.lignes?.map((l, i) => {
              const comp = l.composition ? (typeof l.composition === 'string' ? JSON.parse(l.composition) : l.composition) : null;
              return (
              <div key={i} className="flex flex-col mb-1.5 break-inside-avoid">
                <div className="flex justify-between items-start">
                  <span className="w-8 font-bold text-[11px] mt-px">{l.quantite}</span>
                  <span className="flex-1 text-left px-1 uppercase text-[10px] leading-tight break-words font-bold">
                    {l.casierMixte ? (comp ? `CASIER MIXTE (${comp.reduce((acc,s)=>acc+s.quantite,0)} UNITÉS)` : 'CASIER MIXTE') : (l.article?.designation || 'Article')}
                  </span>
                  <span className="w-16 text-right whitespace-nowrap text-[10px] mt-px">
                    {Math.round(l.prixUnitaire || (l.total / l.quantite)).toLocaleString('fr-FR')}
                  </span>
                  <span className="w-20 text-right font-black whitespace-nowrap text-[11px] mt-px">
                    {l.total.toLocaleString('fr-FR')}
                  </span>
                </div>
                {l.casierMixte && comp && Array.isArray(comp) && (
                  <div className="pl-9 pr-2 mt-0.5 space-y-0.5 text-[9px] leading-[1.1] text-black/80 font-medium">
                    {comp.map((sub, idx) => (
                      <div key={idx} className="flex justify-between items-start">
                        <div className="flex items-start">
                          <span className="mr-1 italic">-</span>
                          <span className="italic uppercase break-words pr-1">{sub.quantite}x {sub.designation}</span>
                        </div>
                        <div className="text-right whitespace-nowrap italic">
                          <span className="text-[8px] opacity-70 mr-2">({sub.prixUnitaire?.toLocaleString('fr-FR')})</span>
                          <span>{((sub.quantite || 0) * (sub.prixUnitaire || 0)).toLocaleString('fr-FR')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
            })}
          </div>
        </div>

        <div className="w-full text-center mb-3">
          {separator}
        </div>

        {/* TOTAUX ET PAIEMENT */}
        <div className="w-full flex flex-col items-end gap-1">
          <div className="flex justify-between w-full items-baseline">
            <span className="text-[12px] font-black">TOTAL NET:</span>
            <span className="text-[20px] font-black uppercase">
              {vente.total.toLocaleString('fr-FR')} FCFA
            </span>
          </div>
          <div className="flex justify-between w-full text-[10px] mt-1">
            <span className="opacity-70 italic">MODE DE PAIEMENT:</span>
            <span className="font-black">{vente.modePaiement || 'CASH'}</span>
          </div>
        </div>

        {/* PIED DE PAGE : MESSAGE & QR CODE */}
        <div className="w-full mt-8 border-t border-dotted border-black pt-6 flex flex-col items-center bg-white text-black">
          <p className="font-black text-[12px] uppercase text-center mb-1 text-black">
            MERCI DE VOTRE FIDÉLITÉ !
          </p>
          <p className="text-center italic text-[9px] px-4 text-black">
            {endMessage}
          </p>
          
          <div className="mt-6 mb-4 filter grayscale contrast-200">
            <QRCodeSVG 
              value={vente.reference} 
              size={64} 
              level="M"
              includeMargin={false}
              bgAlpha={0}
            />
          </div>
          
          <p className="text-[8px] uppercase tracking-widest opacity-50 font-bold mt-2">
            GÉNÉRÉ PAR GESTOCK SAAS
          </p>
        </div>
      </div>

      <style>{`
        @media print {
          @page {
            size: auto;
            margin: 0mm;
          }
          html, body {
            height: auto;
            width: 100%;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            display: flex !important;
            justify-content: center !important;
            align-items: flex-start !important;
          }
          /* On cache tout au premier niveau */
          body * {
            visibility: hidden;
          }
          /* On affiche uniquement le reçu et ses enfants */
          #receipt-80mm, #receipt-80mm * {
            visibility: visible !important;
          }
          #receipt-80mm {
            display: block !important;
            position: relative !important;
            left: auto !important;
            top: auto !important;
            width: 80mm !important;
            max-width: 80mm !important;
            padding: 5mm !important;
            margin: 0 auto !important;
            box-shadow: none !important;
            border: none !important;
            transform: translateZ(0); /* Hardware acceleration to prevent weird reflows */
          }
        }
      `}</style>
    </div>
  );
}




