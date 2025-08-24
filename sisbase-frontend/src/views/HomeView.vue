<template>
  <main>
    <!-- 
      Se removió el v-container para que este componente se adapte 
      correctamente al v-container fluid del layout principal (App.vue).
    -->
    <h1>Gestión de Datos</h1>

    <v-card class="my-4">
      <v-card-text>
        <div class="d-flex align-center">
          <v-text-field
            v-model="searchText"
            label="Buscar por documento o CI, y nombres o apellidos..."
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
          >
            Buscar
          </v-btn>
        </div>
      </v-card-text>
    </v-card>
    
    <!-- Mantenemos los componentes existentes de personas -->
    <PersonapList :search-query="searchQuery" />
    <v-divider class="my-4"></v-divider>
    <PersonasList :search-query="searchQuery" />

  </main>
</template>

<script setup>
import { ref } from 'vue';
import PersonapList from '@/components/PersonapList.vue';
import PersonasList from '@/components/PersonasList.vue';

import {
  VCard,
  VCardText,
  VTextField,
  VDivider,
  VBtn,
} from 'vuetify/components';

// 1. Estado reactivo para el campo de texto (no actualiza las tablas inmediatamente)
const searchText = ref('');

// 2. Estado reactivo que se enviará a los componentes de la tabla (solo cambia con el botón)
const searchQuery = ref('');

// 3. Función para actualizar searchQuery y disparar la búsqueda
const triggerSearch = () => {
  searchQuery.value = searchText.value;
};
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
</style>
