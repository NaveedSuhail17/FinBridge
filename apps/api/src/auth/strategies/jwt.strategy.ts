import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { PlatformUser } from '../../database/entities/platform-user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    @InjectRepository(PlatformUser)
    private readonly userRepo: Repository<PlatformUser>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.userRepo.findOneBy({ id: payload.sub, isActive: true });
    if (!user) throw new UnauthorizedException('User not found or inactive');
    return {
      id: payload.sub,
      email: payload.email,
      tenantId: payload.tenantId,
      roleId: payload.roleId,
      roleName: payload.roleName,
    };
  }
}
