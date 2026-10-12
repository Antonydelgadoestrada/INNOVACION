# VeriChain: Plataforma de Emisión y Verificación de Credenciales Digitales

> **Curso:** Innovación y Transformación Digital  
> **Carrera:** Ingeniería de Sistemas e Informática, Perú  
> **Prototipo Funcional:** Next.js 14, TypeScript, Tailwind CSS, Prisma, Solidity 0.8.20, Hardhat, Ethers.js v6, Ed25519 & SHA-256

VeriChain es una plataforma integral para la emisión y verificación instantánea de credenciales y certificados académicos digitales que combate el fraude documental mediante la combinación de **Hash Criptográfico SHA-256**, **Firma Digital Asimétrica Ed25519** y registro inmutable en **Blockchain (Ethereum Sepolia / Hardhat local)**.

---

## 🚀 Puesta en Marcha Rápida (Guía Paso a Paso)

### 1. Clonar e Instalar Dependencias
Asegúrate de contar con Node.js v20 o superior:
```bash
# Instalar todas las dependencias del proyecto
npm install
```

### 2. Configurar Variables de Entorno
Copia la plantilla de variables de entorno a `.env`:
```bash
cp .env.example .env
```
Por defecto, `.env` viene preconfigurado con SQLite (`file:./dev.db`) para desarrollo y demostración instantánea sin requerir bases de datos externas. Para conectar con PostgreSQL en Supabase, simplemente actualiza `DATABASE_URL` con tu cadena de conexión.

### 3. Sincronizar Base de Datos y Sembrar Datos Iniciales
```bash
# Generar cliente de Prisma
npm run prisma:generate

# Sincronizar esquema con la base de datos
npm run prisma:push

# Sembrar datos de prueba (instituciones, credenciales y auditoría)
npm run seed
```

### 4. Compilar y Ejecutar Pruebas Automatizadas
```bash
# 1. Pruebas unitarias de criptografía (SHA-256, Ed25519, JSON Canónico, AES-256-GCM)
npm run test:crypto

# 2. Compilar contrato inteligente y ejecutar pruebas en Hardhat
npm run test:contracts

# 3. Sembrar y validar los 4 estados exactos requeridos (RF-16)
npm run seed:scenarios
```

