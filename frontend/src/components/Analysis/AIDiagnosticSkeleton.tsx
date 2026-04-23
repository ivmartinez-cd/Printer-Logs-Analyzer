import { Skeleton } from '../ui/Skeleton'

export function AIDiagnosticSkeleton() {
  return (
    <div className="ai-diagnostic-skeleton animate-in">
      <div className="ai-diagnostic-result">
        {/* Diagnosis Card Skeleton */}
        <div className="ai-diagnostic-result__diagnosis-card">
          <h4 className="ai-diagnostic-result__section-title">
            <Skeleton width="180px" height="20px" />
          </h4>
          <div style={{ marginTop: '12px' }}>
            <Skeleton width="100%" height="14px" className="mb-2" />
            <Skeleton width="95%" height="14px" className="mb-2" />
            <Skeleton width="90%" height="14px" className="mb-2" />
            <Skeleton width="40%" height="14px" />
          </div>
          <div style={{ marginTop: '16px' }}>
            <Skeleton width="150px" height="12px" />
          </div>
        </div>

        {/* Actions Card Skeleton */}
        <div className="ai-diagnostic-result__actions-card">
          <h4 className="ai-diagnostic-result__section-title">
            <Skeleton width="150px" height="20px" />
          </h4>
          <div className="ai-diagnostic-result__actions-list" style={{ marginTop: '12px' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="ai-diagnostic-result__action-item" style={{ border: 'none', background: 'transparent' }}>
                <Skeleton circle width="24px" height="24px" className="flex-shrink-0" />
                <div style={{ flex: 1, paddingLeft: '12px' }}>
                  <Skeleton width="100%" height="14px" className="mb-1" />
                  <Skeleton width="60%" height="12px" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}



