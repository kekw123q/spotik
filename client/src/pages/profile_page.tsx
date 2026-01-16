import React, { useEffect, useState } from "react";
import { User } from "../domain/entities/user";
import { RepositoryFactory } from "../data/factory/RepositoryFactory";

const ProfilePage: React.FC = () => {
    // 1. Инициализируем репозиторий
    const [userRepo] = useState(() => RepositoryFactory.createUserRepository());

    // 2. Состояния (State)
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    // Данные формы (включая ссылку на аватарку)
    const [formData, setFormData] = useState({
        username: "",
        bio: "",
        avatar_url: "" 
    });

    // 3. Загрузка данных при открытии
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await userRepo.getUser();
            setUser(data);
            // Заполняем форму текущими данными
            setFormData({ 
                username: data.username, 
                bio: data.bio || "", 
                avatar_url: data.avatar_url || "" 
            });
        } catch (err) {
            console.error(err);
            setError("Не удалось загрузить профиль. Убедитесь, что Go-сервер запущен.");
        } finally {
            setLoading(false);
        }
    };

    // 4. Загрузка файла (Аватарка)
    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        
        const file = e.target.files[0];
        const uploadData = new FormData();
        uploadData.append("avatar", file);

        try {
            // Отправляем файл на сервер
            const response = await fetch("http://localhost:8085/api/upload", {
                method: "POST",
                body: uploadData,
            });

            if (!response.ok) throw new Error("Ошибка загрузки файла");

            const data = await response.json(); // Ожидаем { url: "..." }
            
            // Обновляем форму, чтобы отобразить новую картинку сразу
            setFormData(prev => ({ ...prev, avatar_url: data.url }));
            
        } catch (err) {
            alert("Не удалось загрузить фото. Проверьте консоль.");
            console.error(err);
        }
    };

    // 5. Сохранение профиля
    const handleSave = async () => {
        setError(null);
        
        // Валидация (бан-слова)
        const banWords = ["admin", "root", "badword"];
        const hasBanWord = banWords.some(word => 
            formData.username.toLowerCase().includes(word) || 
            formData.bio.toLowerCase().includes(word)
        );

        if (hasBanWord) {
            setError("Ошибка: Использованы запрещенные слова!");
            return;
        }

        if (formData.username.length < 3 || formData.username.length > 20) {
            setError("Имя должно быть от 3 до 20 символов");
            return;
        }

        try {
            // Отправляем обновленные данные (включая новую ссылку на аватарку)
            const updatedUser = await userRepo.updateProfile({
                username: formData.username,
                bio: formData.bio,
                avatar_url: formData.avatar_url
            });
            
            setUser(updatedUser);
            setIsEditing(false); // Выходим из режима редактирования
        } catch (err: any) {
            setError("Ошибка сервера: " + err.message);
        }
    };

    if (loading) return <div style={{ color: "white", textAlign: "center", marginTop: "50px" }}>Загрузка...</div>;
    if (!user) return <div style={{ color: "red", textAlign: "center", marginTop: "50px" }}>{error}</div>;

    // --- СТИЛИ ---
    const containerStyle: React.CSSProperties = {
        padding: "40px",
        maxWidth: "700px",
        margin: "40px auto",
        backgroundColor: "#121212", // Очень темный фон (Spotify style)
        color: "white",
        borderRadius: "8px",
        boxShadow: "0 4px 60px rgba(0,0,0,0.6)",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    };

    const inputStyle: React.CSSProperties = {
        width: "100%",
        padding: "12px",
        marginTop: "8px",
        marginBottom: "20px",
        backgroundColor: "#2a2a2a",
        border: "1px solid #444",
        color: "white",
        borderRadius: "4px",
        fontSize: "16px"
    };

    const buttonStyle = (bgColor: string): React.CSSProperties => ({
        backgroundColor: bgColor,
        color: "white",
        padding: "12px 30px",
        border: "none",
        borderRadius: "30px",
        cursor: "pointer",
        fontWeight: "bold",
        fontSize: "14px",
        marginRight: "15px",
        textTransform: "uppercase",
        letterSpacing: "1px"
    });

    return (
        <div style={containerStyle}>
            <h1 style={{ borderBottom: "1px solid #333", paddingBottom: "20px", marginBottom: "30px" }}>Профиль</h1>
            
            <div style={{ display: "flex", alignItems: "flex-start", gap: "30px" }}>
                
                {/* --- АВАТАРКА --- */}
                <div style={{ position: "relative", width: "150px", height: "150px", flexShrink: 0 }}>
                    <label style={{ cursor: isEditing ? "pointer" : "default", display: "block", width: "100%", height: "100%" }}>
                        
                        {/* Скрытый инпут для файла */}
                        {isEditing && (
                            <input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleAvatarChange} 
                                style={{ display: "none" }} 
                            />
                        )}

                        <div style={{ 
                            width: "100%", height: "100%", borderRadius: "50%", 
                            backgroundColor: "#282828", overflow: "hidden", 
                            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                            position: "relative"
                        }}>
                            {/* Логика выбора картинки: Новая -> Текущая -> Заглушка */}
                            {(formData.avatar_url || user.avatar_url) ? (
                                <img 
                                    src={formData.avatar_url || user.avatar_url} 
                                    alt="Avatar" 
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                                />
                            ) : (
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: "60px", color: "#555" }}>
                                    👤
                                </div>
                            )}
                            
                            {/* Оверлей "Изменить" */}
                            {isEditing && (
                                <div style={{
                                    position: "absolute", bottom: 0, left: 0, right: 0, height: "40px",
                                    background: "rgba(0,0,0,0.7)", color: "white", 
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px"
                                }}>
                                    📷 Изменить
                                </div>
                            )}
                        </div>
                    </label>
                </div>

                {/* --- ИНФОРМАЦИЯ --- */}
                <div style={{ flexGrow: 1 }}>
                    {error && <div style={{ backgroundColor: "#e91e63", padding: "10px", borderRadius: "4px", marginBottom: "20px", fontSize: "14px" }}>{error}</div>}

                    {isEditing ? (
                        // РЕЖИМ РЕДАКТИРОВАНИЯ
                        <div>
                            <label style={{ color: "#b3b3b3", fontSize: "12px", fontWeight: "bold" }}>ИМЯ ПОЛЬЗОВАТЕЛЯ</label>
                            <input 
                                type="text" 
                                value={formData.username}
                                onChange={(e) => setFormData({...formData, username: e.target.value})}
                                style={inputStyle}
                            />
                            
                            <label style={{ color: "#b3b3b3", fontSize: "12px", fontWeight: "bold" }}>О СЕБЕ</label>
                            <textarea 
                                value={formData.bio}
                                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                                style={{ ...inputStyle, minHeight: "120px", resize: "vertical" }}
                            />

                            <div style={{ marginTop: "10px" }}>
                                <button onClick={handleSave} style={buttonStyle("#1db954")}>Сохранить</button>
                                <button onClick={() => {
                                    setIsEditing(false);
                                    setFormData({ ...formData, avatar_url: user.avatar_url || "" }); // Сброс превью
                                }} style={buttonStyle("#535353")}>Отмена</button>
                            </div>
                        </div>
                    ) : (
                        // РЕЖИМ ПРОСМОТРА
                        <div>
                            <h2 style={{ fontSize: "3rem", margin: "0 0 10px 0", fontWeight: "800" }}>{user.username}</h2>
                            <p style={{ color: "#b3b3b3", margin: "0 0 20px 0" }}>{user.email}</p>
                            
                            <div style={{ borderTop: "1px solid #333", paddingTop: "20px", marginTop: "20px" }}>
                                <h3 style={{ fontSize: "1rem", color: "#b3b3b3", textTransform: "uppercase", marginBottom: "10px" }}>О себе</h3>
                                <p style={{ lineHeight: "1.6", color: "#e0e0e0", fontSize: "1.1rem" }}>
                                    {user.bio || <span style={{ color: "#555", fontStyle: "italic" }}>Нет описания.</span>}
                                </p>
                            </div>

                            <button 
                                onClick={() => setIsEditing(true)}
                                style={{ ...buttonStyle("#1db954"), marginTop: "30px" }}
                            >
                                Редактировать
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;