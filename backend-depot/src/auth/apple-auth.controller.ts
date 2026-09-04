import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { Public } from './decorators/public.decorator';
import { AppleAuthService } from './apple-auth.service';

@Controller('auth/apple')
export class AppleAuthController {
  constructor(private readonly appleAuthService: AppleAuthService) {}

  @Public()
  @Throttle({ default: { limit: 20, ttl: 300000 } })
  @Get('challenge')
  async challenge(@Res({ passthrough: true }) res: Response) {
    const challenge = await this.appleAuthService.createChallenge();
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      maxAge: 10 * 60 * 1000,
      path: '/auth/apple',
    };
    res.cookie('appleOAuthState', challenge.state, cookieOptions);
    res.cookie('appleOAuthNonce', challenge.nonce, cookieOptions);
    return challenge;
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 300000 } })
  @Post()
  async login(
    @Body() body: { code?: string; state?: string; nonce?: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const expectedState = req.cookies?.appleOAuthState;
    const expectedNonce = req.cookies?.appleOAuthNonce;
    const origin = req.headers.origin;
    const configuredOrigins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || '')
      .split(',')
      .map((value) => value.trim().replace(/\/$/, ''))
      .filter(Boolean);

    if (origin && configuredOrigins.length > 0 && !configuredOrigins.includes(origin.replace(/\/$/, ''))) {
      return res.status(400).json({ message: 'Origine non autorisée.' });
    }

    const result = await this.appleAuthService.loginWithApple(
      body.code || '',
      body.state || '',
      body.nonce || '',
      expectedState || '',
      expectedNonce || '',
      { ip: req.ip ?? null, userAgent: req.headers['user-agent'] ?? null },
    );

    res.clearCookie('appleOAuthState', { path: '/auth/apple' });
    res.clearCookie('appleOAuthNonce', { path: '/auth/apple' });
    res.cookie('refreshToken', result.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return { access_token: result.access_token, user: result.user };
  }
}
