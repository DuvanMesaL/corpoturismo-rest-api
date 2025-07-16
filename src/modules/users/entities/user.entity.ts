import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Role } from '../../roles/entities/role.entity';

export enum UserStatus {
  INACTIVE = 'inactive',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
}

@Entity('users')
@Index(['email'], { unique: true })
@Index(['uuid'], { unique: true })
export class User extends BaseEntity {
  @Column({ type: 'uuid', unique: true })
  uuid: string;

  @Column({ unique: true, length: 100 })
  email: string;

  @Column({ length: 255 })
  password: string;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.INACTIVE,
  })
  status: UserStatus;

  @Column({ name: 'first_name', length: 50, nullable: true })
  firstName: string;

  @Column({ name: 'second_name', length: 50, nullable: true })
  secondName: string;

  @Column({ name: 'first_lastname', length: 50, nullable: true })
  firstLastname: string;

  @Column({ name: 'second_lastname', length: 50, nullable: true })
  secondLastname: string;

  @Column({ name: 'identification_type', length: 20, nullable: true })
  identificationType: string;

  @Column({ name: 'identification_number', length: 50, nullable: true })
  identificationNumber: string;

  @Column({ name: 'phone_number', length: 20, nullable: true })
  phoneNumber: string;

  @Column({ name: 'invitation_date', nullable: true })
  invitationDate: Date;

  @Column({ name: 'activation_date', nullable: true })
  activationDate: Date;

  @Column({ name: 'last_login', nullable: true })
  lastLogin: Date;

  @Column({ name: 'registration_ip', length: 45, nullable: true })
  registrationIp: string;

  @Column({ name: 'registration_device', length: 200, nullable: true })
  registrationDevice: string;

  @Column({ name: 'is_temporary', default: true })
  isTemporary: boolean;

  @Column({ name: 'invitation_token', length: 255, nullable: true })
  invitationToken: string;

  @Column({ name: 'invitation_expires_at', nullable: true })
  invitationExpiresAt: Date;

  // Relaciones
  @ManyToOne(() => Role, (role) => role.users, { eager: true })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'invited_by_user_id' })
  invitedBy: User;
}
