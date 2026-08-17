import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Camera, FileText, Gauge, LoaderCircle, ShieldCheck, X } from 'lucide-react'
import {
  buildFuelEvidenceDraftFromText,
  recognizeFuelEvidence,
  type FuelEvidenceDraft,
  type FuelEvidenceResult,
} from '../utils/fuelEvidence'
import styles from './FuelEvidenceDialog.module.css'

interface FuelEvidenceDialogProps {
  files: File[]
  pastedText?: string
  currency: string
  initialDraft?: Partial<FuelEvidenceDraft>
  showFuelFields?: boolean
  onApply: (draft: FuelEvidenceDraft) => void
  onClose: () => void
}

interface DraftInputs {
  title: string
  amount: string
  datetime: string
  unitPrice: string
  liters: string
  odometer: string
  fullTank: boolean
}

const EMPTY_DRAFT: DraftInputs = {
  title: '',
  amount: '',
  datetime: '',
  unitPrice: '',
  liters: '',
  odometer: '',
  fullTank: true,
}

function inputValue(value?: number) {
  return value === undefined ? '' : value.toString()
}

function numericValue(value: string) {
  const parsed = Number(value)
  return value.trim() && Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

export function FuelEvidenceDialog({
  files,
  pastedText = '',
  currency,
  initialDraft,
  showFuelFields = false,
  onApply,
  onClose,
}: FuelEvidenceDialogProps) {
  const { t } = useTranslation()
  const [results, setResults] = useState<FuelEvidenceResult[]>([])
  const [draft, setDraft] = useState<DraftInputs>(EMPTY_DRAFT)
  const [progress, setProgress] = useState(0)
  const [isProcessing, setIsProcessing] = useState(true)
  const [error, setError] = useState('')
  const previews = useMemo(
    () => files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [files]
  )

  useEffect(() => () => {
    previews.forEach(({ url }) => URL.revokeObjectURL(url))
  }, [previews])

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    setIsProcessing(true)
    setError('')
    const recognize = pastedText.trim()
      ? Promise.resolve({
          results: [],
          draft: buildFuelEvidenceDraftFromText(pastedText),
        })
      : recognizeFuelEvidence(
          files,
          setProgress,
          controller.signal,
          !showFuelFields
        )
    void recognize
      .then(({ results: nextResults, draft: nextDraft }) => {
        if (!active) return
        setResults(nextResults)
        setDraft({
          title: nextDraft.title || initialDraft?.title || '',
          amount: inputValue(nextDraft.amount ?? initialDraft?.amount),
          datetime: nextDraft.datetime || initialDraft?.datetime || '',
          unitPrice: inputValue(nextDraft.unitPrice),
          liters: inputValue(nextDraft.liters),
          odometer: inputValue(nextDraft.odometer),
          fullTank: initialDraft?.fullTank ?? true,
        })
        setProgress(1)
      })
      .catch((reason: unknown) => {
        if (!active || (reason instanceof DOMException && reason.name === 'AbortError')) return
        setError(t('operations.fuelEvidenceFailed'))
      })
      .finally(() => {
        if (active) setIsProcessing(false)
      })
    return () => {
      active = false
      controller.abort()
    }
  }, [files, initialDraft, pastedText, showFuelFields, t])

  const applyDraft = () => onApply({
    title: draft.title.trim() || undefined,
    amount: numericValue(draft.amount),
    datetime: draft.datetime || undefined,
    unitPrice: numericValue(draft.unitPrice),
    liters: numericValue(draft.liters),
    odometer: numericValue(draft.odometer),
    fullTank: draft.fullTank,
  })

  return createPortal(
    <div className={styles.overlay} onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="fuel-evidence-title"
      >
        <header className={styles.header}>
          <div>
            <h2 id="fuel-evidence-title">
              <Camera aria-hidden="true" />
              {t('operations.receiptEvidenceTitle')}
            </h2>
            <p><ShieldCheck aria-hidden="true" />{t('operations.receiptEvidencePrivacy')}</p>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label={t('common.close')}
            title={t('common.close')}
          >
            <X aria-hidden="true" />
          </button>
        </header>

        <div className={styles.body}>
          <div className={styles.images}>
            {pastedText.trim() && (
              <div className={styles.textEvidence}>
                <FileText aria-hidden="true" />
                <strong>{t('operations.receiptPastedText')}</strong>
                <pre>{pastedText}</pre>
              </div>
            )}
            {previews.map(({ file, url }, index) => {
              const result = results[index]
              const kind = result?.kind
              return (
                <figure key={`${file.name}-${file.lastModified}`} className={styles.imageItem}>
                  <img src={url} alt={file.name} />
                  <figcaption>
                    <span>
                      {kind === 'receipt'
                        ? <FileText aria-hidden="true" />
                        : kind === 'odometer'
                          ? <Gauge aria-hidden="true" />
                          : <Camera aria-hidden="true" />}
                      {kind === 'receipt'
                        ? t('operations.fuelEvidenceReceipt')
                        : kind === 'odometer'
                          ? t('operations.fuelEvidenceOdometer')
                          : t('operations.fuelEvidencePhoto')}
                    </span>
                    {result && (
                      <small>{t('operations.fuelEvidenceConfidence', {
                        value: Math.round(result.confidence),
                      })}</small>
                    )}
                  </figcaption>
                </figure>
              )
            })}
          </div>

          <div className={styles.confirmation}>
            {isProcessing ? (
              <div className={styles.processing} role="status">
                <LoaderCircle aria-hidden="true" />
                <strong>{t('operations.fuelEvidenceProcessing')}</strong>
                <progress max="1" value={progress} />
              </div>
            ) : (
              <>
                {error && <div className={styles.error} role="alert">{error}</div>}
                <div className={styles.fieldGrid}>
                  <label className={styles.fullWidthField}>
                    <span>{t('common.title')}</span>
                    <input
                      type="text"
                      value={draft.title}
                      onChange={(event) => setDraft((current) => ({
                        ...current,
                        title: event.target.value,
                      }))}
                    />
                  </label>
                  <label>
                    <span>{t('common.amount')}, {currency}</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={draft.amount}
                      onChange={(event) => setDraft((current) => ({
                        ...current,
                        amount: event.target.value,
                      }))}
                    />
                  </label>
                  <label>
                    <span>{t('operations.dateTime')}</span>
                    <input
                      type="datetime-local"
                      value={draft.datetime}
                      onChange={(event) => setDraft((current) => ({
                        ...current,
                        datetime: event.target.value,
                      }))}
                    />
                  </label>
                  {showFuelFields && (
                    <>
                      <label>
                        <span>{t('operations.fuelEvidencePrice')}</span>
                        <input
                          type="number"
                          min="0"
                          step="0.001"
                          value={draft.unitPrice}
                          onChange={(event) => setDraft((current) => ({
                            ...current,
                            unitPrice: event.target.value,
                          }))}
                        />
                      </label>
                      <label>
                        <span>{t('operations.fuelEvidenceLiters')}</span>
                        <input
                          type="number"
                          min="0"
                          step="0.001"
                          value={draft.liters}
                          onChange={(event) => setDraft((current) => ({
                            ...current,
                            liters: event.target.value,
                          }))}
                        />
                      </label>
                      <label>
                        <span>{t('operations.fuelEvidenceOdometerValue')}</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={draft.odometer}
                          onChange={(event) => setDraft((current) => ({
                            ...current,
                            odometer: event.target.value,
                          }))}
                        />
                      </label>
                      <label className={styles.fullTank}>
                        <input
                          type="checkbox"
                          checked={draft.fullTank}
                          onChange={(event) => setDraft((current) => ({
                            ...current,
                            fullTank: event.target.checked,
                          }))}
                        />
                        <span>{t('operations.fuelEvidenceFullTank')}</span>
                      </label>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <footer className={styles.actions}>
          <button type="button" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className={styles.applyButton}
            onClick={applyDraft}
            disabled={isProcessing}
          >
            {t('operations.fuelEvidenceApply')}
          </button>
        </footer>
      </section>
    </div>,
    document.body
  )
}
