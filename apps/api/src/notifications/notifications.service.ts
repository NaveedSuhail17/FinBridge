import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Observable, Subject, finalize } from 'rxjs';
import { Notification } from '../database/entities/notification.entity';
import { NotificationType } from '../database/entities/enums';

@Injectable()
export class NotificationsService {
  private readonly subjects = new Map<string, Subject<Notification>>();
  private readonly refCounts = new Map<string, number>();

  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
  ) {}

  stream(userId: string): Observable<Notification> {
    if (!this.subjects.has(userId)) {
      this.subjects.set(userId, new Subject<Notification>());
      this.refCounts.set(userId, 0);
    }
    this.refCounts.set(userId, (this.refCounts.get(userId) ?? 0) + 1);

    return this.subjects
      .get(userId)!
      .asObservable()
      .pipe(
        finalize(() => {
          const remaining = (this.refCounts.get(userId) ?? 1) - 1;
          if (remaining <= 0) {
            this.subjects.delete(userId);
            this.refCounts.delete(userId);
          } else {
            this.refCounts.set(userId, remaining);
          }
        }),
      );
  }

  async notify(
    tenantId: string,
    userId: string,
    type: NotificationType,
    message: string,
  ): Promise<Notification> {
    const notification = await this.repo.save(
      this.repo.create({ tenantId, userId, type, message, read: false }),
    );
    this.subjects.get(userId)?.next(notification);
    return notification;
  }

  async findAll(
    userId: string,
    tenantId: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: Notification[]; total: number }> {
    const [data, total] = await this.repo.findAndCount({
      where: { userId, tenantId },
      order: { read: 'ASC', createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async markRead(id: string, userId: string, tenantId: string): Promise<void> {
    const notification = await this.repo.findOneBy({ id, userId, tenantId });
    if (!notification) throw new NotFoundException('Notification not found');
    await this.repo.update(id, { read: true });
  }

  async markAllRead(userId: string, tenantId: string): Promise<void> {
    await this.repo.update({ userId, tenantId, read: false }, { read: true });
  }
}
