import { RepositoryFactory } from '../../data/factory/RepositoryFactory';
import { IMusicRepository } from '../../domain/repositories/IMusicRepository';

export const useMusicRepository = (): IMusicRepository => {
  return RepositoryFactory.getMusicRepository();
};
