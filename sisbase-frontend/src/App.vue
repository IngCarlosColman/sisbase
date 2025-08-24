<template>
  <v-app>
    <v-app-bar app color="primary" dark>
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-title>Base de Datos Inmobiliario</v-toolbar-title>
    </v-app-bar>

    <v-navigation-drawer
      v-model="drawer"
      app
      temporary
    >
      <v-list nav dense>
        <v-list-item>
          <v-list-item-title class="text-h6">
            Navegación
          </v-list-item-title>
        </v-list-item>
        
        <v-divider></v-divider>
        
        <v-list-item to="/" link>
          <template v-slot:prepend>
            <v-icon>mdi-home</v-icon>
          </template>
          <v-list-item-title>Inicio</v-list-item-title>
        </v-list-item>

        <v-list-item to="/industrias" link>
          <template v-slot:prepend>
            <v-icon>mdi-factory</v-icon>
          </template>
          <v-list-item-title>Industrias</v-list-item-title>
        </v-list-item>

        <v-list-item to="/abogados" link>
          <template v-slot:prepend>
            <v-icon>mdi-gavel</v-icon>
          </template>
          <v-list-item-title>Abogados</v-list-item-title>
        </v-list-item>

        <v-list-item to="/itaipu" link>
          <template v-slot:prepend>
            <v-img
              :src="ItaipuLogo"
              alt="Logo Itaipu"
              width="24"
              height="24"
              class="mr-4"
            ></v-img>
          </template>
          <v-list-item-title>Itaipu Funcionarios</v-list-item-title>
        </v-list-item>
        
        <v-list-item to="/yacyreta" link>
          <template v-slot:prepend>
            <v-img
              :src="YacyretaLogo"
              alt="Logo Yacyreta"
              width="24"
              height="24"
              class="mr-4"
            ></v-img>
          </template>
          <v-list-item-title>Yacyreta Funcionarios</v-list-item-title>
        </v-list-item>

        <v-list-item to="/est-rurales" link>
          <template v-slot:prepend>
            <v-icon>mdi-tractor</v-icon>
          </template>
          <v-list-item-title>Establecimientos Rurales</v-list-item-title>
        </v-list-item>
        
        <v-list-item to="/estaciones" link>
          <template v-slot:prepend>
            <v-icon>mdi-gas-station</v-icon>
          </template>
          <v-list-item-title>Estaciones</v-list-item-title>
        </v-list-item>

        <v-list-item to="/importadores" link>
          <template v-slot:prepend>
            <v-icon>mdi-ship-wheel</v-icon>
          </template>
          <v-list-item-title>Importadores</v-list-item-title>
        </v-list-item>

        <v-list-item to="/agricola" link>
          <template v-slot:prepend>
            <v-icon>mdi-silo</v-icon>
          </template>
          <v-list-item-title>Export/Agricola</v-list-item-title>
        </v-list-item>
        
        <v-list-item to="/futbolistas" link>
          <template v-slot:prepend>
            <v-icon>mdi-soccer</v-icon>
          </template>
          <v-list-item-title>Futbolistas</v-list-item-title>
        </v-list-item>

        <v-list-item to="/politicos" link>
          <template v-slot:prepend>
            <v-icon>mdi-account-tie</v-icon>
          </template>
          <v-list-item-title>Políticos</v-list-item-title>
        </v-list-item>
        
        <v-list-item to="/medicos" link>
          <template v-slot:prepend>
            <v-icon>mdi-stethoscope</v-icon>
          </template>
          <v-list-item-title>Médicos</v-list-item-title>
        </v-list-item>

        <v-list-item to="/despachantes" link>
          <template v-slot:prepend>
            <v-icon>mdi-ferry</v-icon>
          </template>
          <v-list-item-title>Despachantes Aduaneros</v-list-item-title>
        </v-list-item> </v-list>
    </v-navigation-drawer>

    <v-main>
      <v-container fluid>
        <RouterView />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref } from 'vue';
import { RouterView } from 'vue-router';
import ItaipuLogo from '@/assets/itaipu.png';
import YacyretaLogo from '@/assets/yacyreta.ico';

const drawer = ref(false);
</script>

<style scoped>
/* Estilos si los tienes */
</style>