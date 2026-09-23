import { useEffect, useRef, useState } from 'react';
import {
  PUSH_WAIT_SECONDS,
  getPushFallback,
} from '../config/paymentPushFallback';

/**
 * PaymentPushMonitor — écran d'attente du push Mobile Money.
 *
 * FAITS VALIDÉS PAR LE SUPPORT NOTCHPAY (2026-09) :
 * - Les canaux mobile money (cm.mtn, cm.orange, …) déclenchent par défaut un
 *   VRAI PUSH automatique (pop-up PIN sur le téléphone du client) : le client
 *   ne compose rien manuellement dans le parcours normal.
 * - Le push peut échouer à s'afficher pour des raisons hors du contrôle de
 *   GesTock/NotchPay : timeout réseau opérateur, session USSD déjà active,
 *   écran verrouillé/en veille. AUCUN moyen technique ne permet de forcer
 *   l'affichage si l'opérateur ne distribue pas le push.
 * - Ce comportement concerne TOUS les push mobile money, pas seulement MTN.
 *
 * CONDUITE À TENIR (identique quel que soit l'opérateur) :
 * 1. Décompte visuel (PUSH_WAIT_SECONDS, fourchette 2-3 min) invitant le
 *    client à vérifier son téléphone.
 * 2. Bouton « Relancer » (même canal) proposé si aucune validation n'a eu
 *    lieu passé ce délai.
 * 3. Instruction de secours UNIQUEMENT après le délai, spécifique à
 *    l'opérateur détecté : seul MTN (*126# → menu des transactions en
 *    attente, ou app MTN MoMo) est confirmé. Pour Orange et les autres
 *    opérateurs, la procédure n'est PAS confirmée : message strictement
 *    neutre (pas de code deviné) en attendant la validation du support
 *    NotchPay. Source unique du secours : src/config/paymentPushFallback.js.
 */

/** Masque un numéro E.164 pour l'affichage : +237675558437 → +237 6 75 ** ** 37 */
export function maskPhone(e164) {
  if (typeof e164 !== 'string' || e164.length < 6) return e164 ?? '';
  const head = e164.slice(0, 4);
  const tail = e164.slice(-2);
  return `${head} ${'•'.repeat(Math.max(e164.length - 6, 2))} ${tail}`;
}

export default function PaymentPushMonitor({ channelId, phone, onRetry, retrying = false, onCancel }) {
  const [secondsLeft, setSecondsLeft] = useState(PUSH_WAIT_SECONDS);
  const [expired, setExpired] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current);
          setExpired(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const fallback = getPushFallback(channelId);
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  return (
    <div className="payment-push-monitor" role="status" aria-live="polite">
      <style>{`
        .payment-push-monitor { color: #e2e8f0; text-align: center; }
        .ppm-spinner { width: 44px; height: 44px; margin: 0 auto 18px; border-radius: 50%;
          border: 4px solid rgba(148,163,184,0.25); border-top-color: #38bdf8;
          animation: ppm-rotate 0.9s linear infinite; }
        @keyframes ppm-rotate { to { transform: rotate(360deg); } }
        .payment-push-monitor h3 { margin: 0 0 10px; font-size: 20px; font-weight: 900; color: #fff; }
        .ppm-countdown { font-size: 34px; font-weight: 900; letter-spacing: 3px; color: #38bdf8;
          margin: 14px 0 4px; font-variant-numeric: tabular-nums; }
        .ppm-hint { margin: 6px 0 0; color: #94a3b8; font-size: 13px; line-height: 1.6; }
        .ppm-expired { background: rgba(251,191,36,0.08); border: 1px solid rgba(251,191,36,0.3);
          color: #fcd34d; border-radius: 12px; padding: 12px 16px; font-size: 13px; line-height: 1.6; margin-bottom: 14px; }
        .ppm-fallback { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px; padding: 14px 18px; text-align: left; font-size: 13px; line-height: 1.7;
          color: #cbd5e1; margin-bottom: 18px; }
        .ppm-fallback p { margin: 0 0 6px; }
        .ppm-fallback ol { margin: 0; padding-left: 20px; }
        .ppm-retry { width: 100%; padding: 14px; border: none; border-radius: 14px; cursor: pointer;
          background: linear-gradient(135deg, #0ea5e9, #6366f1); color: #fff; font-weight: 800; font-size: 15px; }
        .ppm-retry:disabled { opacity: 0.6; cursor: wait; }
        .ppm-cancel { width: 100%; margin-top: 10px; padding: 12px; border: none; border-radius: 14px; cursor: pointer;
          background: rgba(255,255,255,0.06); color: #94a3b8; font-weight: 700; font-size: 14px; }
      `}</style>
      <div className="ppm-spinner" aria-hidden="true" />
      <h3>Paiement en attente de validation</h3>
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: '#94a3b8' }}>
        Après votre confirmation sur la page de paiement NotchPay, votre opérateur
        envoie un pop-up de validation sur votre téléphone{' '}
        {phone ? <strong style={{ color: '#e2e8f0' }}>({maskPhone(phone)})</strong> : null}. Saisissez-y
        votre code secret pour valider le paiement. Si vous n'avez pas encore
        confirmé sur la page NotchPay, faites-le maintenant.
      </p>

      {!expired ? (
        <>
          <div className="ppm-countdown" aria-label="Temps restant avant relance">
            {mm}:{ss}
          </div>
          <p className="ppm-hint">
            Vérifiez votre téléphone : déverrouillez l'écran et vérifiez qu'aucune
            session USSD n'est en cours. Si le pop-up n'apparaît pas d'ici la fin
            du décompte, vous pourrez relancer la demande.
          </p>
        </>
      ) : (
        <>
          <div className="ppm-expired">
            <strong>Le délai d’attente est écoulé.</strong> Le push n’a pas pu vous être
            distribué (réseau opérateur, écran verrouillé ou session USSD active) — il
            n’est pas possible de le forcer depuis notre application.
          </div>

          {/* Instruction de secours UNIQUEMENT après le délai, jamais comme étape normale */}
          {fallback.confirmed && fallback.steps.length > 0 ? (
            <div className="ppm-fallback">
              <p><strong>Procédure de secours — {fallback.label} :</strong></p>
              <ol>
                {fallback.steps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            </div>
          ) : (
            <div className="ppm-fallback">
              <p>
                Si vous n'avez rien reçu, utilisez « Relancer la demande de
                paiement » ci-dessous pour recevoir un nouveau push, ou contactez
                le support si le problème persiste. La procédure de secours
                spécifique à {fallback.label} sera ajoutée dès confirmation par
                le support de paiement.
              </p>
            </div>
          )}

          <button
            type="button"
            className="ppm-retry"
            onClick={onRetry}
            disabled={retrying}
          >
            {retrying ? 'Relance en cours…' : 'Relancer la demande de paiement'}
          </button>
          {onCancel ? (
            <button type="button" className="ppm-cancel" onClick={onCancel}>
              Annuler et choisir un autre moyen
            </button>
          ) : null}
        </>
      )}
    </div>
  );
}
