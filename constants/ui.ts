export const getUIColors = (isDarkMode: boolean) => {
  const primary = '#4361EE';
  const success = '#10B981';
  const danger = '#EF4444';
  const warning = '#F59E0B';

  return {
    primary,
    success,
    danger,
    warning,
    // surfaces
    bg: isDarkMode ? '#05060A' : '#F6F9FC',
    card: isDarkMode ? '#071023' : '#FFFFFF',
    text: isDarkMode ? '#F8F9FB' : '#0F172A',
    subText: isDarkMode ? '#94A3B8' : '#64748B',
    white: '#FFFFFF',
    dark: isDarkMode ? '#050505' : '#1B1B2F',
    gray50: isDarkMode ? '#1F2937' : '#F8F9FA',
    gray100: isDarkMode ? '#374151' : '#F1F3F5',
    gray200: isDarkMode ? '#111827' : '#E6EEF8',
    gray400: isDarkMode ? '#4B5563' : '#9CA3AF',
    gray600: isDarkMode ? '#9AA4B2' : '#6B7280',
    gray900: isDarkMode ? '#E6EEF8' : '#111827',
    // softer variants for icons
    primarySoft: primary + 'AA',
    successSoft: success + 'AA',
    dangerSoft: danger + 'AA',
    warningSoft: warning + 'AA',
  } as const;
};

export default getUIColors;
