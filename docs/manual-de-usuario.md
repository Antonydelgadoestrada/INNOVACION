# Manual de Usuario — Plataforma VeriChain
**Curso:** Innovación y Transformación Digital  
**Especialidad:** Ingeniería de Sistemas e Informática, Perú  
**Versión del Prototipo:** 1.0.0 (Prototipo Funcional Oficial)

---

## 1. Introducción: ¿Qué es VeriChain y para qué sirve?
**VeriChain** es una plataforma web moderna e intuitiva diseñada para resolver el problema del fraude y la demora en la verificación de certificados académicos en el Perú y Latinoamérica.

Hoy en día, para saber si un certificado universitario o técnico es auténtico, una empresa u organización suele tener que enviar un correo formal, llamar por teléfono o esperar días por una respuesta. Además, un documento digital en formato PDF puede ser fácilmente alterado con herramientas de edición gráfica sin dejar rastro visible a simple vista.

Con **VeriChain**, cualquier persona puede comprobar en menos de 3 segundos si una credencial académica es **auténtica**, si fue **alterada**, si fue **revocada** por la institución o si el sistema **no la reconoce**.

> **Regla de Privacidad de VeriChain:**  
> Ningún dato personal (nombres, notas, DNI) ni el archivo completo se guardan en la Blockchain pública. En la cadena de bloques solo se almacena una huella matemática digital (el **hash**), la institución que lo emitió, la fecha y si está activo o revocado.

---

## 2. ¿Quién puede usar el sistema? (Los cuatro roles)
1. **Verificador (Público General):** Cualquier persona, empresa de selección o reclutador. No necesita crearse una cuenta ni iniciar sesión. Verifica escaneando el código QR con su celular o laptop, o arrastrando el archivo PDF.
2. **Titular (Estudiante o Egresado):** La persona que obtuvo el certificado. Puede acceder a su documento oficial mediante un enlace privado con token seguro para descargarlo en PDF de alta calidad y compartirlo en su currículum o redes profesionales.
3. **Institución Emisora (Universidad o Instituto):** Personal autorizado de la casa de estudios. Requiere autenticación de dos pasos (MFA). Puede registrarse, emitir certificados individuales o por lote (CSV) y revocar credenciales si detecta algún error formal.
4. **Administrador de la Plataforma:** Responsable de la gobernanza del sistema. Requiere autenticación de dos pasos (MFA). Se encarga de evaluar solicitudes de instituciones, aprobarlas (generando sus claves criptográficas únicas), suspenderlas en caso de faltas y monitorear métricas globales y auditoría.

---

## 3. Requisitos del Sistema
Para utilizar VeriChain únicamente necesitas:
- **Dispositivo:** Teléfono inteligente (celular), tableta, laptop o computadora de escritorio.
- **Navegador Web:** Google Chrome, Mozilla Firefox, Microsoft Edge o Safari (versiones actualizadas).
- **Conexión a Internet:** Para conectarse a la plataforma y consultar la red Blockchain.
- **Cámara Web o de Celular (Opcional):** Si se desea escanear el código QR directamente desde la pantalla física o papel.
- **Aplicación Autenticadora (Solo para Instituciones y Administradores):** Google Authenticator, Microsoft Authenticator o Authy (disponibles gratuitamente en Google Play Store y Apple App Store).

---

## 4. Guía para el Verificador (Paso a Paso)

### A. Cómo verificar escaneando un código QR
1. Abre tu navegador y dirígete a `https://<dominio>/verificar`.
2. Selecciona la pestaña **"Cámara QR"**.
3. Presiona el botón **"Activar Cámara"** y acepta el permiso que solicita tu navegador.
4. Apunta la cámara hacia el código QR ubicado en la esquina inferior derecha del certificado.
5. El sistema detectará automáticamente el código y te llevará de inmediato a la pantalla de resultados oficiales.

> `[INSERTAR AQUÍ CAPTURA DE PANTALLA: Escáner QR con cámara web activa apuntando a un certificado]`

### B. Cómo verificar arrastrando un archivo PDF
1. Ingresa a `https://<dominio>/verificar` y selecciona la pestaña **"Subir PDF"**.
2. Arrastra el archivo PDF del certificado sobre la zona punteada o haz clic para seleccionarlo desde tu explorador de archivos.
3. El sistema calculará en tiempo real el hash criptográfico SHA-256 de tu archivo y lo contrastará con la evidencia inmutable en Blockchain.

> `[INSERTAR AQUÍ CAPTURA DE PANTALLA: Zona de arrastre de PDF con archivo seleccionado]`

### C. Cómo interpretar los 4 resultados oficiales
El sistema devolverá uno de los siguientes cuatro estados con un color distintivo:

