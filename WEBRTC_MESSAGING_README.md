# WebRTC Messaging System

Bu proje, Algorand blockchain tabanlı cross-border microlending platformuna WebRTC mesajlaşma özelliği ekler.

## 🚀 Özellikler

### ✅ **WebRTC Data Channel Messaging**

- Peer-to-peer bağlantı (merkezi sunucu olmadan)
- Gerçek zamanlı mesajlaşma
- Düşük gecikme süresi
- NAT traversal desteği

### ✅ **End-to-End Encryption**

- AES-256-GCM şifreleme
- Otomatik anahtar yönetimi
- Güvenli mesaj iletimi
- Şifreleme doğrulama

### ✅ **Blockchain Hash Verification**

- Mesaj hash'leri Algorand blockchain'de saklanır
- Smart contract ile doğrulama
- Değiştirilemez mesaj kayıtları
- Audit trail desteği

### ✅ **Wallet Integration**

- Algorand wallet adresleri ile kimlik doğrulama
- Wallet tabanlı contact yönetimi
- Otomatik kullanıcı kaydı
- Güvenli bağlantı kurma

## 🏗️ Sistem Mimarisi

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Blockchain    │
│   (React)       │    │   (Node.js)     │    │   (Algorand)    │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • WebRTC Client │◄──►│ • Signaling     │    │ • Smart Contract│
│ • AES Encryption│    │ • Message API    │◄──►│ • Hash Storage   │
│ • Wallet Conn.  │    │ • WebSocket     │    │ • Verification  │
│ • UI Components │    │ • REST API      │    │ • User Registry │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📁 Dosya Yapısı

```
├── projects/algorand-frontend/src/
│   ├── components/WebRTCMessaging.tsx    # Ana mesajlaşma komponenti
│   ├── pages/MessagingPage.tsx          # Mesajlaşma sayfası
│   └── contracts/MessagingApp.ts       # Smart contract interface
├── backend/
│   ├── messaging.js                     # Mesajlaşma servisi
│   └── server.js                        # Backend entegrasyonu
├── projects/algorand-contracts/smart_contracts/messaging_app/
│   └── contract.algo.ts                 # Smart contract kodu
└── signaling-server.js                  # WebRTC signaling sunucusu
```

## 🚀 Kurulum ve Çalıştırma

### 1. **Signaling Server Başlatma**

```bash
# Ana dizinde
npm install
npm start

# Veya development modunda
npm run dev
```

### 2. **Backend Başlatma**

```bash
cd backend
npm install
npm start
```

### 3. **Frontend Başlatma**

```bash
cd projects/algorand-frontend
npm install
npm run dev
```

### 4. **Docker ile Tüm Sistem**

```bash
# Ana sistem
docker-compose up -d

# MCP testnet sistemi
docker-compose -f docker-compose.mcp-testnet.yml up -d
```

## 🔧 Konfigürasyon

### Environment Variables

**Frontend (.env):**

```env
VITE_SIGNALING_SERVER_URL=ws://localhost:8080
VITE_BACKEND_URL=http://localhost:3001
VITE_ALGOD_NETWORK=testnet
VITE_ALGOD_SERVER=https://testnet-api.algonode.cloud
```

**Backend (.env):**

```env
PORT=3001
ALGOD_SERVER=https://testnet-api.algonode.cloud
ALGOD_NETWORK=testnet
CONTRACT_APP_ID=your_messaging_app_id
```

## 💬 Kullanım

### 1. **Contact Ekleme**

- Wallet adresini girin
- Contact adını belirleyin
- "Add Contact" butonuna tıklayın

### 2. **Bağlantı Kurma**

- Contact listesinden bir kişi seçin
- "Connect" butonuna tıklayın
- WebRTC bağlantısı otomatik kurulur

### 3. **Mesaj Gönderme**

- Mesaj yazın
- "Send" butonuna tıklayın
- Mesaj şifrelenir ve gönderilir

### 4. **Hash Doğrulama**

- Mesajlar otomatik olarak blockchain'de hash'lenir
- Smart contract ile doğrulama yapılır
- Değiştirilemez kayıt oluşturulur

## 🔐 Güvenlik Özellikleri

### **End-to-End Encryption**

- AES-256-GCM şifreleme algoritması
- Her mesaj için benzersiz IV
- Otomatik anahtar yönetimi
- Şifreleme bütünlük kontrolü

### **WebRTC Güvenliği**

- DTLS şifreleme
- SRTP medya şifreleme
- ICE candidate doğrulama
- NAT traversal güvenliği

### **Blockchain Doğrulama**

- SHA-256 hash hesaplama
- Smart contract hash saklama
- Değiştirilemez mesaj kayıtları
- Audit trail desteği

## 📊 API Endpoints

### **Messaging API**

```javascript
// Mesaj geçmişi
GET /api/messaging/history/:address

// Mesaj kaydetme
POST /api/messaging/history

// Online kullanıcılar
GET /api/messaging/online

// Hash doğrulama
POST /api/messaging/verify

// Mesaj istatistikleri
GET /api/messaging/stats/:address
```

### **WebSocket Events**

```javascript
// Kayıt
{ type: 'register', address: 'wallet_address' }

// WebRTC Offer
{ type: 'offer', to: 'recipient', offer: rtc_offer }

// WebRTC Answer
{ type: 'answer', to: 'sender', answer: rtc_answer }

// ICE Candidate
{ type: 'ice-candidate', to: 'peer', candidate: ice_candidate }

// Mesaj
{ type: 'message', to: 'recipient', encrypted: 'data', iv: 'iv', hash: 'hash' }
```

## 🧪 Test Etme

### **Manuel Test**

1. İki farklı tarayıcıda uygulamayı açın
2. Farklı wallet adresleri ile giriş yapın
3. Birbirlerini contact olarak ekleyin
4. Bağlantı kurun ve mesaj gönderin

### **Otomatik Test**

```bash
# Backend testleri
cd backend
npm test

# Frontend testleri
cd projects/algorand-frontend
npm test

# Contract testleri
cd projects/algorand-contracts
npm test
```

## 🐛 Sorun Giderme

### **WebRTC Bağlantı Sorunları**

- STUN/TURN sunucu konfigürasyonu kontrol edin
- Firewall ayarlarını kontrol edin
- NAT traversal desteğini kontrol edin

### **Şifreleme Sorunları**

- Browser crypto API desteğini kontrol edin
- HTTPS bağlantısı gereklidir
- Anahtar yönetimi loglarını kontrol edin

### **Blockchain Sorunları**

- Smart contract deployment'ını kontrol edin
- App ID konfigürasyonunu kontrol edin
- Network bağlantısını kontrol edin

## 📈 Performans

### **Optimizasyonlar**

- WebRTC connection pooling
- Message batching
- Efficient hash storage
- Memory management

### **Monitoring**

- Connection status tracking
- Message delivery rates
- Encryption performance
- Blockchain transaction costs

## 🔮 Gelecek Özellikler

- [ ] File sharing over WebRTC
- [ ] Voice/video calling
- [ ] Group messaging
- [ ] Message search
- [ ] Offline message sync
- [ ] Mobile app support

## 📝 Lisans

MIT License - Detaylar için LICENSE dosyasına bakın.

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun
3. Değişikliklerinizi commit edin
4. Pull request gönderin

## 📞 Destek

Sorularınız için:

- GitHub Issues
- Discord: #messaging
- Email: support@microlending.com
