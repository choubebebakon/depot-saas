import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePagination } from '../../../hooks/usePagination';
import api from '../../../api'; // Ajuste le chemin si besoin pour atteindre ton dossier api
import { useAuth } from '../../../contexts/AuthContext';
import { useNotif } from '../../../context/NotifContext';
import { depotApi } from '../services/depotApi';
import VenteBoissonsForm from '../forms/VenteBoissonsForm';
import ConfirmModal from '../../../shared/components/forms/ConfirmModal';

const LIMIT = 100;

export default function VentesPage() {
  const { metier } = useAuth();
  const queryClient = useQueryClient();
  const notif = useNotif();
  const { tenantId } = useAuth(); 
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // --- 🏢 EXTRACTION LOGIQUE DU DEPOT_USER (Comme sur la page Caisse) ---
  const userString = localStorage.getItem('depot_user');
  let currentDepotId = null;

  if (userString) {
    try {
      const userData = JSON.parse(userString);
      currentDepotId = userData.depotId || userData.depot_id;
    } catch (e) {
      console.error("Erreur lors de l'analyse du JSON depot_user dans VentesPage", e);
    }
  }
  // ---------------------------------------------------------------------

  if (metier !== 'DEPOT_BOISSONS') {
    return <div className="p-8 text-center text-red-400">Accès non autorisé</div>;
  }

  const { data, isLoading } = useQuery({
    queryKey: ['depot-ventes'],
    queryFn: async () => {
      const res = await depotApi.getVentes({ page: 1, limit: LIMIT });
      return res.data?.data || res.data || [];
    },
    enabled: metier === 'DEPOT_BOISSONS',
  });

  const ventes = Array.isArray(data) ? data : (data?.data || []);
  const total = ventes.length;

  const {
    currentPage,
    setCurrentPage,
    nextPage,
    prevPage,
    totalPages,
    totalItems,
    paginatedData: paginated,
  } = usePagination(ventes, 10);

  const openCreate = () => { setEditItem(null); setFormOpen(true); };

  const annulerVenteMutation = useMutation({
    mutationFn: (id) => depotApi.annulerVente(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['depot-ventes'] });
      queryClient.invalidateQueries({ queryKey: ['depot-dashboard'] });
      notif.success('Vente annulée avec succès');
      setConfirmDelete(null);
    },
    onError: (err) => {
      notif.error(err.response?.data?.message || 'Erreur lors de l\'annulation de la vente');
    }
  });

  const handleAnnulerVente = () => {
    if (confirmDelete) {
      annulerVenteMutation.mutate(confirmDelete.id);
    }
  };

