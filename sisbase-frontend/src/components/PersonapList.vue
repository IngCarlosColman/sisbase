<template>
  <div>
    <v-card class="mb-4">
      <v-card-title>
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="openDialog">
          Agregar Datos
        </v-btn>
         Base Principal
      </v-card-title>
    </v-card>

    <v-card>
      <v-card-text>
        <v-data-table
          v-model:items-per-page="itemsPerPage"
          :headers="headers"
          :items="paginatedRecords"
          :loading="isLoading"
          :no-data-text="noDataText"
          :density="'compact'"
          class="elevation-1"
        >
          <template v-slot:item.actions="{ item }">
            <v-icon small class="mr-2" @click="editItem(item)">
              mdi-pencil
            </v-icon>
            <v-icon small @click="deleteItem(item.id)">
              mdi-delete
            </v-icon>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <v-pagination
      v-model="page"
      :length="totalPages"
      :total-visible="5"
    ></v-pagination>

    <v-dialog v-model="dialog" max-width="600px">
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ isEditing ? 'Editar Persona' : 'Agregar Nueva Persona' }}</span>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-form @submit.prevent="submitForm">
              <v-row>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="formData.nombre1"
                    label="Primer Nombre"
                    required
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="formData.nombre2"
                    label="Segundo Nombre"
                  ></v-text-field>
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="formData.apellido1"
                    label="Primer Apellido"
                    required
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="formData.apellido2"
                    label="Segundo Apellido"
                  ></v-text-field>
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="formData.documento"
                    label="Documento"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="formData.telefono"
                    label="Teléfono"
                  ></v-text-field>
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12">
                  <v-text-field
                    v-model="formData.celular"
                    label="Celular"
                  ></v-text-field>
                </v-col>
              </v-row>
            </v-form>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-2" text @click="closeDialog">Cancelar</v-btn>
          <v-btn color="primary" text @click="submitForm">Guardar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import axios from 'axios';

const props = defineProps({
  searchQuery: {
    type: String,
    default: ''
  }
});

const API_BASE_URL = 'http://localhost:8000/api/personap';

const allRecords = ref([]);
const isLoading = ref(false);
const dialog = ref(false);
const isEditing = ref(false);
const editedId = ref(null);
const noDataText = ref('No hay registros para mostrar. Por favor, realiza una búsqueda.');

const formData = ref({
  nombre1: '',
  nombre2: '',
  apellido1: '',
  apellido2: '',
  documento: '',
  telefono: '',
  celular: '',
});

const headers = ref([
  { title: 'Documento', key: 'documento' },
  { title: 'Primer Nombre', key: 'nombre1' },
  { title: 'Segundo Nombre', key: 'nombre2' },
  { title: 'Primer Apellido', key: 'apellido1' },
  { title: 'Segundo Apellido', key: 'apellido2' },
  { title: 'Teléfono', key: 'telefono' },
  { title: 'Celular', key: 'celular' },
  { title: 'Acciones', key: 'actions', sortable: false },
]);

// Lógica de Paginación
const page = ref(1);
const itemsPerPage = ref(5); // Ahora es una variable reactiva

const paginatedRecords = computed(() => {
  const start = (page.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return allRecords.value.slice(start, end);
});

const totalPages = computed(() => {
  return Math.ceil(allRecords.value.length / itemsPerPage.value);
});

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
    nombre1: '',
    nombre2: '',
    apellido1: '',
    apellido2: '',
    documento: '',
    telefono: '',
    celular: '',
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
    fetchRecords(props.searchQuery);
  } catch (error) {
    console.error('Error al guardar el registro:', error);
  }
};

const deleteItem = async (id) => {
  if (confirm('¿Estás seguro de que quieres eliminar este registro?')) {
    try {
      await axios.delete(`${API_BASE_URL}/${id}`);
      fetchRecords(props.searchQuery);
    } catch (error) {
      console.error('Error al eliminar el registro:', error);
    }
  }
};

const fetchRecords = async (search = '') => {
  isLoading.value = true;
  try {
    const response = await axios.get(`${API_BASE_URL}?search=${search}`);
    allRecords.value = response.data;
    noDataText.value = 'No se encontraron registros.';
  } catch (error) {
    console.error('Error al obtener datos:', error);
    allRecords.value = [];
    noDataText.value = 'Error al cargar los registros.';
  } finally {
    isLoading.value = false;
  }
};

watch(() => props.searchQuery, (newQuery) => {
  page.value = 1;
  if (newQuery) {
    fetchRecords(newQuery);
  } else {
    allRecords.value = [];
    noDataText.value = 'No hay registros para mostrar. Por favor, realiza una búsqueda.';
  }
});
</script>