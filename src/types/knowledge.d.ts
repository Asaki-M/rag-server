export interface CreateKnowledgeCollectionParams {
  name: string
  description?: string
}

export interface UpdateKnowledgeCollectionParams {
  name: string
  newName?: string
  newDescription?: string
}
