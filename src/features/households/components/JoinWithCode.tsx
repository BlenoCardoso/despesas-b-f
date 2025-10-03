import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { auth } from '@/lib/firebase'

export function JoinWithCode() {
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleJoin = async () => {
    try {
      setLoading(true)
      const trimmed = String(code || '').trim()
      if (!trimmed) {
        toast.error('Insira um código válido')
        return
      }

      const user = auth.currentUser
      if (!user) {
        // Redirect to login and then come back to invite page
        navigate('/login', { state: { redirect: `/convite/${trimmed}` } })
        setOpen(false)
        return
      }

      // Navigate to invite page which will handle acceptance flow
      navigate(`/convite/${trimmed}`)
      setOpen(false)
    } catch (err) {
      console.error('Erro ao entrar com código', err)
      toast.error('Erro ao processar código')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">Entrar com código</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Entrar com código</DialogTitle>
          <DialogDescription>Cole o código que recebeu e entre na casa.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div>
            <Label>Código do convite</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Ex: ABC12345" data-testid="join-code-input" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleJoin} disabled={loading} data-testid="join-with-code-button">{loading ? 'Entrando...' : 'Entrar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default JoinWithCode
