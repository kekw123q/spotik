import { IMusicRepository } from '../../domain/repositories/IMusicRepository';
import { MockMusicRepository } from '../repositories/MockMusicRepository';
import { ApiMusicRepository } from '../repositories/ApiMusicRepository';
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { ApiUserRepository } from "../repositories/ApiUserRepository";


const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

export class RepositoryFactory {
  private static musicRepository: IMusicRepository | null = null;

  static getMusicRepository(): IMusicRepository {
    if (!this.musicRepository) {
      this.musicRepository = USE_MOCKS
        ? new MockMusicRepository()
        : new ApiMusicRepository();
    }
    return this.musicRepository;
  }

  // For testing purposes or runtime switching
  static setMusicRepository(repository: IMusicRepository): void {
    this.musicRepository = repository;
  }

  static reset(): void {
    this.musicRepository = null;
  }
   static createUserRepository(): IUserRepository {
        return new ApiUserRepository();
    }
}
