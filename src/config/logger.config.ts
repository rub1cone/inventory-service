export const loggerConfig = {
    pinoHttp: {
      // Уровень логирования
      level: process.env.LOG_LEVEL || 'info',
      // Формат вывода
      transport: process.env.NODE_ENV !== 'production'
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,           
              levelFirst: true,        
              translateTime: 'HH:MM:ss', 
              singleLine: false,        
            },
          }
        : undefined,
      
      // Не логируем запросы к Swagger
      autoLogging: {
        ignore: (req: any) => req.url.startsWith('/api/docs'),
      },
    },
  };