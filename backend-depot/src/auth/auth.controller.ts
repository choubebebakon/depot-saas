import { Controller, Post, Body, Get, UseGuards, Res, Req, Logger, InternalServerErrorException, HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import type { Response } from 'express';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
    private readonly logger = new Logger(AuthController.name);

    constructor(private readonly authService: AuthService) { }

    // Inscription d'un nouveau dépôt (Public)
    @Public()
    @Post('register')
    async register(@Body() registerDto: RegisterDto) {
        try {
            return await this.authService.register(registerDto);
        } catch (error: any) {
            this.logger.error(`Erreur critique lors de l'inscription: ${error.message}`, error.stack);
            
            // Rejeter l'erreur proprement vers le client
            if (error instanceof HttpException) {
                throw error;
            }
            
            // Renvoyer l'erreur spécifique pour que le frontend puisse l'afficher
            throw new InternalServerErrorException({
                message: error.message || 'Erreur interne lors de la création du compte',
                error: 'Registration Failed'
            });
        }
    }

    // Connexion existante (Public)
    @Public()
    @Throttle({ default: { limit: 10, ttl: 300000 } })
    @Post('login')
    async login(@Body() body: any, @Res({ passthrough: true }) res: Response) {
        const result = await this.authService.login(body.email, body.password);
        
        // Refresh Token en Cookie httpOnly
        res.cookie('refreshToken', result.refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 jours
        });

        return {
            access_token: result.access_token,
            user: result.user,
        };
    }

    // Renouvellement du token (Public car utilise le cookie de refresh)
    @Public()
    @Post('refresh')
    async refresh(@Req() req: any, @Body() body: any) { // FIX #1: Ajout de @Req() req pour pouvoir accéder aux cookies de la requête
        const refreshToken = req.cookies?.refreshToken || body?.refreshToken; // FIX #1: Extraction du token depuis le cookie httpOnly ou le body
        return this.authService.refresh(refreshToken); // FIX #1: Appel au service avec le token extrait
    }

    // Deconnexion (Protegee)
    @UseGuards(JwtAuthGuard)
    @Post('logout')
    async logout(@Req() req: any, @Res({ passthrough: true }) res: Response) {
        if (req.user) {
            await this.authService.logout(req.user.userId);
        }
        res.clearCookie('refreshToken');
        return { message: 'Deconnexion reussie' };
    }

    // Profil connecté (Protégé)
    @UseGuards(JwtAuthGuard)
    @Get('me')
    async getProfile(@CurrentUser() user: any) {
        const tenant = await this.authService.getTenantInfo(user.tenantId);
        return {
            ...user,
            metier: tenant?.metier,
            nomEntreprise: tenant?.nomEntreprise ?? tenant?.name,
        };
    }
}
