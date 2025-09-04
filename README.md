# 🖥️ Deepbot Frontend

**React | Vite | Ant Design | Google OAuth2 | Zustand | Docker**

---

## 💬 About Project

- 🧩 **Frontend** для платформы чат-бота (Deepbot)  
- ⚛️ Написан на **React (Vite)**  
- 🎨 Интерфейс на **Ant Design** + кастомный CSS  
- 🔐 Авторизация через **Google OAuth2 + JWT (cookies)**  
- 💬 Диалоги и чат с AI (псевдо-стриминг ответа, индикатор печати)  
- 🪵 Глобальное хранилище ошибок (**Zustand**)  
- 🛠️ Контейнеризация через **Docker / Docker Compose**  
- ☁️ Работает в связке с **Backend** и **Nginx**  
  - **Backend**: https://github.com/mangyst/chatbot-backend  
  - **Nginx**: https://github.com/mangyst  

---

<h1> Tech Stack <a href="#-tech-stack--"><img src="https://raw.githubusercontent.com/HighAmbition211/HighAmbition211/auxiliary/others/skill.gif" width="32"></a> </h1>

### Languages
<table>
  <tr>
    <td align="center" width="90">
      <a href="https://developer.mozilla.org/docs/Web/JavaScript" target="_blank">
        <img alt="JavaScript" width="45" height="45" src="https://raw.githubusercontent.com/HighAmbition211/HighAmbition211/auxiliary/languages/javascript.svg" />
      </a>
      <br><h4>JavaScript</h4>
    </td>
  </tr>
</table>

### Frameworks & Libraries
<table>
  <tr>
    <td align="center" width="90">
      <a href="https://react.dev/" target="_blank">
        <img alt="React" width="45" height="45" src="https://raw.githubusercontent.com/devicons/devicon/master/icons/react/react-original.svg" />
      </a>
      <br><h4>React</h4>
    </td>
    <td align="center" width="90">
      <a href="https://vitejs.dev/" target="_blank">
        <img alt="Vite" width="45" height="45" src="https://vitejs.dev/logo.svg" />
      </a>
      <br><h4>Vite</h4>
    </td>
    <td align="center" width="90">
      <a href="https://ant.design/" target="_blank">
        <img alt="Ant Design" width="45" height="45" src="https://avatars.githubusercontent.com/u/12101536?s=200&v=4" />
      </a>
      <br><h4>Ant Design</h4>
    </td>
    <td align="center" width="90">
      <a href="https://github.com/MomenSherif/react-oauth" target="_blank">
        <img alt="Google OAuth" width="45" height="45" src="https://www.vectorlogo.zone/logos/google/google-icon.svg" />
      </a>
      <br><h4>Google OAuth</h4>
    </td>
    <td align="center" width="90">
      <a href="https://zustand-demo.pmnd.rs/" target="_blank">
        <img alt="Zustand" width="45" height="45" src="https://raw.githubusercontent.com/pmndrs/zustand/main/bear.png" />
      </a>
      <br><h4>Zustand</h4>
    </td>
  </tr>
</table>

---

## 📂 Структура проекта

```bash
├─ public/
│ └─ avatar.png # favicon / логотип
├─ src/
│ ├─ components/
│ │ ├─ ChatWindow.jsx # окно чата: история, ввод, печать, scroll-to-bottom
│ │ └─ SidebarMenu.jsx # меню диалогов: create/rename/delete, overlay confirm
│ ├─ api.js # fetch wrapper (credentials + обработка ошибок)
│ ├─ errorStore.js # Zustand-стор ошибок
│ ├─ App.jsx # корневой компонент, OAuth, профиль, тема AntD
│ ├─ main.jsx # точка входа, reset.css, favicon, index.css
│ └─ index.css # кастомные стили: меню, чат, оверлеи, спиннер
├─ .env.example # переменные окружения
├─ Dockerfile # билд и запуск фронта через serve (порт 3000)
├─ index.html
├─ package.json
└─ vite.config.js
```

---

## 📦 Installation & Run

```bash
git clone https://github.com/mangyst/chatbot-front.git
cd chatbot-front

# локально
npm install
npm run dev
# по умолчанию: http://localhost:5173

# сборка
npm run build
npm run preview

# через Docker
docker build -t chatbot-frontend .
docker run -d -p 3000:3000 --env-file .env chatbot-frontend

# через Docker Compose (с бэком и nginx)
docker compose up -d
```

---

## 📑 Env Examples

### `.env.example`
```env
# === Google OAuth ===
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# === Backend API ===
VITE_API_BASE_URL=http://localhost:8000
```

---

## 📑 Env Examples Production

### `.env.production.example`
```env
# === Google OAuth (prod) ===
VITE_GOOGLE_CLIENT_ID=your-prod-google-client-id.apps.googleusercontent.com

# === Backend API (prod) ===
VITE_API_BASE_URL=https://your-backend.example.com
```

---

## 📡 Основные фичи

- Google Login (через @react-oauth/google)
- JWT в HttpOnly cookie (CORS с ADDRESS_FRONT)
- Сайдбар (создание, переименование, удаление до 5 диалогов)
- Чат с AI: история, ввод, счётчик, «AI is thinking…», псевдо-стриминг
- Scroll-to-bottom кнопка, авто-фокус и управление клавишами
- Глобальный спиннер загрузки
- Глобальный алерт ошибок (auto-hide, Zustand)

---

## 🌐 CORS

Фронт шлёт запросы с credentials: 'include'.
Бэк разрешает только домен из .env → ADDRESS_FRONT.

---

## 🐳 Docker Compose (общая система)

Файл docker-compose.yml поднимает три сервиса:
- backend — FastAPI API
- frontend — клиентское SPA
- nginx — реверс-прокси с SSL

После старта:
- API: http://localhost:8000
- Swagger: http://localhost:8000/docs
- Frontend: http://localhost:3000
- Через nginx (SSL): https://your-domain/
  
---

## 🛡️ Безопасность

- Авторизация: JWT в HttpOnly cookie
- SECURE_HTTP_HTTPS=true → cookie с флагом Secure (только HTTPS)
- Google OAuth: авторизованные origins → фронт-домен
- Лимит диалогов: 5 на пользователя

---
