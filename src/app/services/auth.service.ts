import { Injectable } from '@angular/core';
import { Observable, of, delay, throwError } from 'rxjs';
import { User, UserRole, AuthResponse, LoginRequest } from '../models/user.model';
import { ApiResponse } from '../models/api.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Simulated AWS Lambda endpoint
  private readonly lambdaEndpoint = 'https://api.example.com/auth';

  // Mock user data
  private mockUser: User = {
    id: 'admin-001',
    email: 'admin@adminos.com',
    firstName: 'Carlos',
    lastName: 'Mendoza',
    phone: '+51 999 888 777',
    role: UserRole.SUPER_ADMIN,
    avatar: 'https://ui-avatars.com/api/?name=Carlos+Mendoza&background=0ea5e9&color=fff',
    condominiumIds: ['1', '2', '3', '4', '5'],
    isActive: true,
    lastLogin: new Date('2025-10-22T08:00:00'),
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2025-10-22'),
  };

  // Mock credentials (in real app, this would be handled by AWS Cognito or similar)
  private readonly mockCredentials = {
    email: 'admin@adminos.com',
    password: 'admin123',
  };

  /**
   * Simulates AWS Lambda POST request for login
   * Lambda: authenticateUser
   */
  login(request: LoginRequest): Observable<ApiResponse<AuthResponse>> {
    // Validate credentials
    if (
      request.email !== this.mockCredentials.email ||
      request.password !== this.mockCredentials.password
    ) {
      return of({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Email o contraseña incorrectos',
        },
        timestamp: new Date(),
      }).pipe(delay(1000)); // Simulate network delay
    }

    // Update last login
    this.mockUser.lastLogin = new Date();

    // Generate mock tokens (in real app, these would be JWT tokens from AWS Cognito)
    const authResponse: AuthResponse = {
      user: this.mockUser,
      token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({ userId: this.mockUser.id, email: this.mockUser.email }))}`,
      refreshToken: `refresh_${Date.now()}_${Math.random().toString(36)}`,
      expiresIn: 3600, // 1 hour
    };

    return of({
      success: true,
      data: authResponse,
      message: 'Inicio de sesión exitoso',
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 800 + 600));
  }

  /**
   * Simulates AWS Lambda POST request for logout
   * Lambda: logoutUser
   */
  logout(): Observable<ApiResponse<void>> {
    return of({
      success: true,
      message: 'Sesión cerrada exitosamente',
      timestamp: new Date(),
    }).pipe(delay(300));
  }

  /**
   * Simulates AWS Lambda GET request to fetch current user
   * Lambda: getCurrentUser
   */
  getCurrentUser(): Observable<ApiResponse<User>> {
    return of({
      success: true,
      data: this.mockUser,
      message: 'Usuario obtenido exitosamente',
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 400 + 200));
  }

  /**
   * Simulates AWS Lambda POST request to refresh token
   * Lambda: refreshToken
   */
  refreshToken(refreshToken: string): Observable<ApiResponse<AuthResponse>> {
    // In real app, validate refresh token
    const authResponse: AuthResponse = {
      user: this.mockUser,
      token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({ userId: this.mockUser.id, email: this.mockUser.email }))}`,
      refreshToken: `refresh_${Date.now()}_${Math.random().toString(36)}`,
      expiresIn: 3600,
    };

    return of({
      success: true,
      data: authResponse,
      message: 'Token renovado exitosamente',
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 400 + 300));
  }

  /**
   * Simulates AWS Lambda POST request for password reset
   * Lambda: requestPasswordReset
   */
  requestPasswordReset(email: string): Observable<ApiResponse<void>> {
    if (email !== this.mockCredentials.email) {
      return of({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Usuario no encontrado',
        },
        timestamp: new Date(),
      }).pipe(delay(500));
    }

    return of({
      success: true,
      message: 'Email de recuperación enviado',
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 1000 + 800));
  }

  /**
   * Simulates AWS Lambda POST request to reset password
   * Lambda: resetPassword
   */
  resetPassword(
    token: string,
    newPassword: string
  ): Observable<ApiResponse<void>> {
    // In real app, validate reset token
    return of({
      success: true,
      message: 'Contraseña actualizada exitosamente',
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 600 + 400));
  }

  /**
   * Simulates AWS Lambda PUT request to update user profile
   * Lambda: updateUserProfile
   */
  updateProfile(
    userId: string,
    updates: Partial<User>
  ): Observable<ApiResponse<User>> {
    if (userId !== this.mockUser.id) {
      return of({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Usuario no encontrado',
        },
        timestamp: new Date(),
      }).pipe(delay(200));
    }

    const updated = {
      ...this.mockUser,
      ...updates,
      updatedAt: new Date(),
    };
    this.mockUser = updated;

    return of({
      success: true,
      data: updated,
      message: 'Perfil actualizado exitosamente',
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 500 + 300));
  }

  /**
   * Simulates AWS Lambda POST request to validate token
   * Lambda: validateToken
   */
  validateToken(token: string): Observable<ApiResponse<{ valid: boolean; user?: User }>> {
    // In real app, validate JWT token
    return of({
      success: true,
      data: {
        valid: true,
        user: this.mockUser,
      },
      message: 'Token válido',
      timestamp: new Date(),
    }).pipe(delay(Math.random() * 300 + 200));
  }
}
