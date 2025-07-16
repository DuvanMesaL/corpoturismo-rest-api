import { IsEmail, IsNumber } from 'class-validator';

export class InviteUserDto {
  @IsEmail()
  email: string;

  @IsNumber()
  roleId: number;
}
