import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController, AlertController } from '@ionic/angular'; 
import { addIcons } from 'ionicons';
import { alertCircleOutline, layersOutline, locationOutline, chevronBackOutline, addOutline, pencilOutline, trashOutline } from 'ionicons/icons';

// Importaciones nativas y modulares de Firebase Firestore
import { getFirestore, collection, onSnapshot, doc, deleteDoc } from 'firebase/firestore';

@Component({
  selector: 'app-piezas',
  templateUrl: './piezas.page.html',
  styleUrls: ['./piezas.page.scss'],
  standalone: true, 
  imports: [
    CommonModule, 
    IonicModule
  ]
})
export class PiezasPage implements OnInit {
  piezas: any[] = [];
  piezasFiltradas: any[] = []; // Arreglo para manejar búsquedas locales fluidas
  cargando: boolean = false;

  // Instancia de la base de datos de Firebase
  private db = getFirestore();

  // Inyecciones modernas usando inject()
  private navCtrl = inject(NavController);
  private alertCtrl = inject(AlertController);

  constructor() {
    addIcons({
      'chevron-back-outline': chevronBackOutline,
      'alert-circle-outline': alertCircleOutline,
      'layers-outline': layersOutline,
      'location-outline': locationOutline,
      'add-outline': addOutline,
      'pencil-outline': pencilOutline, 
      'trash-outline': trashOutline
    });
  }

  ngOnInit() {
    this.obtenerPiezas();
  }

  /**
   * Escucha la colección 'piezas' en tiempo real desde Firestore
   */
  obtenerPiezas() {
    this.cargando = true;
    const piezasRef = collection(this.db, 'piezas');

    // onSnapshot mantiene sincronizada la app automáticamente con la nube
    onSnapshot(piezasRef, (snapshot) => {
      this.piezas = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Inicializar el filtro con todos los componentes obtenidos
      this.piezasFiltradas = [...this.piezas];
      this.cargando = false;
    }, (error) => {
      console.error('Error al conectar con Firestore en AutoGestor:', error);
      this.cargando = false;
    });
  }

  /**
   * Filtra las piezas localmente de forma instantánea sin re-consultar la base de datos
   */
  buscarPiezas(event: any) {
    const termino = event.target.value?.toLowerCase().trim() || '';

    if (!termino) {
      this.piezasFiltradas = this.piezas;
      return;
    }

    this.piezasFiltradas = this.piezas.filter(pieza => {
      const nombre = pieza.nombre ? pieza.nombre.toLowerCase() : '';
      const codigo = pieza.codigo ? pieza.codigo.toLowerCase() : '';
      const categoria = pieza.categoria ? pieza.categoria.toLowerCase() : '';
      
      return nombre.includes(termino) || codigo.includes(termino) || categoria.includes(termino);
    });
  }

  abrirModalAgregar() {
    this.navCtrl.navigateForward('/agregar-pieza');
  }

  /**
   * Redirige a la vista de edición compartiendo la pieza mediante el state de navegación
   */
  editarPieza(pieza: any) {
    this.navCtrl.navigateForward('/agregar-pieza', {
      state: { piezaEditar: pieza }
    });
  }

  /**
   * Elimina un componente directamente de la colección en Firebase
   */
  async eliminarPieza(id: any) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar Componente',
      message: '¿Estás seguro de que deseas retirar esta pieza permanentemente del almacén?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            try {
              // Eliminar el documento por su ID único de Firestore
              const piezaDocRef = doc(this.db, 'piezas', id);
              await deleteDoc(piezaDocRef);
              // Nota: No hace falta volver a llamar a obtenerPiezas(), onSnapshot detecta el cambio solo.
            } catch (error) {
              console.error('Error al intentar eliminar la pieza de Firestore:', error);
            }
          }
        }
      ]
    });
    await alert.present();
  }
}