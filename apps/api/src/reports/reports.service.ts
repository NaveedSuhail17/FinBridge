import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { MISReport } from '../database/entities/mis-report.entity';
import { Transaction } from '../database/entities/transaction.entity';
import { AuditAction } from '../database/entities/enums';
import { GenerateReportDto, ReportType } from './dto/generate-report.dto';
import { ShareReportDto, ShareExpiry } from './dto/share-report.dto';
import { StorageService } from '../uploads/storage/storage.service';
import { AuditLogService } from '../audit/audit.service';

interface GeneratedReport {
  id: string;
  type: ReportType;
  tenantId: string;
  data: Record<string, unknown>;
  createdAt: Date;
  shareToken?: string;
  shareExpiry?: Date;
}

@Injectable()
export class ReportsService {
  private generatedReports: Map<string, GeneratedReport> = new Map();

  constructor(
    @InjectRepository(MISReport)
    private readonly misReportRepo: Repository<MISReport>,
    @InjectRepository(Transaction)
    private readonly txRepo: Repository<Transaction>,
    private readonly storageService: StorageService,
    private readonly auditService: AuditLogService,
    private readonly config: ConfigService,
  ) {}

  async uploadMisReport(
    file: Express.Multer.File,
    tenantId: string,
    userId: string,
  ): Promise<MISReport> {
    const reportId = uuidv4();
    const uploadRoot = this.config.get<string>('UPLOAD_DIR') ?? path.join(process.cwd(), 'uploads');
    const dir = path.join(uploadRoot, tenantId, 'mis-reports', reportId);
    fs.mkdirSync(dir, { recursive: true });

    const ext = path.extname(file.originalname);
    const filePath = path.join(dir, `${reportId}${ext}`);
    fs.writeFileSync(filePath, file.buffer);

    const report = await this.misReportRepo.save(
      this.misReportRepo.create({
        tenantId,
        filePath,
        fileName: file.originalname,
        fileSize: file.size,
        uploadedBy: userId,
      }),
    );

    await this.auditService.log({
      tenantId,
      userId,
      entityType: 'MISReport',
      entityId: report.id,
      action: AuditAction.CREATE,
    });
    return report;
  }

  async generate(
    dto: GenerateReportDto,
    tenantId: string,
    userId: string,
  ): Promise<GeneratedReport> {
    const where: FindOptionsWhere<Transaction> = { tenantId };
    if (dto.dateFrom && dto.dateTo) {
      where.transactionDate = Between(new Date(dto.dateFrom), new Date(dto.dateTo));
    }

    const transactions = await this.txRepo.find({
      where,
      relations: ['paymentHead', 'paymentSubHead'],
    });

    let data: Record<string, unknown> = {};

    switch (dto.type) {
      case ReportType.EXPENSE_SUMMARY: {
        const total = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
        data = { type: 'EXPENSE_SUMMARY', totalExpenses: total, count: transactions.length };
        break;
      }
      case ReportType.VENDOR_SUMMARY: {
        const byVendor: Record<string, number> = {};
        for (const t of transactions) {
          byVendor[t.vendorName] = (byVendor[t.vendorName] ?? 0) + Number(t.amount);
        }
        data = {
          type: 'VENDOR_SUMMARY',
          vendors: Object.entries(byVendor).map(([name, total]) => ({ name, total })),
        };
        break;
      }
      case ReportType.CATEGORY_BREAKDOWN: {
        const byHead: Record<string, number> = {};
        for (const t of transactions) {
          const key = t.paymentHead?.name ?? t.paymentHeadId;
          byHead[key] = (byHead[key] ?? 0) + Number(t.amount);
        }
        data = {
          type: 'CATEGORY_BREAKDOWN',
          categories: Object.entries(byHead).map(([name, total]) => ({ name, total })),
        };
        break;
      }
      case ReportType.CASH_FLOW: {
        const byMonth: Record<string, number> = {};
        for (const t of transactions) {
          const key = `${t.transactionDate.getFullYear()}-${String(t.transactionDate.getMonth() + 1).padStart(2, '0')}`;
          byMonth[key] = (byMonth[key] ?? 0) + Number(t.amount);
        }
        data = {
          type: 'CASH_FLOW',
          months: Object.entries(byMonth).map(([month, total]) => ({ month, total })),
        };
        break;
      }
    }

    const report: GeneratedReport = {
      id: uuidv4(),
      type: dto.type,
      tenantId,
      data,
      createdAt: new Date(),
    };

    this.generatedReports.set(report.id, report);
    await this.auditService.log({
      tenantId,
      userId,
      entityType: 'Report',
      entityId: report.id,
      action: AuditAction.CREATE,
    });
    return report;
  }

  async findAll(tenantId: string): Promise<MISReport[]> {
    return this.misReportRepo.findBy({ tenantId });
  }

  async findById(id: string, tenantId: string): Promise<MISReport> {
    const report = await this.misReportRepo.findOneBy({ id, tenantId });
    if (!report) throw new NotFoundException('Report not found');
    return report;
  }

  getGeneratedReport(id: string, tenantId: string): GeneratedReport {
    const report = this.generatedReports.get(id);
    if (!report || report.tenantId !== tenantId)
      throw new NotFoundException('Generated report not found');
    return report;
  }

  generateShareToken(
    id: string,
    tenantId: string,
    dto: ShareReportDto,
  ): { shareToken: string; shareUrl: string } {
    const report = this.getGeneratedReport(id, tenantId);
    const token = uuidv4();
    const expiryMap: Record<ShareExpiry, number | null> = {
      [ShareExpiry.SEVEN_DAYS]: 7 * 24 * 60 * 60 * 1000,
      [ShareExpiry.THIRTY_DAYS]: 30 * 24 * 60 * 60 * 1000,
      [ShareExpiry.NO_EXPIRY]: null,
    };

    const ms = expiryMap[dto.expiry];
    report.shareToken = token;
    report.shareExpiry = ms ? new Date(Date.now() + ms) : undefined;

    const baseUrl = this.config.get<string>('APP_BASE_URL') ?? 'http://localhost:3001';
    return { shareToken: token, shareUrl: `${baseUrl}/api/v1/reports/shared/${token}` };
  }
}
