# Adminos

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.3.6.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.


# 🔐 Explicación Completa de la Implementación de AWS Cognito

## 📋 Índice
1. [Introducción: ¿Qué "Sabor" de Cognito Usamos?](#1-introducción-qué-sabor-de-cognito-usamos)
2. [Arquitectura General](#2-arquitectura-general)
3. [Flujo de Registro y Confirmación (PIN)](#3-flujo-de-registro-y-confirmación-pin)
4. [Flujo de Login](#4-flujo-de-login)
5. [Componentes Principales](#5-componentes-principales)
6. [Diagramas de Flujo Detallados](#6-diagramas-de-flujo-detallados)
7. [Configuración de AWS Cognito](#7-configuración-de-aws-cognito)

---

## 1. Introducción: ¿Qué "Sabor" de Cognito Usamos?

### 🎯 Respuesta Directa

**NO usamos AWS Amplify Framework completo** (el que tiene `Auth.signIn()`, `Auth.currentAuthenticatedUser()`, etc.)

**Usamos una implementación HÍBRIDA que combina:**

### ✅ Librería Principal: `aws-amplify/auth` v6
```typescript
import {
  signIn,           // ❌ Solo para registro username/password
  signUp,           // ✅ Para registro de nuevos usuarios
  confirmSignUp,    // ✅ Para confirmar código de verificación
  resendSignUpCode, // ✅ Para reenviar código de confirmación
  signOut,          // ✅ Para cerrar sesión
  // ...otros métodos específicos
} from 'aws-amplify/auth';
```

**Características:**
- ✅ **Módulo específico de autenticación** (no todo el framework)
- ✅ **Versión 6** (más moderna y modular)
- ✅ **Solo se usa para operaciones de registro y gestión de cuentas**
- ❌ **NO se usa para el flujo OAuth principal**

### ✅ Flujo OAuth 2.0 con PKCE (IMPLEMENTACIÓN MANUAL)

El **flujo de login principal** está implementado **MANUALMENTE** usando:

```typescript
// 1. OAuth Service personalizado (manual)
export class OAuthService {
  // Genera PKCE, construye URLs, maneja callbacks
  async login() { /* Implementación manual del flujo OAuth */ }
  
  // No usa métodos de Amplify, usa fetch() directo
  async exchangeCodeForTokens(code: string) {
    const response = await fetch(`${domain}/oauth2/token`, {...});
  }
}
```

**Características:**
- ✅ **OAuth 2.0 Authorization Code Flow** con PKCE
- ✅ **Cognito Hosted UI** (página web de login de AWS)
- ✅ **Implementación manual** (sin biblioteca OAuth)
- ✅ **Tokens guardados en localStorage**
- ✅ **Capacitor Browser** para abrir el Hosted UI

### 🔄 Resumen del "Sabor"

```
┌─────────────────────────────────────────────────────┐
│         ARQUITECTURA HÍBRIDA DE COGNITO             │
├─────────────────────────────────────────────────────┤
│                                                     │
│  📦 aws-amplify/auth (v6)                          │
│     └─ SOLO para: signUp, confirmSignUp,          │
│        resendCode, forgotPassword                  │
│                                                     │
│  🔐 OAuth Service (MANUAL)                         │
│     └─ Para: Login, Logout, Refresh Token         │
│     └─ Usando: Hosted UI + PKCE                   │
│     └─ Sin biblioteca OAuth externa                │
│                                                     │
│  🌐 Cognito Hosted UI                              │
│     └─ Página web de AWS para autenticación       │
│                                                     │
│  📱 Capacitor Browser                              │
│     └─ Para abrir el Hosted UI en el móvil        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 2. Arquitectura General

### 🏗️ Componentes del Sistema

```
┌──────────────────────────────────────────────────────────┐
│                    FRONTEND (Ionic/Angular)              │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────┐  ┌─────────────────┐               │
│  │  AuthService   │  │  OAuthService   │               │
│  │  (Amplify v6)  │  │  (Manual PKCE)  │               │
│  └───────┬────────┘  └────────┬────────┘               │
│          │                     │                         │
│          │ signUp()           │ login() → Hosted UI    │
│          │ confirmSignUp()    │ exchangeTokens()       │
│          │ resendCode()       │ refreshToken()         │
│          │                     │                         │
└──────────┼─────────────────────┼─────────────────────────┘
           │                     │
           ▼                     ▼
┌──────────────────────────────────────────────────────────┐
│                    AWS COGNITO USER POOL                 │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────┐  ┌──────────────────────────┐    │
│  │  User Pool       │  │  Hosted UI               │    │
│  │  - Usuarios      │  │  - Login Page            │    │
│  │  - Atributos     │  │  - OAuth 2.0 Endpoints   │    │
│  │  - Policies      │  │  - /oauth2/authorize     │    │
│  │                  │  │  - /oauth2/token         │    │
│  └──────────────────┘  └──────────────────────────┘    │
│                                                          │
│  ✉️ Email Verification: AWS SES                         │
│     └─ Envía códigos de 6 dígitos automáticamente      │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 📦 Librerías Instaladas

```json
{
  "dependencies": {
    "aws-amplify": "^6.x.x",           // ← Módulo de autenticación
    "@aws-sdk/client-cognito-identity-provider": "^3.x.x",
    "crypto-js": "^4.x.x",             // ← Para PKCE (SHA256)
    "@capacitor/browser": "^6.x.x",    // ← Para abrir Hosted UI
    "@capacitor/app": "^6.x.x"         // ← Para deep links
  }
}
```

---

## 3. Flujo de Registro y Confirmación (PIN)

### 📝 Paso 1: Usuario Se Registra

```typescript
// register.component.ts
async register() {
  const registerData: RegisterRequest = {
    name: this.name,
    email: this.email,
    school: this.school,
    age: this.age,
    gender: this.gender,
    phone: this.phone,
    password: this.password
  };
  
  // Llamar al servicio híbrido
  const result = await this.hybridAuthService.register(registerData);
}
```

```typescript
// hybrid-auth.service.ts
async register(data: RegisterRequest): Promise<any> {
  // Usar aws-amplify/auth para el registro
  const result = await signUp({
    username: data.email,
    password: data.password,
    options: {
      userAttributes: {
        email: data.email,
        name: data.name,
        phone_number: data.phone,
        'custom:school': data.school,
        'custom:age': data.age.toString(),
        'custom:gender': data.gender,
        'custom:role': 'student'
      }
    }
  });
  
  return result;
}
```

### 📧 Paso 2: AWS Cognito Envía el PIN/Código

**¿Cómo se envía el código de confirmación?**

1. **Automáticamente por AWS Cognito:**
   - Cuando llamas a `signUp()`, Cognito **automáticamente**:
     - Crea el usuario en estado "UNCONFIRMED"
     - Genera un código de 6 dígitos aleatorio
     - Envía un email usando **AWS SES** (Simple Email Service)

2. **Formato del Email:**
   ```
   De: no-reply@verificationemail.com (o tu dominio configurado)
   Asunto: Your verification code
   
   Su código de verificación es: 123456
   ```

3. **Configuración en AWS Cognito:**
   ```
   User Pool → Message customizations → Verification type:
   ✅ Email (selected)
   
   Email verification message:
   "Tu código de verificación es {####}"
   
   Email verification subject:
   "Confirma tu cuenta en EdTech"
   ```

### 🔢 Paso 3: Usuario Ingresa el Código

```typescript
// register.component.ts
async confirmRegistration(code: string) {
  try {
    // Llamar al servicio para confirmar
    const result = await this.hybridAuthService.confirmRegistration(
      this.email, 
      code
    );
    
    if (result.success) {
      // Usuario confirmado ✅
      this.router.navigate(['/login']);
    }
  } catch (error) {
    // Código inválido o expirado
    this.showError(error);
  }
}
```

```typescript
// hybrid-auth.service.ts
async confirmRegistration(email: string, code: string): Promise<any> {
  // Usar aws-amplify/auth para confirmar
  const result = await confirmSignUp({
    username: email,
    confirmationCode: code  // ← El código de 6 dígitos
  });
  
  return {
    success: result.isSignUpComplete
  };
}
```

### 🔄 Paso 4: Reenviar Código (Opcional)

```typescript
// hybrid-auth.service.ts
async resendConfirmationCode(email: string): Promise<any> {
  // Usar aws-amplify/auth para reenviar
  const result = await resendSignUpCode({
    username: email
  });
  
  // Cognito volverá a enviar el email automáticamente
  return result;
}
```

### 📊 Diagrama del Flujo de Confirmación

```
┌─────────────┐
│   Usuario   │
│  Registra   │
└──────┬──────┘
       │
       │ 1. signUp(email, password, attrs)
       ▼
┌──────────────────┐
│  AuthService     │
│  (aws-amplify)   │
└──────┬───────────┘
       │
       │ 2. HTTP POST a Cognito
       ▼
┌──────────────────────────────────────┐
│        AWS Cognito User Pool         │
│                                      │
│  1. Crea usuario (estado: UNCONFIRMED)
│  2. Genera código: "123456"         │
│  3. Llama a AWS SES                  │
└──────┬───────────────────────────────┘
       │
       │ 3. AWS SES envía email
       ▼
┌──────────────────┐
│  Email del User  │
│                  │
│  Código: 123456  │  ◄─── 📧 Llega al inbox
└──────┬───────────┘
       │
       │ 4. Usuario lee email
       │ 5. Ingresa código en app
       ▼
┌──────────────────┐
│  Confirm Dialog  │
│                  │
│  [______]        │  ◄─── Usuario escribe "123456"
│  [Confirmar]     │
└──────┬───────────┘
       │
       │ 6. confirmSignUp(email, "123456")
       ▼
┌──────────────────┐
│  AuthService     │
└──────┬───────────┘
       │
       │ 7. HTTP POST a Cognito
       ▼
┌──────────────────────────────────────┐
│        AWS Cognito User Pool         │
│                                      │
│  1. Valida el código                 │
│  2. Si es correcto:                  │
│     - Cambia estado a CONFIRMED ✅   │
│  3. Si es incorrecto:                │
│     - Error: CodeMismatchException   │
└──────┬───────────────────────────────┘
       │
       │ 8. Respuesta
       ▼
┌──────────────────┐
│   Usuario        │
│   Confirmado ✅  │
│                  │
│  → Login Page    │
└──────────────────┘
```

### 🔐 Detalles Técnicos del Código de Confirmación

**Características del código:**
- ✅ **6 dígitos numéricos** (ej: 123456)
- ✅ **Válido por 24 horas** (configurable en Cognito)
- ✅ **Un solo uso** (se invalida después de confirmar)
- ✅ **Generado por Cognito** (no por tu app)
- ✅ **Enviado automáticamente** por AWS SES
- ✅ **Se puede reenviar** con `resendSignUpCode()`

**Posibles errores:**
```typescript
// Error: Código incorrecto
CodeMismatchException: "Invalid verification code provided"

// Error: Código expirado
ExpiredCodeException: "Invalid code provided, please request a code again"

// Error: Usuario ya confirmado
NotAuthorizedException: "User cannot be confirmed. Current status is CONFIRMED"
```

---

## 4. Flujo de Login

### 🌐 Paso 1: Login con Hosted UI (OAuth PKCE)

```typescript
// login.component.ts
async loginWithHostedUI() {
  // Abrir el Cognito Hosted UI (navegador)
  await this.oauthService.login();
}
```

```typescript
// oauth.service.ts
async login(): Promise<void> {
  // 1. Generar PKCE (Proof Key for Code Exchange)
  const codeVerifier = this.generateRandomString(32);
  const codeChallenge = this.sha256(codeVerifier);
  
  // 2. Guardar code_verifier para después
  localStorage.setItem('oauth_code_verifier', codeVerifier);
  
  // 3. Construir URL del Hosted UI
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: environment.aws.clientId,
    redirect_uri: 'http://localhost:8101/callback',
    scope: 'openid email',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256'
  });
  
  const authUrl = `https://edtech-auth.auth.us-east-1.amazoncognito.com/login?${params}`;
  
  // 4. Abrir en el navegador del dispositivo
  await Browser.open({ url: authUrl });
}
```

### 🔐 Paso 2: Usuario Ingresa Credenciales en Hosted UI

```
┌────────────────────────────────────────┐
│   AWS Cognito Hosted UI                │
│   (Página web de AWS)                  │
├────────────────────────────────────────┤
│                                        │
│   📧 Email:    [___________________]   │
│   🔒 Password: [___________________]   │
│                                        │
│   [  Iniciar Sesión  ]                 │
│                                        │
│   ¿Olvidaste tu contraseña?            │
│   ¿No tienes cuenta? Regístrate        │
│                                        │
└────────────────────────────────────────┘
         ↓
    (Usuario ingresa email + password)
         ↓
    Cognito valida credenciales
         ↓
    Si es correcto: redirige a callback
```

### ↩️ Paso 3: Callback con Authorization Code

```typescript
// App.ts - Deep Link Listener
App.addListener('appUrlOpen', async (data) => {
  // URL recibida: http://localhost:8101/callback?code=abc123xyz...
  
  const url = new URL(data.url);
  const code = url.searchParams.get('code');  // ← Authorization Code
  
  if (code) {
    // Cerrar el browser
    await Browser.close();
    
    // Intercambiar código por tokens
    await this.oauthService.exchangeCodeForTokens(code);
  }
});
```

### 🎫 Paso 4: Intercambio de Código por Tokens

```typescript
// oauth.service.ts
private async exchangeCodeForTokens(code: string): Promise<void> {
  // 1. Recuperar el code_verifier guardado
  const codeVerifier = localStorage.getItem('oauth_code_verifier');
  
  // 2. Hacer petición al endpoint de tokens
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: environment.aws.clientId,
    code: code,                    // ← El código recibido
    redirect_uri: 'http://localhost:8101/callback',
    code_verifier: codeVerifier    // ← PKCE: proof que iniciamos el flow
  });
  
  // 3. POST a /oauth2/token
  const response = await fetch(
    'https://edtech-auth.auth.us-east-1.amazoncognito.com/oauth2/token',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    }
  );
  
  // 4. Respuesta con tokens
  const tokens = await response.json();
  /*
  {
    "access_token": "eyJraWQiOiJ...",
    "id_token": "eyJraWQiOiJ...",
    "refresh_token": "eyJjdHkiOiJ...",
    "expires_in": 3600,
    "token_type": "Bearer"
  }
  */
  
  // 5. Guardar tokens en localStorage
  localStorage.setItem('oauth_access_token', tokens.access_token);
  localStorage.setItem('oauth_id_token', tokens.id_token);
  localStorage.setItem('oauth_refresh_token', tokens.refresh_token);
  localStorage.setItem('oauth_expires_at', Date.now() + tokens.expires_in * 1000);
  
  // 6. Cargar información del usuario
  await this.loadUserInfo();
  
  // 7. Redirigir a la app
  this.router.navigate(['/bot']);
}
```

### 📋 Paso 5: Obtener Info del Usuario

```typescript
// oauth.service.ts
private async loadUserInfo(): Promise<void> {
  const accessToken = localStorage.getItem('oauth_access_token');
  
  // Llamar al endpoint userInfo de Cognito
  const response = await fetch(
    'https://edtech-auth.auth.us-east-1.amazoncognito.com/oauth2/userInfo',
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );
  
  const userInfo = await response.json();
  /*
  {
    "sub": "uuid-del-usuario",
    "email": "user@example.com",
    "email_verified": true,
    "name": "Juan Pérez",
    "custom:school": "Universidad XYZ",
    "custom:age": "20",
    "custom:gender": "male",
    "custom:role": "student"
  }
  */
  
  localStorage.setItem('oauth_user_info', JSON.stringify(userInfo));
}
```

---

## 5. Componentes Principales

### 🔐 AuthService (auth.service.ts)

**Responsabilidad:** Operaciones de registro y gestión de cuentas usando `aws-amplify/auth`

```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  
  // ✅ Configuración de Amplify
  constructor() {
    Amplify.configure({
      Auth: {
        Cognito: {
          userPoolId: 'us-east-1_DI5ZL4Ecg',
          userPoolClientId: '20rtl03enqpogedn5r5g79pqdm',
          loginWith: {
            oauth: {
              domain: 'edtech-auth.auth.us-east-1.amazoncognito.com',
              scopes: ['openid', 'email'],
              redirectSignIn: ['http://localhost:8101/callback'],
              redirectSignOut: ['http://localhost:8101/signout'],
              responseType: 'code'
            }
          }
        }
      }
    });
  }
  
  // ✅ MÉTODOS QUE SÍ USA (con aws-amplify/auth)
  
  register(data: RegisterRequest): Observable<any> {
    return from(signUp({
      username: data.email,
      password: data.password,
      options: { userAttributes: {...} }
    }));
  }
  
  confirmRegistration(email: string, code: string): Observable<any> {
    return from(confirmSignUp({
      username: email,
      confirmationCode: code
    }));
  }
  
  resendConfirmationCode(email: string): Observable<any> {
    return from(resendSignUpCode({ username: email }));
  }
  
  forgotPassword(data: ForgotPasswordRequest): Observable<any> {
    return from(resetPassword({ username: data.email }));
  }
  
  confirmNewPassword(email: string, code: string, newPassword: string): Observable<any> {
    return from(confirmResetPassword({
      username: email,
      confirmationCode: code,
      newPassword: newPassword
    }));
  }
  
  // ❌ NO USA para OAuth login
  // El login se hace con OAuthService
}
```

### 🌐 OAuthService (oauth.service.ts)

**Responsabilidad:** Flujo OAuth 2.0 PKCE manual con Hosted UI

```typescript
@Injectable({ providedIn: 'root' })
export class OAuthService {
  
  // ✅ Login con Hosted UI
  async login(): Promise<void> {
    const { codeVerifier, codeChallenge } = this.generatePKCE();
    localStorage.setItem('oauth_code_verifier', codeVerifier);
    
    const authUrl = this.buildAuthUrl(codeChallenge);
    await Browser.open({ url: authUrl });
  }
  
  // ✅ Intercambio de código por tokens
  private async exchangeCodeForTokens(code: string): Promise<void> {
    const codeVerifier = localStorage.getItem('oauth_code_verifier');
    const tokens = await this.fetchTokens(code, codeVerifier);
    this.saveTokens(tokens);
    await this.loadUserInfo();
  }
  
  // ✅ Refresh de token expirado
  async refreshToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem('oauth_refresh_token');
    const newTokens = await this.fetchRefreshTokens(refreshToken);
    this.saveTokens(newTokens);
    return true;
  }
  
  // ✅ Verificar autenticación
  async isAuthenticated(): Promise<boolean> {
    const token = localStorage.getItem('oauth_access_token');
    const expiresAt = localStorage.getItem('oauth_expires_at');
    
    if (!token || !expiresAt) return false;
    
    if (Date.now() >= parseInt(expiresAt)) {
      return await this.refreshToken();
    }
    
    return true;
  }
  
  // ✅ Obtener tokens
  getAccessToken(): string | null {
    return localStorage.getItem('oauth_access_token');
  }
  
  getIdToken(): string | null {
    return localStorage.getItem('oauth_id_token');
  }
  
  // ✅ Obtener usuario
  getCurrentUser(): UserInfo | null {
    const userInfoStr = localStorage.getItem('oauth_user_info');
    return userInfoStr ? JSON.parse(userInfoStr) : null;
  }
  
  // ✅ Logout
  async logout(): Promise<void> {
    // Limpiar localStorage
    localStorage.clear();
    
    // Abrir logout URL de Cognito
    const logoutUrl = this.buildLogoutUrl();
    await Browser.open({ url: logoutUrl });
  }
}
```

### 👤 UserService (user.service.ts)

**Responsabilidad:** Interacción con el backend (MongoDB) y decodificación de JWT

```typescript
@Injectable({ providedIn: 'root' })
export class UserService {
  
  // ✅ Enviar datos del primer login a MongoDB
  async firstLogin(attributes: UserAttributes): Promise<Observable<FirstLoginResponse>> {
    const headers = await this.getAuthHeaders();
    return this.http.post<FirstLoginResponse>(
      environment.api.firstLogin,
      { attributes },
      { headers }
    );
  }
  
  // ✅ Verificar si el usuario existe en MongoDB
  async checkUserExists(): Promise<CheckUserResponse | null> {
    const headers = await this.getAuthHeaders();
    return this.http.get<CheckUserResponse>(
      environment.api.checkUserExists,
      { headers }
    ).toPromise();
  }
  
  // ✅ Obtener info del usuario desde el ID Token (JWT)
  async getUserInfoFromCognito(): Promise<CognitoUserInfo | null> {
    const idToken = await this.authService.getIdToken();
    if (!idToken) return null;
    
    // Decodificar el JWT
    const payload = this.decodeJWT(idToken);
    return payload as CognitoUserInfo;
  }
  
  // ✅ Verificar si necesita completar first-login
  async needsFirstLogin(): Promise<boolean> {
    const response = await this.checkUserExists();
    return response?.isFirstLogin === true || response?.exists === false;
  }
}
```

### 🛡️ AuthGuard (auth.guard.ts)

**Responsabilidad:** Proteger rutas y manejar first-login

```typescript
@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  
  async canActivate(route: ActivatedRouteSnapshot): Promise<boolean> {
    // 1. Verificar autenticación OAuth
    const isAuthenticated = await this.oauthService.isAuthenticated();
    
    if (!isAuthenticated) {
      this.router.navigate(['/login']);
      return false;
    }
    
    // 2. Verificar si existe en MongoDB
    try {
      const userExists = await this.userService.checkUserExists();
      
      if (!userExists || userExists.isFirstLogin) {
        // Usuario no existe en MongoDB → Redirigir a registro
        this.router.navigate(['/register']);
        return false;
      }
      
      // Usuario existe → Permitir acceso
      return true;
      
    } catch (error) {
      console.error('Error verificando usuario:', error);
      this.router.navigate(['/login']);
      return false;
    }
  }
}
```

---

## 6. Diagramas de Flujo Detallados

### 📊 Flujo Completo de Registro

```
┌──────────────────────────────────────────────────────────────────┐
│                    FLUJO DE REGISTRO COMPLETO                    │
└──────────────────────────────────────────────────────────────────┘

    👤 Usuario
       │
       │ 1. Abre /register
       ▼
    ┌─────────────────┐
    │ RegisterComponent│
    │                 │
    │ Formulario:     │
    │ - Name          │
    │ - Email         │
    │ - Password      │
    │ - School        │
    │ - Age           │
    │ - Gender        │
    │ - Phone         │
    └────────┬────────┘
             │
             │ 2. Click "Registrar"
             ▼
    ┌─────────────────────┐
    │ HybridAuthService   │
    │ .register(data)     │
    └────────┬────────────┘
             │
             │ 3. signUp(username, password, attributes)
             ▼
    ┌─────────────────────────────────────────┐
    │         AWS Cognito User Pool           │
    │                                         │
    │  1. Valida password policy              │
    │  2. Verifica que email no exista        │
    │  3. Crea usuario (estado: UNCONFIRMED)  │
    │  4. Genera código: "123456"             │
    └────────┬────────────────────────────────┘
             │
             │ 4. Llama a AWS SES
             ▼
    ┌─────────────────────┐
    │      AWS SES        │
    │  (Email Service)    │
    └────────┬────────────┘
             │
             │ 5. Envía email con código
             ▼
    ┌─────────────────────┐         ┌─────────────────────┐
    │  Email del Usuario  │         │   App muestra       │
    │                     │         │   Alert Dialog      │
    │  Código: 123456     │  ←───→  │                     │
    └─────────────────────┘         │  [____________]     │
                                    │  Ingresa código     │
                                    │  [Confirmar]        │
                                    └────────┬────────────┘
                                             │
                                             │ 6. Usuario ingresa código
                                             ▼
                                    ┌─────────────────────┐
                                    │ confirmRegistration │
                                    │ (email, "123456")   │
                                    └────────┬────────────┘
                                             │
                                             │ 7. confirmSignUp()
                                             ▼
                                    ┌─────────────────────────────┐
                                    │   AWS Cognito User Pool     │
                                    │                             │
                                    │  1. Valida código           │
                                    │  2. Si correcto:            │
                                    │     - Estado → CONFIRMED ✅ │
                                    │  3. Si incorrecto:          │
                                    │     - Error ❌              │
                                    └────────┬────────────────────┘
                                             │
                                             │ 8. Respuesta
                                             ▼
                                    ┌─────────────────────┐
                                    │   Usuario           │
                                    │   Confirmado ✅     │
                                    │                     │
                                    │ Redirige a /login   │
                                    └─────────────────────┘
