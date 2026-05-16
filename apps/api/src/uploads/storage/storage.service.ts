import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

export interface StoredFile {
  filePath: string;
  fileName: string;
}

@Injectable()
export class StorageService {
  private readonly uploadRoot: string;

  constructor(private readonly config: ConfigService) {
    this.uploadRoot = this.config.get<string>('UPLOAD_DIR') ?? path.join(process.cwd(), 'uploads');
  }

  async store(tenantId: string, uploadId: string, file: Express.Multer.File): Promise<StoredFile> {
    const dir = path.join(this.uploadRoot, tenantId, uploadId);
    fs.mkdirSync(dir, { recursive: true });

    const ext = path.extname(file.originalname);
    const fileName = `${uploadId}${ext}`;
    const filePath = path.join(dir, fileName);

    fs.writeFileSync(filePath, file.buffer);
    return { filePath, fileName };
  }

  async delete(filePath: string): Promise<void> {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  getAbsolutePath(filePath: string): string {
    return filePath;
  }
}
