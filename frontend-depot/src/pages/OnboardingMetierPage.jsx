// ─────────────────────────────────────────────────────────────────
// OnboardingMetierPage.jsx
// Page de sélection du métier après inscription/paiement.
// Accessible UNE SEULE FOIS — redirige vers /dashboard si déjà choisi.
//
// 📦 Dépendances : React, react-router-dom, axios (ou ton client API)
// 📁 Destination : src/pages/OnboardingMetierPage.jsx
// ─────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuthToken } from "../utils/auth"; // FIX #2: Import de getAuthToken

// ── Config des métiers ────────────────────────────────────────────
const METIERS = [
  {
    id: "DEPOT_BOISSONS",
    icon: "🥤",
    nom: "Dépôt de Boissons",
    description: "Gestion de stock, livraisons, consignes et tournées",
    couleur: "#2563eb",
    gradient: "from-blue-500 to-blue-700",
    features: ["Gestion de stock & articles", "Consignes bouteilles/casiers", "Livraisons & tournées tricycle", "Ventes au comptoir", "Caisse & rapports"],
  },
  {
    id: "BOUTIQUE",
    icon: "🏪",
    nom: "Boutique",
    description: "Commerce général, vente au détail",
    couleur: "#0891b2",
    gradient: "from-cyan-500 to-cyan-700",
    features: ["Caisse & ventes", "Gestion stock", "Clients & fidélité", "Promotions", "Factures PDF"],
  },
  {
    id: "QUINCAILLERIE",
    icon: "🛠",
    nom: "Quincaillerie / BTP",
    description: "Matériaux, devis et chantiers",
    couleur: "#b45309",
    gradient: "from-amber-600 to-amber-800",
    features: ["Devis & factures", "Gestion chantiers", "Stock multi-unités", "Livraisons", "Fournisseurs"],
  },
  {
    id: "PHARMACIE",
    icon: "💊",
    nom: "Pharmacie",
    description: "Médicaments, lots et ordonnances",
    couleur: "#059669",
    gradient: "from-emerald-500 to-emerald-700",
    features: ["Gestion des lots", "Alertes DLC", "Ordonnances", "Patients", "Stock médicaments"],
  },
  {
    id: "RESTAURANT",
    icon: "🍽",
    nom: "Restaurant",
    description: "Tables, commandes et cuisine",
    couleur: "#dc2626",
    gradient: "from-red-500 to-red-700",
    features: ["Plan de salle", "Commandes cuisine", "Menu du jour", "Réservations", "Caisse par table"],
  },
  {
    id: "TELEPHONIE",
    icon: "📱",
    nom: "Téléphonie",
    description: "Ventes, réparations et IMEI",
    couleur: "#7c3aed",
    gradient: "from-violet-500 to-violet-700",
    features: ["Suivi IMEI", "Réparations", "Garanties", "Accessoires", "Factures"],
  },
  {
    id: "SUPERMARCHE",
    icon: "🛒",
    nom: "Supermarché",
    description: "Rayons, codes-barres et gestion stock",
    couleur: "#f59e0b",
    gradient: "from-amber-500 to-amber-700",
    features: ["Gestion rayons", "Scan code-barres", "Stock & ruptures", "Ventes rapides", "Rapports"],
  },
  {
    id: "CIMENT_BTP",
    icon: "🏗️",
    nom: "Ciment / BTP",
    description: "Livraisons, chantiers et flotte véhicules",
    couleur: "#b45309",
    gradient: "from-amber-600 to-amber-800",
    features: ["Gestion chantiers", "Suivi livraisons", "Flotte véhicules", "Devis & factures", "Stock matériaux"],
  },
  {
    id: "PRESSING",
    icon: "👔",
    nom: "Pressing",
    description: "Gestion des dépôts, lavages et retraits",
    couleur: "#7c3aed",
    gradient: "from-violet-500 to-violet-700",
    features: ["Suivi dépôts", "Gestion retraits", "Statuts vêtements", "Caisse", "Rapports"],
  },
  { id: "ELEVAGE", icon: "🐄", nom: "Élevage", description: "Gestion des troupeaux, alimentation et suivi vétérinaire", couleur: "#65a30d", gradient: "from-lime-500 to-green-600", features: ["Suivi des lots d'animaux", "Événements vétérinaires", "Alimentation et croissance", "Ventes de bétail"] },
  { id: "SALON_BEAUTE", icon: "💇", nom: "Salon de Coiffure / Beauté", description: "Rendez-vous, prestations et gestion clientèle", couleur: "#ec4899", gradient: "from-pink-500 to-rose-600", features: ["Agenda des rendez-vous", "Prestations et tarifs", "Fidélisation client", "Vente de produits"] },
  { id: "PARFUMERIE", icon: "🧴", nom: "Parfumerie / Cosmétique", description: "Ventes, fidélité et catalogue produits", couleur: "#d946ef", gradient: "from-fuchsia-500 to-purple-600", features: ["Catalogue beauté", "Programme de fidélité", "Gestion des stocks", "Promotions"] },
  { id: "BOULANGERIE", icon: "🥖", nom: "Boulangerie / Pâtisserie", description: "Production du jour, recettes et ventes", couleur: "#d97706", gradient: "from-amber-500 to-orange-600", features: ["Production journalière", "Recettes et ingrédients", "Gestion des invendus", "Ventes en boutique"] },
  { id: "GLACIER_SNACK", icon: "🍦", nom: "Glacier / Snack", description: "Compositions, commandes rapides et caisse", couleur: "#06b6d4", gradient: "from-cyan-500 to-teal-600", features: ["Compositions de glaces", "Commandes rapides", "Menu du jour", "Caisse"] },
  { id: "LIBRAIRIE", icon: "📚", nom: "Librairie / Papeterie", description: "Catalogue livres, papeterie et commandes spéciales", couleur: "#6366f1", gradient: "from-indigo-500 to-blue-600", features: ["Catalogue livres", "Recherche par ISBN", "Commandes spéciales", "Fournitures papeterie"] },
  { id: "CLINIQUE", icon: "🏥", nom: "Clinique / Médical", description: "Dossiers patients, consultations et prescriptions", couleur: "#0ea5e9", gradient: "from-sky-500 to-blue-600", features: ["Dossiers médicaux", "Consultations", "Prescriptions", "Agenda RDV"] },
  { id: "TRANSPORT", icon: "🚛", nom: "Transport / Logistique", description: "Suivi colis, flotte véhicules et trajets", couleur: "#f97316", gradient: "from-orange-500 to-red-600", features: ["Suivi colis en temps réel", "Gestion de flotte", "Planification trajets", "Clients transport"] },
  { id: "IMMOBILIER", icon: "🏠", nom: "Gestion Immobilière", description: "Biens, locations, loyers et interventions", couleur: "#14b8a6", gradient: "from-teal-500 to-emerald-600", features: ["Portefeuille de biens", "Contrats de location", "Suivi des loyers", "Interventions techniques"] },
  { id: "HOTEL", icon: "🏨", nom: "Hôtel", description: "Chambres, réservations et consommations", couleur: "#8b5cf6", gradient: "from-violet-500 to-purple-600", features: ["Plan des chambres", "Réservations en ligne", "Check-in/out", "Consommations"] },
];

