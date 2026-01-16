import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { ApiUserRepository } from "../repositories/ApiUserRepository";

export class RepositoryFactory {
    static createUserRepository(): IUserRepository {
        return new ApiUserRepository();
    }
}