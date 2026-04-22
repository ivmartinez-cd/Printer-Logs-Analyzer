import React from 'react';
import './ReportCover.css';

interface ReportCoverProps {
  serialNumber: string | null;
  modelName: string | null;
  logFileName: string | null;
  startDate?: string;
  endDate?: string;
  totalEvents?: number;
}

export const ReportCover: React.FC<ReportCoverProps> = ({
  serialNumber,
  modelName,
  logFileName,
  startDate,
  endDate,
  totalEvents
}) => {
  const today = new Date().toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="report-cover">
      <div className="report-cover__header">
        <img src="/report-logo.png" alt="HP Logo" className="report-cover__logo" />
        <div className="report-cover__branding">
          <span className="report-cover__brand-name">HP Logs Analyzer</span>
          <span className="report-cover__brand-tagline">Soluciones Digitales de Diagnóstico</span>
        </div>
      </div>

      <div className="report-cover__content">
        <h1 className="report-cover__title">Reporte de Análisis Técnico</h1>
        <div className="report-cover__divider" />
        
        <div className="report-cover__meta-grid">
          <div className="report-cover__meta-item">
            <span className="report-cover__meta-label">Dispositivo</span>
            <span className="report-cover__meta-value">{modelName || 'Modelo no especificado'}</span>
          </div>
          
          <div className="report-cover__meta-item">
            <span className="report-cover__meta-label">Número de Serie</span>
            <span className="report-cover__meta-value">{serialNumber || 'N/A'}</span>
          </div>

          <div className="report-cover__meta-item">
            <span className="report-cover__meta-label">Archivo de Origen</span>
            <span className="report-cover__meta-value">{logFileName || 'Logs Pegados'}</span>
          </div>

          {startDate && endDate && (
            <div className="report-cover__meta-item">
              <span className="report-cover__meta-label">Periodo del Log</span>
              <span className="report-cover__meta-value">
                {new Date(startDate).toLocaleDateString()} — {new Date(endDate).toLocaleDateString()}
              </span>
            </div>
          )}

          {totalEvents !== undefined && (
            <div className="report-cover__meta-item">
              <span className="report-cover__meta-label">Total de Eventos</span>
              <span className="report-cover__meta-value">{totalEvents}</span>
            </div>
          )}
        </div>
      </div>

      <div className="report-cover__footer">
        <div className="report-cover__footer-info">
          <p>Generado el {today}</p>
          <p className="report-cover__confidential">Documento de uso técnico — Confidencial</p>
        </div>
      </div>
    </div>
  );
};
