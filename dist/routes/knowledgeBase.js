import { Router } from 'express';
import { addDocumentsToKnowledgeBase, createKnowledge, deleteDocuments, deleteKnowledge, queryKnowledgeCollections, searchDocuments, updateKnowledge, } from '../controller/knowledgeBase.js';
const knowledgeBaseRouter = Router();
knowledgeBaseRouter.post('/', createKnowledge);
knowledgeBaseRouter.get('/collections', queryKnowledgeCollections);
knowledgeBaseRouter.put('/:collectionName', updateKnowledge);
knowledgeBaseRouter.delete('/:collectionName', deleteKnowledge);
knowledgeBaseRouter.post('/:collectionName/documents', addDocumentsToKnowledgeBase);
knowledgeBaseRouter.delete('/:collectionName/documents', deleteDocuments);
knowledgeBaseRouter.post('/:collectionName/search', searchDocuments);
export default knowledgeBaseRouter;
//# sourceMappingURL=knowledgeBase.js.map