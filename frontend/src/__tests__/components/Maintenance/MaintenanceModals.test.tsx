
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { 
  RuleModal, 
  RenameFamilyModal, 
  DeleteFamilyModal, 
  NewFamilyModal 
} from '../../../components/Maintenance/MaintenanceModals'

describe('MaintenanceModals', () => {
  describe('RuleModal', () => {
    const mockRule = {
      model_family: 'Family 1',
      component_type: 'Fuser',
      expected_life: 100000,
      alert_margin: 10000,
      email_recipients: 'test@test.com'
    }

    it('renders with existing rule data', () => {
      render(
        <RuleModal 
          editingRule={{ ...mockRule, id: 1 }} 
          setEditingRule={vi.fn()} 
          onSave={vi.fn()} 
          onClose={vi.fn()} 
          saving={false} 
        />
      )

      expect(screen.getByText('Editar Regla Maestra')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Family 1')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Fuser')).toBeInTheDocument()
    })

    it('calls onSave when form is submitted', () => {
      const onSave = vi.fn((e) => e.preventDefault())
      render(
        <RuleModal 
          editingRule={mockRule} 
          setEditingRule={vi.fn()} 
          onSave={onSave} 
          onClose={vi.fn()} 
          saving={false} 
        />
      )

      fireEvent.submit(screen.getByRole('button', { name: /Guardar Regla/i }).closest('form')!)
      expect(onSave).toHaveBeenCalled()
    })
  })

  describe('RenameFamilyModal', () => {
    it('calls onSave with new name', () => {
      const onSave = vi.fn()
      render(
        <RenameFamilyModal 
          currentName="Old Name" 
          onSave={onSave} 
          onClose={vi.fn()} 
        />
      )

      const input = screen.getByDisplayValue('Old Name')
      fireEvent.change(input, { target: { value: 'New Name' } })
      fireEvent.click(screen.getByText('Guardar Cambios'))

      expect(onSave).toHaveBeenCalledWith('New Name')
    })

    it('calls onClose when cancel is clicked', () => {
      const onClose = vi.fn()
      render(
        <RenameFamilyModal 
          currentName="Old Name" 
          onSave={vi.fn()} 
          onClose={onClose} 
        />
      )

      fireEvent.click(screen.getByText('Cancelar'))
      expect(onClose).toHaveBeenCalled()
    })
  })

  describe('DeleteFamilyModal', () => {
    it('renders family name and calls onConfirm', () => {
      const onConfirm = vi.fn()
      render(
        <DeleteFamilyModal 
          familyName="Family X" 
          onConfirm={onConfirm} 
          onClose={vi.fn()} 
        />
      )

      expect(screen.getByText(/Family X/i)).toBeInTheDocument()
      fireEvent.click(screen.getByText('Sí, Eliminar Todo'))
      expect(onConfirm).toHaveBeenCalled()
    })
  })

  describe('NewFamilyModal', () => {
    it('calls onSave when submitted', () => {
      const onSave = vi.fn()
      render(<NewFamilyModal onSave={onSave} onClose={vi.fn()} />)

      const input = screen.getByPlaceholderText(/Ej: 52645/i)
      fireEvent.change(input, { target: { value: 'Brand New Family' } })
      fireEvent.click(screen.getByText('Crear Familia'))

      expect(onSave).toHaveBeenCalledWith('Brand New Family')
    })
  })
})
