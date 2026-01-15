// client/src/data/repositories/ApiUserRepository.ts
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { User } from "../../domain/entities/user";

export class ApiUserRepository implements IUserRepository {
    // ВАЖНО: Указываем адрес нашего нового сервиса
    private baseUrl = "http://localhost:8085/api/profile";

    async getUser(): Promise<User> {
        const response = await fetch(this.baseUrl, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error("Failed to fetch user profile");
        }

        return response.json();
    }

    async updateProfile(user: Partial<User>): Promise<User> {
        const response = await fetch(this.baseUrl, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(user),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "Failed to update profile");
        }

        return response.json();
    }
}