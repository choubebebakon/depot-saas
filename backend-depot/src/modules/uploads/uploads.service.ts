import { BadRequestException, Injectable } from '@nestjs/common';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';

const IMAGE_MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

@Injectable()
export class UploadsService {
  async uploadArticleImage(tenantId: string, file: Express.Multer.File) {
    if (!tenantId) throw new BadRequestException('Tenant introuvable');
    if (!file?.buffer?.length) throw new BadRequestException('Aucun fichier image reçu');

    const extension = IMAGE_MIME_TO_EXTENSION[file.mimetype];
    if (!extension) {
      throw new BadRequestException('Format image non supporté. Formats acceptés : JPG, PNG, WEBP.');
    }

    const safeTenantId = tenantId.replace(/[^a-zA-Z0-9_-]/g, '');
    if (!safeTenantId) throw new BadRequestException('Tenant invalide');

    const filename = `${randomBytes(18).toString('hex')}${extension}`;
    const relativeDirectory = join('uploads', 'tenants', safeTenantId, 'articles');
    const absoluteDirectory = join(process.cwd(), relativeDirectory);
    const absolutePath = join(absoluteDirectory, filename);

    await mkdir(absoluteDirectory, { recursive: true });
    await writeFile(absolutePath, file.buffer, { flag: 'wx' });

    return { url: `/uploads/tenants/${safeTenantId}/articles/${filename}` };
  }
}
