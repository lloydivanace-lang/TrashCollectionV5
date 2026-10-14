# DRAW (Disaster & Resource Allocation for Waste) - Barangay 41, Cavite City
## Opisyal na Gabay sa Pag-deploy ng Sariling Website (May Kagawad Proof Photo & Raspberry Pi 4 Cloud Storage)

Ang proyektong ito ay buong-buo at nakadisenyo para sa **Barangay 41, Cavite City**. Mayroon itong:
1. **Kagawad Requirement ng Proeba:** Bago ma-resolve ang ticket, kailangan mag-attach ng litrato ng nilinis na lugar na babalik sa residente bilang katibayan.
2. **Raspberry Pi 4 Cloud Storage Transit:** Lahat ng litrato (ulat at proeba) ay dumadaan at kumakain ng espasyo sa Pi 4 disk bago i-auto purge pagkatapos ng 3 araw.
3. **Residente Phone Storage:** Ang bawat residente ay may sariling imbakan sa kanilang cellphone kung saan pwede nilang idelete o panatilihin ang kanilang tala.

---

### OPSYON 1: Libreng Cloud Hosting via Render.com (Inirerekomenda)
Ang Render.com ay nagbibigay ng libreng web service na laging bukas 24/7 sa internet nang walang bayad at walang Google login pop-up.

#### Hakbang 1: I-upload sa GitHub
1. I-extract ang downloaded `draw-barangay41-website-source.zip`.
2. Gumawa ng repository sa [GitHub](https://github.com) (halimbawa: `draw-barangay41`).
3. I-push o i-upload ang lahat ng files mula sa na-extract na folder sa GitHub repository.

#### Hakbang 2: Ikonekta sa Render.com
1. Mag-sign up o mag-log in sa [Render.com](https://render.com).
2. Pindutin ang **"New +"** button sa dashboard at piliin ang **"Web Service"**.
3. Ikonekta ang iyong GitHub account at piliin ang repository ng DRAW.

#### Hakbang 3: Ilagay ang Settings
- **Name:** `draw-barangay41`
- **Region:** `Singapore` (pinakamalapit sa Pilipinas para mabilis)
- **Branch:** `main`
- **Runtime:** `Node`
- **Build Command:**
  ```bash
  npm install && npm run build
  ```
- **Start Command:**
  ```bash
  npm start
  ```
- **Instance Type:** `Free`

#### Hakbang 4: Pindutin ang "Deploy Web Service"
- Maghihintay lamang ng 1 hanggang 2 minuto.
- Kapag tapos na, bibigyan ka ng Render ng sarili mong opisyal na website URL (halimbawa: `https://draw-barangay41.onrender.com`).

---

### OPSYON 2: Lokal na Server sa Barangay Hall Gamit ang Raspberry Pi 4
Kung nais ng barangay na 100% lokal at nasa loob ng Barangay Hall ang data:

1. I-kopya ang laman ng project sa Raspberry Pi 4 (gamit ang USB flash drive o SFTP).
2. Buksan ang Terminal sa Raspberry Pi at mag-navigate sa folder:
   ```bash
   cd ~/draw-barangay41
   ```
3. I-install ang dependencies at i-build:
   ```bash
   npm install
   npm run build
   ```
4. Patakbuhin gamit ang PM2 para awtomatikong mag-restart kahit mag-brownout:
   ```bash
   sudo npm install -g pm2
   pm2 start "npm start" --name "draw-brgy41"
   pm2 startup
   pm2 save
   ```
5. Para mabuksan ng mga residente kahit nasa labas ng barangay hall nang libre:
   - Mag-install ng Cloudflare Tunnel (`cloudflared`):
     ```bash
     cloudflared tunnel --url http://localhost:3000
     ```
   - Bibigyan ka ng Cloudflare ng libre at secure na HTTPS URL nang hindi kailangang mag-bukas ng router ports.

---

### Mga Account Credential para sa Kagawad Portal:
- **Username:** `kagawad41` o `admin_draw`
- **Password:** `Kagawad@Cavite2026#Brgy41!` (o palitan sa Kagawad Portal gamit ang "Palitan Password")
