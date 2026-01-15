package user

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/kekw123q/spotik-backend/internal/domain"
	"github.com/kekw123q/spotik-backend/pkg/postgres"
)

type Repository struct {
	client *postgres.Client
}

func NewRepository(client *postgres.Client) *Repository {
	return &Repository{client: client}
}

func (r *Repository) GetByID(ctx context.Context, id uuid.UUID) (*domain.User, error) {
	// Мы добавили COALESCE, чтобы превратить NULL в пустую строку ''
	q := `
		SELECT id, username, email, COALESCE(bio, ''), COALESCE(avatar_url, ''), created_at, updated_at 
		FROM users 
		WHERE id = $1
	`

	var u domain.User
	err := r.client.Pool.QueryRow(ctx, q, id).Scan(
		&u.ID,
		&u.Username,
		&u.Email,
		&u.Bio,
		&u.AvatarURL,
		&u.CreatedAt,
		&u.UpdatedAt,
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, domain.ErrUserNotFound
		}
		// Вот тут мы увидим реальную ошибку в логах, если она останется
		fmt.Printf("Error scanning user: %v\n", err)
		return nil, fmt.Errorf("repo: failed to get user: %w", err)
	}
	return &u, nil
}
func (r *Repository) Update(ctx context.Context, user *domain.User) error {
	q := `UPDATE users SET username = $1, bio = $2, avatar_url = $3, updated_at = NOW() WHERE id = $4`

	// Если строка пустая, Postgres нормально это съест, так что тут менять особо нечего,
	// но убедись, что код выглядит так:
	_, err := r.client.Pool.Exec(ctx, q, user.Username, user.Bio, user.AvatarURL, user.ID)
	if err != nil {
		return fmt.Errorf("repo: failed to update user: %w", err)
	}
	return nil
}
