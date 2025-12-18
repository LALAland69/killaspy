import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'pt-BR' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translations
const translations: Record<Language, Record<string, string>> = {
  'en': {
    // Navigation
    'nav.trends': 'Trends',
    'nav.adLibrary': 'Ad Library',
    'nav.savedAds': 'Saved Ads',
    'nav.divergence': 'Divergence',
    'nav.intelligence': 'Intelligence',
    'nav.more': 'More',
    'nav.dashboard': 'Dashboard',
    'nav.advertisers': 'Advertisers',
    'nav.domains': 'Domains',
    'nav.audit': 'Security Audit',
    'nav.import': 'Import',
    'nav.jobs': 'Jobs',
    'nav.alerts': 'Alerts',
    'nav.logs': 'Logs',
    'nav.settings': 'Settings',
    'nav.logout': 'Logout',
    
    // Common
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.export': 'Export',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.view': 'View',
    'common.loading': 'Loading...',
    'common.noData': 'No data available',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.active': 'Active',
    'common.inactive': 'Inactive',
    'common.all': 'All',
    
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.totalAds': 'Total Ads',
    'dashboard.activeAds': 'Active Ads',
    'dashboard.advertisers': 'Advertisers',
    'dashboard.domains': 'Domains',
    'dashboard.recentActivity': 'Recent Activity',
    'dashboard.topAdvertisers': 'Top Advertisers',
    
    // Ads
    'ads.title': 'Ad Library',
    'ads.search': 'Search ads...',
    'ads.filters': 'Filters',
    'ads.sortBy': 'Sort by',
    'ads.dateRange': 'Date Range',
    'ads.country': 'Country',
    'ads.language': 'Language',
    'ads.platform': 'Platform',
    'ads.status': 'Status',
    'ads.mediaType': 'Media Type',
    'ads.riskLevel': 'Risk Level',
    'ads.category': 'Category',
    'ads.winningScore': 'Winning Score',
    
    // Import
    'import.title': 'Import Ads',
    'import.searchTerms': 'Search Terms',
    'import.pageIds': 'Page IDs',
    'import.countries': 'Countries',
    'import.status': 'Ad Status',
    'import.limit': 'Limit',
    'import.preview': 'Preview',
    'import.importNow': 'Import Now',
    'import.scheduled': 'Scheduled Imports',
    'import.createSchedule': 'Create Schedule',
    
    // Logs
    'logs.title': 'System Logs',
    'logs.level': 'Level',
    'logs.category': 'Category',
    'logs.message': 'Message',
    'logs.timestamp': 'Timestamp',
    'logs.clear': 'Clear Logs',
    'logs.export': 'Export',
    'logs.debug': 'Debug',
    'logs.info': 'Info',
    'logs.warn': 'Warning',
    'logs.error': 'Error',
    
    // Alerts
    'alerts.title': 'Alerts',
    'alerts.noAlerts': 'No alerts',
    'alerts.markRead': 'Mark as Read',
    'alerts.viewAll': 'View All',
  },
  'pt-BR': {
    // Navigation
    'nav.trends': 'Tendências',
    'nav.adLibrary': 'Biblioteca de Ads',
    'nav.savedAds': 'Ads Salvos',
    'nav.divergence': 'Divergência',
    'nav.intelligence': 'Inteligência',
    'nav.more': 'Mais',
    'nav.dashboard': 'Painel',
    'nav.advertisers': 'Anunciantes',
    'nav.domains': 'Domínios',
    'nav.audit': 'Auditoria de Segurança',
    'nav.import': 'Importar',
    'nav.jobs': 'Jobs',
    'nav.alerts': 'Alertas',
    'nav.logs': 'Logs',
    'nav.settings': 'Configurações',
    'nav.logout': 'Sair',
    
    // Common
    'common.search': 'Buscar',
    'common.filter': 'Filtrar',
    'common.export': 'Exportar',
    'common.save': 'Salvar',
    'common.cancel': 'Cancelar',
    'common.delete': 'Excluir',
    'common.edit': 'Editar',
    'common.view': 'Visualizar',
    'common.loading': 'Carregando...',
    'common.noData': 'Nenhum dado disponível',
    'common.error': 'Erro',
    'common.success': 'Sucesso',
    'common.active': 'Ativo',
    'common.inactive': 'Inativo',
    'common.all': 'Todos',
    
    // Dashboard
    'dashboard.title': 'Painel',
    'dashboard.totalAds': 'Total de Ads',
    'dashboard.activeAds': 'Ads Ativos',
    'dashboard.advertisers': 'Anunciantes',
    'dashboard.domains': 'Domínios',
    'dashboard.recentActivity': 'Atividade Recente',
    'dashboard.topAdvertisers': 'Top Anunciantes',
    
    // Ads
    'ads.title': 'Biblioteca de Ads',
    'ads.search': 'Buscar ads...',
    'ads.filters': 'Filtros',
    'ads.sortBy': 'Ordenar por',
    'ads.dateRange': 'Período',
    'ads.country': 'País',
    'ads.language': 'Idioma',
    'ads.platform': 'Plataforma',
    'ads.status': 'Status',
    'ads.mediaType': 'Tipo de Mídia',
    'ads.riskLevel': 'Nível de Risco',
    'ads.category': 'Categoria',
    'ads.winningScore': 'Score de Vitória',
    
    // Import
    'import.title': 'Importar Ads',
    'import.searchTerms': 'Termos de Busca',
    'import.pageIds': 'IDs de Página',
    'import.countries': 'Países',
    'import.status': 'Status do Ad',
    'import.limit': 'Limite',
    'import.preview': 'Visualizar',
    'import.importNow': 'Importar Agora',
    'import.scheduled': 'Importações Agendadas',
    'import.createSchedule': 'Criar Agendamento',
    
    // Logs
    'logs.title': 'Logs do Sistema',
    'logs.level': 'Nível',
    'logs.category': 'Categoria',
    'logs.message': 'Mensagem',
    'logs.timestamp': 'Data/Hora',
    'logs.clear': 'Limpar Logs',
    'logs.export': 'Exportar',
    'logs.debug': 'Debug',
    'logs.info': 'Info',
    'logs.warn': 'Aviso',
    'logs.error': 'Erro',
    
    // Alerts
    'alerts.title': 'Alertas',
    'alerts.noAlerts': 'Sem alertas',
    'alerts.markRead': 'Marcar como Lido',
    'alerts.viewAll': 'Ver Todos',
  },
  'es': {
    // Navigation
    'nav.trends': 'Tendencias',
    'nav.adLibrary': 'Biblioteca de Anuncios',
    'nav.savedAds': 'Anuncios Guardados',
    'nav.divergence': 'Divergencia',
    'nav.intelligence': 'Inteligencia',
    'nav.more': 'Más',
    'nav.dashboard': 'Panel',
    'nav.advertisers': 'Anunciantes',
    'nav.domains': 'Dominios',
    'nav.audit': 'Auditoría de Seguridad',
    'nav.import': 'Importar',
    'nav.jobs': 'Trabajos',
    'nav.alerts': 'Alertas',
    'nav.logs': 'Registros',
    'nav.settings': 'Configuración',
    'nav.logout': 'Salir',
    
    // Common
    'common.search': 'Buscar',
    'common.filter': 'Filtrar',
    'common.export': 'Exportar',
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
    'common.delete': 'Eliminar',
    'common.edit': 'Editar',
    'common.view': 'Ver',
    'common.loading': 'Cargando...',
    'common.noData': 'Sin datos disponibles',
    'common.error': 'Error',
    'common.success': 'Éxito',
    'common.active': 'Activo',
    'common.inactive': 'Inactivo',
    'common.all': 'Todos',
    
    // Dashboard
    'dashboard.title': 'Panel',
    'dashboard.totalAds': 'Total de Anuncios',
    'dashboard.activeAds': 'Anuncios Activos',
    'dashboard.advertisers': 'Anunciantes',
    'dashboard.domains': 'Dominios',
    'dashboard.recentActivity': 'Actividad Reciente',
    'dashboard.topAdvertisers': 'Top Anunciantes',
    
    // Ads
    'ads.title': 'Biblioteca de Anuncios',
    'ads.search': 'Buscar anuncios...',
    'ads.filters': 'Filtros',
    'ads.sortBy': 'Ordenar por',
    'ads.dateRange': 'Rango de Fechas',
    'ads.country': 'País',
    'ads.language': 'Idioma',
    'ads.platform': 'Plataforma',
    'ads.status': 'Estado',
    'ads.mediaType': 'Tipo de Medio',
    'ads.riskLevel': 'Nivel de Riesgo',
    'ads.category': 'Categoría',
    'ads.winningScore': 'Puntuación Ganadora',
    
    // Import
    'import.title': 'Importar Anuncios',
    'import.searchTerms': 'Términos de Búsqueda',
    'import.pageIds': 'IDs de Página',
    'import.countries': 'Países',
    'import.status': 'Estado del Anuncio',
    'import.limit': 'Límite',
    'import.preview': 'Vista Previa',
    'import.importNow': 'Importar Ahora',
    'import.scheduled': 'Importaciones Programadas',
    'import.createSchedule': 'Crear Programación',
    
    // Logs
    'logs.title': 'Registros del Sistema',
    'logs.level': 'Nivel',
    'logs.category': 'Categoría',
    'logs.message': 'Mensaje',
    'logs.timestamp': 'Fecha/Hora',
    'logs.clear': 'Limpiar Registros',
    'logs.export': 'Exportar',
    'logs.debug': 'Debug',
    'logs.info': 'Info',
    'logs.warn': 'Advertencia',
    'logs.error': 'Error',
    
    // Alerts
    'alerts.title': 'Alertas',
    'alerts.noAlerts': 'Sin alertas',
    'alerts.markRead': 'Marcar como Leído',
    'alerts.viewAll': 'Ver Todos',
  },
};

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem('killaspy_language');
    return (stored as Language) || 'pt-BR';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('killaspy_language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  useEffect(() => {
    document.documentElement.lang = language === 'pt-BR' ? 'pt-BR' : language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
