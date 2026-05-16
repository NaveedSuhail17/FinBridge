import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentSubHead } from '../database/entities/payment-sub-head.entity';
import { PaymentHead } from '../database/entities/payment-head.entity';
import { Transaction } from '../database/entities/transaction.entity';
import { AuditAction } from '../database/entities/enums';
import { CreatePaymentSubHeadDto } from './dto/create-payment-sub-head.dto';
import { UpdatePaymentSubHeadDto } from './dto/update-payment-sub-head.dto';
import { AuditLogService } from '../audit/audit.service';

@Injectable()
export class PaymentSubHeadsService {
  constructor(
    @InjectRepository(PaymentSubHead)
    private readonly subHeadRepo: Repository<PaymentSubHead>,
    @InjectRepository(PaymentHead)
    private readonly headRepo: Repository<PaymentHead>,
    @InjectRepository(Transaction)
    private readonly txRepo: Repository<Transaction>,
    private readonly auditService: AuditLogService,
  ) {}

  async findAll(tenantId: string, paymentHeadId?: string): Promise<PaymentSubHead[]> {
    const where = paymentHeadId ? { tenantId, paymentHeadId } : { tenantId };
    return this.subHeadRepo.findBy(where);
  }

  async findOne(id: string, tenantId: string): Promise<PaymentSubHead> {
    const sh = await this.subHeadRepo.findOneBy({ id, tenantId });
    if (!sh) throw new NotFoundException('Payment sub-head not found');
    return sh;
  }

  async create(
    dto: CreatePaymentSubHeadDto,
    tenantId: string,
    actorId: string,
  ): Promise<PaymentSubHead> {
    const head = await this.headRepo.findOneBy({ id: dto.paymentHeadId, tenantId });
    if (!head) throw new NotFoundException('Payment head not found');

    const existing = await this.subHeadRepo.findOneBy({ tenantId, code: dto.code });
    if (existing) throw new ConflictException(`Sub-head with code '${dto.code}' already exists`);

    const sh = await this.subHeadRepo.save(
      this.subHeadRepo.create({
        tenantId,
        paymentHeadId: dto.paymentHeadId,
        code: dto.code,
        name: dto.name,
        description: dto.description ?? null,
      }),
    );

    await this.auditService.log({
      tenantId,
      userId: actorId,
      entityType: 'PaymentSubHead',
      entityId: sh.id,
      action: AuditAction.CREATE,
    });
    return sh;
  }

  async update(
    id: string,
    dto: UpdatePaymentSubHeadDto,
    tenantId: string,
    actorId: string,
  ): Promise<PaymentSubHead> {
    const sh = await this.findOne(id, tenantId);
    Object.assign(sh, dto);
    const saved = await this.subHeadRepo.save(sh);
    await this.auditService.log({
      tenantId,
      userId: actorId,
      entityType: 'PaymentSubHead',
      entityId: id,
      action: AuditAction.UPDATE,
      changes: dto as Record<string, unknown>,
    });
    return saved;
  }

  async remove(id: string, tenantId: string, actorId: string): Promise<void> {
    await this.findOne(id, tenantId);

    const txCount = await this.txRepo.countBy({ paymentSubHeadId: id });
    if (txCount > 0)
      throw new BadRequestException('Cannot delete: transactions reference this sub-head');

    await this.subHeadRepo.delete({ id, tenantId });
    await this.auditService.log({
      tenantId,
      userId: actorId,
      entityType: 'PaymentSubHead',
      entityId: id,
      action: AuditAction.DELETE,
    });
  }
}
