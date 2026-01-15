package user

import (
	"encoding/json"
	"net/http"

	"github.com/google/uuid"
	"github.com/kekw123q/spotik-backend/internal/domain"
)

type Handler struct {
	useCase domain.UserUseCase
}

func NewHandler(uc domain.UserUseCase) *Handler {
	return &Handler{useCase: uc}
}

// Временная заглушка для ID, чтобы тестировать без авторизации.
// В будущем это нужно заменить на r.Context().Value("userID")
var dummyUserID = uuid.MustParse("00000000-0000-0000-0000-000000000001") // <-- ЗАМЕНИ ЭТОТ UUID НА ТОТ, ЧТО ЕСТЬ В ТВОЕЙ БД

func (h *Handler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var input domain.UpdateUserInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "invalid input body", http.StatusBadRequest)
		return
	}

	updatedUser, err := h.useCase.UpdateProfile(ctx, dummyUserID, input)
	if err != nil {
		switch err {
		case domain.ErrBanWordUsed:
			http.Error(w, "input contains restricted words", http.StatusBadRequest)
		case domain.ErrInvalidInput:
			http.Error(w, "invalid input length", http.StatusBadRequest)
		case domain.ErrUserNotFound:
			http.Error(w, "user not found", http.StatusNotFound)
		default:
			http.Error(w, "internal server error", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(updatedUser)
}

func (h *Handler) GetProfile(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	user, err := h.useCase.GetProfile(ctx, dummyUserID)
	if err != nil {
		if err == domain.ErrUserNotFound {
			http.Error(w, "user not found", http.StatusNotFound)
			return
		}
		http.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}
