import { db as localDb } from '../core/db/database';
import { db as firebaseDb } from '../config/firebase';
import { firebaseExpenseService } from './firebaseExpenseService';
import { firebaseHouseholdService } from './firebaseHouseholdService';
import { authService } from './authService';
import { 
  collection, 
  addDoc, 
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

export class DataMigrationService {
  private static instance: DataMigrationService;

  private constructor() {}

  static getInstance(): DataMigrationService {
    if (!DataMigrationService.instance) {
      DataMigrationService.instance = new DataMigrationService();
    }
    return DataMigrationService.instance;
  }

  // Mapear método de pagamento local para Firebase
  private mapPaymentMethod(localMethod: string): 'money' | 'card' | 'pix' | 'transfer' {
    switch (localMethod) {
      case 'dinheiro': return 'money';
      case 'cartao_credito':
      case 'cartao_debito': return 'card';
      case 'pix': return 'pix';
      case 'transferencia':
      case 'boleto': return 'transfer';
      default: return 'money';
    }
  }

  async migrateAllUserData(): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    console.log('🔄 Iniciando migração de dados para Firebase...');

    try {
      // 1. Criar ou buscar household padrão
      let userHouseholds = await firebaseHouseholdService.getUserHouseholds(user.id);
      let householdId: string;

      if (userHouseholds.length === 0) {
        // Criar household padrão
        householdId = await firebaseHouseholdService.createHousehold('Minha Casa', user.id);
        console.log('✅ Household criada:', householdId);
      } else {
        householdId = userHouseholds[0].id;
        console.log('✅ Usando household existente:', householdId);
      }

      // 2. Migrar categorias
      await this.migrateCategories(householdId, user.id);

      // 3. Migrar despesas  
      await this.migrateExpenses(householdId, user.id);

      // 4. Migrar tarefas
      await this.migrateTasks(householdId, user.id);

      // 5. Migrar documentos
      await this.migrateDocuments(householdId, user.id);

      // 6. Migrar medicamentos
      await this.migrateMedications(householdId, user.id);

      console.log('🎉 Migração concluída com sucesso!');
      
      // Marcar migração como concluída
      localStorage.setItem('dataMigratedToFirebase', 'true');
      
    } catch (error) {
      console.error('❌ Erro na migração:', error);
      throw error;
    }
  }

  private async migrateCategories(householdId: string, userId: string): Promise<void> {
    try {
      const localCategories = await localDb.categories.toArray();
      console.log(`📂 Migrando ${localCategories.length} categorias...`);

      for (const category of localCategories) {
        const categoryData = {
          householdId,
          name: category.name,
          color: category.color || '#3B82F6',
          icon: category.icon || 'folder',
          isDefault: false, // Categorias migradas não são padrão
          createdBy: userId,
          createdAt: serverTimestamp(),
          syncVersion: 1
        };

        await addDoc(collection(firebaseDb, 'categories'), categoryData);
      }

      console.log('✅ Categorias migradas');
    } catch (error) {
      console.error('❌ Erro ao migrar categorias:', error);
    }
  }

  private async migrateExpenses(householdId: string, userId: string): Promise<void> {
    try {
      const localExpenses = await localDb.expenses.toArray();
      console.log(`💰 Migrando ${localExpenses.length} despesas...`);

      for (const expense of localExpenses) {
        const expenseData = {
          householdId,
          amount: expense.amount,
          description: expense.title, // Local usa 'title', Firebase usa 'description'
          category: expense.categoryId, // Local usa 'categoryId', Firebase usa 'category'
          paymentMethod: this.mapPaymentMethod(expense.paymentMethod),
          createdBy: userId,
          createdAt: expense.createdAt,
          updatedAt: serverTimestamp(),
          syncVersion: 1
        };

        await firebaseExpenseService.createExpense(expenseData);
      }

      console.log('✅ Despesas migradas');
    } catch (error) {
      console.error('❌ Erro ao migrar despesas:', error);
    }
  }

  private async migrateTasks(householdId: string, userId: string): Promise<void> {
    try {
      const localTasks = await localDb.tasks.toArray();
      console.log(`📋 Migrando ${localTasks.length} tarefas...`);

      for (const task of localTasks) {
        const taskData = {
          householdId,
          title: task.title,
          description: task.description || '',
          priority: task.priority as 'low' | 'medium' | 'high',
          status: task.status as 'pending' | 'in-progress' | 'completed',
          assignedTo: userId,
          createdBy: userId,
          createdAt: task.createdAt,
          updatedAt: serverTimestamp(),
          dueDate: task.dueDate || null,
          syncVersion: 1
        };

        await addDoc(collection(firebaseDb, 'tasks'), taskData);
      }

      console.log('✅ Tarefas migradas');
    } catch (error) {
      console.error('❌ Erro ao migrar tarefas:', error);
    }
  }

  private async migrateDocuments(householdId: string, userId: string): Promise<void> {
    try {
      const localDocuments = await localDb.documents.toArray();
      console.log(`📄 Migrando ${localDocuments.length} documentos...`);

      for (const doc of localDocuments) {
        const documentData = {
          householdId,
          name: doc.title, // Local usa 'title', Firebase usa 'name'
          type: doc.mimeType, // Local usa 'mimeType', Firebase usa 'type'
          size: doc.fileSize,
          url: doc.fileUrl || '', // Nota: arquivos precisarão ser re-uploaded para Firebase Storage
          path: '', // Será preenchido quando o arquivo for re-uploaded
          tags: doc.tags || [],
          description: doc.description || '',
          createdBy: userId,
          createdAt: serverTimestamp(),
          syncVersion: 1
        };

        await addDoc(collection(firebaseDb, 'documents'), documentData);
      }

      console.log('✅ Documentos migrados');
    } catch (error) {
      console.error('❌ Erro ao migrar documentos:', error);
    }
  }

  private async migrateMedications(householdId: string, userId: string): Promise<void> {
    try {
      const localMedications = await localDb.medications.toArray();
      console.log(`💊 Migrando ${localMedications.length} medicamentos...`);

      for (const med of localMedications) {
        const medicationData = {
          householdId,
          name: med.name,
          dosage: `${med.dosage} ${med.unit}`,
          frequency: med.frequency || 'daily',
          instructions: med.description || '',
          prescribedBy: med.prescribedBy || '',
          startDate: Timestamp.fromDate(med.startDate),
          endDate: med.endDate ? Timestamp.fromDate(med.endDate) : null,
          isActive: med.isActive,
          assignedTo: userId, // Assumir que é para o usuário atual
          createdBy: userId,
          createdAt: serverTimestamp(),
          syncVersion: 1
        };

        await addDoc(collection(firebaseDb, 'medications'), medicationData);
      }

      console.log('✅ Medicamentos migrados');
    } catch (error) {
      console.error('❌ Erro ao migrar medicamentos:', error);
    }
  }

  // Verificar se migração já foi feita
  static isMigrationCompleted(): boolean {
    return localStorage.getItem('dataMigratedToFirebase') === 'true';
  }

  // Limpar flag de migração (para testes)
  static resetMigration(): void {
    localStorage.removeItem('dataMigratedToFirebase');
  }
}

export const dataMigrationService = DataMigrationService.getInstance();