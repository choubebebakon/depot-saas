import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { openNotchPayCheckout } from '../api/notchpayCheckout';

const TVA = 0.1925;

const PLANS = [
  {
    id: 'TRIAL', name: 'TRIAL', icon: '🚀', color: 'slate',
    monthly: 0, annual: 0, depots: 1,
    badge: null,
    desc: 'Démarrez sans engagement',
    features: ['1 dépôt', '30 jours d\'essai', 'Toutes les fonctionnalités', 'Support email'],
  },
  {
    id: 'SOLO', name: 'SOLO', icon: '⚡', color: 'blue',
    monthly: 20000, annual: 200000, depots: 1,
    badge: null,
    desc: 'Pour les petits commerces',
    features: ['1 dépôt', 'Gestion des stocks', 'Rapports basiques', 'Support standard', 'Exports Excel'],
  },
  {
    id: 'PME', name: 'PME', icon: '🏆', color: 'amber',
    monthly: 50000, annual: 500000, depots: 5,
    badge: 'RECOMMANDÉ',
    desc: 'La référence multi-dépôts',
    features: ['5 dépôts', 'Multi-stock avancé', 'Rapports détaillés', 'Support prioritaire', 'API complète', 'Tournées de livraison'],
  },
  {
    id: 'ENTERPRISE', name: 'ENTERPRISE', icon: '🌐', color: 'purple',
    monthly: 100000, annual: 1000000, depots: 20,
    badge: null,
    desc: 'Grandes structures',
    features: ['20 dépôts', 'Tout PME inclus', 'Rapports personnalisés', 'Support dédié 24/7', 'Formation incluse', 'SLA garanti'],
  },
];

const PAYMENT_METHODS = [
  { id: 'MTN_MOMO', label: 'MTN MoMo', icon: '📱', color: '#FFC107', bg: 'rgba(255,193,7,0.12)', border: 'rgba(255,193,7,0.4)', requiresPhone: true },
  { id: 'ORANGE_MONEY', label: 'Orange Money', icon: '🟠', color: '#FF6B00', bg: 'rgba(255,107,0,0.12)', border: 'rgba(255,107,0,0.4)', requiresPhone: true },
  { id: 'VISA_CARD', label: 'Visa', icon: '💳', color: '#1A73E8', bg: 'rgba(26,115,232,0.12)', border: 'rgba(26,115,232,0.4)', requiresPhone: false },
  { id: 'MASTERCARD', label: 'Mastercard', icon: '💳', color: '#EB001B', bg: 'rgba(235,0,27,0.12)', border: 'rgba(235,0,27,0.4)', requiresPhone: false },
  { id: 'STRIPE', label: 'Stripe', icon: '🔒', color: '#635BFF', bg: 'rgba(99,91,255,0.12)', border: 'rgba(99,91,255,0.4)', requiresPhone: false },
];

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n);
const normalizePhone = (phone) => {
  if (!phone) return null;
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.startsWith('237') ? cleaned : '237' + cleaned;
};

const NOTCHPAY_CHANNELS = {
  MTN_MOMO: 'mtn',
  ORANGE_MONEY: 'orange',
  VISA_CARD: 'card',
  MASTERCARD: 'card',
  STRIPE: 'card',
};

