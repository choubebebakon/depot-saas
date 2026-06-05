const NOTCHPAY_SCRIPT_SRC = 'https://checkout.notchpay.co/script.js';
const SDK_READY_TIMEOUT_MS = 10000;
const SDK_READY_POLL_MS = 100;

type NotchPayCheckoutPayload = {
  publicKey?: string;
  paymentId?: string;
  checkoutUrl?: string;
  amount: number;
  currency: string;
  channel?: string;
  email: string;
  phone?: string;
  reference: string;
  description?: string;
};

type NotchPayOpenOptions = NotchPayCheckoutPayload & {
  key?: string;
  customer?: {
    email: string;
    phone?: string;
  };
  onSuccess?: (transaction: unknown) => void;
  onFailure?: (error: unknown) => void;
  onError?: (error: unknown) => void;
  onClose?: () => void;
};

type OpenNotchPayCallbacks = {
  onSuccess: (transaction: unknown) => void;
  onFailure: (error: unknown) => void;
  onClose?: () => void;
};

declare global {
  interface Window {
    NotchPay?: {
      open?: (options: NotchPayOpenOptions) => void;
    };
  }
}

let notchPayScriptPromise: Promise<void> | null = null;

function redirectToHostedCheckout(checkoutUrl?: string): void {
  console.warn('[NotchPay] Fallback activé.');

  if (!checkoutUrl) {
    throw new Error('URL de paiement NotchPay indisponible.');
  }

  window.location.href = checkoutUrl;
}

function waitForNotchPayReady(): Promise<void> {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();

    const checkReady = () => {
      if (window.NotchPay?.open) {
        console.info('[NotchPay] SDK prêt.');
        resolve();
        return;
      }

      if (Date.now() - startedAt >= SDK_READY_TIMEOUT_MS) {
        reject(new Error('NotchPay SDK non disponible après chargement du script.'));
        return;
      }

      window.setTimeout(checkReady, SDK_READY_POLL_MS);
    };

    checkReady();
  });
}

export async function loadNotchPayScript(): Promise<void> {
  if (window.NotchPay?.open) {
    console.info('[NotchPay] SDK prêt.');
    return;
  }

  if (!notchPayScriptPromise) {
    notchPayScriptPromise = new Promise((resolve, reject) => {
      console.info('[NotchPay] Chargement script...');

      const existingScript = document.querySelector<HTMLScriptElement>(
        `script[src="${NOTCHPAY_SCRIPT_SRC}"]`,
      );

      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(), { once: true });
        existingScript.addEventListener('error', () => reject(new Error('Impossible de charger NotchPay Checkout.')), { once: true });

        if (existingScript.dataset.loaded === 'true') {
          resolve();
        }

        return;
      }

      const script = document.createElement('script');
      script.src = NOTCHPAY_SCRIPT_SRC;
      script.async = true;
      script.onload = () => {
        script.dataset.loaded = 'true';
        resolve();
      };
      script.onerror = () => reject(new Error('Impossible de charger NotchPay Checkout.'));
      document.body.appendChild(script);
    });
  }

  await notchPayScriptPromise;
  await waitForNotchPayReady();
}

export async function openNotchPayCheckout(
  checkout: NotchPayCheckoutPayload,
  callbacks: OpenNotchPayCallbacks,
): Promise<void> {
  try {
    await loadNotchPayScript();

    if (!window.NotchPay?.open) {
      throw new Error('NotchPay Checkout indisponible.');
    }

    console.info('[NotchPay] Ouverture modale...');
    window.NotchPay.open({
      ...checkout,
      key: checkout.publicKey,
      customer: {
        email: checkout.email,
        phone: checkout.phone,
      },
      onSuccess: callbacks.onSuccess,
      onFailure: callbacks.onFailure,
      onError: callbacks.onFailure,
      onClose: callbacks.onClose,
    });
  } catch (error) {
    console.error('[NotchPay] Erreur checkout inline.', error);
    redirectToHostedCheckout(checkout?.checkoutUrl);
  }
}
