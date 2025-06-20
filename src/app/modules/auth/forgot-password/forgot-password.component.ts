import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule]
})
export class ForgotPasswordComponent implements OnInit {
  forgotPasswordForm!: FormGroup;
  submitted = false;
  loading = false;
  success = false;
  errorMessage = '';

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.forgotPasswordForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  // Getter para un acceso fácil a los campos del formulario
  get f() {
    return this.forgotPasswordForm.controls;
  }

  onSubmit(): void {
    this.submitted = true;
    this.success = false;
    this.errorMessage = '';

    // Si el formulario es inválido, detenemos aquí
    if (this.forgotPasswordForm.invalid) {
      return;
    }

    this.loading = true;
    const email = this.f['email'].value;

    this.authService.forgotPassword(email)
      .subscribe({
        next: (response) => {
          this.success = true;
          this.loading = false;
          // Resetear el formulario
          this.forgotPasswordForm.reset();
          this.submitted = false;
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Ocurrió un error al procesar tu solicitud.';
          this.loading = false;
        }
      });
  }

  backToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
} 