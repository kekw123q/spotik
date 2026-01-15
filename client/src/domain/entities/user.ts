// client/src/domain/user.ts

export interface User {
    id: string;
    username: string;
    email: string;
    bio: string;
    avatar_url: string;
}

// Тип для отправки обновленных данных
export interface UpdateUserDto {
    username?: string;
    bio?: string;
    avatar_url?: string;
}