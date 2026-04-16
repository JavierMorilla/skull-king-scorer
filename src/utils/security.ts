/**
 * Elimina caracteres que típicamente se utilizan en ataques XSS o inyecciones
 * (ej., <, >, {, }, \). Actúa como un sanitizador agnóstico súper ligero y rápido.
 */
export const sanitizeInput = (text: string): string => {
  if (!text) return '';
  return text.replace(/[<>{}\\]/g, '').trimStart();
};
