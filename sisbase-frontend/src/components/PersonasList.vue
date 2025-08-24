<template>
  <v-container>
    <v-card class="mb-4">
      <v-card-title>
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="openDialog">
          Agregar Datos
        </v-btn>
        Base Complementaria
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
                    v-model="formData.nombre"
                    label="Nombre"
                    required
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="formData.contacto"
                    label="Contacto"
                  ></v-text-field>
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="formData.ci"
                    label="CI"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="formData.tel"
                    label="Teléfono"
                  ></v-text-field>
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="formData.fax"
                    label="Fax"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
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
  </v-container>
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

const API_BASE_URL = 'http://localhost:8000/api/personas';

const allRecords = ref([]);
const isLoading = ref(false);
const dialog = ref(false);
const isEditing = ref(false);
const editedId = ref(null);
const noDataText = ref('No hay datos de personas disponibles.');

const formData = ref({
  nombre: '',
  contacto: '',
  ci: '',
  tel: '',
  fax: '',
  celular: '',
});

const headers = ref([
  { title: 'Nombre', key: 'nombre' },
  { title: 'Contacto', key: 'contacto' },
  { title: 'CI', key: 'ci' },
  { title: 'Teléfono', key: 'tel' },
  { title: 'Fax', key: 'fax' },
  { title: 'Celular', key: 'celular' },
  { title: 'Acciones', key: 'actions', sortable: false },
]);

// Lógica de Paginación
const page = ref(1);
const itemsPerPage = ref(5);

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
    nombre: '',
    contacto: '',
    ci: '',
    telefono: '',
    fax: '',
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
    noDataText.value = 'No hay datos de personas disponibles.';
  }
});
</script> 