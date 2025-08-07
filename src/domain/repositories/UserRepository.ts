import { User, CreateUserDto, CompleteRegistrationDto } from "../entities/User";

export interface UserRepository {
  create(
    userData: CreateUserDto & { uuid: string; password: string }
  ): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findByUuid(uuid: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  update(id: string, userData: Partial<User>): Promise<User>;
  completeRegistration(
    uuid: string,
    data: CompleteRegistrationDto
  ): Promise<User>;
  findAll(filters?: any): Promise<User[]>;
  delete(id: string): Promise<void>;
}
