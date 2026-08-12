import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { openNotchPayCheckout } from '../api/notchpayCheckout';
import Icon from '../shared/components/Icon';

const TVA = 0.1925;

const PLANS = [
  {
    id: 'TRIAL', name: 'TRIAL', icon: 'Rocket', color: 'slate',
    monthly: 0, annual: 0, depots: 1,
    badge: null,
    desc: 'Démarrez sans engagement',
    features: ['1 structure', '14 jours d\'essai', 'Toutes les fonctionnalités', 'Notifications', 'IA (chatbot)'],
  },
  {
    id: 'SOLO', name: 'SOLO', icon: 'Zap', color: 'blue',
    monthly: 25000, annual: 249000, depots: 1,
    badge: null,
    desc: 'Pour les petits commerces',
    features: ['1 structure', 'Gestion des stocks', 'Rapport intelligent', 'Support standard', 'Export EXCEL', 'Notification', 'IA (chatbot)', 'Audit gestion'],
  },
  {
    id: 'PME', name: 'PME', icon: 'Trophy', color: 'amber',
    monthly: 50000, annual: 498000, depots: 10,
    badge: 'RECOMMANDÉ',
    desc: 'La référence multi-structures',
    features: ['10 structures', 'Multi-stock avancé', 'Rapports détaillés', 'Support prioritaire', 'Gestion du personnel illimité', 'Gestion des rôles dans l\'entreprise', 'Notification — alerte stock — rupture', 'IA avancée'],
  },
  {
    id: 'ENTERPRISE', name: 'ENTERPRISE', icon: 'Globe', color: 'purple',
    monthly: 100000, annual: 996000, depots: 999,
    badge: null,
    desc: 'Grandes structures',
    features: ['Illimité', 'Tout PME inclus', 'Rapports personnalisés', 'Support dédié 24/7', 'Formation incluse'],
  },
];