const handlePrint = async (id) => {
    try {
      const r = await depotApi.getVente(id);
      const vente = r.data || r;

      let params = {};
      try {
        const response = await api.get('/depot/parametres');
        params = response.data || {};
      } catch (e) {
        console.warn("Utilisation des paramètres locaux...");
      }
      
      const infos = params?.infos || { 
        nomEntreprise: localStorage.getItem('depot_nom') || "MON DÉPÔT", 
        adresse: localStorage.getItem('depot_adresse') || "Douala", 
        telephone: localStorage.getItem('depot_telephone') || "" 
      };
      const ticketConf = params?.ticket || { 
        messageAccueil: localStorage.getItem('msg_accueil') || "Merci !", 
        messageFin: localStorage.getItem('msg_fin') || "À bientôt !" 
      };

      const printWindow = window.open('', '_blank', 'width=400,height=700');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Ticket - ${vente.reference}</title>
            <style>
              /* Reset général */
              * { box-sizing: border-box; }
              
              /* Comportement à l'écran */
              body { 
                background-color: #525659; 
                display: flex; 
                justify-content: center; 
                padding: 20px; 
                margin: 0;
              }
              
              #ticket {
                background-color: #fff;
                width: 80mm; 
                padding: 5mm;
                font-family: 'Courier New', Courier, monospace;
                font-size: 12px;
                color: #000;
              }

              /* FORÇAGE DE L'IMPRIMANTE */
              @media print {
                @page { 
                  margin: 0; 
                  size: 80mm 200mm; /* Force Edge à créer un petit PDF de la taille d'un ticket */
                }
                body { 
                  background-color: #fff; 
                  padding: 0; 
                  display: block; 
                }
                #ticket { 
                  width: 100%; 
                  max-width: 100%;
                  margin: 0;
                  padding: 2mm; /* Petite marge pour l'impression thermique */
                }
              }

              /* Typographie et alignements */
              .center { text-align: center; }
              .bold { font-weight: bold; }
              .divider { border-top: 1px dashed #000; margin: 8px 0; }
              h2 { font-size: 16px; margin: 0 0 4px 0; }
              
              /* Tableau */
              table { width: 100%; border-collapse: collapse; margin: 10px 0; }
              th { border-bottom: 1px solid #000; text-align: left; padding: 4px 0; font-size: 11px; }
              td { padding: 4px 0; font-size: 11px; }
              td.right, th.right { text-align: right; }
              td.center, th.center { text-align: center; }
              
              .total { font-size: 15px; font-weight: bold; text-align: right; margin-top: 10px; padding-top: 5px; border-top: 2px solid #000; }
            </style>
          </head>
          <body>
            <div id="ticket">
              <div class="center">
                <h2>${infos.nomEntreprise.toUpperCase()}</h2>
                <div>${infos.adresse}</div>
                <div>Tél: ${infos.telephone}</div>
              </div>
              
              <div class="divider"></div>
              <div class="center bold" style="margin: 5px 0;">${ticketConf.messageAccueil}</div>
              
              <div style="font-size: 10px; margin-bottom: 5px;">
                Réf: ${vente.reference}<br>
                Date: ${new Date(vente.date).toLocaleString()}
              </div>
              
              <div class="divider"></div>
              
              <table>
                <thead>
                  <tr>
                    <th>Article</th>
                    <th class="center">Qté</th>
                    <th class="right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${vente.lignes.map(l => `
                    <tr>
                      <td>${l.article?.designation || 'BOISSON'}</td>
                      <td class="center">${l.prix}</td>
                      <td class="right">${parseInt(l.total).toLocaleString()}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              
              <div class="total">NET À PAYER: ${parseInt(vente.total).toLocaleString()} FCFA</div>
              
              <div class="center" style="margin-top: 20px; font-size: 11px;">
                ${ticketConf.messageFin}
                <div style="margin-top: 10px; font-size: 9px; color: #555;">GeStock - 2026</div>
              </div>
            </div>
            
            <script>
              window.onload = function() {
                window.print();
                setTimeout(window.close, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (err) {
      console.error(err);
      alert("Erreur impression: " + err.message);
    }
  };
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Ventes</h1>
          <p className="text-slate-400 text-sm mt-1">Historique des ventes ({total} vente{total > 1 ? 's' : ''})</p>
        </div>
        <button onClick={openCreate}
          className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/30">
          ➕ Nouvelle vente
        </button>
      </div>

      {totalItems === 0 ? (
        <div className="p-12 text-center text-slate-500 bg-slate-800/30 rounded-xl border border-slate-700/50">
          <p className="text-3xl mb-3">💸</p>
          <p className="text-lg font-medium">Aucune vente enregistrée</p>
          <p className="text-sm mt-1">Cliquez sur "Nouvelle vente" pour commencer</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-700/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider">
                <th className="text-left p-4 font-semibold">Date</th>
                <th className="text-left p-4 font-semibold">Client</th>
                <th className="text-right p-4 font-semibold">Articles</th>
                <th className="text-right p-4 font-semibold">Total</th>
                <th className="text-center p-4 font-semibold">Paiement</th>
                <th className="text-center p-4 font-semibold">Statut</th>
                <th className="text-right p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {paginated.map(v => (
                <tr key={v.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 text-white">{new Date(v.date).toLocaleDateString('fr-FR')}</td>
                  <td className="p-4 text-slate-400">{v.client?.nom || 'Comptoir'}</td>
                  
                  {/* ✨ Colonne Articles avec calcul de la quantité réelle et Tooltip au survol */}
                   <td className="p-4 text-right text-white font-medium">
                    {(() => {
                      const totalMontant = parseInt(v.total || 0);
                      
                      // Si le total est de 15000 et qu'on a le prix 2500 dans nbArticles, on divise !
                      if (totalMontant > 0 && v.nbArticles > 100) {
                        return Math.round(totalMontant / v.nbArticles);
                      }
                      
                      // Sinon, si nbArticles est une vraie quantité (ex: 6), on l'affiche
                      if (v.nbArticles && v.nbArticles < 100) {
                        return v.nbArticles;
                      }
                      
                      return '1';
                    })()}
                    <span className="text-[10px] text-slate-500 ml-0.5">U</span>
                  </td>
                  <td className="p-4 text-right text-white font-bold">{parseInt(v.total || 0).toLocaleString('fr-FR')} FCFA</td>
                  <td className="p-4 text-center">
                    <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-slate-700/50 text-slate-300 border border-slate-600/50">
                      {v.modePaiement || '-'}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                      v.statut === 'ANNULEE' || v.statut === 'ANNULE' ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    }`}>
                      {v.statut || 'VALIDEE'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handlePrint(v.id)}
                        title="Imprimer ticket" className="px-2.5 py-1.5 hover:bg-blue-500/20 rounded-lg text-slate-400 hover:text-blue-400 transition-all text-xs">🖨️ Ticket</button>
                      {(v.statut !== 'ANNULEE' && v.statut !== 'ANNULE') && (
                        <button onClick={() => setConfirmDelete(v)} title="Annuler"
                          className="px-2.5 py-1.5 hover:bg-red-500/20 rounded-lg text-red-400 hover:text-red-300 transition-all text-xs">✕ Annuler</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={currentPage <= 1} onClick={prevPage}
            className="px-4 py-2 bg-slate-800 rounded-xl text-white text-sm disabled:opacity-40 hover:bg-slate-700 transition-all">◀ Précédent</button>
          <span className="text-slate-400 text-sm">Page {currentPage} / {totalPages}</span>
          <button disabled={currentPage >= totalPages} onClick={nextPage}
            className="px-4 py-2 bg-slate-800 rounded-xl text-white text-sm disabled:opacity-40 hover:bg-slate-700 transition-all">Suivant ▶</button>
        </div>
      )}

      <VenteBoissonsForm 
        isOpen={formOpen} 
        onClose={() => setFormOpen(false)} 
        edit={editItem} 
        metier="depot-boissons" 
        depotId={currentDepotId} 
      />
      
      <ConfirmModal 
        isOpen={!!confirmDelete} 
        onConfirm={handleAnnulerVente} 
        onCancel={() => setConfirmDelete(null)} 
        loading={annulerVenteMutation.isPending}
        title="Annuler la vente" 
        message={`Annuler la vente de ${parseInt(confirmDelete?.total || 0).toLocaleString('fr-FR')} FCFA ? Cette action est irréversible.`} 
      />
    </div>
  );
}