import { Injectable } from '@angular/core';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail, 
  signOut 
} from 'firebase/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Obtener la instancia de autenticación de Firebase
  private auth = getAuth();

  constructor() { }

  /**
   * Inicia sesión con Firebase Auth
   */
  login(correo: string, clave: string) {
    return signInWithEmailAndPassword(this.auth, correo, clave);
  }

  /**
   * Envía un enlace de restablecimiento oficial de Firebase al correo
   */
  recuperarClave(correo: string) {
    return sendPasswordResetEmail(this.auth, correo);
  }
  
  /**
   * Registra un nuevo usuario con correo y contraseña
   */
  registrarUsuario(correo: string, contrasenia: string) {
    return createUserWithEmailAndPassword(this.auth, correo, contrasenia);
  }

  /**
   * Cierra la sesión activa
   */
  cerrarSesion() {
    return signOut(this.auth);
  }
}