const PAYMENT_METHODS = [
  { id: 'MTN_MOMO', label: 'MTN MoMo', icon: 'Smartphone', color: '#FFC107', bg: 'rgba(255,193,7,0.12)', border: 'rgba(255,193,7,0.4)', requiresPhone: true },
  { id: 'ORANGE_MONEY', label: 'Orange Money', icon: 'Circle', color: '#FF6B00', bg: 'rgba(255,107,0,0.12)', border: 'rgba(255,107,0,0.4)', requiresPhone: true },
  { id: 'VISA_CARD', label: 'Visa', icon: 'CreditCard', color: '#1A73E8', bg: 'rgba(26,115,232,0.12)', border: 'rgba(26,115,232,0.4)', requiresPhone: false },
  { id: 'MASTERCARD', label: 'Mastercard', icon: 'CreditCard', color: '#EB001B', bg: 'rgba(235,0,27,0.12)', border: 'rgba(235,0,27,0.4)', requiresPhone: false },
  { id: 'STRIPE', label: 'Stripe', icon: 'Lock', color: '#635BFF', bg: 'rgba(99,91,255,0.12)', border: 'rgba(99,91,255,0.4)', requiresPhone: false },
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
    <div className="pricing-liquid" style={{ minHeight: '100vh', background: '#ffffff', fontFamily: "'Inter', -apple-system, sans-serif", position: 'relative', overflow: 'hidden' }}>
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

          /* ===== GESTOCK LIQUID GLASS — VISUAL LAYER ONLY ===== */
          .pricing-liquid {
            color: #e8efff !important;
            background:
              radial-gradient(circle at 8% 5%, rgba(77,123,255,.20), transparent 28%),
              radial-gradient(circle at 92% 8%, rgba(139,92,246,.20), transparent 30%),
              radial-gradient(circle at 50% 100%, rgba(38,91,180,.16), transparent 34%),
              linear-gradient(145deg,#020617 0%,#061126 48%,#030816 100%) !important;
          }

          .pricing-liquid::before {
            content:"";
            position:fixed;
            inset:0;
            pointer-events:none;
            z-index:0;
            opacity:.38;
            background-image:
              linear-gradient(rgba(255,255,255,.018) 1px,transparent 1px),
              linear-gradient(90deg,rgba(255,255,255,.018) 1px,transparent 1px);
            background-size:42px 42px;
            mask-image:linear-gradient(to bottom,black,transparent 90%);
          }

          .pricing-liquid > div[style*="maxWidth"] {
            max-width:1320px !important;
            padding:52px 24px 90px !important;
          }

          .pricing-liquid h1 {
            color:#f8fbff !important;
            text-shadow:0 10px 40px rgba(66,112,255,.18);
          }

          .pricing-liquid h1 span {
            background:linear-gradient(135deg,#6ee7ff 0%,#7297ff 42%,#b58cff 100%) !important;
            -webkit-background-clip:text !important;
            background-clip:text !important;
          }

          .pricing-liquid p { color:#91a4c4 !important; }

          /* Glass label */
          .pricing-liquid [style*="rgba(139,92,246,0.1)"] {
            background:linear-gradient(135deg,rgba(87,130,255,.16),rgba(139,92,246,.11)) !important;
            border-color:rgba(157,190,255,.20) !important;
            box-shadow:inset 0 1px 0 rgba(255,255,255,.12),0 0 28px rgba(85,113,255,.10) !important;
            backdrop-filter:blur(18px) saturate(150%);
            -webkit-backdrop-filter:blur(18px) saturate(150%);
          }
          .pricing-liquid [style*="rgba(139,92,246,0.1)"] span { color:#a8c7ff !important; }

          /* Billing switch */
          .pricing-liquid [style*="background: '#f1f5f9'"] {
            background:rgba(14,27,52,.58) !important;
            border:1px solid rgba(166,196,255,.16) !important;
            border-radius:22px !important;
            box-shadow:inset 0 1px 0 rgba(255,255,255,.09),0 18px 45px rgba(0,0,0,.22) !important;
            backdrop-filter:blur(24px) saturate(150%);
            -webkit-backdrop-filter:blur(24px) saturate(150%);
          }
          .pricing-liquid [style*="background: cycle === 'MONTHLY'"] { border-radius:17px !important; }

          /* Premium glass cards */
          .pricing-liquid .plan-card {
            overflow:hidden;
            isolation:isolate;
            background:linear-gradient(145deg,rgba(37,60,101,.58),rgba(7,18,38,.70)) !important;
            border:1px solid rgba(171,202,255,.17) !important;
            border-radius:30px !important;
            box-shadow:
              inset 0 1px 0 rgba(255,255,255,.14),
              inset 0 -1px 0 rgba(0,0,0,.22),
              0 28px 80px rgba(0,0,0,.32),
              0 0 0 1px rgba(91,130,255,.035) !important;
            backdrop-filter:blur(28px) saturate(145%);
            -webkit-backdrop-filter:blur(28px) saturate(145%);
          }

          .pricing-liquid .plan-card::before {
            content:"";
            position:absolute;
            inset:1px;
            border-radius:29px;
            pointer-events:none;
            z-index:-1;
            background:
              radial-gradient(circle at 12% 0%,rgba(164,213,255,.16),transparent 30%),
              linear-gradient(135deg,rgba(255,255,255,.08),transparent 32%);
          }

          .pricing-liquid .plan-card::after {
            content:"";
            position:absolute;
            width:180px;
            height:180px;
            top:-95px;
            right:-70px;
            border-radius:50%;
            pointer-events:none;
            background:rgba(89,129,255,.16);
            filter:blur(35px);
            z-index:-1;
          }

          .pricing-liquid .plan-card:hover {
            transform:translateY(-10px) scale(1.008) !important;
            border-color:rgba(176,211,255,.31) !important;
            box-shadow:
              inset 0 1px 0 rgba(255,255,255,.18),
              0 34px 95px rgba(0,0,0,.40),
              0 0 45px rgba(74,119,255,.13) !important;
          }

          .pricing-liquid .plan-card h3 { color:#f4f8ff !important; }
          .pricing-liquid .plan-card p { color:#8ea2c3 !important; }
          .pricing-liquid .plan-card [style*="font-size: 48px"] {
            color:#f7faff !important;
            text-shadow:0 6px 25px rgba(92,132,255,.12);
          }
          .pricing-liquid .plan-card [style*="borderBottom: '1px solid #e2e8f0'"] {
            border-bottom-color:rgba(169,198,255,.13) !important;
          }
          .pricing-liquid .plan-card li { color:#b3c1d8 !important; }

          .pricing-liquid .plan-card .pay-btn {
            border-radius:17px !important;
            box-shadow:inset 0 1px 0 rgba(255,255,255,.14),0 10px 25px rgba(0,0,0,.16) !important;
            backdrop-filter:blur(14px);
            -webkit-backdrop-filter:blur(14px);
          }
          .pricing-liquid .plan-card .pay-btn:hover {
            box-shadow:
              inset 0 1px 0 rgba(255,255,255,.22),
              0 14px 30px rgba(0,0,0,.22),
              0 0 25px rgba(95,132,255,.12) !important;
          }

          .pricing-liquid .highlighted-plan {
            border-color:rgba(255,197,76,.72) !important;
            box-shadow:
              inset 0 1px 0 rgba(255,255,255,.16),
              0 0 0 1px rgba(255,190,55,.42),
              0 28px 85px rgba(0,0,0,.34),
              0 0 65px rgba(255,178,42,.18) !important;
          }

          .pricing-liquid [style*="borderTop: '1px solid #e2e8f0'"] {
            border-top-color:rgba(167,197,255,.13) !important;
          }

          /* Payment modal */
          .pricing-liquid [style*="background: 'rgba(0,0,10,0.85)'"] {
            background:rgba(1,6,18,.72) !important;
            backdrop-filter:blur(24px) saturate(130%) !important;
            -webkit-backdrop-filter:blur(24px) saturate(130%) !important;
          }

          .pricing-liquid .modal-overlay {
            animation:liquidModalIn .42s cubic-bezier(.2,.8,.2,1) both !important;
            background:
              radial-gradient(circle at 90% 0%,rgba(91,120,255,.18),transparent 34%),
              linear-gradient(145deg,rgba(25,43,76,.90),rgba(5,13,28,.94)) !important;
            border:1px solid rgba(184,211,255,.20) !important;
            border-radius:32px !important;
            box-shadow:
              inset 0 1px 0 rgba(255,255,255,.15),
              0 40px 100px rgba(0,0,0,.58),
              0 0 70px rgba(76,116,255,.14) !important;
            backdrop-filter:blur(30px) saturate(145%);
            -webkit-backdrop-filter:blur(30px) saturate(145%);
          }

          @keyframes liquidModalIn {
            from { opacity:0; transform:translateY(18px) scale(.97); }
            to { opacity:1; transform:translateY(0) scale(1); }
          }

          .pricing-liquid .modal-overlay h3 { color:#f6f9ff !important; }

          .pricing-liquid .modal-overlay [style*="background: 'rgba(255,255,255,0.04)'"] {
            background:rgba(255,255,255,.045) !important;
            border-color:rgba(190,213,255,.12) !important;
            box-shadow:inset 0 1px 0 rgba(255,255,255,.07) !important;
            backdrop-filter:blur(18px);
            -webkit-backdrop-filter:blur(18px);
          }

          .pricing-liquid .modal-overlay input {
            background:rgba(4,13,29,.62) !important;
            border-color:rgba(175,204,255,.16) !important;
          }
          .pricing-liquid .modal-overlay input:focus {
            border-color:rgba(112,159,255,.58) !important;
            box-shadow:0 0 0 4px rgba(88,126,255,.10),inset 0 1px 10px rgba(0,0,0,.20) !important;
          }
          .pricing-liquid .modal-overlay .pay-btn {
            border-radius:17px !important;
            box-shadow:inset 0 1px 0 rgba(255,255,255,.12),0 12px 28px rgba(0,0,0,.22) !important;
          }

          @media (max-width:760px) {
            .pricing-liquid > div[style*="maxWidth"] { padding:34px 14px 64px !important; }
            .pricing-liquid h1 { font-size:clamp(34px,11vw,48px) !important; letter-spacing:-1.5px !important; }
            .pricing-liquid .plan-card { border-radius:26px !important; padding:26px 20px !important; }
            .pricing-liquid .plan-card:hover { transform:translateY(-5px) !important; }
            .pricing-liquid .modal-overlay { border-radius:26px !important; }
          }

          @media (prefers-reduced-motion:reduce) {
            .pricing-liquid *, .pricing-liquid *::before, .pricing-liquid *::after {
              animation-duration:.01ms !important;
              animation-iteration-count:1 !important;
              transition-duration:.01ms !important;
              scroll-behavior:auto !important;
            }
          }
        `}</style>
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1280, margin: '0 auto', padding: '60px 24px 80px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 56, animation: 'fadeInUp 0.6s ease' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 100, padding: '6px 18px', marginBottom: 24 }}>
            <span style={{ fontSize: 12, color: '#8b5cf6', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' }}>Plans & Tarifs</span>
          </div>
          <h1 style={{ fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 900, color: '#1e293b', lineHeight: 1.1, margin: '0 0 20px', letterSpacing: -2 }}>
            Gérez vos dépôts<br />
            <span style={{ background: 'linear-gradient(135deg, #f59e0b, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>sans limite</span>
          </h1>
          <p style={{ fontSize: 18, color: '#64748b', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
            Paiement local simplifié via MTN MoMo, Orange Money ou carte bancaire internationale.
          </p>
        </div>

        {/* Billing Toggle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 56 }}>
          <div style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 16, padding: 6, display: 'inline-flex', gap: 4 }}>
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
                  ? 'linear-gradient(160deg, rgba(245,158,11,0.05) 0%, #ffffff 40%)'
                  : '#ffffff',
                border: isHighlighted ? '2px solid rgba(245,158,11,0.95)' : (isPopular ? '1px solid rgba(245,158,11,0.3)' : '1px solid #e2e8f0'),
                borderRadius: 24, padding: '32px 28px', position: 'relative',
                boxShadow: isHighlighted ? '0 0 0 1px rgba(245,158,11,0.75), 0 0 34px rgba(245,158,11,0.22)' : (isPopular ? '0 0 60px rgba(245,158,11,0.12), 0 4px 20px rgba(0,0,0,0.05)' : '0 4px 20px rgba(0,0,0,0.05)'),
                animation: `fadeInUp ${0.3 + idx * 0.1}s ease`,
              }}>
                {isHighlighted && (
                  <div style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(245,158,11,0.16)', border: '1px solid rgba(245,158,11,0.55)', color: '#fbbf24', fontSize: 10, fontWeight: 900, padding: '4px 10px', borderRadius: 100, letterSpacing: 1, textTransform: 'uppercase' }}>
                    Suggere
                  </div>
                )}
                {plan.badge && (
                  <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000', fontSize: 11, fontWeight: 900, padding: '4px 16px', borderRadius: 100, letterSpacing: 1, whiteSpace: 'nowrap' }}>
                    <Icon name="Star" size={12} /> {plan.badge}
                  </div>
                )}

                {/* Plan header */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}><Icon name={plan.icon} size={36} style={{ color: accent }} /></div>
                  <h3 style={{ fontSize: 22, fontWeight: 900, color: '#1e293b', margin: '0 0 4px', letterSpacing: -0.5 }}>{plan.name}</h3>
                  <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>{plan.desc}</p>
                </div>

                {/* Price */}
                <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid #e2e8f0' }}>
                  {cycle === 'ANNUAL' && !isFree ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 48, fontWeight: 900, color: '#1e293b', lineHeight: 1, letterSpacing: -2 }}>
                          {fmt(p)}
                        </span>
                        <span style={{ color: '#64748b', fontSize: 14, fontWeight: 600 }}>FCFA / an HT</span>
                      </div>
                      <p style={{ fontSize: 13, color: '#64748b', margin: '2px 0' }}>soit {fmt(Math.round(p / 12))} FCFA/mois</p>
                      <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0', textDecoration: 'line-through' }}>{fmt(Math.round(p / 0.83))} FCFA</p>
                      <p style={{ fontSize: 12, color: '#10b981', margin: '2px 0', fontWeight: 700 }}>Économisez {fmt(Math.round(p / 0.83) - p)} FCFA/an</p>
                      <p style={{ fontSize: 12, color: '#d97706', margin: '4px 0 0', fontWeight: 600 }}>TTC annuel : {fmt(total)} FCFA</p>
                    </>
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 48, fontWeight: 900, color: '#1e293b', lineHeight: 1, letterSpacing: -2 }}>
                          {isFree ? 'Gratuit' : fmt(p)}
                        </span>
                        {!isFree && <span style={{ color: '#64748b', fontSize: 14, fontWeight: 600 }}>FCFA</span>}
                      </div>
                      {!isFree && (
                        <>
                          <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0' }}>/{cycle === 'MONTHLY' ? 'mois HT' : 'an HT'}</p>
                          <p style={{ fontSize: 12, color: '#d97706', margin: '4px 0 0', fontWeight: 600 }}>TVA (19,25%) : +{fmt(tva)} FCFA → TTC {fmt(total)}</p>
                        </>
                      )}
                    </>
                  )}
                  <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6, background: `rgba(${accent === planColors.amber ? '245,158,11' : '59,130,246'},0.1)`, border: `1px solid ${accent}33`, borderRadius: 100, padding: '4px 12px' }}>
                    <Icon name="Store" size={12} style={{ color: accent }} /> <span style={{ fontSize: 12, color: accent, fontWeight: 700 }}>{plan.depots === 999 ? 'Illimité' : `${plan.depots} structure${plan.depots > 1 ? 's' : ''}`}</span>
                  </div>
                </div>

                {/* Features */}
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {plan.features.map((f, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#64748b' }}>
                      <span style={{ width: 18, height: 18, borderRadius: '50%', background: `${accent}22`, border: `1px solid ${accent}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, color: accent }}><Icon name="Check" size={10} /></span>
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA Buttons */}
                {isFree ? (
                  <button onClick={() => navigate('/register')} className="pay-btn" style={{
                    width: '100%', padding: '14px', borderRadius: 14, background: '#6366f1', color: '#fff', fontWeight: 700, fontSize: 15,
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
                          <Icon name={m.icon} size={16} /> {m.label}
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
                          <Icon name={m.icon} size={18} />
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
        <div style={{ textAlign: 'center', borderTop: '1px solid #e2e8f0', paddingTop: 48 }}>
          <p style={{ color: '#64748b', fontSize: 13, fontWeight: 600, marginBottom: 24, textTransform: 'uppercase', letterSpacing: 1 }}>Paiements sécurisés via</p>
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
            {[
              { icon: 'Lock', text: 'Paiements chiffrés SSL' },
              { icon: 'Building2', text: 'Fonds protégés' },
              { icon: 'CheckCircle', text: 'Remboursement 14 jours' }
            ].map(t => (
              <span key={t.text} style={{ fontSize: 13, color: '#64748b', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name={t.icon} size={14} /> {t.text}
              </span>
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
                  <Icon name={m.icon} size={28} />
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
                    <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: 15 }}><Icon name="Smartphone" size={16} /></span>
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
                  <Icon name="Lock" size={20} />
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
                  {loading ? <><Icon name="Clock" size={16} /> Traitement...</> : `Payer ${fmt(total)} FCFA`}
                </button>
              </div>

              <p style={{ textAlign: 'center', color: '#334155', fontSize: 12, marginTop: 16, marginBottom: 0 }}>
                <Icon name="Lock" size={12} /> Transaction sécurisée · GeStock SaaS
              </p>
            </div>
          </div>
        );
      })()}
    </div>
  );
}