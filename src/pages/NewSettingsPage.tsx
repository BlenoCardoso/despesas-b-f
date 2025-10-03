import { useState } from 'react'
import { useHouseholds } from '@/hooks/useHouseholds'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Users, 
  Settings, 
  Share2, 
  Copy, 
  LogOut, 
  Trash2, 
  Edit,
  Home,
  Crown,
  User
} from 'lucide-react'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function NewSettingsPage() {
  const { user, signOut } = useAuth()
  const { 
    households, 
    currentHousehold, 
    loading,
    switchHousehold,
    createHousehold,
    generateInviteCode,
    updateName,
    deleteHousehold,
    leaveHousehold
  } = useHouseholds()

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [newHouseholdName, setNewHouseholdName] = useState('')
  const [editHouseholdName, setEditHouseholdName] = useState('')

  const handleCreateHousehold = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newHouseholdName.trim()) return

    try {
      await createHousehold(newHouseholdName.trim())
      setNewHouseholdName('')
      setShowCreateForm(false)
    } catch (error) {
      // Error is already handled in the hook
    }
  }

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editHouseholdName.trim() || !currentHousehold) return

    try {
      await updateName(editHouseholdName.trim())
      setEditHouseholdName('')
      setShowEditForm(false)
    } catch (error) {
      // Error is already handled in the hook
    }
  }

  const handleDeleteHousehold = async () => {
    if (!currentHousehold) return
    
    const confirmText = `Para confirmar, digite: ${currentHousehold.name}`
    const input = prompt(`Tem certeza que deseja deletar "${currentHousehold.name}"?\n\n${confirmText}`)
    
    if (input !== currentHousehold.name) {
      toast.error('Nome incorreto. Operação cancelada.')
      return
    }

    try {
      await deleteHousehold()
    } catch (error) {
      // Error is already handled in the hook
    }
  }

  const handleLeaveHousehold = async () => {
    if (!currentHousehold) return
    
    if (!confirm(`Tem certeza que deseja sair de "${currentHousehold.name}"?`)) return

    try {
      await leaveHousehold()
    } catch (error) {
      // Error is already handled in the hook
    }
  }

  const handleLogout = async () => {
    if (!confirm('Tem certeza que deseja sair?')) return
    
    try {
      await signOut()
    } catch (error) {
      toast.error('Erro ao fazer logout')
    }
  }

  const isOwner = currentHousehold?.ownerId === user?.id

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">Carregando configurações...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configurações</h1>
          <p className="text-gray-600 mt-1">Gerencie suas households e configurações</p>
        </div>
      </div>

      {/* User Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informações do Usuário
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {user?.avatarUrl ? (
              <img 
                src={user.avatarUrl} 
                alt={user.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-gray-600" />
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-semibold">{user?.name || 'Usuário'}</h3>
              <p className="text-gray-600">{user?.email}</p>
            </div>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Household */}
      {currentHousehold && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Household Atual
              {isOwner && (
                <Badge variant="default" className="ml-2">
                  <Crown className="h-3 w-3 mr-1" />
                  Proprietário
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Gerencie a household atual
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">{currentHousehold.name}</h3>
                <p className="text-gray-600">
                  {currentHousehold.members.length} membro(s)
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={generateInviteCode} variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Convidar
                </Button>
                
                {isOwner ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Gerenciar
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => {
                        setEditHouseholdName(currentHousehold.name)
                        setShowEditForm(true)
                      }}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar nome
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={handleDeleteHousehold}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Deletar household
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button onClick={handleLeaveHousehold} variant="outline" size="sm">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Households */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Minhas Households
            </div>
            <Button onClick={() => setShowCreateForm(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nova Household
            </Button>
          </CardTitle>
          <CardDescription>
            Troque entre suas households ou crie uma nova
          </CardDescription>
        </CardHeader>
        <CardContent>
          {households.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-4">
                Você não faz parte de nenhuma household
              </div>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar primeira household
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {households.map((household) => (
                <div
                  key={household.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    household.id === currentHousehold?.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{household.name}</h3>
                        {household.ownerId === user?.id && (
                          <Badge variant="default" size="sm">
                            <Crown className="h-3 w-3 mr-1" />
                            Owner
                          </Badge>
                        )}
                        {household.id === currentHousehold?.id && (
                          <Badge variant="secondary" size="sm">
                            Atual
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {household.members.length} membro(s)
                      </p>
                    </div>
                    
                    {household.id !== currentHousehold?.id && (
                      <Button
                        onClick={() => switchHousehold(household.id)}
                        variant="outline"
                        size="sm"
                      >
                        Selecionar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Household Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nova Household</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleCreateHousehold} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome da Household</label>
              <Input
                value={newHouseholdName}
                onChange={(e) => setNewHouseholdName(e.target.value)}
                placeholder="Ex: Casa da Família Silva"
                required
              />
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowCreateForm(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1">
                Criar Household
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Household Name Dialog */}
      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Nome da Household</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleUpdateName} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome da Household</label>
              <Input
                value={editHouseholdName}
                onChange={(e) => setEditHouseholdName(e.target.value)}
                placeholder="Ex: Casa da Família Silva"
                required
              />
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowEditForm(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1">
                Atualizar Nome
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}