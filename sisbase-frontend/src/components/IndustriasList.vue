<template>
  <div>
    <v-card class="my-4">
      <v-card-text>
        <div class="d-flex align-center">
          <v-text-field
            v-model="searchText"
            label="Buscar por razón social, actividad, departamento o ciudad..."
            prepend-inner-icon="mdi-magnify"
            clearable
            hide-details
            variant="outlined"
            class="mb-4"
            @keyup.enter="triggerSearch"
          ></v-text-field>
          <v-btn
            color="primary"
            height="56"
            class="mb-4 ml-4"
            @click="triggerSearch"
            :disabled="isSearchDisabled"
          >
            Buscar
          </v-btn>
          <v-btn
            color="secondary"
            height="56"
            class="mb-4 ml-4"
            @click="showAll"
          >
            Mostrar Todo
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <v-card class="mb-4">
      <v-card-title>
        Base de Industrias
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="openDialog">
          Agregar Industria
        </v-btn>
      </v-card-title>
    </v-card>

    <v-card>
      <v-card-text>
        <div style="overflow-x: auto;">
          <v-data-table
            :headers="headers"
            :items="records"
            :loading="isLoading"
            :items-per-page="-1"
            hide-default-footer
            :density="'compact'"
            class="elevation-1"
          >
            <template v-slot:no-data>
              <div class="pa-4 text-center">
                {{ noDataText }}
              </div>
            </template>
            
            <template v-slot:item.actions="{ item }">
              <v-icon small class="mr-2" @click="editItem(item)">
                mdi-pencil
              </v-icon>
              <v-icon small @click="deleteItem(item.id)">
                mdi-delete
              </v-icon>
            </template>
          </v-data-table>
        </div>
      </v-card-text>
    </v-card>

    <div v-if="loadingMore" class="d-flex justify-center my-4">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>

    <v-dialog v-model="dialog" max-width="600px">
      <v-card>
        <v-card-title class="text-h5">
          {{ isEditing ? 'Editar Industria' : 'Agregar Industria' }}
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-form @submit.prevent="submitForm">
              <v-text-field
                v-model="formData.razon_social"
                label="Razón Social"
                variant="outlined"
                required
              ></v-text-field>
              <v-text-field
                v-model="formData.telefonos"
                label="Teléfonos"
                variant="outlined"
              ></v-text-field>
              <v-text-field
                v-model="formData.email"
                label="Email"
                variant="outlined"
              ></v-text-field>
              <v-text-field
                v-model="formData.actividad"
                label="Actividad"
                variant="outlined"
              ></v-text-field>
              <v-text-field
                v-model="formData.direccion"
                label="Dirección"
                variant="outlined"
              ></v-text-field>
              <v-text-field
                v-model="formData.departamento"
                label="Departamento"
                variant="outlined"
              ></v-text-field>
              <v-text-field
                v-model="formData.ciudad"
                label="Ciudad"
                variant="outlined"
              ></v-text-field>
            </v-form>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="red-darken-1" variant="text" @click="closeDialog">
            Cancelar
          </v-btn>
          <v-btn color="green-darken-1" variant="text" @click="submitForm">
            Guardar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue';
import axios from 'axios';
import {
  VContainer,
  VCard,
  VCardText,
  VTextField,
  VBtn,
  VRow,
  VCol,
  VForm,
  VDialog,
  VDataTable,
  VCardTitle,
  VSpacer,
  VIcon,
  VCardActions,
  VProgressCircular
} from 'vuetify/components';

// Estado reactivo para el campo de texto y la búsqueda
const searchText = ref('');
const searchQuery = ref('');

// Propiedad computada para habilitar/deshabilitar el botón de búsqueda
const isSearchDisabled = computed(() => {
  return (searchText.value || '').trim() === '';
});

// Función para actualizar el estado de búsqueda y disparar la llamada a la API
const triggerSearch = () => {
  searchQuery.value = searchText.value;
  fetchRecords(searchQuery.value, true);
};

const showAll = () => {
  searchText.value = '';
  searchQuery.value = '';
  fetchRecords('', true);
};

const API_BASE_URL = 'http://localhost:8000/api/industrias';
const RECORDS_PER_PAGE = 15;

// Estado de los datos y de la interfaz
const records = ref([]);
const isLoading = ref(false);
const loadingMore = ref(false);
const hasMoreRecords = ref(true);
const dialog = ref(false);
const isEditing = ref(false);
const editedId = ref(null);
const noDataText = ref('No hay registros para mostrar. Por favor, realiza una búsqueda o haz clic en "Mostrar Todo".');

