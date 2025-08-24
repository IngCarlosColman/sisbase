import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import PersonapList from '@/components/PersonapList.vue';
import PersonasList from '@/components/PersonasList.vue';
import IndustriasList from '@/components/IndustriasList.vue';
import AbogadosList from '@/components/AbogadosList.vue';
import ItaipuList from '@/components/ItaipuList.vue';
import YacyretaList from '@/components/YacyretaList.vue';
import EstRuralesList from '@/components/Est_RuralesList.vue';
import EstacionesList from '@/components/EstacionesList.vue';
import ImportadoresList from '@/components/ImportadoresList.vue';
import ExportAgricolaList from '@/components/ExportAgricolaList.vue';
import FutbolistasList from '@/components/FutbolistasList.vue';
import PoliticosList from '@/components/PoliticosList.vue';
import MedicosList from '@/components/MedicosList.vue';
import DespachantesList from '@/components/DespachantesList.vue'; // <-- NUEVA LÍNEA
import StaRitaList from '@/components/Sta_RitaList.vue'; // <-- NUEVA LÍNEA PARA EL COMPONENTE

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      // Cuando se visita la URL principal, se carga el componente HomeView
      component: HomeView,
    },
    {
      path: '/personap',
      name: 'personap',
      // Muestra la lista de personas P
      component: PersonapList,
    },
    {
      path: '/personas',
      name: 'personas',
      // Muestra la lista de personas
      component: PersonasList,
    },
    {
      path: '/industrias',
      name: 'industrias',
      // Muestra la lista de industrias
      component: IndustriasList,
    },
    {
      path: '/abogados',
      name: 'abogados',
      // Muestra la lista de abogados
      component: AbogadosList,
    },
    {
      path: '/itaipu',
      name: 'itaipu',
      // Muestra la lista de registros de Itaipu
      component: ItaipuList,
    },
    {
      path: '/yacyreta',
      name: 'yacyreta',
      // Muestra la lista de registros de Yacyretá
      component: YacyretaList,
    },
    {
      path: '/est-rurales',
      name: 'est-rurales',
      // Muestra la lista de establecimientos rurales
      component: EstRuralesList,
    },
    {
      path: '/estaciones',
      name: 'EstacionesList',
      component: EstacionesList,
    },
    {
      path: '/importadores',
      name: 'ImportadoresList',
      // Solución: Usar el componente 'ImportadoresList' que importamos
      component: ImportadoresList,
    },
    {
      path: '/agricola',
      name: 'AgricolaList',
      component: ExportAgricolaList,
    },
    {
      path: '/futbolistas',
      name: 'FutbolistasList',
      component: FutbolistasList,
    },
    {
      path: '/politicos',
      name: 'politicos',
      component: PoliticosList,
    },
    {
      path: '/medicos',
      name: 'medicos',
      component: MedicosList,
    },
    {
      path: '/despachantes',
      name: 'despachantes',
      component: DespachantesList,
    }, // <-- NUEVA RUTA
    {
      path: '/contri-sta-rita', // <-- Nueva URL para la vista
      name: 'contri-sta-rita', // <-- Nuevo nombre de la ruta
      component: StaRitaList, // <-- El componente que importaste
    }, // <-- NUEVA RUTA COMPLETA
  ],
});

export default router;