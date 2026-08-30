import {
  Controller,
  Post,
  Body,
  Get,
  Put,
  UseGuards,
  Res,
  Req,
  Logger,
  InternalServerErrorException,
  BadRequestException,
  HttpException,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { PreferencesDto } from './dto/preferences.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { PermissionService } from './permission.service';
import type { Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly permissionService: PermissionService,
  ) {}

  // Inscription d'un nouveau dépôt (Public)
  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    try {
      return await this.authService.register(registerDto);
    } catch (error: any) {
      this.logger.error(
        `Erreur critique lors de l'inscription: ${error.message}`,
        error.stack,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException({
        message:
          error.message || 'Erreur interne lors de la création du compte',
        error: 'Registration Failed',
      });
    }
  }

  // Connexion existante (Public)
  @Public()
  @Throttle({ default: { limit: 10, ttl: 300000 } })
  @Post('login')
  async login(
    @Body() body: any,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(body.email, body.password, {
      ip: req.ip ?? null,
      userAgent: req.headers?.['user-agent'] ?? null,
    });

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
  async refresh(@Req() req: any, @Body() body: any) {
    const refreshToken = req.cookies?.refreshToken || body?.refreshToken;
    return this.authService.refresh(refreshToken);
  }

  // Deconnexion (Protegee)
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    if (req.user) {
      await this.authService.logout(req.user.userId, {
        ip: req.ip ?? null,
        userAgent: req.headers?.['user-agent'] ?? null,
      });
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

  /** Permissions granulaires du user courant pour le métier du tenant. */
  @UseGuards(JwtAuthGuard)
  @Get('permissions')
  async getPermissions(@CurrentUser() user: any) {
    const tenant = await this.authService.getTenantInfo(user.tenantId);
    const metier = await this.permissionService.resolveMetierSlug(
      user.tenantId,
      undefined,
      tenant?.metier,
    );

    if (!metier) {
      return {
        fullAccess: false,
        denySousModules: [],
        permissions: {},
        libellePoste: user.role,
        metier: null,
      };
    }

    const result = await this.permissionService.getPermissionsForUser(
      user.role,
      metier,
    );

    return { ...result, metier };
  }

  // Mise à jour du profil utilisateur
  @UseGuards(JwtAuthGuard)
  @Put('me')
  async updateProfile(@CurrentUser() user: any, @Body() updateProfileDto: UpdateProfileDto) {
    return await this.authService.updateProfile(user.userId, updateProfileDto);
  }

  // Upload de photo de profil
  @UseGuards(JwtAuthGuard)
  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: './uploads/avatars',
        filename: (req, file, cb) => {
          const user = (req as any).user;
          const uniqueSuffix = `${user.userId}-${Date.now()}${extname(file.originalname)}`;
          cb(null, uniqueSuffix);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
          return cb(new BadRequestException("Format d'image non supporté (jpg, jpeg, png, webp uniquement)"), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  async uploadAvatar(@CurrentUser() user: any, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Aucun fichier reçu');
    }
    return await this.authService.uploadAvatar(user.userId, file);
  }

  // Changement de mot de passe
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(
    @CurrentUser() user: any,
    @Body() changePasswordDto: ChangePasswordDto,
    @Req() req: any,
  ) {
    return await this.authService.changePassword(user.userId, changePasswordDto, {
      ip: req.ip ?? null,
      userAgent: req.headers?.['user-agent'] ?? null,
    });
  }

  // Activation/Désactivation 2FA
  @UseGuards(JwtAuthGuard)
  @Post('2fa')
  async toggle2FA(@CurrentUser() user: any, @Body() body: { enabled: boolean }) {
    return await this.authService.toggle2FA(user.userId, body.enabled);
  }

  // Récupérer les préférences utilisateur
  @UseGuards(JwtAuthGuard)
  @Get('preferences')
  async getPreferences(@CurrentUser() user: any) {
    return await this.authService.getPreferences(user.userId);
  }

  // Mettre à jour les préférences utilisateur
  @UseGuards(JwtAuthGuard)
  @Put('preferences')
  async updatePreferences(@CurrentUser() user: any, @Body() preferencesDto: PreferencesDto) {
    return await this.authService.updatePreferences(user.userId, preferencesDto);
  }
}