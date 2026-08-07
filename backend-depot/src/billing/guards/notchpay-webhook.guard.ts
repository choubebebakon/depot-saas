import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { NotchPayService } from '../../payments/notchpay.service';

interface RequestWithRawBody {
  rawBody?: Buffer;
  headers: Record<string, string | string[] | undefined>;
  body: unknown;
}

/**
 * Guard de sécurité pour le webhook public NotchPay.
 * Valide la signature HMAC SHA256 (x-notchpay-signature / x-notch-signature)
 * sur le corps brut de la requête avant tout traitement métier.
 */
@Injectable()
export class NotchPayWebhookGuard implements CanActivate {
  private readonly logger = new Logger(NotchPayWebhookGuard.name);

  constructor(private readonly notchPayService: NotchPayService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithRawBody>();

    const signatureHeader =
      request.headers['x-notchpay-signature'] ??
      request.headers['x-notch-signature'];

    const signature = Array.isArray(signatureHeader)
      ? signatureHeader[0]
      : signatureHeader;

    const rawBody = request.rawBody;

    if (!rawBody || !signature) {
      this.logger.warn(
        'Webhook NotchPay rejeté : signature ou rawBody manquant',
      );
      throw new UnauthorizedException({
        error: 'WEBHOOK_UNAUTHORIZED',
        message: 'Signature NotchPay manquante ou corps brut indisponible.',
      });
    }

    const payload = rawBody.toString('utf8');
    const isValid = this.notchPayService.verifyWebhookSignature(
      payload,
      signature,
    );

    if (!isValid) {
      this.logger.warn('Webhook NotchPay rejeté : signature invalide');
      throw new UnauthorizedException({
        error: 'WEBHOOK_INVALID_SIGNATURE',
        message: 'Signature NotchPay invalide.',
      });
    }

    return true;
  }
}