```

### 📊 Flujo Completo de Login con OAuth PKCE

```
┌──────────────────────────────────────────────────────────────────┐
│                 FLUJO DE LOGIN CON OAUTH PKCE                    │
└──────────────────────────────────────────────────────────────────┘

    👤 Usuario
       │
       │ 1. Abre /login
       ▼
    ┌─────────────────┐
    │  LoginComponent │
    │                 │
    │  [Login OAuth]  │ ← Click aquí
    └────────┬────────┘
             │
             │ 2. oauthService.login()
             ▼
    ┌──────────────────────────────────────┐
    │       OAuthService                   │
    │                                      │
    │  1. Genera PKCE:                     │
    │     - code_verifier (random)         │
    │     - code_challenge = SHA256(^)     │
    │                                      │
    │  2. Guarda en localStorage:          │
    │     - oauth_code_verifier            │
    │                                      │
    │  3. Construye URL:                   │
    │     /oauth2/authorize?               │
    │       response_type=code             │
    │       &client_id=xxx                 │
    │       &redirect_uri=callback         │
    │       &code_challenge=yyy            │
    │       &code_challenge_method=S256    │
    └────────┬─────────────────────────────┘
             │
             │ 4. Browser.open(authUrl)
             ▼
    ┌────────────────────────────────────┐
    │   📱 Capacitor Browser             │
    │   (In-App Browser)                 │
    │                                    │
    │   ┌─────────────────────────────┐  │
    │   │  AWS Cognito Hosted UI      │  │
    │   │  (edtech-auth.auth.xxx)     │  │
    │   │                             │  │
    │   │  Email:    [____________]   │  │
    │   │  Password: [____________]   │  │
    │   │                             │  │
    │   │  [  Iniciar Sesión  ]       │  │
    │   └─────────────────────────────┘  │
    └────────┬───────────────────────────┘
             │
             │ 5. Usuario ingresa credenciales
             ▼
    ┌─────────────────────────────────────┐
    │     AWS Cognito User Pool           │
    │                                     │
    │  1. Valida email + password         │
    │  2. Verifica que esté CONFIRMED     │
    │  3. Genera authorization_code       │
    │  4. Redirige a:                     │
    │     callback?code=abc123xyz...      │
    └────────┬────────────────────────────┘
             │
             │ 6. Redirect con code
             ▼
    ┌────────────────────────────────────┐
    │   App Deep Link Listener           │
    │   (App.addListener)                │
    │                                    │
    │  URL: callback?code=abc123xyz      │
    └────────┬───────────────────────────┘
             │
             │ 7. Browser.close()
             │ 8. exchangeCodeForTokens(code)
             ▼
    ┌──────────────────────────────────────────────────┐
    │       OAuthService                               │
    │                                                  │
    │  1. Lee code_verifier de localStorage            │
    │  2. POST a /oauth2/token con:                    │
    │     - grant_type=authorization_code              │
    │     - client_id=xxx                              │
    │     - code=abc123xyz                             │
    │     - redirect_uri=callback                      │
    │     - code_verifier=zzz  ← PKCE proof           │
    └────────┬─────────────────────────────────────────┘
             │
             │ 9. Petición a Cognito
             ▼
    ┌─────────────────────────────────────┐
    │     AWS Cognito Token Endpoint      │
    │                                     │
    │  1. Valida code                     │
    │  2. Valida code_verifier con        │
    │     code_challenge (PKCE)           │
    │  3. Genera tokens:                  │
    │     - access_token (JWT)            │
    │     - id_token (JWT)                │
    │     - refresh_token                 │
    └────────┬────────────────────────────┘
             │
             │ 10. Respuesta con tokens
             ▼
    ┌──────────────────────────────────────┐
    │       OAuthService                   │
    │                                      │
    │  1. Guarda en localStorage:          │
    │     - oauth_access_token             │
    │     - oauth_id_token                 │
    │     - oauth_refresh_token            │
    │     - oauth_expires_at               │
    │                                      │
    │  2. loadUserInfo()                   │
    └────────┬─────────────────────────────┘
             │
             │ 11. GET /oauth2/userInfo
             ▼
    ┌─────────────────────────────────────┐
    │     AWS Cognito UserInfo Endpoint   │
    │                                     │
    │  Retorna:                           │
    │  {                                  │
    │    sub: "uuid",                     │
    │    email: "user@example.com",       │
    │    name: "Juan",                    │
    │    custom:school: "UNAM",           │
    │    custom:age: "20",                │
    │    ...                              │
    │  }                                  │
    └────────┬────────────────────────────┘
             │
             │ 12. Guarda user_info
             ▼
    ┌──────────────────────────────────────┐
    │       localStorage                   │
    │                                      │
    │  oauth_access_token: "eyJ..."        │
    │  oauth_id_token: "eyJ..."            │
    │  oauth_refresh_token: "eyJ..."       │
    │  oauth_expires_at: 1730000000000     │
    │  oauth_user_info: "{...}"            │
    └────────┬─────────────────────────────┘
             │
             │ 13. router.navigate(['/bot'])
             ▼
    ┌─────────────────────┐
    │      AuthGuard      │
    │                     │
    │  1. Verifica token  │
    │  2. Verifica MongoDB│
    └────────┬────────────┘
             │
             │ 14. checkUserExists()
             ▼
    ┌──────────────────────────────────────┐
    │     UserService                      │
    │                                      │
    │  GET /users/check-exists             │
    │  Header: Authorization: Bearer xxx   │
    └────────┬─────────────────────────────┘
             │
             │ 15. Consulta a Lambda + MongoDB
             ▼
    ┌──────────────────────────────────────┐
    │     AWS Lambda + MongoDB             │
    │                                      │
    │  1. Decodifica JWT                   │
    │  2. Extrae email/sub                 │
    │  3. Busca en MongoDB                 │
    │  4. Retorna:                         │
    │     - exists: true/false             │
    │     - isFirstLogin: true/false       │
    │     - user: {...}                    │
    └────────┬─────────────────────────────┘
             │
             │ 16. Respuesta
             ▼
    ┌──────────────────────────────────────┐
    │         AuthGuard Decision           │
    │                                      │
    │  Si exists=true → /bot ✅            │
    │  Si exists=false → /register ⚠️      │
    └──────────────────────────────────────┘
