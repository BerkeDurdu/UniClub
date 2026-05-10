# UniClub Bonus Setup — Sen Ne Yapacaksın?

Backend ve frontend tarafında tüm bonus özellikler kodlandı, testler geçiyor, migrationlar gerçek PostgreSQL'inde başarılı çalıştı. Aşağıdaki adımları sırayla yap; her madde tek başına bağımsız.

---

## 0. Hızlı sağlık özeti (zaten doğrulandı)

| Kontrol | Sonuç |
|---|---|
| Backend smoke (Postgres'inde) | ✅ `health 200`, `admin login 200`, 24 permission, 4 rol |
| `pytest` | ✅ 76 test, %95.69 coverage (eşik %90) |
| `vitest run` | ✅ 50 test, %98.49 coverage |
| `tsc -b --noEmit` | ✅ temiz |
| `npm run build` | ✅ üretim build'i başarılı |

---

## 1. `.env` dosyalarını doldur (5 dk) — **ŞART**

### `uniclub-api/.env` (mevcut dosyana ekle)

Şu satırları **ekle** (mevcut DATABASE_URL ve SECRET_KEY'e dokunma):

```env
SEED_ADMIN_EMAIL=admin@uniclub.com
SEED_ADMIN_PASSWORD=Admin#12345
SEED_MEMBER_PASSWORD=Member#12345
SEED_ADVISOR_PASSWORD=Advisor#12345
SEED_BOARD_PASSWORD=Board#12345

# OAuth (şimdilik boş bırak, butonlar gizli kalır - dolduracağın anda görünür)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_TENANT=common
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=
OAUTH_REDIRECT_BASE=http://localhost:8000
OAUTH_FRONTEND_REDIRECT=http://localhost:5173/oauth/callback

# Email OTP — bu satırları boş bırakırsan, OTP kodları sunucu logunda görünür (demoya uygun)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=no-reply@uniclub.local
SMTP_USE_TLS=true

# WebAuthn
WEBAUTHN_RP_ID=localhost
WEBAUTHN_RP_NAME=UniClub
WEBAUTHN_ORIGIN=http://localhost:5173
```

### `uniclub-web/.env`

Sadece şu satır olsun (zaten varsa atlama):
```env
VITE_API_BASE_URL=http://localhost:8000
```

---

## 2. Bağımlılıkları kur (3 dk)

```powershell
cd C:\Users\Berke\Desktop\UniClub\uniclub-api
pip install -r requirements.txt

cd C:\Users\Berke\Desktop\UniClub\uniclub-web
npm install
```

---

## 3. Backend'i başlat ve doğrula (2 dk)

```powershell
cd C:\Users\Berke\Desktop\UniClub\uniclub-api
python -m uvicorn main:app --reload
```

Kontrol et:
- `http://127.0.0.1:8000/docs` → `Admin`, `2FA`, `OAuth` tag'lerini gör
- Aynı sayfadan `POST /auth/login` → `{"email":"admin@uniclub.com","password":"Admin#12345"}` → 200 dön

---

## 4. Frontend'i başlat (1 dk)

```powershell
cd C:\Users\Berke\Desktop\UniClub\uniclub-web
npm run dev
```

→ `http://localhost:5173`

---

## 5. Demo akışını birebir dene (10 dk) — sunum prova

### A) Dinamik authorization + admin dashboard demo
1. `admin@uniclub.com` / `Admin#12345` ile login → sidebar'da **"Admin"** grubu (Users, Permissions) görünmeli
2. **Permissions** sayfası → matrix'i aç, `member` satırında `events.create` checkbox'ını **işaretle** → **Save changes**
3. Logout, `member@uniclub.com` / `Member#12345` ile login
4. `/auth/me` veya event create butonu → artık permission'a sahip olduğunu göster
5. Tekrar admin'e dön, checkbox'ı kapat → değişikliğin canlı uygulandığını anlat

### B) 2FA — TOTP demo
1. Member ile giriş → sidebar **Account → Security**
2. **"Set up TOTP"** → QR kod çıkar
3. Telefonuna **Google Authenticator / Authy** indir, QR'ı taratla
4. App'in verdiği 6 haneli kodu gir → **Confirm**
5. Logout → tekrar login → bu sefer 2FA challenge ekranı çıkar → kod gir → giriş başarılı

### C) 2FA — Email OTP demo (SMTP yoksa terminal'den oku)
1. Security sayfası → Email OTP **Enable**
2. Logout → login → 2FA ekranında **Email** sekmesi
3. **"Send code"** → SMTP boşsa kod **uvicorn terminalinde** `[EMAIL OTP]` satırı olarak görünür
4. Kodu gir → giriş

### D) 2FA — WebAuthn demo (Windows Hello / Touch ID / fiziksel key)
1. Security sayfası → "Add device" (label gir, opsiyonel)
2. Browser sorar → Windows Hello PIN / parmak izi / harici USB key
3. Logout → login → Security key sekmesi → cihazı dokun

### E) 4 social login butonu (opsiyonel, aşağı bak)
- `.env`'e bir provider client_id eklersen Login ekranında butonu görürsün
- Hocaya **boş haldeyken hiç görünmemesi** + **doldurulunca görünmesi** = "configure-aware" demosu olur

---

## 6. OAuth provider'ları (opsiyonel, ekstra puan için)

**4 provider'ı en azından "configure-able" hale getirdim → tek bir tane bile aktif edersen butonu görüyorsun.** Sunum sırasında **en az 1 tanesi gerçekten çalışırsa** social login bonusu garanti.

Her provider için: console'a gir → OAuth app oluştur → `redirect_uri = http://localhost:8000/auth/oauth/{provider}/callback` → client_id+secret al → `.env`'e yaz → backend restart.

| Provider | Console | Redirect URI |
|---|---|---|
| **Google** | https://console.cloud.google.com/apis/credentials → "OAuth 2.0 Client ID" → Web application | `http://localhost:8000/auth/oauth/google/callback` |
| **GitHub** | https://github.com/settings/developers → "New OAuth App" | `http://localhost:8000/auth/oauth/github/callback` |
| **Microsoft** | https://portal.azure.com → Azure AD → App registrations → New registration | `http://localhost:8000/auth/oauth/microsoft/callback` |
| **Facebook** | https://developers.facebook.com/apps/ → Create app → Facebook Login | `http://localhost:8000/auth/oauth/facebook/callback` |

> **Tavsiyem:** Sadece **GitHub**'ı yap — 5 dakikalık iş, kart bilgisi istemez. 1 social login = full puan, 4'ü = +15. İstersen sadece 1'le kal.

---

## 7. Sunum konuşma noktaları (kısa kılavuz)

**Bonus 1 — Authorization + Admin dashboard:**
> "Daha önce 3 sabit rol vardı, hardcoded `require_roles`. Şimdi `admin` rolü ekledim, 24 permission code'u DB'de tutuyorum, `RolePermission` matrix'i admin paneliden canlı değiştiriliyor. Demo: matrix'te `events.create` toggle → restart yok, hemen etki ediyor."

**Bonus 2 — Social login:**
> "Authlib ile 4 provider hazır: Google, GitHub, Microsoft, Facebook. `/auth/oauth/providers` sadece env'de configure edilmiş olanları döner, frontend ona göre buton gösterir. Demo'da `<şu an aktif olan provider>` ile login."

**Bonus 3 — 4 auth metodu:**
> "Password (mevcut) + TOTP (RFC 6238, pyotp) + Email OTP (SMTP veya console fallback) + WebAuthn (passkey/Windows Hello). Login flow değişti: 2FA varsa 5dk'lık `challenge_token` döner, sonra ayrı endpoint'te verify. Kullanıcı istediği kombinasyonu açabiliyor."

**Bonus 4 — Test + CI:**
> "Backend'de pytest, %95.69 coverage. Frontend'de vitest, %98.49. Playwright e2e. `.github/workflows/ci.yml` her push'ta backend → frontend → e2e job'larını sırayla koşturuyor (Postgres servisli)."

---

## 8. Test komutları (sunumda canlı çalıştırabilirsin)

```powershell
# Backend
cd C:\Users\Berke\Desktop\UniClub\uniclub-api
pytest --cov --cov-report=term

# Frontend unit
cd C:\Users\Berke\Desktop\UniClub\uniclub-web
npm run test

# Frontend e2e (backend ayakta olmalı + dev server)
npm run e2e:install   # ilk seferde browser indirir
npm run e2e
```

---

## 9. Kontrol checklisti — sunum öncesi

- [ ] `.env` doldurulmuş, `SEED_ADMIN_PASSWORD` set
- [ ] Backend ayakta, `/docs`'ta `Admin`, `2FA`, `OAuth` tag'leri var
- [ ] Frontend dev server çalışıyor
- [ ] admin@uniclub.com ile login + permission matrix değişikliği çalışıyor
- [ ] member@uniclub.com ile TOTP setup → telefondan QR oku → confirm → re-login challenge çalışıyor
- [ ] Email OTP enable → login challenge → kod terminalden okunup verify çalışıyor
- [ ] (opsiyonel) En az 1 OAuth provider config edilip butonun gerçekten çalıştığı doğrulandı
- [ ] (opsiyonel) `pytest` ve `npm run test` canlı koşmaya hazır

---

## 10. Bilinen / kabul edilmiş kısıtlar

- **VPS/alternatif deploy bonusu (+10):** atlandı — Vercel/Railway dışı host edilmedi.
- **"Yeni proje" bonusu (+10):** alınamaz — mevcut proje devam ediyor.
- **Server güvenlik screenshotları:** sen sunucuda göstermek zorundasın; deploy etmeyince geçerli değil.

**Toplam beklenen bonus puan: +55** (Playwright/test +15, social login +15, 2FA +15, admin/authz +10).

---

## 11. Yardımcı dosyalar (referans için)

- Yeni endpointler: `uniclub-api/routers/admin.py`, `routers/twofa.py`, `routers/oauth.py`
- Yeni modeller: `Permission`, `RolePermission`, `OAuthAccount`, `UserTOTP`, `UserEmailOTP`, `EmailOTPChallenge`, `WebAuthnCredential`, `WebAuthnChallenge`
- Default permission matrix: `uniclub-api/permissions_catalog.py`
- Frontend admin sayfaları: `src/pages/AdminUsersPage.tsx`, `AdminPermissionsPage.tsx`, `SecurityPage.tsx`, `OAuthCallbackPage.tsx`
- CI: `.github/workflows/ci.yml`
- Bonus prompt dosyaları: 4 prompt klasöründe `bonus-*.md`

İşin bittiğinde ya da takıldığın yer olursa söyle, hemen bakarım.
