import swaggerJsDoc from 'swagger-jsdoc';

const swaggerOptions = {
    swaggerDefinition: {
        openapi: "3.0.0",
        info: {
            title: "API_4",
            version: "1.0.0",
            description: "Documentação API_4",
        },
        servers: [
            {
                url: "http://localhost:3000",
            },
        ],
    },
    apis: ["./src/endpoints/*.ts"]
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

export { swaggerDocs };