```

---

## 7. Configuración de AWS Cognito

### ⚙️ Variables de Entorno (environment.ts)

```typescript
export const environment = {
  production: false,
  aws: {
    region: 'us-east-1',
    userPoolId: 'us-east-1_DI5ZL4Ecg',
    clientId: '20rtl03enqpogedn5r5g79pqdm',
    domain: 'https://edtech-auth.auth.us-east-1.amazoncognito.com',
    issuer: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_DI5ZL4Ecg',
    jwks_uri: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_DI5ZL4Ecg/.well-known/jwks.json',
    redirectUri: 'http://localhost:8101/callback',
    signOutUri: 'http://localhost:8101/signout',
    scopes: ['openid', 'email'],
    responseType: 'code'
  }
};
```

### 🔧 Configuración en AWS Cognito Console

#### 1. User Pool Settings

```
User Pool ID: us-east-1_DI5ZL4Ecg
Region: us-east-1
Name: edtech-user-pool
```

#### 2. App Client Settings

```
App Client ID: 20rtl03enqpogedn5r5g79pqdm
App Client Name: edtech-app-client

Authentication Flows:
✅ ALLOW_USER_PASSWORD_AUTH
✅ ALLOW_REFRESH_TOKEN_AUTH
✅ ALLOW_AUTHORIZATION_CODE_GRANT (OAuth)