export default function PricingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [cycle, setCycle] = useState('MONTHLY');
  const [modal, setModal] = useState(null); // { plan, method }
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState(1); // 1=method, 2=confirm

  const price = (p) => cycle === 'MONTHLY' ? p.monthly : p.annual;
  const ttc = (ht) => ({ ht, tva: Math.round(ht * TVA), ttc: ht + Math.round(ht * TVA) });

  const openModal = (plan, method) => {
    setModal({ plan, method });
    setPhone(''); setError(''); setSuccess(''); setStep(1);
  };

  const closeModal = () => { setModal(null); setStep(1); };

  const handleDirectPayment = async (plan, method, phoneNumber) => {
    const p = price(plan);
    const { ttc: total } = ttc(p);
    const channel = NOTCHPAY_CHANNELS[method.id] || 'card';

    setLoading(true); setError('');
    try {
      const res = await api.post('/payments/init', {
        planPurchased: plan.id,
        billingCycle: cycle,
        method: method.id,
        channel,
        amount: total,
        momoPhoneNumber: normalizePhone(phoneNumber), // Utilisation du normalisateur
      });

      const checkout = res.data?.checkout ?? {
        checkoutUrl: res.data?.checkout_url ?? res.data?.checkoutUrl,
        reference: res.data?.reference,
        amount: total,
        currency: 'XAF',
        channel,
      };

      if (res.data?.stripeClientSecret) {
        navigate('/payment-card', { state: { clientSecret: res.data.stripeClientSecret } });
        return;
      }

      await openNotchPayCheckout(checkout, {
        onSuccess: () => {
          setSuccess('Paiement confirmé. Redirection vers GeStock...');
          // REDIRECTION AUTOMATIQUE VERS ONBOARDING
          setTimeout(() => { 
            closeModal();
            navigate('/onboarding/metier'); 
          }, 1500);
        },
        onFailure: () => setError('Paiement refusé ou annulé.'),
        onClose: () => setLoading(false),
      });
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur lors du paiement');
    } finally { setLoading(false); }
  };

  const handlePay = async () => {
    if (!modal) return;
    const m = PAYMENT_METHODS.find(x => x.id === modal.method);
    if (m?.requiresPhone && (!phone || phone.length < 9)) {
      setError('Numero invalide (min. 9 chiffres)'); return;
    }
    await handleDirectPayment(modal.plan, m, phone);
  };

  const planColors = { slate: '#64748b', blue: '#3b82f6', amber: '#f59e0b', purple: '#8b5cf6' };
  const highlightedPlan = new URLSearchParams(location.search).get('highlight')?.toUpperCase();

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1117 50%, #0a0a1a 100%)', fontFamily: "'Inter', -apple-system, sans-serif", position: 'relative', overflow: 'hidden' }}>
      {/* Animated BG */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: 600, height: 600, background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)', borderRadius: '50%', animation: 'pulse 8s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)', borderRadius: '50%', animation: 'pulse 10s ease-in-out infinite reverse' }} />
        <div style={{ position: 'absolute', top: '40%', left: '30%', width: 300, height: 300, background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)', borderRadius: '50%' }} />
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
          @keyframes pulse { 0%,100%{transform:scale(1);opacity:0.7} 50%{transform:scale(1.1);opacity:1} }
          @keyframes fadeInUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
          @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
          .plan-card { transition: all 0.3s ease; cursor: pointer; }
          .plan-card:hover { transform: translateY(-8px); }
          .highlighted-plan { animation: fadeInUp 0.4s ease, highlightedPlanPulse 1.8s ease-in-out infinite; }
          @keyframes highlightedPlanPulse {
            0%,100% { box-shadow: 0 0 0 1px rgba(245,158,11,0.75), 0 0 34px rgba(245,158,11,0.22); }
            50% { box-shadow: 0 0 0 2px rgba(245,158,11,1), 0 0 58px rgba(245,158,11,0.38); }
          }
          .pay-btn { transition: all 0.2s ease; cursor: pointer; border: none; }
          .pay-btn:hover { transform: translateY(-2px); filter: brightness(1.1); }
          .pay-btn:active { transform: translateY(0); }
          .modal-overlay { animation: fadeInUp 0.2s ease; }
        `}</style>
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1280, margin: '0 auto', padding: '60px 24px 80px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 56, animation: 'fadeInUp 0.6s ease' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 100, padding: '6px 18px', marginBottom: 24 }}>
            <span style={{ fontSize: 12, color: '#a78bfa', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' }}>Plans & Tarifs</span>
          </div>
          <h1 style={{ fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 900, color: '#fff', lineHeight: 1.1, margin: '0 0 20px', letterSpacing: -2 }}>
            Gérez vos dépôts<br />
            <span style={{ background: 'linear-gradient(135deg, #f59e0b, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>sans limite</span>
          </h1>
          <p style={{ fontSize: 18, color: '#94a3b8', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
            Paiement local simplifié via MTN MoMo, Orange Money ou carte bancaire internationale.
          </p>
        </div>

        {/* Billing Toggle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 56 }}>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 6, display: 'inline-flex', gap: 4 }}>
            {['MONTHLY', 'ANNUAL'].map(c => (
              <button key={c} onClick={() => setCycle(c)} style={{
                padding: '12px 28px', borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, transition: 'all 0.3s ease',
                background: cycle === c ? 'linear-gradient(135deg, #6d28d9, #4f46e5)' : 'transparent',
                color: cycle === c ? '#fff' : '#64748b',
                boxShadow: cycle === c ? '0 4px 20px rgba(109,40,217,0.4)' : 'none',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                {c === 'MONTHLY' ? 'Mensuel' : 'Annuel'}
                {c === 'ANNUAL' && <span style={{ background: 'rgba(245,158,11,0.2)', color: '#fbbf24', fontSize: 11, padding: '2px 8px', borderRadius: 100, fontWeight: 800 }}>-17%</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Plans Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginBottom: 80 }}>
          {PLANS.map((plan, idx) => {
            const p = price(plan);
            const { tva, ttc: total } = ttc(p);
            const accent = planColors[plan.color];
            const isPopular = plan.badge === 'RECOMMANDÉ';
            const isFree = p === 0;
            const isHighlighted = highlightedPlan === plan.id;
            return (
              <div key={plan.id} className={`plan-card${isHighlighted ? ' highlighted-plan' : ''}`} style={{
                background: isPopular
                  ? 'linear-gradient(160deg, rgba(245,158,11,0.08) 0%, rgba(15,15,30,0.95) 40%)'
                  : 'rgba(255,255,255,0.03)',
                border: isHighlighted ? '1px solid rgba(245,158,11,0.95)' : (isPopular ? '1px solid rgba(245,158,11,0.5)' : '1px solid rgba(255,255,255,0.07)'),
                borderRadius: 24, padding: '32px 28px', position: 'relative',
                boxShadow: isHighlighted ? '0 0 0 1px rgba(245,158,11,0.75), 0 0 34px rgba(245,158,11,0.22)' : (isPopular ? '0 0 60px rgba(245,158,11,0.12), inset 0 1px 0 rgba(255,255,255,0.05)' : 'inset 0 1px 0 rgba(255,255,255,0.04)'),
                animation: `fadeInUp ${0.3 + idx * 0.1}s ease`,
                backdropFilter: 'blur(20px)',
              }}>
                {isHighlighted && (
                  <div style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(245,158,11,0.16)', border: '1px solid rgba(245,158,11,0.55)', color: '#fbbf24', fontSize: 10, fontWeight: 900, padding: '4px 10px', borderRadius: 100, letterSpacing: 1, textTransform: 'uppercase' }}>
                    Suggere
                  </div>
                )}
                {plan.badge && (
                  <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000', fontSize: 11, fontWeight: 900, padding: '4px 16px', borderRadius: 100, letterSpacing: 1, whiteSpace: 'nowrap' }}>
                    ⭐ {plan.badge}
                  </div>
                )}

                {/* Plan header */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>{plan.icon}</div>
                  <h3 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 4px', letterSpacing: -0.5 }}>{plan.name}</h3>
                  <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>{plan.desc}</p>
                </div>

                {/* Price */}
                <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 48, fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: -2 }}>
                      {isFree ? 'Gratuit' : fmt(p)}
                    </span>
                    {!isFree && <span style={{ color: '#64748b', fontSize: 14, fontWeight: 600 }}>FCFA</span>}
                  </div>
                  {!isFree && (
                    <>
                      <p style={{ fontSize: 12, color: '#475569', margin: '2px 0' }}>/{cycle === 'MONTHLY' ? 'mois HT' : 'an HT'}</p>
                      <p style={{ fontSize: 12, color: '#d97706', margin: '4px 0 0', fontWeight: 600 }}>TVA (19,25%) : +{fmt(tva)} FCFA → TTC {fmt(total)}</p>
                    </>
                  )}
                  <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6, background: `rgba(${accent === planColors.amber ? '245,158,11' : '59,130,246'},0.1)`, border: `1px solid ${accent}33`, borderRadius: 100, padding: '4px 12px' }}>
                    <span style={{ fontSize: 12, color: accent, fontWeight: 700 }}>🏪 {plan.depots} dépôt{plan.depots > 1 ? 's' : ''}</span>
                  </div>
                </div>

                {/* Features */}
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {plan.features.map((f, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#94a3b8' }}>
                      <span style={{ width: 18, height: 18, borderRadius: '50%', background: `${accent}22`, border: `1px solid ${accent}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, color: accent }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA Buttons */}
                {isFree ? (
                  <button onClick={() => navigate('/register')} className="pay-btn" style={{
                    width: '100%', padding: '14px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', color: '#fff', fontWeight: 700, fontSize: 15,
                  }}>
                    Commencer l'essai gratuit →
                  </button>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {/* Mobile Money */}
                    <p style={{ fontSize: 11, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>Mobile Money</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {PAYMENT_METHODS.filter(m => m.requiresPhone).map(m => (
                        <button key={m.id} onClick={() => openModal(plan, m.id)} className="pay-btn" style={{
                          padding: '12px 8px', borderRadius: 12, background: m.bg, border: `1px solid ${m.border}`,
                          color: m.color, fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        }}>
                          {m.icon} {m.label}
                        </button>
                      ))}
                    </div>
                    {/* Card */}
                    <p style={{ fontSize: 11, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: '4px 0 0' }}>Carte bancaire</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                      {PAYMENT_METHODS.filter(m => !m.requiresPhone).map(m => (
                        <button key={m.id} onClick={() => openModal(plan, m.id)} className="pay-btn" style={{
                          padding: '12px 4px', borderRadius: 12, background: m.bg, border: `1px solid ${m.border}`,
                          color: m.color, fontWeight: 700, fontSize: 11, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                        }}>
                          <span style={{ fontSize: 18 }}>{m.icon}</span>
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Trust badges */}
        <div style={{ textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 48 }}>
          <p style={{ color: '#334155', fontSize: 13, fontWeight: 600, marginBottom: 24, textTransform: 'uppercase', letterSpacing: 1 }}>Paiements sécurisés via</p>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
            {[
              { label: 'MTN MoMo', bg: '#FFC107', color: '#000', text: 'M' },
              { label: 'Orange Money', bg: '#FF6B00', color: '#fff', text: 'O' },
              { label: 'Visa', bg: '#1A73E8', color: '#fff', text: 'VISA' },
              { label: 'Mastercard', bg: 'linear-gradient(135deg, #EB001B, #F79E1B)', color: '#fff', text: 'MC' },
              { label: 'Stripe', bg: '#635BFF', color: '#fff', text: 'S' },
            ].map(b => (
              <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b' }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: b.bg, color: b.color, fontWeight: 900, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{b.text}</div>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{b.label}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap' }}>
            {['🔒 Paiements chiffrés SSL', '🏦 Fonds protégés', '✅ Remboursement 14 jours'].map(t => (
              <span key={t} style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {modal && (() => {
        const m = PAYMENT_METHODS.find(x => x.id === modal.method);
        const p = price(modal.plan);
        const { ttc: total } = ttc(p);
        return (
          <div onClick={closeModal} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,10,0.85)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <div onClick={e => e.stopPropagation()} className="modal-overlay" style={{
              background: 'linear-gradient(160deg, rgba(15,15,30,0.99) 0%, rgba(10,10,20,0.99) 100%)',
              border: `1px solid ${m.border}`, borderRadius: 28, padding: 40, maxWidth: 460, width: '100%',
              boxShadow: `0 0 80px ${m.bg}`,
            }}>
              {/* Modal header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: m.bg, border: `1px solid ${m.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
                  {m.icon}
                </div>
                <div>
                  <h3 style={{ margin: 0, color: '#fff', fontSize: 22, fontWeight: 900 }}>Payer via {m.label}</h3>
                  <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>Plan {modal.plan.name} · {cycle === 'MONTHLY' ? 'Mensuel' : 'Annuel'}</p>
                </div>
              </div>

              {/* Amount recap */}
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 20, marginBottom: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: '#64748b', fontSize: 14 }}>Montant HT</span>
                  <span style={{ color: '#fff', fontWeight: 600 }}>{fmt(p)} FCFA</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: '#64748b', fontSize: 14 }}>TVA (19,25%)</span>
                  <span style={{ color: '#d97706', fontWeight: 600 }}>+{fmt(Math.round(p * TVA))} FCFA</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12, marginTop: 4 }}>
                  <span style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>Total TTC</span>
                  <span style={{ color: m.color, fontWeight: 900, fontSize: 20 }}>{fmt(total)} FCFA</span>
                </div>
              </div>

              {/* Phone input for mobile money */}
              {m.requiresPhone && (
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', color: '#94a3b8', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                    Numéro {m.label}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: 15 }}>📱</span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="6XX XXX XXX"
                      style={{
                        width: '100%', boxSizing: 'border-box', paddingLeft: 44, paddingRight: 16, paddingTop: 14, paddingBottom: 14,
                        background: 'rgba(255,255,255,0.05)', border: `1px solid ${phone.length >= 9 ? m.border : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: 14, color: '#fff', fontSize: 16, outline: 'none', transition: 'border 0.2s',
                        fontFamily: 'inherit', letterSpacing: 1,
                      }}
                    />
                  </div>
                </div>
              )}

              {!m.requiresPhone && (
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 16, marginBottom: 24, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 20 }}>🔒</span>
                  <p style={{ margin: 0, color: '#94a3b8', fontSize: 13, lineHeight: 1.6 }}>
                    Vous serez redirigé vers la page de paiement sécurisée {m.label} pour entrer vos données bancaires.
                  </p>
                </div>
              )}

              {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: 14, fontWeight: 600 }}>{error}</div>}
              {success && <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80', borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: 14, fontWeight: 600 }}>{success}</div>}

              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={closeModal} className="pay-btn" style={{ flex: 1, padding: '16px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', color: '#94a3b8', fontWeight: 700, fontSize: 15 }}>
                  Annuler
                </button>
                <button onClick={handlePay} disabled={loading} className="pay-btn" style={{
                  flex: 2, padding: '16px', borderRadius: 14, fontWeight: 800, fontSize: 16,
                  background: loading ? '#334155' : `linear-gradient(135deg, ${m.color}, ${m.color}cc)`,
                  color: '#fff', opacity: loading ? 0.7 : 1, boxShadow: loading ? 'none' : `0 8px 24px ${m.bg}`,
                }}>
                  {loading ? '⏳ Traitement...' : `Payer ${fmt(total)} FCFA`}
                </button>
              </div>

              <p style={{ textAlign: 'center', color: '#334155', fontSize: 12, marginTop: 16, marginBottom: 0 }}>
                🔒 Transaction sécurisée · GeStock SaaS
              </p>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
