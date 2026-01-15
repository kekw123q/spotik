// client/src/domain/repositories/IUserRepository.ts
import { User } from "../entities/user"; // Проверь, что имя файла совпадает (user или User)

export interface IUserRepository {
    getUser(): Promise<User>;
    updateProfile(user: Partial<User>): Promise<User>;
}