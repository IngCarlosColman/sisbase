<template>
  <div>
    <!--
      Se eliminó la anidación de v-container, v-row y v-col dentro del v-card.
      La barra de búsqueda y la tabla ahora son componentes separados
      con su propio v-card, lo que evita conflictos de CSS y se adapta 
      correctamente al v-container fluid del App.vue.
    -->
    <v-card class="my-4">
      <v-card-text>
        <div class="d-flex align-center">
          <v-text-field
            v-model="searchText"
            label="Buscar por cédula o nombre"
            variant="outlined"
            density="compact"
            hide-details
            clearable
            prepend-inner-icon="mdi-magnify"
            class="mb-4"
            @click:clear="handleShowAll"
            @keyup.enter="handleSearch"
          ></v-text-field>
          <v-btn 
            color="primary"
            height="56"
            class="mb-4 ml-4"
            @click="handleSearch"
          >
            Buscar
          </v-btn>
          <v-btn 
            color="red"
            height="56"
            class="mb-4 ml-4"
            @click="handleShowAll"
          >
            Mostrar Todo
          </v-btn>
        </div>
      </v-card-text>
    </v-card>
    
    <v-card>
      <v-card-text>
        <!-- Aquí se incluye el componente de la tabla de datos. -->
        <GenericDataTable
          api-endpoint="http://localhost:8000/api/yacyreta/detalles"
          card-title="Registros de Yacyretá"
          :table-headers="tableHeaders"
          :form-fields="formFields"
          :search-query="searchQuery"
        />
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue';
import GenericDataTable from '../components/GenericDataTable.vue';
import { VCard, VCardText, VTextField, VBtn } from 'vuetify/components';

// Variables de estado para la búsqueda
const searchText = ref('');
const searchQuery = ref('');

// Función para el botón "Buscar" y para el evento de la tecla Enter
const handleSearch = () => {
  searchQuery.value = searchText.value;
};

// Función para el botón "Mostrar Todo"
const handleShowAll = async () => {
  // Limpiar el campo de texto de búsqueda
  searchText.value = '';
  // Forzar la actualización en el GenericDataTable
  searchQuery.value = null;
  await nextTick();
  searchQuery.value = '';
};

const tableHeaders = [
  { title: 'Cédula', key: 'cedula' },
  { title: 'Nombre', key: 'nombre' },
  { title: 'Salario', key: 'salario' },
  { title: 'Sede', key: 'sede' },
  { title: 'Teléfono 1', key: 'telefono1' },
  { title: 'Teléfono 2', key: 'telefono2' },
];

const formFields = [
  { key: 'cedula', label: 'Cédula', required: true },
  { key: 'nombre', label: 'Nombre', required: true },
  { key: 'salario', label: 'Salario' },
  { key: 'sede', label: 'Sede' },
  { key: 'telefono1', label: 'Teléfono 1' },
  { key: 'telefono2', label: 'Teléfono 2' },
];
</script>
