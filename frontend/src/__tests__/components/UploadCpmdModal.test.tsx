// @vitest-environment happy-dom
import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import { UploadCpmdModal } from '../../components/UploadCpmdModal'

afterEach(cleanup)

const MODEL_ID = 'aaaa-bbbb-cccc-dddd'
const MODEL_NAME = 'HP LaserJet E60175'

vi.mock('../../services/api', () => ({
  uploadCpmd: vi.fn(),
}))

import { uploadCpmd } from '../../services/api'
const mockUploadCpmd = uploadCpmd as ReturnType<typeof vi.fn>

function makeFile(name: string, sizeBytes: number, type = 'application/pdf'): File {
  const content = new Uint8Array(sizeBytes)
  return new File([content], name, { type })
}

describe('UploadCpmdModal', () => {
  const onClose = vi.fn()
  const onSuccess = vi.fn()

  beforeEach(() => {
    onClose.mockReset()
    onSuccess.mockReset()
    mockUploadCpmd.mockReset()
  })

  it('renders idle state with model name', () => {
    render(
      <UploadCpmdModal
        modelId={MODEL_ID}
        modelName={MODEL_NAME}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    )
    expect(screen.getByText(MODEL_NAME)).toBeInTheDocument()
    expect(screen.getByText('Elegir Archivo')).toBeInTheDocument()
  })

  it('rejects files over 20 MB', async () => {
    render(
      <UploadCpmdModal
        modelId={MODEL_ID}
        modelName={MODEL_NAME}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    )
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const bigFile = makeFile('cpmd.pdf', 21 * 1024 * 1024)
    fireEvent.change(input, { target: { files: [bigFile] } })
    await waitFor(() => {
      expect(screen.getByText(/supera el límite de 20 MB/i)).toBeInTheDocument()
    })
    expect(mockUploadCpmd).not.toHaveBeenCalled()
  })

  it('shows progress modal while uploading', async () => {
    // Never resolves so we stay in uploading state
    mockUploadCpmd.mockReturnValue(new Promise(() => {}))

    render(
      <UploadCpmdModal
        modelId={MODEL_ID}
        modelName={MODEL_NAME}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    )
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = makeFile('cpmd.pdf', 1024)
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText(/Ingesta de Inteligencia/i)).toBeInTheDocument()
    })
  })

  it('shows success message with extracted count on done', async () => {
    mockUploadCpmd.mockResolvedValue({
      model_id: MODEL_ID,
      cpmd_hash: 'abc',
      total_blocks: 10,
      extracted: 8,
      failed: 2,
      skipped: false,
      reason: null,
    })

    render(
      <UploadCpmdModal
        modelId={MODEL_ID}
        modelName={MODEL_NAME}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    )
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [makeFile('cpmd.pdf', 1024)] } })

    await waitFor(() => {
      expect(screen.getByText(/8 soluciones técnicas/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/fueron omitidas/i)).toBeInTheDocument()
    expect(onSuccess).toHaveBeenCalledTimes(1)
  })

  it('shows skipped message when already processed', async () => {
    mockUploadCpmd.mockResolvedValue({
      model_id: MODEL_ID,
      cpmd_hash: 'abc',
      total_blocks: 0,
      extracted: 0,
      failed: 0,
      skipped: true,
      reason: 'Ya procesado',
    })

    render(
      <UploadCpmdModal
        modelId={MODEL_ID}
        modelName={MODEL_NAME}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    )
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [makeFile('cpmd.pdf', 1024)] } })

    await waitFor(() => {
      expect(screen.getByText(/ya ha sido indexado previamente/i)).toBeInTheDocument()
    })
  })

  it('shows error message on upload failure and allows retry', async () => {
    mockUploadCpmd.mockRejectedValue(new Error('Timeout'))

    render(
      <UploadCpmdModal
        modelId={MODEL_ID}
        modelName={MODEL_NAME}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    )
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [makeFile('cpmd.pdf', 1024)] } })

    await waitFor(() => {
      expect(screen.getByText('Timeout')).toBeInTheDocument()
    })
    const retryBtn = screen.getByText('Reintentar')
    expect(retryBtn).toBeInTheDocument()
    // Clicking retry goes back to idle (shows file picker again)
    fireEvent.click(retryBtn)
    expect(screen.getByText('Elegir Archivo')).toBeInTheDocument()
  })

  it('cancel button calls onClose in idle state', () => {
    render(
      <UploadCpmdModal
        modelId={MODEL_ID}
        modelName={MODEL_NAME}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    )
    fireEvent.click(screen.getByText('Cancelar'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
