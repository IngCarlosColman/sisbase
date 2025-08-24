<template>
  <div>
    <v-card class="my-4">
      <v-card-text>
        <div class="d-flex align-center">
          <v-text-field
            v-model="searchText"
            label="Buscar por cédula o nombre..."
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
            color="red"
            height="56"
            class="mb-4 ml-4"
            @click="showAllRecords"
            :disabled="isLoading || loadingMore"
          >
            Mostrar Todo
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <v-card class="mb-4">
      <v-card-title>
        Base de Itaipu
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
          </v-data-table>
        </div>
      </v-card-text>
    </v-card>

    <div v-if="loadingMore" class="d-flex justify-center my-4">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue';
import axios from 'axios';
import {
  VCard,
  VCardText,
  VTextField,
  VBtn,
  VDataTable,
  VCardTitle,
  VProgressCircular
} from 'vuetify/components';

// Estado reactivo para el campo de texto y la búsqueda
const searchText = ref('');
const searchQuery = ref('');

const isSearchDisabled = computed(() => {
  return (searchText.value || '').trim() === '';
});

// URL de la API de solo lectura
const API_BASE_URL = 'http://localhost:8000/api/itaipu';
const RECORDS_PER_PAGE = 50;

// Estado de los datos y de la interfaz
const records = ref([]);
const isLoading = ref(false);
const loadingMore = ref(false);
const hasMoreRecords = ref(true);
const noDataText = ref('Por favor, realiza una búsqueda para ver los registros.');

// Encabezados de la tabla adaptados a la estructura del back-end
const headers = ref([
  { title: 'Cédula', key: 'cedula', style: 'min-width: 150px;' },
  { title: 'Nombre', key: 'nombre', style: 'min-width: 250px;' },
  { title: 'Salario', key: 'salario', style: 'min-width: 150px;' },
  { title: 'Teléfono 1', key: 'telefono1', style: 'min-width: 150px;' },
  { title: 'Teléfono 2', key: 'telefono2', style: 'min-width: 150px;' },
]);

// Función para el botón "Mostrar Todo"
const showAllRecords = () => {
  searchText.value = '';
  searchQuery.value = '';
  hasMoreRecords.value = true;
  fetchRecords('', true);
};

// Se encarga de traer los registros iniciales y los que se carguen con el scroll
const fetchRecords = async (search = '', reset = false) => {
  if (reset) {
    records.value = [];
    isLoading.value = true;
    noDataText.value = 'Buscando registros...';
  } else {
    loadingMore.value = true;
  }
  
  const offset = records.value.length;
  // La URL ahora incluye limit y offset para la paginación
  const url = `${API_BASE_URL}/detalles?search=${search}&limit=${RECORDS_PER_PAGE}&offset=${offset}`;

  try {
    const response = await axios.get(url);
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
    noDataText.value = 'No se pudieron cargar los registros. Por favor, asegúrate de que el servidor está funcionando.';
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

// Función para el botón "Buscar"
const triggerSearch = () => {
  searchQuery.value = searchText.value;
  hasMoreRecords.value = true;
  fetchRecords(searchQuery.value, true);
};

watch(searchText, (newValue) => {
  if (newValue === '') {
    searchQuery.value = '';
    records.value = [];
    noDataText.value = 'Por favor, realiza una búsqueda para ver los registros.';
    hasMoreRecords.value = true;
  }
});

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<style scoped>
.d-flex { display: flex; }
.align-center { align-items: center; }
.ml-4 { margin-left: 16px; }
.justify-center { justify-content: center; }
</style>