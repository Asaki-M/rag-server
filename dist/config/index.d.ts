interface Config {
    port: number;
    google: {
        apiKey: string;
        embeddingModel: string;
    };
    chroma: {
        apiKey: string;
        tenant: string;
        database: string;
    };
    langsearch: {
        apiKey: string;
        model: string;
    };
}
declare const config: Config;
export declare function validateConfig(): void;
export default config;
