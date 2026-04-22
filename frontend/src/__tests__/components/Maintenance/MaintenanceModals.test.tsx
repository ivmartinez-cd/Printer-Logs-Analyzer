
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { RuleModal, RecordChangeModal, NewFamilyModal } from '../../../components/Maintenance/MaintenanceModals'

describe('MaintenanceModals', () => {
  describe('RuleModal', () => {
    const mockEditingRule = {
      model_family: 'TestFamily',
      component_type: 'Fuser',
      expected_life: 100000,
      alert_margin: 10000,
      email_recipients: 'test@example.com'
    }

    it('renders with existing rule data', () => {
      render(
        <RuleModal 
          editingRule={mockEditingRule} 
          setEditingRule={vi.fn()} 
          onSave={vi.fn()} 
          onClose={vi.fn()} 
          saving={false} 
        />
      )

      expect(screen.getByDisplayValue('TestFamily')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Fuser')).toBeInTheDocument()
      expect(screen.getByDisplayValue('100000')).toBeInTheDocument()
    })

    it('calls onSave when form is submitted', () => {
      const onSave = vi.fn((e) => e.preventDefault())
      render(
        <RuleModal 
          editingRule={mockEditingRule} 
          setEditingRule={vi.fn()} 
          onSave={onSave} 
          onClose={vi.fn()} 
          saving={false} 
        />
      )

      fireEvent.submit(screen.getByRole('button', { name: 'Guardar Regla' }))
      expect(onSave).toHaveBeenCalled()
    })
  })

  describe('RecordChangeModal', () => {
    const mockData = {
      component_type: 'Fuser',
      serial: 'SERIAL-123',
      incident_number: '',
      notes: ''
    }

    it('renders component info and current counter', () => {
      render(
        <RecordChangeModal 
          recordingData={mockData} 
          setRecordingData={vi.fn()} 
          currentCounter={50000} 
          onSave={vi.fn()} 
          onClose={vi.fn()} 
          recording={false} 
        />
      )

      expect(screen.getByText(/Fuser/)).toBeInTheDocument()
      expect(screen.getByText(/SERIAL-123/)).toBeInTheDocument()
      expect(screen.getByText(/50\.000/)).toBeInTheDocument()
    })
  })

  describe('NewFamilyModal', () => {
    it('calls onSave with input value', () => {
      const onSave = vi.fn()
      render(<NewFamilyModal onSave={onSave} onClose={vi.fn()} />)

      const input = screen.getByPlaceholderText(/Ej: 52645/)
      fireEvent.change(input, { target: { value: 'NewFamilyName' } })
      
      fireEvent.submit(screen.getByRole('button', { name: 'Crear Familia' }))
      expect(onSave).toHaveBeenCalledWith('NewFamilyName')
    })
  })
})
