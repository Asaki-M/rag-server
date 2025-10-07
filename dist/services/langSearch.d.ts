interface RerankByLangSearchProps {
    query: string;
    documents: Array<string>;
    topN?: number;
    returnDocuments?: boolean;
}
interface LangSearchDocument {
    text: string;
}
interface LangSearchRerankResult {
    index: number;
    relevance_score: number;
    document?: LangSearchDocument;
}
export declare function rerankByLangSearch(props: RerankByLangSearchProps): Promise<LangSearchRerankResult[] | boolean>;
export {};