// Objeto de formulario adaptado a la estructura del back-end
const formData = ref({
  razon_social: '',
  telefonos: '',
  email: '',
  actividad: '',
  direccion: '',
  departamento: '',
  ciudad: '',
});

// Encabezados de la tabla adaptados a la estructura del back-end
const headers = ref([
  { title: 'Razón Social', key: 'razon_social', style: 'min-width: 200px; width: 200px;' },
  { title: 'Teléfonos', key: 'telefonos', style: 'min-width: 200px; width: 200px;' },
  { title: 'Actividad', key: 'actividad', style: 'min-width: 200px; width: 200px;' },
  { title: 'Dirección', key: 'direccion', style: 'min-width: 200px; width: 200px;' },
  { title: 'Departamento', key: 'departamento', style: 'min-width: 200px; width: 200px;' },
  { title: 'Ciudad', key: 'ciudad', style: 'min-width: 200px; width: 200px;' },
  { title: 'Email', key: 'email', style: 'min-width: 200px; width: 200px;' },
  { title: 'Acciones', key: 'actions', sortable: false, style: 'min-width: 100px; width: 100px;' },
]);

// Funciones de CRUD
const openDialog = () => {
  isEditing.value = false;
  editedId.value = null;
  resetForm();
  dialog.value = true;
};

const editItem = (item) => {
  isEditing.value = true;
  editedId.value = item.id;
  Object.assign(formData.value, item);
  dialog.value = true;
};

const closeDialog = () => {
  dialog.value = false;
  resetForm();
};

const resetForm = () => {
  formData.value = {
    razon_social: '',
    telefonos: '',
    email: '',
    actividad: '',
    direccion: '',
    departamento: '',
    ciudad: '',
  };
};

const submitForm = async () => {
  const url = isEditing.value ? `${API_BASE_URL}/${editedId.value}` : API_BASE_URL;
  const method = isEditing.value ? 'PUT' : 'POST';

  try {
    await axios({
      method,
      url,
      data: formData.value,
    });
    
    closeDialog();
    fetchRecords(searchQuery.value, true);
  } catch (error) {
    console.error('Error al guardar el registro:', error);
  }
};

const deleteItem = async (id) => {
  if (confirm('¿Estás seguro de que quieres eliminar esta industria?')) {
    try {
      await axios.delete(`${API_BASE_URL}/${id}`);
      fetchRecords(searchQuery.value, true);
    } catch (error) {
      console.error('Error al eliminar el registro:', error);
    }
  }
};

const fetchRecords = async (search = '', reset = false) => {
  if (reset) {
    records.value = [];
    hasMoreRecords.value = true;
    isLoading.value = true;
    noDataText.value = 'Buscando registros...'; // Mensaje de carga
  } else {
    loadingMore.value = true;
  }
  
  const offset = records.value.length;
  
  try {
    const response = await axios.get(`${API_BASE_URL}?search=${search}&limit=${RECORDS_PER_PAGE}&offset=${offset}`);
    const newRecords = response.data;
    
    if (newRecords.length < RECORDS_PER_PAGE) {
      hasMoreRecords.value = false;
    }
    
    records.value.push(...newRecords);

    if (records.value.length === 0) {
      noDataText.value = 'No se encontraron registros.';
    }

  } catch (error) {
    console.error('Error al obtener datos:', error);
    noDataText.value = 'No se pudieron cargar los registros. Por favor, asegúrate de que el servidor está funcionando en la URL: ' + API_BASE_URL;
    hasMoreRecords.value = false;
  } finally {
    isLoading.value = false;
    loadingMore.value = false;
  }
};

const handleScroll = () => {
  if (!loadingMore.value && hasMoreRecords.value) {
    const bottomOfPage = window.innerHeight + window.scrollY >= document.documentElement.offsetHeight - 50;
    if (bottomOfPage) {
      fetchRecords(searchQuery.value);
    }
  }
};

watch(searchText, (newValue) => {
  if (newValue === '') {
    searchQuery.value = '';
    // La línea que cargaba la tabla al borrar el texto ahora está comentada.
    // fetchRecords('', true);
  }
});


onMounted(() => {
  window.addEventListener('scroll', handleScroll);
  // Eliminamos la llamada inicial.
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<style scoped>
.d-flex {
  display: flex;
}
.align-center {
  align-items: center;
}
.ml-4 {
  margin-left: 16px;
}
.justify-center {
  justify-content: center;
}
</style>