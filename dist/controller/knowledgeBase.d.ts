import type { NextFunction, Request, Response } from 'express';
export declare function createKnowledge(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function queryKnowledgeCollections(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function updateKnowledge(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function deleteKnowledge(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function addDocumentsToKnowledgeBase(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function searchDocuments(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function deleteDocuments(req: Request, res: Response, next: NextFunction): Promise<void>;