| Estado Oficial | Color | ¿Qué significa? | ¿Qué debes hacer? |
| :--- | :---: | :--- | :--- |
| **VÁLIDA** | **Verde** | El certificado es 100% auténtico. El hash del documento y los datos coinciden con lo registrado en Blockchain, la firma digital de la institución es válida y no ha sido revocado. | Puedes confiar plenamente en la validez del certificado. |
| **ALTERADA** | **Amarillo** | El documento existe, pero alguien ha modificado aunque sea una sola letra, nota, fecha o firma del PDF, o la firma digital no corresponde a la institución. | **Rechazar el documento.** El certificado ha sido manipulado o falsificado. |
| **REVOCADA** | **Rojo** | El certificado existió, pero la institución emisora lo anuló formalmente (por ejemplo, por error en el título, fraude en requisitos o sustitución). | El certificado ya no tiene validez legal ni académica. Lee el motivo indicado en pantalla. |
| **NO RECONOCIDA** | **Gris** | El identificador no existe en la Blockchain ni en la plataforma, o el archivo subido no corresponde a un documento de VeriChain. | El documento no fue emitido a través de la plataforma oficial. |

> `[INSERTAR AQUÍ CAPTURA DE PANTALLA: Tarjeta de estado VÁLIDA en color verde con desglose de evidencia]`

---

## 5. Guía para la Institución Emisora

### A. Registro de la Institución
1. Ingresa a `/auth/registro`.
2. Completa los datos: Nombre oficial de la universidad, RUC de 11 dígitos, correo institucional y contraseña de al menos 8 caracteres.
3. Al enviar, tu cuenta quedará registrada en estado **PENDIENTE**. No podrás emitir certificados hasta que el Administrador apruebe la solicitud.

### B. Activación de Verificación en Dos Pasos (MFA)
1. Al iniciar sesión en `/auth/login`, introduce tu correo y contraseña.
2. El sistema solicitará un código de 6 dígitos. Abre tu aplicación autenticadora (Google Authenticator) e introduce el código temporal generado. *(Para el entorno de demostración académica, puedes usar el código demo `123456`).*

> `[INSERTAR AQUÍ CAPTURA DE PANTALLA: Formulario de inicio de sesión solicitando código de 6 dígitos]`

### C. Emisión Individual de una Credencial
1. Dirígete a **Panel Institución** y haz clic en **"Emitir Credencial"** (`/institucion/emitir`).
2. Completa el formulario:
   - Nombre completo del titular (estudiante).
   - Documento de identidad (DNI / Pasaporte). *El sistema lo enmascarará automáticamente a `****1234` para proteger la privacidad.*
   - Correo electrónico del estudiante.
   - Tipo de credencial (Certificado, Diploma, Grado Académico).
   - Nombre del programa académico o carrera.
   - Fecha oficial de expedición.
3. Presiona **"Firmar y Emitir Credencial Oficial"**.
4. En segundos, el sistema ordenará los datos, calculará el hash canónico, aplicará la firma digital Ed25519 con la clave privada de la institución, generará el PDF con su QR incrustado y registrará la evidencia en Blockchain.
5. Podrás descargar el PDF resultante y ver el enlace de la transacción en el explorador de bloques.

> `[INSERTAR AQUÍ CAPTURA DE PANTALLA: Certificado PDF generado con bordes ornamentales y código QR]`

### D. Emisión Masiva por Archivo CSV (Lotes)
1. En el panel de institución, presiona **"Carga CSV"** (`/institucion/emision-masiva`).
2. Descarga la plantilla de ejemplo presionando **"Descargar Plantilla CSV"**.
3. El archivo CSV debe contener exactamente estas columnas en la cabecera:
   ```csv
   recipientName,recipientId,recipientEmail,programName,credentialType,issueDate
   María Elena Gómez,71928301,maria.gomez@gmail.com,Especialización en Ciberseguridad,Certificado de Aprobación,2026-10-12
   Jorge Luis Ramos,45920182,jorge.ramos@gmail.com,Diplomado en Gestión Pública,Diploma,2026-10-12
   ```
4. Arrastra el archivo CSV y presiona **"Iniciar Emisión Masiva"**.
5. Al terminar, la pantalla mostrará un resumen con la cantidad de emisiones exitosas y, si hubo errores en alguna fila, indicará el número de fila y el motivo exacto para corregirlo.

> `[INSERTAR AQUÍ CAPTURA DE PANTALLA: Resumen de emisión masiva con contador de filas exitosas y erróneas]`

### E. Búsqueda y Descarga de Credenciales
1. En el panel de institución, usa el buscador para filtrar credenciales por nombre del estudiante o carrera.
2. Haz clic en **"Detalle"** en cualquier registro para visualizar sus hashes, descargar el código QR en imagen PNG aislada o descargar el PDF completo.

### F. Revocación de una Credencial
1. Entra al detalle de la credencial que deseas revocar (`/institucion/credencial/[id]`).
2. Haz clic en el botón rojo **"Revocar Credencial"**.
3. Escribe el motivo formal de la revocación (por ejemplo: *"Error tipográfico en los apellidos del graduado; reemitido con ID sustituto"*).
4. Confirma la acción. La revocación se registrará mediante una transacción en Blockchain y a partir de ese instante la verificación pública devolverá **REVOCADA**.