OAuth 2.0 Settings:
✅ Authorization code grant
✅ Implicit grant (NO - más seguro con PKCE)

Allowed OAuth Flows:
✅ Authorization code grant

Allowed OAuth Scopes:
✅ openid
✅ email
✅ profile

Callback URLs:
http://localhost:8100/callback
http://localhost:8101/callback
edtech://callback (para móvil)

Sign out URLs:
http://localhost:8100/signout
http://localhost:8101/signout
edtech://signout
```

#### 3. Domain

```
Domain: edtech-auth.auth.us-east-1.amazoncognito.com

Hosted UI URLs:
- Login: https://edtech-auth.auth.us-east-1.amazoncognito.com/login
- Logout: https://edtech-auth.auth.us-east-1.amazoncognito.com/logout
- OAuth2 Authorize: .../oauth2/authorize
- OAuth2 Token: .../oauth2/token
- OAuth2 UserInfo: .../oauth2/userInfo
```

#### 4. Atributos

**Atributos Estándar:**
```
✅ email (required, mutable, verifiable)
✅ name (required, mutable)
✅ phone_number (required, mutable)
```

**Atributos Personalizados:**
```
✅ custom:school (String, mutable)
✅ custom:age (Number, mutable)
✅ custom:gender (String, mutable)
✅ custom:role (String, mutable)
```

#### 5. Password Policy

```
Minimum length: 8
Require lowercase: ✅
Require uppercase: ✅
Require numbers: ✅
Require symbols: ✅
Expiration: Never
```

#### 6. Email Verification

```
Verification method: Email
Verification message:
  "Tu código de verificación es {####}"
  
