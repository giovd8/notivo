import swaggerUi from "swagger-ui-express";

export const swaggerOptions = {
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #0066cc; }
    .swagger-ui .scheme-container { background: #f8fafc; padding: 10px; border-radius: 4px; }
  `,
  customSiteTitle: "Notivo API Documentation",
  customfavIcon: "/favicon.ico",
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: "list",
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    tryItOutEnabled: true,
    requestInterceptor: (req: any) => {
      // Aggiungi automaticamente i cookie se presenti
      if (typeof window !== 'undefined' && document.cookie) {
        req.headers['Cookie'] = document.cookie;
      }
      return req;
    }
  }
};

export const swaggerUiHandler = swaggerUi.serve;
export const swaggerUiSetup = swaggerUi.setup;
