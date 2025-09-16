import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Category } from '../types/firebase-schema';

export class FirebaseCategoryService {
  private static instance: FirebaseCategoryService;

  private constructor() {}

  static getInstance(): FirebaseCategoryService {
    if (!FirebaseCategoryService.instance) {
      FirebaseCategoryService.instance = new FirebaseCategoryService();
    }
    return FirebaseCategoryService.instance;
  }

  // Criar categoria
  async createCategory(category: Omit<Category, 'id' | 'createdAt' | 'syncVersion'>): Promise<string> {
    try {
      const categoryData = {
        ...category,
        createdAt: serverTimestamp(),
        syncVersion: 1
      };

      const docRef = await addDoc(collection(db, 'categories'), categoryData);
      return docRef.id;
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      throw error;
    }
  }

  // Buscar categorias por household
  async getCategories(householdId: string): Promise<Category[]> {
    console.log('🔍 Buscando categorias para household:', householdId);
    try {
      const q = query(
        collection(db, 'categories'),
        where('householdId', '==', householdId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const categories = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Category[];
      
      console.log(`📋 Encontradas ${categories.length} categorias:`, categories);
      return categories;
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      throw error;
    }
  }

  // Escutar mudanças em tempo real
  subscribeToCategories(householdId: string, callback: (categories: Category[]) => void): () => void {
    console.log('👂 Iniciando subscription para categorias do household:', householdId);
    try {
      const q = query(
        collection(db, 'categories'),
        where('householdId', '==', householdId),
        orderBy('createdAt', 'desc')
      );

      return onSnapshot(q, (querySnapshot) => {
        const categories = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        })) as Category[];
        
        console.log(`🔄 Subscription: Encontradas ${categories.length} categorias`);
        callback(categories);
      });
    } catch (error) {
      console.error('Erro ao escutar categorias:', error);
      throw error;
    }
  }

  // Atualizar categoria
  async updateCategory(categoryId: string, updates: Partial<Category>): Promise<void> {
    try {
      const categoryRef = doc(db, 'categories', categoryId);
      const updateData = {
        ...updates,
        syncVersion: (updates.syncVersion || 0) + 1
      };

      await updateDoc(categoryRef, updateData);
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      throw error;
    }
  }

  // Criar categorias padrão
  async createDefaultCategories(householdId: string, userId: string): Promise<void> {
    console.log('🏗️ Criando categorias padrão para household:', householdId);
    
    const defaultCategories = [
      { name: 'Alimentação', color: '#10B981', icon: 'utensils' },
      { name: 'Transporte', color: '#3B82F6', icon: 'car' },
      { name: 'Moradia', color: '#F59E0B', icon: 'home' },
      { name: 'Saúde', color: '#EF4444', icon: 'heart' },
      { name: 'Entretenimento', color: '#8B5CF6', icon: 'gamepad-2' },
      { name: 'Compras', color: '#06B6D4', icon: 'shopping-bag' },
      { name: 'Outros', color: '#6B7280', icon: 'more-horizontal' }
    ];

    try {
      for (const category of defaultCategories) {
        const categoryId = await this.createCategory({
          householdId,
          name: category.name,
          color: category.color,
          icon: category.icon,
          isDefault: true,
          createdBy: userId
        });
        console.log(`✅ Categoria criada: ${category.name} (ID: ${categoryId})`);
      }
      console.log('🎉 Todas as categorias padrão foram criadas com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao criar categorias padrão:', error);
      throw error;
    }
  }
}

export const firebaseCategoryService = FirebaseCategoryService.getInstance();