import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase';

export interface Document {
  id: string;
  householdId: string;
  name: string;
  type: string;
  size: number;
  url: string;
  path: string;
  tags?: string[];
  description?: string;
  createdBy: string;
  createdAt: Date;
  syncVersion: number;
}

export class FirebaseDocumentService {
  private static instance: FirebaseDocumentService;

  private constructor() {}

  static getInstance(): FirebaseDocumentService {
    if (!FirebaseDocumentService.instance) {
      FirebaseDocumentService.instance = new FirebaseDocumentService();
    }
    return FirebaseDocumentService.instance;
  }

  // Upload de arquivo e criação do documento
  async uploadDocument(
    file: File, 
    householdId: string, 
    userId: string,
    options?: { description?: string; tags?: string[] }
  ): Promise<string> {
    try {
      // Gerar um ID único para o arquivo
      const fileId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const filePath = `households/${householdId}/documents/${fileId}_${file.name}`;
      
      // Upload do arquivo para Firebase Storage
      const storageRef = ref(storage, filePath);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Criar documento no Firestore
      const documentData = {
        householdId,
        name: file.name,
        type: file.type,
        size: file.size,
        url: downloadURL,
        path: filePath,
        description: options?.description || '',
        tags: options?.tags || [],
        createdBy: userId,
        createdAt: serverTimestamp(),
        syncVersion: 1
      };

      const docRef = await addDoc(collection(db, 'documents'), documentData);
      return docRef.id;
    } catch (error) {
      console.error('Erro ao fazer upload do documento:', error);
      throw error;
    }
  }

  // Buscar documentos por household
  async getDocuments(householdId: string): Promise<Document[]> {
    try {
      const q = query(
        collection(db, 'documents'),
        where('householdId', '==', householdId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Document[];
    } catch (error) {
      console.error('Erro ao buscar documentos:', error);
      throw error;
    }
  }

  // Escutar mudanças em tempo real
  subscribeToDocuments(householdId: string, callback: (documents: Document[]) => void): () => void {
    try {
      const q = query(
        collection(db, 'documents'),
        where('householdId', '==', householdId),
        orderBy('createdAt', 'desc')
      );

      return onSnapshot(q, (querySnapshot) => {
        const documents = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        })) as Document[];
        
        callback(documents);
      });
    } catch (error) {
      console.error('Erro ao escutar documentos:', error);
      throw error;
    }
  }

  // Atualizar documento
  async updateDocument(documentId: string, updates: Partial<Document>): Promise<void> {
    try {
      const documentRef = doc(db, 'documents', documentId);
      const updateData = {
        ...updates,
        syncVersion: (updates.syncVersion || 0) + 1
      };

      await updateDoc(documentRef, updateData);
    } catch (error) {
      console.error('Erro ao atualizar documento:', error);
      throw error;
    }
  }

  // Deletar documento (remove do Storage e Firestore)
  async deleteDocument(documentId: string): Promise<void> {
    try {
      // Primeiro buscar os dados do documento para obter o path
      const documentRef = doc(db, 'documents', documentId);
      const documentSnap = await getDocs(query(collection(db, 'documents'), where('__name__', '==', documentId)));
      
      if (!documentSnap.empty) {
        const documentData = documentSnap.docs[0].data() as Document;
        
        // Deletar arquivo do Storage
        if (documentData.path) {
          const storageRef = ref(storage, documentData.path);
          await deleteObject(storageRef);
        }
      }

      // Deletar documento do Firestore
      await deleteDoc(documentRef);
    } catch (error) {
      console.error('Erro ao deletar documento:', error);
      throw error;
    }
  }

  // Buscar documentos por tipo
  async getDocumentsByType(householdId: string, fileType: string): Promise<Document[]> {
    try {
      const q = query(
        collection(db, 'documents'),
        where('householdId', '==', householdId),
        where('type', '==', fileType),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Document[];
    } catch (error) {
      console.error('Erro ao buscar documentos por tipo:', error);
      throw error;
    }
  }

  // Buscar documentos por tags
  async getDocumentsByTag(householdId: string, tag: string): Promise<Document[]> {
    try {
      const q = query(
        collection(db, 'documents'),
        where('householdId', '==', householdId),
        where('tags', 'array-contains', tag),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Document[];
    } catch (error) {
      console.error('Erro ao buscar documentos por tag:', error);
      throw error;
    }
  }

  // Calcular tamanho total de documentos
  async getTotalSize(householdId: string): Promise<number> {
    try {
      const documents = await this.getDocuments(householdId);
      return documents.reduce((total, doc) => total + doc.size, 0);
    } catch (error) {
      console.error('Erro ao calcular tamanho total:', error);
      return 0;
    }
  }
}

export const firebaseDocumentService = FirebaseDocumentService.getInstance();