export default function OnboardingMetierPage() {
  const navigate = useNavigate();
  const [selected, setSelected]   = useState(null);
  const [hovered, setHovered]     = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  // ── Appel API ──────────────────────────────────────────────────
  async function handleConfirm() {
    if (!selected || loading) return;
    setLoading(true);
    setError(null);

    try {
      if (selected === "DEPOT_BOISSONS") {
        // Le dépôt de boissons est le métier par défaut déjà configuré.
        localStorage.setItem("gestock_metier", selected);
        navigate("/dashboard", { replace: true });
        return;
      }

      // Adapte cette URL à ton API
      const token = getAuthToken(); // FIX #2: Utilisation de getAuthToken() pour uniformiser la récupération du token
      const res = await fetch("/api/v1/onboarding/metier", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ metier: selected }),
      });

      if (!res.ok) throw new Error("Erreur lors de la configuration");

      // Sauvegarde le métier localement
      localStorage.setItem("gestock_metier", selected);

      // Redirige vers le dashboard
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  const selectedMetier = METIERS.find((m) => m.id === selected);

  return (
    <div style={styles.page}>
      {/* ── Fond animé ─────────────────────────────────────────── */}
      <div style={styles.bgGrid} />
      <div style={styles.bgGlow} />

      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>📦</span>
          <span style={styles.logoText}>GeStock</span>
        </div>
        <div style={styles.step}>
          <span style={styles.stepDot} />
          <span style={styles.stepDot} />
          <span style={{ ...styles.stepDot, ...styles.stepDotActive }} />
        </div>
      </div>

      {/* ── Titre ──────────────────────────────────────────────── */}
      <div style={styles.titleBlock}>
        <h1 style={styles.title}>Votre activité principale</h1>
        <p style={styles.subtitle}>
          Choisissez votre métier — GeStock configurera automatiquement
          <br />
          votre espace de travail, vos rôles et vos outils.
        </p>
      </div>

      {/* ── Grille des métiers ─────────────────────────────────── */}
      <div style={styles.grid}>
        {METIERS.map((metier, i) => {
          const isSelected = selected === metier.id;
          const isHovered  = hovered  === metier.id;

          return (
            <button
              key={metier.id}
              onClick={() => setSelected(metier.id)}
              onMouseEnter={() => setHovered(metier.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                ...styles.card,
                ...(isSelected ? styles.cardSelected : {}),
                ...(isHovered && !isSelected ? styles.cardHovered : {}),
                animationDelay: `${i * 80}ms`,
                borderColor: isSelected ? metier.couleur : undefined,
                boxShadow: isSelected
                  ? `0 0 0 2px ${metier.couleur}, 0 20px 60px ${metier.couleur}30`
                  : isHovered
                  ? "0 12px 40px rgba(0,0,0,0.3)"
                  : undefined,
              }}
            >
              {/* Indicateur sélection */}
              {isSelected && (
                <div style={{ ...styles.checkBadge, backgroundColor: metier.couleur }}>
                  ✓
                </div>
              )}

              {/* Icône */}
              <div
                style={{
                  ...styles.iconWrap,
                  backgroundColor: isSelected ? metier.couleur + "20" : "#ffffff08",
                  transform: isSelected || isHovered ? "scale(1.1)" : "scale(1)",
                  transition: "all 0.2s ease",
                }}
              >
                <span style={styles.icon}>{metier.icon}</span>
              </div>

              {/* Nom & description */}
              <h3 style={{ ...styles.cardTitle, color: isSelected ? metier.couleur : "#f1f5f9" }}>
                {metier.nom}
              </h3>
              <p style={styles.cardDesc}>{metier.description}</p>

              {/* Features (visible au hover ou sélection) */}
              <div
                style={{
                  ...styles.features,
                  opacity: isSelected || isHovered ? 1 : 0,
                  transform: isSelected || isHovered ? "translateY(0)" : "translateY(8px)",
                  transition: "all 0.25s ease",
                }}
              >
                {metier.features.map((f) => (
                  <span key={f} style={{ ...styles.featurePill, borderColor: metier.couleur + "60" }}>
                    <span style={{ color: metier.couleur }}>✓</span> {f}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Bouton confirmer ───────────────────────────────────── */}
      <div style={styles.footer}>
        {error && <p style={styles.error}>{error}</p>}

        {selected && (
          <p style={styles.selectionLabel}>
            Métier sélectionné :{" "}
            <strong style={{ color: selectedMetier?.couleur }}>
              {selectedMetier?.icon} {selectedMetier?.nom}
            </strong>
          </p>
        )}

        <button
          onClick={handleConfirm}
          disabled={!selected || loading}
          style={{
            ...styles.confirmBtn,
            backgroundColor: selected ? selectedMetier?.couleur : "#334155",
            opacity: !selected || loading ? 0.5 : 1,
            cursor: !selected || loading ? "not-allowed" : "pointer",
            boxShadow: selected
              ? `0 8px 30px ${selectedMetier?.couleur}50`
              : "none",
          }}
        >
          {loading ? (
            <span style={styles.spinner}>⟳ Configuration en cours...</span>
          ) : (
            <>
              {selected
                ? `Configurer mon espace ${selectedMetier?.nom} →`
                : "Sélectionnez votre métier"}
            </>
          )}
        </button>

        <p style={styles.note}>
          ⚠️ Ce choix est définitif. Contactez le support pour le modifier.
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500&display=swap');

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        button { font-family: 'DM Sans', sans-serif; }
      `}</style>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────
const styles = {
  page: {
    minHeight: "100vh",
    background: "#0a0f1e",
    color: "#f1f5f9",
    fontFamily: "'DM Sans', sans-serif",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "0 24px 60px",
    position: "relative",
    overflow: "hidden",
  },
  bgGrid: {
    position: "fixed",
    inset: 0,
    backgroundImage: `
      linear-gradient(rgba(148,163,184,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(148,163,184,0.03) 1px, transparent 1px)
    `,
    backgroundSize: "40px 40px",
    pointerEvents: "none",
  },
  bgGlow: {
    position: "fixed",
    top: "-20%",
    left: "50%",
    transform: "translateX(-50%)",
    width: "800px",
    height: "400px",
    background: "radial-gradient(ellipse, rgba(14,165,233,0.08) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  header: {
    width: "100%",
    maxWidth: "900px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "28px 0 0",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  logoIcon: { fontSize: "24px" },
  logoText: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: "20px",
    color: "#f1f5f9",
    letterSpacing: "-0.5px",
  },
  step: {
    display: "flex",
    gap: "6px",
    alignItems: "center",
  },
  stepDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#334155",
  },
  stepDotActive: {
    width: "24px",
    borderRadius: "4px",
    background: "#38bdf8",
  },
  titleBlock: {
    textAlign: "center",
    margin: "52px 0 44px",
    animation: "fadeSlideUp 0.6s ease both",
  },
  title: {
    fontFamily: "'Syne', sans-serif",
    fontSize: "clamp(28px, 4vw, 42px)",
    fontWeight: 800,
    color: "#f8fafc",
    margin: "0 0 14px",
    letterSpacing: "-1px",
    lineHeight: 1.1,
  },
  subtitle: {
    fontSize: "16px",
    color: "#94a3b8",
    lineHeight: 1.7,
    margin: 0,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: "16px",
    width: "100%",
    maxWidth: "900px",
  },
  card: {
    position: "relative",
    background: "#111827",
    border: "1.5px solid #1e293b",
    borderRadius: "16px",
    padding: "28px 24px 24px",
    textAlign: "left",
    cursor: "pointer",
    transition: "all 0.2s ease",
    animation: "fadeSlideUp 0.5s ease both",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    outline: "none",
  },
  cardSelected: {
    background: "#0d1b2a",
    border: "1.5px solid",
  },
  cardHovered: {
    background: "#131f2e",
    border: "1.5px solid #2d3f55",
  },
  checkBadge: {
    position: "absolute",
    top: "14px",
    right: "14px",
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    color: "white",
    fontSize: "12px",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrap: {
    width: "52px",
    height: "52px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "4px",
  },
  icon: { fontSize: "26px" },
  cardTitle: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: "17px",
    margin: "4px 0 0",
    letterSpacing: "-0.3px",
    transition: "color 0.2s",
  },
  cardDesc: {
    fontSize: "13px",
    color: "#64748b",
    margin: 0,
    lineHeight: 1.5,
  },
  features: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    marginTop: "12px",
  },
  featurePill: {
    fontSize: "11px",
    padding: "4px 10px",
    borderRadius: "20px",
    border: "1px solid",
    color: "#94a3b8",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    background: "rgba(255,255,255,0.03)",
  },
  footer: {
    marginTop: "44px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "14px",
    width: "100%",
    maxWidth: "420px",
  },
  selectionLabel: {
    fontSize: "14px",
    color: "#94a3b8",
    margin: 0,
  },
  confirmBtn: {
    width: "100%",
    padding: "16px 32px",
    borderRadius: "12px",
    border: "none",
    color: "white",
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: "16px",
    letterSpacing: "-0.3px",
    transition: "all 0.25s ease",
    outline: "none",
  },
  spinner: {
    display: "inline-block",
    animation: "spin 1s linear infinite",
  },
  error: {
    color: "#f87171",
    fontSize: "14px",
    margin: 0,
    textAlign: "center",
  },
  note: {
    fontSize: "12px",
    color: "#475569",
    textAlign: "center",
    margin: 0,
  },
};
