import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentHead } from '../database/entities/payment-head.entity';
import { PaymentSubHead } from '../database/entities/payment-sub-head.entity';
import { Transaction } from '../database/entities/transaction.entity';
import { BusinessTypeTemplate } from '../database/entities/business-type-template.entity';
import { BusinessType, AuditAction } from '../database/entities/enums';
import { CreatePaymentHeadDto } from './dto/create-payment-head.dto';
import { UpdatePaymentHeadDto } from './dto/update-payment-head.dto';
import { AuditLogService } from '../audit/audit.service';

@Injectable()
export class PaymentHeadsService {
  constructor(
    @InjectRepository(PaymentHead)
    private readonly headRepo: Repository<PaymentHead>,
    @InjectRepository(PaymentSubHead)
    private readonly subHeadRepo: Repository<PaymentSubHead>,
    @InjectRepository(Transaction)
    private readonly txRepo: Repository<Transaction>,
    @InjectRepository(BusinessTypeTemplate)
    private readonly templateRepo: Repository<BusinessTypeTemplate>,
    private readonly auditService: AuditLogService,
  ) {}

  async findAll(tenantId: string): Promise<PaymentHead[]> {
    return this.headRepo.findBy({ tenantId });
  }

  async findWithSubHeads(tenantId: string): Promise<PaymentHead[]> {
    return this.headRepo.find({
      where: { tenantId },
      relations: ['subHeads'],
      order: { code: 'ASC' },
    });
  }

  async findOne(id: string, tenantId: string): Promise<PaymentHead> {
    const head = await this.headRepo.findOneBy({ id, tenantId });
    if (!head) throw new NotFoundException('Payment head not found');
    return head;
  }

  async create(dto: CreatePaymentHeadDto, tenantId: string, actorId: string): Promise<PaymentHead> {
    const existing = await this.headRepo.findOneBy({ tenantId, code: dto.code });
    if (existing)
      throw new ConflictException(`Payment head with code '${dto.code}' already exists`);

    const head = await this.headRepo.save(
      this.headRepo.create({
        tenantId,
        code: dto.code,
        name: dto.name,
        description: dto.description ?? null,
      }),
    );

    await this.auditService.log({
      tenantId,
      userId: actorId,
      entityType: 'PaymentHead',
      entityId: head.id,
      action: AuditAction.CREATE,
    });
    return head;
  }

  async update(
    id: string,
    dto: UpdatePaymentHeadDto,
    tenantId: string,
    actorId: string,
  ): Promise<PaymentHead> {
    const head = await this.findOne(id, tenantId);
    Object.assign(head, dto);
    const saved = await this.headRepo.save(head);
    await this.auditService.log({
      tenantId,
      userId: actorId,
      entityType: 'PaymentHead',
      entityId: id,
      action: AuditAction.UPDATE,
      changes: dto as Record<string, unknown>,
    });
    return saved;
  }

  async remove(id: string, tenantId: string, actorId: string): Promise<void> {
    await this.findOne(id, tenantId);

    const subHeadCount = await this.subHeadRepo.countBy({ paymentHeadId: id });
    if (subHeadCount > 0)
      throw new BadRequestException('Cannot delete: sub-heads reference this payment head');

    const txCount = await this.txRepo.countBy({ paymentHeadId: id });
    if (txCount > 0)
      throw new BadRequestException('Cannot delete: transactions reference this payment head');

    await this.headRepo.delete({ id, tenantId });
    await this.auditService.log({
      tenantId,
      userId: actorId,
      entityType: 'PaymentHead',
      entityId: id,
      action: AuditAction.DELETE,
    });
  }

  async exportCsv(tenantId: string): Promise<string> {
    const heads = await this.findWithSubHeads(tenantId);
    const csv = (v: unknown) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
    const rows: string[] = ['head_code,head_name,sub_head_code,sub_head_name'];
    for (const h of heads) {
      if (!h.subHeads?.length) {
        rows.push([csv(h.code), csv(h.name), '""', '""'].join(','));
      } else {
        for (const sh of h.subHeads) {
          rows.push([csv(h.code), csv(h.name), csv(sh.code), csv(sh.name)].join(','));
        }
      }
    }
    return rows.join('\n');
  }

  async getTemplate(businessType: BusinessType): Promise<BusinessTypeTemplate> {
    const template = await this.templateRepo.findOneBy({ businessType });
    if (!template)
      throw new NotFoundException(`Template not found for business type: ${businessType}`);
    return template;
  }
}