Verification subject:
  "Confirma tu cuenta en EdTech"

From email:
  no-reply@verificationemail.com (AWS SES)
```

#### 7. Lambda Triggers (Opcional)

```
Pre sign-up: check_user_lambda (verifica si ya existe en MongoDB)
Post confirmation: None
Pre authentication: None
Post authentication: None
```

---

## 🎯 Resumen Final

### ✅ Lo que DEBES saber

1. **"Sabor" de Cognito:**
   - ✅ NO es AWS Amplify completo
   - ✅ Es `aws-amplify/auth` v6 + OAuth manual
   - ✅ PKCE implementado manualmente
   - ✅ Hosted UI de Cognito

2. **Flujo de Registro:**
   - ✅ Usuario → signUp() → Cognito crea usuario (UNCONFIRMED)
   - ✅ Cognito → AWS SES → Envía email con código de 6 dígitos
   - ✅ Usuario → Ingresa código → confirmSignUp()
   - ✅ Cognito → Valida código → Estado = CONFIRMED ✅

3. **Flujo de Login:**
   - ✅ Usuario → Click "Login" → Abre Hosted UI
   - ✅ Hosted UI → Usuario ingresa credenciales
   - ✅ Cognito → Valida → Redirige con authorization_code
   - ✅ App → Intercambia code por tokens (PKCE)
   - ✅ Tokens guardados en localStorage
   - ✅ AuthGuard verifica si existe en MongoDB

4. **Código de Confirmación (PIN):**
   - ✅ **Generado automáticamente** por AWS Cognito
   - ✅ **Enviado automáticamente** por AWS SES
   - ✅ **6 dígitos numéricos**
   - ✅ **Válido 24 horas**
   - ✅ **Un solo uso**
   - ✅ **Se puede reenviar** con `resendSignUpCode()`

5. **Tokens:**
   - ✅ access_token: Para llamadas al backend
   - ✅ id_token: Contiene info del usuario (JWT)
   - ✅ refresh_token: Para renovar tokens expirados
   - ✅ Guardados en localStorage
   - ✅ Validez: 1 hora (configurable)

---

## 📚 Referencias

- [AWS Amplify Auth v6](https://docs.amplify.aws/javascript/build-a-backend/auth/)
- [AWS Cognito Hosted UI](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-app-integration.html)
- [OAuth 2.0 PKCE](https://oauth.net/2/pkce/)
- [Capacitor Browser Plugin](https://capacitorjs.com/docs/apis/browser)

