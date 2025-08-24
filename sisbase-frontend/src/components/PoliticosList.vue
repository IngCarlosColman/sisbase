<template>
  <div ref="scrollContainer">
    <v-card class="my-4">
      <v-card-text>
        <div class="d-flex align-center">
          <v-text-field
            v-model="searchText"
            label="Buscar por nombre, apellido o partido..."
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
            @click="showAllRecords"
          >
            Mostrar Todo
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <v-card class="mb-4">
      <v-card-title>
        Base de Políticos
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="openDialog">
          Agregar Político
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
        <div v-if="isFetchingMore" class="d-flex justify-center my-4">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
        </div>
      </v-card-text>
    </v-card>

    <v-dialog v-model="dialog" max-width="600px">
      <v-card>
        <v-card-title class="text-h5">
          {{ isEditing ? 'Editar Político' : 'Agregar Político' }}
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-form @submit.prevent="submitForm">
              <v-text-field
                v-model="formData.nombres"
                label="Nombres"
                variant="outlined"
                required
              ></v-text-field>
              <v-text-field
                v-model="formData.apellidos"
                label="Apellidos"
                variant="outlined"
                required
              ></v-text-field>
              <v-text-field
                v-model="formData.partido"
                label="Partido"
                variant="outlined"
              ></v-text-field>
              <v-text-field
                v-if="isEditing"
                v-model="formData.cedula"
                label="Cédula"
                variant="outlined"
                :hint="cedulaHint"
                persistent-hint
              ></v-text-field>
              <v-text-field
                v-if="isEditing"
                v-model="formData.telefono"
                label="Teléfono"
                variant="outlined"
                readonly
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
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import axios from 'axios';
import {
  VContainer,
  VCard,
  VCardText,
  VTextField,
  VBtn,
  VForm,
  VDialog,
  VDataTable,
  VCardTitle,
  VSpacer,
  VIcon,
  VCardActions,
  VProgressCircular,
} from 'vuetify/components';

// Estado reactivo para el campo de texto y la búsqueda
const searchText = ref('');
const searchQuery = ref(undefined);
const isSearchDisabled = computed(() => {
  return (searchText.value || '').trim() === '';
});

// NUEVAS VARIABLES para el scroll infinito
const limit = ref(100);
const offset = ref(0);
const isFetchingMore = ref(false);
const hasMoreRecords = ref(true);
const scrollContainer = ref(null);

const API_BASE_URL = 'http://localhost:8000/api/politicos';

// Estado de los datos y de la interfaz
const records = ref([]);
const isLoading = ref(false);
const dialog = ref(false);
const isEditing = ref(false);
const editedId = ref(null);
const noDataText = ref('Presione "Buscar" o "Mostrar Todo" para iniciar la carga de registros.');
const cedulaHint = ref('Ingrese la cédula para buscar el teléfono.');

// Objeto de formulario
const formData = ref({
  nombres: '',
  apellidos: '',
  partido: '',
  cedula: '', // Nuevo campo para la cédula
  telefono: '', // Nuevo campo para el teléfono
});

// Encabezados de la tabla
const headers = ref([
  { title: 'Nombres', key: 'nombres', style: 'min-width: 180px; width: 180px;' },
  { title: 'Apellidos', key: 'apellidos', style: 'min-width: 180px; width: 180px;' },
  { title: 'Partido', key: 'partido', style: 'min-width: 150px; width: 150px;' },
  { title: 'Cédula', key: 'cedula', style: 'min-width: 150px; width: 150px;' },
  { title: 'Teléfono', key: 'telefono', style: 'min-width: 150px; width: 150px;' },
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
  // Al editar, los campos cedula y telefono se inicializan vacíos
  formData.value.cedula = '';
  formData.value.telefono = '';
  dialog.value = true;
};

const closeDialog = () => {
  dialog.value = false;
  resetForm();
};

const resetForm = () => {
  formData.value = {
    nombres: '',
    apellidos: '',
    partido: '',
    cedula: '',
    telefono: '',
  };
};

const submitForm = async () => {
  const url = isEditing.value ? `${API_BASE_URL}/${editedId.value}` : API_BASE_URL;
  const method = isEditing.value ? 'PUT' : 'POST';

  try {
    const dataToSend = { ...formData.value };
    // Si estamos editando y hay una cédula, el backend se encargará de buscar el teléfono
    if (isEditing.value) {
      // El backend necesita la cédula para hacer la búsqueda
      dataToSend.cedula = formData.value.cedula;
    }
    
    await axios({
      method,
      url,
      data: dataToSend,
    });
    
    closeDialog();
    resetStateAndFetch();
  } catch (error) {
    console.error('Error al guardar el registro:', error);
  }
};

const deleteItem = async (id) => {
  if (confirm('¿Estás seguro de que quieres eliminar este registro?')) {
    try {
      await axios.delete(`${API_BASE_URL}/${id}`);
      resetStateAndFetch();
    } catch (error) {
      console.error('Error al eliminar el registro:', error);
    }
  }
};

// Funciones de paginación y búsqueda
const resetStateAndFetch = () => {
  records.value = [];
  offset.value = 0;
  hasMoreRecords.value = true;
  fetchRecords();
};

const fetchRecords = async () => {
  if (!hasMoreRecords.value || isLoading.value || isFetchingMore.value) {
    return;
  }

  if (records.value.length === 0) {
    isLoading.value = true;
  } else {
    isFetchingMore.value = true;
  }
  
  try {
    const params = {
      limit: limit.value,
      offset: offset.value,
    };
    if (searchQuery.value !== undefined) {
      params.search = searchQuery.value;
    }

    const response = await axios.get(API_BASE_URL, { params });
    const newRecords = response.data;
    
    records.value.push(...newRecords);
    offset.value += newRecords.length;
    
    if (newRecords.length < limit.value) {
      hasMoreRecords.value = false;
    }

    if (records.value.length === 0 && searchQuery.value !== undefined) {
      noDataText.value = 'No se encontraron registros.';
    }

  } catch (error) {
    console.error('Error al obtener datos:', error);
    noDataText.value = 'No se pudieron cargar los registros. Por favor, asegúrate de que el servidor está funcionando en la URL: ' + API_BASE_URL;
  } finally {
    isLoading.value = false;
    isFetchingMore.value = false;
  }
};

const triggerSearch = () => {
  searchQuery.value = searchText.value;
  resetStateAndFetch();
};

const showAllRecords = () => {
  searchText.value = '';
  searchQuery.value = '';
  resetStateAndFetch();
};

// Lógica de "observador" para la cédula en el formulario de edición
watch(() => formData.value.cedula, async (newCedula) => {
  if (isEditing.value && newCedula && newCedula.length > 0) {
    try {
      const response = await axios.put(`${API_BASE_URL}/${editedId.value}`, {
        ...formData.value,
        cedula: newCedula,
      });
      // Actualizar el teléfono del formulario con la respuesta del backend
      formData.value.telefono = response.data.telefono || 'No se encontró teléfono.';
    } catch (error) {
      console.error('Error al buscar teléfono:', error);
      formData.value.telefono = 'Error en la búsqueda.';
    }
  }
});

// Lógica de scroll infinito
const handleScroll = () => {
  const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
  
  if (scrollTop + clientHeight >= scrollHeight - 200) {
    fetchRecords();
  }
};

// Ciclo de vida del componente
onMounted(() => {
  window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
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