> `[INSERTAR AQUÍ CAPTURA DE PANTALLA: Modal de confirmación de revocación con campo de motivo]`

---

## 6. Guía para el Titular (Estudiante o Egresado)
1. Al emitirse tu certificado, recibirás un enlace privado con un token de seguridad único:  
   `https://<dominio>/titular/<token-privado>`
2. Abre el enlace en tu navegador. Tendrás acceso a la visualización de tu certificado sin necesidad de crear contraseñas.
3. Presiona el botón **"Descargar PDF Oficial con QR"** para guardar tu documento en alta resolución.
4. Puedes copiar tu enlace de verificación pública o compartir el código QR en tu perfil de LinkedIn, currículum vitae (CV) o portafolio profesional.

> `[INSERTAR AQUÍ CAPTURA DE PANTALLA: Portal privado del titular con botón de descarga de PDF]`

---

## 7. Guía para el Administrador de la Plataforma
1. Inicia sesión en `/auth/login` con tus credenciales de administrador y código MFA.
2. Ingresa a `/admin`.
3. **Indicadores Globales:** Monitorea la cantidad total de instituciones, credenciales emitidas y consultas por cada estado (Válida, Alterada, Revocada, No Reconocida).
4. **Gobernanza de Instituciones:**
   - Para instituciones en estado **PENDIENTE**, presiona **"Aprobar & Generar Claves"**. El sistema generará su par de claves criptográficas Ed25519 y las almacenará cifradas bajo AES-256-GCM.
   - Si una institución comete una infracción, puedes presionar **"Suspender"** para bloquear sus permisos de emisión y revocación.
5. **Auditoría del Sistema:** En la sección inferior podrás auditar cada inicio de sesión, aprobación, emisión y revocación con marca de tiempo precisa.

> `[INSERTAR AQUÍ CAPTURA DE PANTALLA: Panel del Administrador con indicadores estadísticos y auditoría]`

---

## 8. Preguntas Frecuentes (FAQ)

### ¿Se guardan mis notas o nombres en la Blockchain?
**No.** Por principios de privacidad y cumplimiento normativo (RNF-02), ningún dato personal ni documento completo se sube a la red pública. Solo se registra una huella matemática (hash SHA-256) de 64 caracteres.

### ¿Qué pasa si imprimo el certificado en papel físico?
El certificado PDF generado por VeriChain incluye un código QR de alta nitidez en la esquina inferior derecha. Cualquier persona puede escanear con su celular el certificado impreso en papel y comprobará la autenticidad al instante.

### ¿Se necesita pagar gas o criptomonedas para verificar?
**No.** La verificación es 100% gratuita y de lectura pública. Las transacciones de emisión y revocación son cubiertas por el nodo del servidor o la institución en la red de pruebas Sepolia.

---

## 9. Solución de Problemas Frecuentes

1. **La cámara del celular o laptop no se activa:**  
   Verifica que le hayas dado permisos a tu navegador para acceder a la cámara. En Chrome o Safari, revisa el ícono del candado junto a la barra de direcciones.
2. **El archivo PDF aparece como ALTERADA:**  
   Asegúrate de estar subiendo el archivo original generado por VeriChain. Si el PDF fue abierto y guardado con un editor que modificó metadatos, texto o marcas de agua, el hash del archivo cambiará y el sistema alertará que ha sido alterado.
3. **El código de 6 dígitos MFA es rechazado:**  
   Revisa que la hora de tu celular esté sincronizada automáticamente por red (los códigos TOTP cambian cada 30 segundos). Para exposiciones académicas de prueba, también puedes usar el código demo `123456`.
4. **La Blockchain no responde o está lenta:**  
   VeriChain cuenta con un modo de respaldo resiliente (RNF-06). Si la red pública Sepolia tiene congestión, el sistema continúa funcionando localmente sin interrumpir la demostración.

---

## 10. Glosario Sencillo de Términos

- **Hash Criptográfico (SHA-256):** Es como la huella dactilar de un archivo digital. A partir de cualquier texto o documento, produce una cadena única de 64 caracteres. Si cambias aunque sea una sola coma del documento, la huella resultante es completamente diferente.
- **Firma Digital Asimétrica (Ed25519):** Es el equivalente electrónico a una firma manuscrita con sello notarial. Se utiliza un par de llaves: una **clave privada** (que solo la institución conoce para firmar) y una **clave pública** (que cualquiera puede usar para comprobar que la firma es auténtica).
- **Blockchain (Cadena de Bloques):** Es un libro contable digital descentralizado e inmutable. Una vez que se registra un dato en un bloque, ninguna persona ni entidad puede borrarlo, alterarlo o falsificar la fecha en que ocurrió.
- **Código QR:** Código de barras bidimensional que contiene únicamente la dirección web oficial donde se puede consultar la evidencia criptográfica del certificado.
- **Revocación:** Procedimiento mediante el cual una institución anula formalmente un certificado previo, dejando constancia inmutable en Blockchain de la fecha y el motivo.
