import {
  IsString,
  IsOptional,
  MinLength,
  Length,
  IsEmail,
} from 'class-validator';

export class CompleteRegistrationDto {
  @IsString()
  @Length(2, 50)
  firstName: string;

  @IsOptional()
  @IsString()
  @Length(2, 50)
  secondName?: string;

  @IsString()
  @Length(2, 50)
  firstLastname: string;

  @IsOptional()
  @IsString()
  @Length(2, 50)
  secondLastname?: string;

  @IsString()
  @Length(2, 20)
  identificationType: string;

  @IsString()
  @Length(5, 50)
  identificationNumber: string;

  @IsOptional()
  @IsString()
  @Length(10, 20)
  phoneNumber?: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
