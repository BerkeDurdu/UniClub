# UniClub Web

UniClub Web, UniClub FastAPI backend'i icin gelistirilmis React tabanli bir yonetim arayuzudur. Uygulama; kulup, etkinlik, uye, kayit ve sponsorluk akislarini tek bir panelde toplar.

## Tech Stack

- React 19 + Vite + TypeScript
- Tailwind CSS
- React Router DOM
- Axios
- React Hook Form + Zod
- TanStack React Query
- React Hot Toast

## Features

- Client-side routing (Dashboard, Clubs, Events, Members, detail sayfalari)
- Caching ve veri senkronizasyonu (React Query)
- Form validation (React Hook Form + Zod)
- Global error handling (Axios interceptor + ErrorBoundary)
- Optimistic UI updates mantigina hazir mutation akisi (invalidate + anlik liste guncelleme stratejisi)
- Health indicator (footer'da 30 saniyede bir backend ping)
- Skeleton loading ve empty state ekranlari

## Project Structure

```text
uniclub-web/
  src/
    api/
      client.ts
      services/
    components/
      common/
      feedback/
      forms/
      layout/
    hooks/
    pages/
    types/
```

## Environment Variables

1. `.env.example` dosyasini `.env` olarak kopyalayin.
2. Backend URL degerini kontrol edin.

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## Run Frontend

```bash
npm install
npm run dev
```

Frontend varsayilan olarak `http://localhost:5173` adresinde acilir.

## Run Backend Together

Ayrica backend'i de calistirin:

```powershell
cd C:\Users\Berke\Desktop\UniClub
.\.venv\Scripts\Activate.ps1
python -m uvicorn main:app --app-dir C:\Users\Berke\Desktop\UniClub\uniclub-api --reload
```

Backend endpointleri:

- `http://127.0.0.1:8000/health`
- `http://127.0.0.1:8000/docs`

## Screenshots

Asagidaki placeholder gorselleri calisan uygulamadan alinmis ekran goruntuleri ile degistirin.

![Dashboard](./screenshots/screenshot-1.png)
![Clubs](./screenshots/screenshot-2.png)
![Events](./screenshots/screenshot-3.png)
![Event Detail](./screenshots/screenshot-4.png)

Guncelleme adimi:

1. Uygulamayi calistirin.
2. Dashboard/Clubs/Events/Detail ekranlarini alin.
3. Dosyalari `screenshots/` altinda ayni isimlerle degistirin.

## Build

```bash
npm run build
```

Bu komut TypeScript kontrolu + production bundle olusturur.
