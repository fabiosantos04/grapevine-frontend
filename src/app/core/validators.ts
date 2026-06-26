import { AbstractControl, ValidationErrors } from '@angular/forms';

// Email con regex estricto
export function emailValidator(control: AbstractControl): ValidationErrors | null {
  const regex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/i;
  return regex.test(control.value ?? '') ? null : { invalidEmail: true };
}

// Contraseña fuerte: mínimo 8 chars, mayúscula, minúscula, número y símbolo
export function strongPasswordValidator(control: AbstractControl): ValidationErrors | null {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_\-#])[A-Za-z\d@$!%*?&_\-#]{8,20}$/;
  return regex.test(control.value ?? '') ? null : { weakPassword: true };
}

// Que las contraseñas coincidan (se aplica al FormGroup)
export function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const newPass     = control.get('newPassword');
  const confirmPass = control.get('confirmPassword');
  if (!newPass || !confirmPass) return null;
  return newPass.value === confirmPass.value ? null : { passwordMismatch: true };
}

// Solo dígitos, sin todos iguales (para DNI, RUC, teléfono)
export function noSameDigitsValidator(control: AbstractControl): ValidationErrors | null {
  const val = control.value ?? '';
  if (!/^\d+$/.test(val)) return { onlyDigits: true };
  if (/^(\d)\1+$/.test(val)) return { sameDigits: true };
  return null;
}

// Longitudes por tipo de documento
export function documentLengthValidator(tipoGetter: () => string) {
  return (control: AbstractControl): ValidationErrors | null => {
    const val  = (control.value ?? '').toString();
    const tipo = tipoGetter();
    if (tipo === 'DNI' && val.length !== 8)  return { docLength: 'El DNI debe tener 8 dígitos' };
    if (tipo === 'RUC' && val.length !== 11) return { docLength: 'El RUC debe tener 11 dígitos' };
    if (tipo === 'CE'  && (val.length < 9 || val.length > 12)) return { docLength: 'El CE debe tener entre 9 y 12 dígitos' };
    return null;
  };
}