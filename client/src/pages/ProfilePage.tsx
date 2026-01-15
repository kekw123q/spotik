import React, { useEffect, useState } from "react";
import { User } from "../domain/entities/user";
import { RepositoryFactory } from "../data/factory/RepositoryFactory";

const ProfilePage: React.FC = () => {
    // 1. Инициализируем репозиторий через фабрику
    const [userRepo] = useState(() => RepositoryFactory.createUserRepository());

    // 2. Состояния (State)
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    // Данные формы
    const [formData, setFormData] = useState({
        username: "",
        bio: "",
    });

    // 3. Загрузка данных при открытии страницы
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await userRepo.getUser();
            setUser(data);
            setFormData({ username: data.username, bio: data.bio });
        } catch (err) {
            console.error(err);
            setError("Не удалось загрузить профиль. Проверьте, запущен ли Go-сервер на порту 8085.");
        } finally {
            setLoading(false);
        }
    };

    // 4. Обработчик сохранения
    const handleSave = async () => {
        setError(null);
        
        // Валидация на клиенте (бан-слова)
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
            // Отправляем данные через репозиторий
            const updatedUser = await userRepo.updateProfile({
                username: formData.username,
                bio: formData.bio
            });
            setUser(updatedUser);
            setIsEditing(false); // Выходим из режима редактирования
        } catch (err: any) {
            setError("Ошибка сервера: " + err.message);
        }
    };

    if (loading) return <div style={{ color: "white", textAlign: "center", marginTop: "20px" }}>Загрузка...</div>;
    if (!user) return <div style={{ color: "red", textAlign: "center", marginTop: "20px" }}>{error}</div>;

    // Стили (простые, в стиле Spotify)
    const containerStyle: React.CSSProperties = {
        padding: "30px",
        maxWidth: "600px",
        margin: "40px auto",
        backgroundColor: "#181818",
        color: "white",
        borderRadius: "8px",
        boxShadow: "0 4px 60px rgba(0,0,0,0.5)",
        fontFamily: "sans-serif"
    };

    const inputStyle: React.CSSProperties = {
        width: "100%",
        padding: "10px",
        marginTop: "5px",
        marginBottom: "15px",
        backgroundColor: "#333",
        border: "1px solid #555",
        color: "white",
        borderRadius: "4px"
    };

    const buttonStyle = (color: string): React.CSSProperties => ({
        backgroundColor: color,
        color: "white",
        padding: "12px 24px",
        border: "none",
        borderRadius: "20px",
        cursor: "pointer",
        fontWeight: "bold",
        marginRight: "10px",
        fontSize: "14px"
    });

    return (
        <div style={containerStyle}>
            <h1 style={{ borderBottom: "1px solid #333", paddingBottom: "10px" }}>Профиль</h1>
            
            <div style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
                <div style={{ 
                    width: "100px", height: "100px", borderRadius: "50%", 
                    backgroundColor: "#555", marginRight: "20px", overflow: "hidden" 
                }}>
                     {/* Если есть аватарка — показываем, если нет — заглушка */}
                    {user.avatar_url ? (
                        <img src={user.avatar_url} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: "40px" }}>👤</div>
                    )}
                </div>
                <div>
                    {!isEditing && <h2 style={{ margin: 0, fontSize: "2rem" }}>{user.username}</h2>}
                    <p style={{ color: "#b3b3b3", margin: "5px 0" }}>{user.email}</p>
                </div>
            </div>

            {error && <div style={{ backgroundColor: "#e22134", padding: "10px", borderRadius: "4px", marginBottom: "15px" }}>{error}</div>}

            {isEditing ? (
                // --- РЕЖИМ РЕДАКТИРОВАНИЯ ---
                <div>
                    <label style={{ display: "block", color: "#b3b3b3", marginBottom: "5px" }}>Имя пользователя</label>
                    <input 
                        type="text" 
                        value={formData.username}
                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                        style={inputStyle}
                    />
                    
                    <label style={{ display: "block", color: "#b3b3b3", marginBottom: "5px" }}>О себе</label>
                    <textarea 
                        value={formData.bio}
                        onChange={(e) => setFormData({...formData, bio: e.target.value})}
                        style={{ ...inputStyle, minHeight: "100px", resize: "vertical" }}
                    />

                    <div style={{ marginTop: "20px" }}>
                        <button onClick={handleSave} style={buttonStyle("#1db954")}>Сохранить</button>
                        <button onClick={() => setIsEditing(false)} style={buttonStyle("#535353")}>Отмена</button>
                    </div>
                </div>
            ) : (
                // --- РЕЖИМ ПРОСМОТРА ---
                <div>
                    <h3 style={{ color: "#b3b3b3" }}>О себе</h3>
                    <p style={{ lineHeight: "1.5" }}>{user.bio || "Пользователь пока ничего не рассказал о себе."}</p>

                    <div style={{ marginTop: "30px" }}>
                        <button 
                            onClick={() => setIsEditing(true)}
                            style={buttonStyle("#1db954")}
                        >
                            Редактировать профиль
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;