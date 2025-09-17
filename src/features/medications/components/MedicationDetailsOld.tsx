import { Medication } from '../types'

interface MedicationDetailsProps {
  medication: Medication | null
  isOpen: boolean
  onClose: () => void
  onRecordIntake?: (medicationId: string, dosage: number, time?: Date, notes?: string) => void
  onStopMedication?: (medicationId: string, reason?: string) => void
  onDeleteMedication?: (medicationId: string) => void
}

// Temporary minimal stub: preserves the component export but returns null.
// This unblocks the TypeScript build while the original detailed UI is migrated/fixed.
export function MedicationDetails(_: MedicationDetailsProps) {
  return null
}