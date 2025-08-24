<template>
  <div ref="scrollContainer">
    <v-card class="mb-4">
      <v-card-title>
        {{ cardTitle }}
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="openDialog">
          Agregar
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
            style="min-width: 100%;"
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
          {{ isEditing ? 'Editar Registro' : 'Agregar Registro' }}
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-form @submit.prevent="submitForm">
              <!-- Renderiza los campos de forma dinámica -->
              <v-text-field
                v-for="field in formFields"
                :key="field.key"
                v-model="formData[field.key]"
                :label="field.label"
                variant="outlined"
                :required="field.required"
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

const props = defineProps({
  apiEndpoint: { type: String, required: true },
  cardTitle: { type: String, required: true },
  searchQuery: { type: String, default: '' },
  tableHeaders: { type: Array, required: true },
  formFields: { type: Array, required: true },
});

// Variables para el scroll infinito
const limit = ref(100);
const offset = ref(0);
const isFetchingMore = ref(false);
const hasMoreRecords = ref(true);
const scrollContainer = ref(null);

// Estado de los datos y de la interfaz
const records = ref([]);
const isLoading = ref(false);
const dialog = ref(false);
const isEditing = ref(false);
const editedId = ref(null);
const noDataText = ref('Presiona el botón "Mostrar Todo" o busca un registro.');

// Objeto de formulario
const formData = ref({});

// Encabezados de la tabla
const headers = computed(() => {
  // Asegurarse de que el objeto de acciones esté presente en los encabezados
  const actionHeader = { title: 'Acciones', key: 'actions', sortable: false };
  if (!props.tableHeaders.some(h => h.key === 'actions')) {
    return [...props.tableHeaders, actionHeader];
  }
  return props.tableHeaders;
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
  // Limpiar el formData antes de copiar los datos para evitar errores
  resetForm();
  Object.assign(formData.value, item);
  dialog.value = true;
};

const closeDialog = () => {
  dialog.value = false;
  resetForm();
};

const resetForm = () => {
  const newFormData = {};
  props.formFields.forEach(field => {
    newFormData[field.key] = '';
  });
  formData.value = newFormData;
};

const submitForm = async () => {
  const url = isEditing.value ? `${props.apiEndpoint}/${editedId.value}` : props.apiEndpoint;
  const method = isEditing.value ? 'PUT' : 'POST';

  try {
    await axios({
      method,
      url,
      data: formData.value,
    });
    
    closeDialog();
    // Limpiar y cargar desde el inicio después de un CRUD
    resetStateAndFetch();
  } catch (error) {
    console.error('Error al guardar el registro:', error);
  }
};

const deleteItem = async (id) => {
  if (confirm('¿Estás seguro de que quieres eliminar este registro?')) {
    try {
      await axios.delete(`${props.apiEndpoint}/${id}`);
      // Limpiar y cargar desde el inicio después de un CRUD
      resetStateAndFetch();
    } catch (error) {
      console.error('Error al eliminar el registro:', error);
    }
  }
};

// Función para reiniciar el estado de paginación
const resetStateAndFetch = () => {
  records.value = [];
  offset.value = 0;
  hasMoreRecords.value = true;
  fetchRecords();
};

// Función para obtener los registros con paginación
const fetchRecords = async () => {
  if (!hasMoreRecords.value || isLoading.value || isFetchingMore.value) {
    return;
  }

  if (records.value.length === 0) {
    isLoading.value = true;
    noDataText.value = 'Cargando registros...';
  } else {
    isFetchingMore.value = true;
  }
  
  try {
    const params = {
      limit: limit.value,
      offset: offset.value,
    };
    if (props.searchQuery) {
      params.search = props.searchQuery;
    }

    const response = await axios.get(props.apiEndpoint, { params });
    const newRecords = response.data;
    
    records.value.push(...newRecords);
    offset.value += newRecords.length;
    
    if (newRecords.length < limit.value) {
      hasMoreRecords.value = false;
    }

    if (records.value.length === 0) {
      noDataText.value = 'No se encontraron registros.';
    }

  } catch (error) {
    console.error('Error al obtener datos:', error);
    noDataText.value = 'No se pudieron cargar los registros. Por favor, asegúrate de que el servidor está funcionando en la URL: ' + props.apiEndpoint;
  } finally {
    isLoading.value = false;
    isFetchingMore.value = false;
  }
};

// Lógica de "observador" para el scroll
const handleScroll = () => {
  const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
  
  if (scrollTop + clientHeight >= scrollHeight - 200) {
    fetchRecords();
  }
};

// Observador para la propiedad searchQuery
watch(() => props.searchQuery, (newValue, oldValue) => {
  if (newValue !== oldValue) {
    resetStateAndFetch();
  }
});

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
