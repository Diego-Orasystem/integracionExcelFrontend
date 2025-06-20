import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login-with-code',
  templateUrl: './login-with-code.component.html',
  styleUrls: ['./login-with-code.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule]
})
export class LoginWithCodeComponent implements OnInit {
  step: 'email' | 'code' = 'email';
  emailForm!: FormGroup;
  codeForm!: FormGroup;
  loading = false;
  error = '';
  email = '';
  successMessage = '';

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.emailForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.codeForm = this.formBuilder.group({
      code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6), Validators.pattern('^[0-9]*$')]]
    });
  }

  // Solicitar código de verificación
  onRequestCode(): void {
    if (this.emailForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = '';
    this.email = this.emailForm.value.email;

    this.authService.requestLoginCode(this.email).subscribe({
      next: (response) => {
        this.loading = false;
        this.step = 'code';
        this.successMessage = 'Código enviado correctamente. Revisa tu correo electrónico.';
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Error al solicitar el código. Intenta de nuevo.';
      }
    });
  }

  // Verificar código e iniciar sesión
  onVerifyCode(): void {
    if (this.codeForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = '';
    const code = this.codeForm.value.code;

    this.authService.verifyLoginCode(this.email, code).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Código inválido o expirado. Intenta de nuevo.';
      }
    });
  }

  // Cambiar de paso (volver a ingresar email)
  changeEmail(): void {
    this.step = 'email';
    this.error = '';
    this.successMessage = '';
  }

  // Reenviar código
  resendCode(): void {
    this.loading = true;
    this.error = '';
    this.successMessage = '';

    this.authService.requestLoginCode(this.email).subscribe({
      next: (response) => {
        this.loading = false;
        this.successMessage = 'Código reenviado correctamente. Revisa tu correo electrónico.';
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Error al reenviar el código. Intenta de nuevo.';
      }
    });
  }
} 