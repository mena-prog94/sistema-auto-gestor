import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router'; 

import { 
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  IonItem,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonList,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  ToastController,
  AlertController,
  IonSearchbar 
} from '@ionic/angular/standalone'; 

import { addIcons } from 'ionicons';
import { 
  logOutOutline, 
  carOutline, 
  checkmarkCircleOutline, 
  cartOutline, 
  hammerOutline, 
  cubeOutline, 
  searchOutline, 
  pencilOutline, 
  trashOutline,
  logoWhatsapp,
  alertOutline
} from 'ionicons/icons'; 

// Importaciones nativas y modulares de Firebase Firestore y Auth
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { getAuth, signOut } from 'firebase/auth';

@Component({
  selector: 'app-vehiculos',
  standalone: true,
  templateUrl: './vehiculos.page.html',
  styleUrls: ['./vehiculos.page.scss'],
  imports: [
    CommonModule, 
    FormsModule,
    RouterModule, 
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonItem,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonList,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonSearchbar 
  ]
})
export class VehiculosPage implements OnInit {
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);
  private router = inject(Router);

  // Instancias de Firebase vinculadas a AutoGestor
  private db = getFirestore();
  private auth = getAuth();

  vehiculo = {
    marca: '',
    modelo: '',
    anio: null as number | null,
    estado: '',
    parte_afectada: '',
    cliente_nombre: '',
    cliente_telefono: '',
    cliente_dni: '',
    fecha_venta: ''
  };

  vehiculos: any[] = [];
  vehiculosFiltrados: any[] = []; 
  editandoId: any = null; 

  constructor() {
    addIcons({ 
      'log-out-outline': logOutOutline,
      'car-outline': carOutline,
      'checkmark-circle-outline': checkmarkCircleOutline,
      'cart-outline': cartOutline,
      'hammer-outline': hammerOutline,
      'cube-outline': cubeOutline,
      'search-outline': searchOutline,
      'pencil-outline': pencilOutline, 
      'trash-outline': trashOutline,
      'logo-whatsapp': logoWhatsapp,  
      'alert-outline': alertOutline    
    });
  }

  ngOnInit() {
    this.cargarVehiculos();
  }

  /**
   * Carga los vehículos de Firestore en tiempo real usando onSnapshot (sin necesidad de llamadas manuales)
   */
  cargarVehiculos() {
    const vehiculosRef = collection(this.db, 'vehiculos');
    
    onSnapshot(vehiculosRef, (snapshot) => {
      this.vehiculos = snapshot.docs.map(doc => {
        const datos = doc.data();
        // Convertimos el Timestamp de Firebase a un string legible si existe
        const fechaActualizacion = datos['actualizadoEn'] ? datos['actualizadoEn'].toDate().toISOString() : '';
        
        return {
          id: doc.id,
          ...datos,
          fechaActualizacion: fechaActualizacion
        };
      });
      this.vehiculosFiltrados = [...this.vehiculos];
    }, (error) => {
      console.error('Error al escuchar Firestore:', error);
    });
  }

  filtrarVehiculos(event: any) {
    const query = event.target.value?.toLowerCase().trim();
    
    if (!query) {
      this.vehiculosFiltrados = this.vehiculos;
      return;
    }

    this.vehiculosFiltrados = this.vehiculos.filter(v => {
      const marca = v.marca ? v.marca.toLowerCase() : '';
      const modelo = v.modelo ? v.modelo.toLowerCase() : '';
      return marca.includes(query) || modelo.includes(query);
    });
  }

  get totalDisponibles(): number {
    return this.vehiculos.filter(v => v.estado === 'Disponible').length;
  }

  get totalVendidos(): number {
    return this.vehiculos.filter(v => v.estado === 'Vendido').length;
  }

  get totalMantenimiento(): number {
    return this.vehiculos.filter(v => v.estado === 'Mantenimiento').length;
  }

  esMantenimientoRetrasado(fechaActualizacion: string, estado: string): boolean {
    if (estado !== 'Mantenimiento' || !fechaActualizacion) return false;

    const fechaRegistro = new Date(fechaActualizacion);
    const fechaActual = new Date();
    
    const diferenciaTiempo = fechaActual.getTime() - fechaRegistro.getTime();
    const diasEnMantenimiento = Math.floor(diferenciaTiempo / (1000 * 60 * 60 * 24));

    return diasEnMantenimiento > 15;
  }

  enviarMensajeWhatsApp(v: any) {
    if (!v.cliente_telefono || v.estado !== 'Mantenimiento') return;

    let telefonoLimpio = v.cliente_telefono.replace(/\D/g, '');

    if (!telefonoLimpio.startsWith('1') && telefonoLimpio.length === 10) {
      telefonoLimpio = '1' + telefonoLimpio;
    }

    const mensaje = `Hola ${v.cliente_nombre}, le saludamos de AutoGestor. Le informamos que su vehículo ${v.marca} ${v.modelo} ya se encuentra listo.`;
    const mensajeCodificado = encodeURIComponent(mensaje);

    const urlWhatsApp = `https://wa.me/${telefonoLimpio}?text=${mensajeCodificado}`;
    window.open(urlWhatsApp, '_blank');
  }

  async confirmarSalida() {
    const alert = await this.alertCtrl.create({
      header: 'Cerrar Sesión',
      message: '¿Estás seguro de que deseas salir del sistema?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Salir',
          role: 'confirm',
          handler: async () => {
            try {
              await signOut(this.auth);
              this.router.navigate(['/login']);
            } catch (error) {
              console.error('Error al cerrar sesión:', error);
            }
          }
        }
      ]
    });
    await alert.present();
  }

  prepararEdicion(v: any) {
    this.editandoId = v.id; 
    // Clonamos el objeto excluyendo propiedades calculadas dinámicamente como la fecha
    this.vehiculo = {
      marca: v.marca || '',
      modelo: v.modelo || '',
      anio: v.anio || null,
      estado: v.estado || '',
      parte_afectada: v.parte_afectada || '',
      cliente_nombre: v.cliente_nombre || '',
      cliente_telefono: v.cliente_telefono || '',
      cliente_dni: v.cliente_dni || '',
      fecha_venta: v.fecha_venta || ''
    }; 
    
    const content = document.querySelector('ion-content');
    if (content) content.scrollToTop(500);
  }

  cancelarEdicion() {
    this.editandoId = null;
    this.limpiarFormulario();
  }

  limpiarFormulario() {
    this.vehiculo = { 
      marca: '', modelo: '', anio: null, estado: '', 
      parte_afectada: '', cliente_nombre: '', 
      cliente_telefono: '', cliente_dni: '', fecha_venta: '' 
    };
  }

  /**
   * Guarda o actualiza los datos del vehículo directamente en Cloud Firestore usando Promesas
   */
  async guardarVehiculo() {
    const marca = this.vehiculo.marca?.trim();
    const modelo = this.vehiculo.modelo?.trim();
    const anio = this.vehiculo.anio;
    const estado = this.vehiculo.estado;
    const cliente = this.vehiculo.cliente_nombre?.trim();

    if (!marca || !modelo || !anio || !estado || !cliente) {
      const toast = await this.toastCtrl.create({
        message: 'Por favor completa todos los campos obligatorios antes de guardar ⚠️',
        duration: 2000,
        color: 'warning'
      });
      await toast.present();
      return;
    }

    try {
      if (this.editandoId) {
        // ACTUALIZAR DOCUMENTO EXISTENTE EN FIRESTORE
        const vehiculoDocRef = doc(this.db, 'vehiculos', this.editandoId);
        await updateDoc(vehiculoDocRef, {
          ...this.vehiculo,
          actualizadoEn: serverTimestamp() // Genera la marca de tiempo del servidor para el cálculo de mantenimiento
        });

        this.presentarToast('Vehículo actualizado correctamente ✅', 'success');
        this.editandoId = null;
      } else {
        // CREAR NUEVO DOCUMENTO (Se genera la colección automáticamente si no existe)
        const vehiculosRef = collection(this.db, 'vehiculos');
        await addDoc(vehiculosRef, {
          ...this.vehiculo,
          actualizadoEn: serverTimestamp()
        });

        this.presentarToast('Vehículo registrado correctamente ✅', 'success');
      }

      this.limpiarFormulario();

    } catch (error) {
      console.error('Error al guardar en Firestore:', error);
      this.presentarToast('Ocurrió un error al guardar el vehículo ❌', 'danger');
    }
  }

  /**
   * Elimina un documento por su ID de Firestore
   */
  async eliminarVehiculo(id: any) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar Registro',
      message: '¿Estás completamente seguro de eliminar este vehículo? Esta acción no se puede deshacer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            try {
              const vehiculoDocRef = doc(this.db, 'vehiculos', id);
              await deleteDoc(vehiculoDocRef);

              this.presentarToast('Vehículo eliminado con éxito 🗑️', 'success');
              if (this.editandoId === id) this.cancelarEdicion();
            } catch (error) {
              console.error('Error al eliminar de Firestore:', error);
              this.presentarToast('No se pudo eliminar el registro ❌', 'danger');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  // Helper interno para reutilizar los mensajes Toast rápidamente
  private async presentarToast(mensaje: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 2000,
      color: color,
      position: 'bottom'
    });
    await toast.present();
  }
}