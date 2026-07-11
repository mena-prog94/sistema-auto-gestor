import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonicModule, ModalController, ToastController, NavController } from '@ionic/angular'; 
import { Router } from '@angular/router'; 
import { addIcons } from 'ionicons';
import { buildOutline, chevronBackOutline, cloudUploadOutline } from 'ionicons/icons';

// Importaciones nativas de Firebase Firestore
import { getFirestore, collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

@Component({
  selector: 'app-agregar-pieza',
  templateUrl: './agregar-pieza.page.html',
  styleUrls: ['./agregar-pieza.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule]
})
export class AgregarPiezaPage implements OnInit {
  piezaForm!: FormGroup;
  guardando: boolean = false;
  
  // Propiedades para controlar el comportamiento de edición
  esModoEdicion: boolean = false;
  idPieza: any = null;

  // Instancia de la base de datos de Firebase
  private db = getFirestore();

  // Inyecciones modernas usando inject()
  private fb = inject(FormBuilder);
  private modalCtrl = inject(ModalController);
  private toastCtrl = inject(ToastController);
  private navCtrl = inject(NavController);
  private router = inject(Router);

  constructor() {
    addIcons({ buildOutline, chevronBackOutline, cloudUploadOutline });
    
    // Capturar los datos enviados por la navegación antes de que cargue la vista
    const navegacion = this.router.getCurrentNavigation();
    if (navegacion && navegacion.extras.state && navegacion.extras.state['piezaEditar']) {
      const pieza = navegacion.extras.state['piezaEditar'];
      this.esModoEdicion = true;
      this.idPieza = pieza.id;
    }
  }

  ngOnInit() {
    this.initForm();

    // Si estamos editando, rellenamos el formulario inmediatamente con los datos capturados
    if (this.esModoEdicion) {
      this.cargarDatosEdicion();
    }
  }

  initForm() {
    this.piezaForm = this.fb.group({
      codigo: ['', [Validators.required, Validators.pattern('^[a-zA-Z0-9-]+$')]],
      nombre: ['', [Validators.required]],
      categoria: ['', [Validators.required]],
      stock: [0, [Validators.required, Validators.min(0)]],
      precio: [0.00, [Validators.required, Validators.min(0.01)]],
      ubicacion_almacen: ['', [Validators.required]]
    });
  }

  cargarDatosEdicion() {
    // Recuperamos los parámetros guardados en el historial de navegación
    const pieza = history.state?.piezaEditar;
    if (pieza) {
      this.piezaForm.patchValue({
        codigo: pieza.codigo,
        nombre: pieza.nombre,
        categoria: pieza.categoria,
        stock: pieza.stock,
        precio: pieza.precio,
        ubicacion_almacen: pieza.ubicacion_almacen
      });
    }
  }

  isValid(campo: string): boolean | null {
    return this.piezaForm.get(campo)!.touched && this.piezaForm.get(campo)!.invalid;
  }

  /**
   * Guarda o actualiza la pieza directamente en la colección 'piezas' de Firestore
   */
  async guardarPieza() {
    if (this.piezaForm.invalid) {
      this.piezaForm.markAllAsTouched();
      return;
    }

    this.guardando = true;

    try {
      if (this.esModoEdicion) {
        // ACTUALIZAR DOCUMENTO EN FIRESTORE
        const piezaDocRef = doc(this.db, 'piezas', this.idPieza);
        await updateDoc(piezaDocRef, {
          ...this.piezaForm.value,
          actualizadoEn: serverTimestamp()
        });

        this.mostrarToast('Componente actualizado exitosamente en Firebase. ✅', 'success');
      } else {
        // CREAR NUEVO DOCUMENTO EN FIRESTORE (Se genera la colección 'piezas' automáticamente)
        const piezasCollectionRef = collection(this.db, 'piezas');
        await addDoc(piezasCollectionRef, {
          ...this.piezaForm.value,
          creadoEn: serverTimestamp(),
          actualizadoEn: serverTimestamp()
        });

        this.mostrarToast('Componente almacenado exitosamente en Firebase. ✅', 'success');
      }

      this.guardando = false;
      this.regresarRuta();

    } catch (error: any) {
      this.guardando = false;
      console.error('Error al guardar pieza en Firestore:', error);
      this.mostrarToast('Error al conectar con Firestore: ' + (error.message || error), 'danger');
    }
  }

  async mostrarToast(msg: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: msg,
      duration: 2500,
      color: color,
      position: 'bottom'
    });
    await toast.present();
  }

  // Método unificado para salir de la pantalla limpiamente
  regresarRuta() {
    // Si se usó en formato modal lo destruye
    this.modalCtrl.dismiss({ actualizado: true }).catch(() => {
      // Si no era un modal, vuelve de forma nativa a la lista de piezas
      this.navCtrl.navigateBack('/piezas');
    });
  }

  cerrar() {
    this.modalCtrl.dismiss({ actualizado: false }).catch(() => {
      this.navCtrl.navigateBack('/piezas');
    });
  }
}