### 5. Iniciar la Aplicación Web
```bash
npm run dev
```
Abre tu navegador en: [http://localhost:3000](http://localhost:3000)

---

## 🏛️ Accesos y Credenciales de Prueba para Exposición

Para facilitar la evaluación de los evaluadores o docentes, se incluyen credenciales de prueba preconfiguradas:

| Rol | Correo Electrónico | Contraseña | Código MFA (Paso 2) |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@verichain.pe` | `Admin2026!` | `123456` |
| **Institución Aprobada (UNI)** | `certificados@uni.edu.pe` | `Uni2026!` | `123456` |
| **Institución Pendiente (PUCP)** | `grados@pucp.edu.pe` | `Pucp2026!` | `123456` |

---

## ⛓️ Despliegue del Contrato Inteligente en Blockchain

### A. Red Local de Respaldo (Hardhat Node)
Ideal para exposiciones académicas sin depender de conexión a internet o faucets:
```bash
# En una terminal independiente, levanta el nodo local de Hardhat
npm run node:local

# En otra terminal, despliega el contrato en la red local
npm run deploy:local
```
El script actualizará automáticamente `NEXT_PUBLIC_CONTRACT_ADDRESS` en tu archivo `.env`.

### B. Red de Pruebas Pública Sepolia (Ethereum)
1. Configura en `.env` tu endpoint RPC de Sepolia (Alchemy o Infura) y la clave privada de tu cuenta con saldo de prueba:
   ```env
   BLOCKCHAIN_NETWORK="sepolia"
   SEPOLIA_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/TU_API_KEY"
   SERVER_SIGNER_PRIVATE_KEY="0xTU_CLAVE_PRIVADA_SEPOLIA"
   ```
2. Ejecuta el despliegue:
   ```bash
   npm run deploy:sepolia
   ```

---

## 📋 Lista de Comprobación de Requerimientos

### Requerimientos Funcionales (RF)

| Código | Requerimiento | Estado | Cómo se probó / Verificación |
| :---: | :--- | :---: | :--- |
| **RF-01** | Registro de Institución | ✅ Cumplido | Formulario en `/auth/registro`. Queda en estado `PENDING` sin permisos de emisión hasta que el administrador la aprueba. |
| **RF-02** | Inicio de sesión con MFA | ✅ Cumplido | `/auth/login` exige correo, contraseña y código TOTP de 6 dígitos. |
| **RF-03** | Aprobación de Instituciones | ✅ Cumplido | El administrador aprueba en `/admin` y se generan las claves Ed25519 con cifrado AES-256-GCM. Instituciones suspendidas quedan bloqueadas. |
| **RF-04** | Emisión Individual | ✅ Cumplido | Formulario en `/institucion/emitir`. Genera UUID, sal, hash, firma Ed25519, PDF con QR y registro en Blockchain. |
| **RF-05** | Emisión Masiva por CSV | ✅ Cumplido | `/institucion/emision-masiva`. Descarga plantilla, procesa lote y reporta resumen de éxitos y filas con error. |
| **RF-06** | Generación del QR | ✅ Cumplido | En `/institucion/credencial/[id]`. QR descargable en PNG e incrustado en el PDF oficial enlazando a `/verificar/[id]`. |
| **RF-07** | Verificación por QR | ✅ Cumplido | `/verificar` con cámara web (`html5-qrcode`) y `/verificar/[id]`. Muestra el estado en grande con color distintivo. |
| **RF-08** | Verificación por PDF | ✅ Cumplido | Arrastre de PDF en `/verificar`. Si se modifica un solo carácter del documento, el sistema lo detecta y retorna `ALTERADA`. |
| **RF-09** | Detalle de la Evidencia | ✅ Cumplido | Muestra institución, fecha, hash registrado, hash calculado, estado de firma Ed25519, txHash y enlace al explorador. |
| **RF-10** | Revocación | ✅ Cumplido | Modal en `/institucion/credencial/[id]`. Registra motivo y transacción en Blockchain; desde ese momento retorna `REVOCADA`. |
| **RF-11** | Panel de la Institución | ✅ Cumplido | `/institucion`. Listado de credenciales con buscador, métricas, descarga de PDF y acceso a revocar. |
| **RF-12** | Vista del Titular | ✅ Cumplido | `/titular/[token]`. Acceso privado con token para ver, descargar PDF oficial y compartir enlace de verificación. |
| **RF-13** | Historial de Verificaciones | ✅ Cumplido | Guarda en `VerificationLog` resultado, método y fecha. Registra también intentos `NO_RECONOCIDA`. |
| **RF-14** | Panel del Administrador | ✅ Cumplido | `/admin`. Muestra indicadores de instituciones, credenciales y verificaciones por estado que coinciden con la BD. |
| **RF-15** | Auditoría | ✅ Cumplido | Tabla en `/admin` que audita inicios de sesión, emisiones, revocaciones y aprobaciones de instituciones. |
| **RF-16** | Pruebas de Escenarios | ✅ Cumplido | `/demo` y script `npm run seed:scenarios`. Valida interactivamente los 4 estados: `VÁLIDA`, `ALTERADA`, `REVOCADA` y `NO RECONOCIDA`. |

### Requerimientos No Funcionales (RNF)

| Código | Requerimiento | Estado | Cumplimiento Técnico |
| :---: | :--- | :---: | :--- |
| **RNF-01** | Seguridad | ✅ Cumplido | MFA obligatorio, validación estricta de esquemas con Zod, contraseñas hasheadas con PBKDF2 y claves privadas Ed25519 cifradas con AES-256-GCM. |
| **RNF-02** | Privacidad | ✅ Cumplido | Ningún dato personal en Blockchain ni dentro del QR. Documentos de identidad guardados y mostrados enmascarados (`****1234`). |
| **RNF-03** | Rendimiento | ✅ Cumplido | La verificación criptográfica y resolución de hash responde en menos de 200 milisegundos en condiciones locales normales. |
| **RNF-04** | Usabilidad | ✅ Cumplido | Interfaz completamente en español, moderna, con glassmorphism y visualización de resultados sin necesidad de scroll forzado. |
| **RNF-05** | Responsive | ✅ Cumplido | Compatible con dispositivos móviles, tabletas y laptops mediante Tailwind CSS. |
| **RNF-06** | Disponibilidad ante Fallas | ✅ Cumplido | Manejo resiliente de conectividad con la red RPC de Blockchain; mensaje claro y continuidad de prueba sin estados falsos. |
| **RNF-07** | Mantenibilidad | ✅ Cumplido | TypeScript estricto, estructura modular por capas, comentarios claros en español y manual de usuario detallado en `docs/manual-de-usuario.md`. |
| **RNF-08** | Portabilidad | ✅ Cumplido | Funciona en red local Hardhat y en red pública Sepolia cambiando únicamente variables en `.env`. |

---

## 📁 Estructura del Proyecto

```
verichain/
├── contracts/
│   └── CredentialRegistry.sol        # Contrato inteligente en Solidity
├── test/
│   ├── CredentialRegistry.test.ts    # 9 pruebas automatizadas en Hardhat
│   └── crypto.test.ts                # 6 pruebas unitarias de criptografía
├── scripts/
│   ├── deploy.ts                     # Script de despliegue en Blockchain
│   └── seed-demo-scenarios.ts        # Generador de los 4 escenarios de prueba (RF-16)
├── prisma/
│   ├── schema.prisma                 # Esquema Prisma (SQLite para desarrollo)
│   ├── schema.postgresql.prisma      # Esquema Prisma (PostgreSQL / Supabase)
│   └── seed.ts                       # Sembrado inicial de instituciones y credenciales
├── src/
│   ├── app/                          # Rutas de interfaz y API (Next.js 14 App Router)
│   │   ├── page.tsx                  # Landing page principal
│   │   ├── verificar/                # Portal público (QR, PDF, UUID)
│   │   ├── demo/                     # Laboratorio de los 4 estados (RF-16)
│   │   ├── auth/                     # Inicio de sesión con MFA y Registro
│   │   ├── institucion/              # Panel de institución, emisión individual y CSV
│   │   ├── titular/                  # Vista privada del titular con token
│   │   ├── admin/                    # Panel de administración e indicadores
│   │   └── api/                      # Endpoints REST de verificación, emisión y gobierno
│   ├── components/                   # Navbar, QrScanner, PdfDropzone, EvidenceCard, StatusBadge
│   └── lib/                          # crypto.ts, blockchain.ts, pdf.ts, qr.ts, verify.ts, auth.ts
├── docs/
│   └── manual-de-usuario.md          # Manual de usuario en 10 secciones para personas no técnicas
├── hardhat.config.ts                 # Configuración de Hardhat (localhost y Sepolia)
├── package.json                      # Dependencias y scripts
├── .env.example                      # Plantilla de variables de entorno
└── README.md                         # Documentación general del sistema
```
