import { useState, useEffect, useCallback } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T) {
  // State para armazenar nosso valor
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      // Obter do localStorage
      const item = window.localStorage.getItem(key)
      // Parse do JSON armazenado ou retorna initialValue se não existir
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      // Se erro, retorna initialValue
      console.error(`Erro ao ler localStorage key "${key}":`, error)
      return initialValue
    }
  })

  // Retorna uma versão envolvida da função setter do useState que persiste o novo valor no localStorage.
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      // Permite que value seja uma função para que tenhamos a mesma API que useState
      const valueToStore = value instanceof Function ? value(storedValue) : value
      
      // Salva no state
      setStoredValue(valueToStore)
      
      // Salva no localStorage
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error(`Erro ao salvar no localStorage key "${key}":`, error)
    }
  }, [key, storedValue])

  // Remove item do localStorage
  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key)
      setStoredValue(initialValue)
    } catch (error) {
      console.error(`Erro ao remover localStorage key "${key}":`, error)
    }
  }, [key, initialValue])

  return [storedValue, setValue, removeValue] as const
}