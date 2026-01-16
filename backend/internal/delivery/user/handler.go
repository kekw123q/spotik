package user

import (
	"encoding/json"
	"net/http"

	"fmt"
	"io"
	"os"
	"path/filepath"

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
func (h *Handler) UploadAvatar(w http.ResponseWriter, r *http.Request) {
	// 1. Ограничиваем размер файла (например, 10 МБ)
	r.ParseMultipartForm(10 << 20)

	// 2. Получаем файл из формы
	file, handler, err := r.FormFile("avatar")
	if err != nil {
		http.Error(w, "Error retrieving the file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// 3. Создаем уникальное имя файла
	// (берем расширение файла, например .jpg, и добавляем UUID)
	ext := filepath.Ext(handler.Filename)
	newFileName := uuid.New().String() + ext

	// Создаем папку uploads, если её нет
	uploadDir := "./uploads"
	if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
		os.Mkdir(uploadDir, 0755)
	}

	// 4. Создаем файл на диске
	filePath := filepath.Join(uploadDir, newFileName)
	dst, err := os.Create(filePath)
	if err != nil {
		http.Error(w, "Error saving file", http.StatusInternalServerError)
		return
	}
	defer dst.Close()

	// 5. Копируем содержимое
	if _, err := io.Copy(dst, file); err != nil {
		http.Error(w, "Error writing file", http.StatusInternalServerError)
		return
	}

	// 6. Формируем ссылку для браузера
	// Внимание: порт должен совпадать с тем, где запущен сервер (8085)
	fileURL := fmt.Sprintf("http://localhost:8085/uploads/%s", newFileName)

	// Возвращаем JSON с ссылкой
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"url": fileURL})
}
