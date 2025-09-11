import { db } from '@/core/db/database'
import { Category } from '@/types/global'
import { generateId } from '@/core/utils/id'

export interface CategoryFormData {
  name: string
  icon: string
  color: string
}

export class CategoryService {
  /**
   * Create a new category
   */
  async createCategory(data: CategoryFormData, householdId: string): Promise<Category> {
    const category: Category = {
      id: generateId(),
      name: data.name,
      icon: data.icon,
      color: data.color,
      householdId,
    }

    await db.categories.add(category)
    return category
  }

  /**
   * Update an existing category
   */
  async updateCategory(id: string, data: Partial<CategoryFormData>): Promise<void> {
    await db.categories.update(id, data)
  }

  /**
   * Delete a category
   */
  async deleteCategory(id: string): Promise<void> {
    // Check if category is being used by any expenses
    const expensesUsingCategory = await db.expenses
      .where({ categoryId: id })
      .and(expense => !expense.deletedAt)
      .count()

    if (expensesUsingCategory > 0) {
      throw new Error('Não é possível excluir uma categoria que está sendo usada por despesas')
    }

    await db.categories.delete(id)
  }

  /**
   * Get category by ID
   */
  async getCategoryById(id: string): Promise<Category | undefined> {
    return await db.categories.get(id)
  }

  /**
   * Get all categories for a household
   */
  async getCategories(householdId: string): Promise<Category[]> {
    return await db.categories
      .where({ householdId })
      .sortBy('name')
  }

  /**
   * Get categories with expense counts
   */
  async getCategoriesWithCounts(householdId: string): Promise<Array<Category & { expenseCount: number; totalAmount: number }>> {
    const categories = await this.getCategories(householdId)
    
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const expenses = await db.expenses
          .where({ householdId, categoryId: category.id })
          .and(expense => !expense.deletedAt)
          .toArray()

        return {
          ...category,
          expenseCount: expenses.length,
          totalAmount: expenses.reduce((sum, expense) => sum + expense.amount, 0),
        }
      })
    )

    return categoriesWithCounts.sort((a, b) => b.totalAmount - a.totalAmount)
  }

  /**
   * Search categories by name
   */
  async searchCategories(householdId: string, searchText: string): Promise<Category[]> {
    const lowerSearchText = searchText.toLowerCase()
    
    return await db.categories
      .where({ householdId })
      .and(category => category.name.toLowerCase().includes(lowerSearchText))
      .sortBy('name')
  }

  /**
   * Get default categories for a new household
   */
  getDefaultCategories(): Omit<Category, 'id' | 'householdId'>[] {
    return [
      { name: 'Alimentação', icon: 'utensils', color: '#ef4444' },
      { name: 'Transporte', icon: 'car', color: '#3b82f6' },
      { name: 'Moradia', icon: 'home', color: '#10b981' },
      { name: 'Saúde', icon: 'heart', color: '#f59e0b' },
      { name: 'Educação', icon: 'book', color: '#8b5cf6' },
      { name: 'Lazer', icon: 'gamepad-2', color: '#ec4899' },
      { name: 'Roupas', icon: 'shirt', color: '#06b6d4' },
      { name: 'Serviços', icon: 'wrench', color: '#84cc16' },
      { name: 'Investimentos', icon: 'trending-up', color: '#f97316' },
      { name: 'Outros', icon: 'more-horizontal', color: '#6b7280' },
    ]
  }

  /**
   * Create default categories for a household
   */
  async createDefaultCategories(householdId: string): Promise<Category[]> {
    const defaultCategories = this.getDefaultCategories()
    const categories: Category[] = []

    for (const categoryData of defaultCategories) {
      const category: Category = {
        id: generateId(),
        ...categoryData,
        householdId,
      }
      
      await db.categories.add(category)
      categories.push(category)
    }

    return categories
  }

  /**
   * Get category usage statistics
   */
  async getCategoryStats(householdId: string, startDate?: Date, endDate?: Date): Promise<Array<{
    category: Category
    expenseCount: number
    totalAmount: number
    averageAmount: number
    percentage: number
  }>> {
    const categories = await this.getCategories(householdId)
    let totalOverall = 0

    // First pass: calculate totals
    const categoryStats = await Promise.all(
      categories.map(async (category) => {
        let query = db.expenses
          .where({ householdId, categoryId: category.id })
          .and(expense => !expense.deletedAt)

        if (startDate || endDate) {
          query = query.and(expense => {
            const expenseDate = typeof expense.date === 'string' ? new Date(expense.date) : expense.date
            if (startDate && expenseDate < startDate) return false
            if (endDate && expenseDate > endDate) return false
            return true
          })
        }

        const expenses = await query.toArray()
        const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0)
        totalOverall += totalAmount

        return {
          category,
          expenseCount: expenses.length,
          totalAmount,
          averageAmount: expenses.length > 0 ? totalAmount / expenses.length : 0,
          percentage: 0, // Will be calculated in second pass
        }
      })
    )

    // Second pass: calculate percentages
    return categoryStats.map(stat => ({
      ...stat,
      percentage: totalOverall > 0 ? (stat.totalAmount / totalOverall) * 100 : 0,
    })).sort((a, b) => b.totalAmount - a.totalAmount)
  }

  /**
   * Check if category name is unique within household
   */
  async isCategoryNameUnique(householdId: string, name: string, excludeId?: string): Promise<boolean> {
    const existingCategory = await db.categories
      .where({ householdId })
      .and(category => {
        if (excludeId && category.id === excludeId) return false
        return category.name.toLowerCase() === name.toLowerCase()
      })
      .first()

    return !existingCategory
  }

  /**
   * Get most used categories
   */
  async getMostUsedCategories(householdId: string, limit: number = 5): Promise<Category[]> {
    const categoriesWithCounts = await this.getCategoriesWithCounts(householdId)
    return categoriesWithCounts
      .filter(cat => cat.expenseCount > 0)
      .slice(0, limit)
      .map(cat => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        householdId: cat.householdId,
      }))
  }
}

// Singleton instance
export const categoryService = new CategoryService()

