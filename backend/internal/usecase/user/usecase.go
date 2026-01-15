package user

import (
	"context"
	"strings"

	"github.com/google/uuid"
	"github.com/kekw123q/spotik-backend/internal/domain"
)

type UserUseCase struct {
	userRepo domain.UserRepository
}

func NewUserUseCase(repo domain.UserRepository) *UserUseCase {
	return &UserUseCase{
		userRepo: repo,
	}
}

func (uc *UserUseCase) GetProfile(ctx context.Context, userID uuid.UUID) (*domain.User, error) {
	return uc.userRepo.GetByID(ctx, userID)
}

func (uc *UserUseCase) UpdateProfile(ctx context.Context, userID uuid.UUID, input domain.UpdateUserInput) (*domain.User, error) {
	user, err := uc.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	banWords := []string{"admin", "root", "badword"}

	if input.Username != nil {
		newUsername := *input.Username
		if len(newUsername) < 3 || len(newUsername) > 20 {
			return nil, domain.ErrInvalidInput
		}
		if containsBanWord(newUsername, banWords) {
			return nil, domain.ErrBanWordUsed
		}
		user.Username = newUsername
	}

	if input.Bio != nil {
		newBio := *input.Bio
		if len(newBio) > 150 {
			return nil, domain.ErrInvalidInput
		}
		if containsBanWord(newBio, banWords) {
			return nil, domain.ErrBanWordUsed
		}
		user.Bio = newBio
	}

	if input.AvatarURL != nil {
		user.AvatarURL = *input.AvatarURL
	}

	if err := uc.userRepo.Update(ctx, user); err != nil {
		return nil, err
	}

	return user, nil
}

func containsBanWord(text string, banList []string) bool {
	lowerText := strings.ToLower(text)
	for _, word := range banList {
		if strings.Contains(lowerText, word) {
			return true
		}
	}
	return false
}
