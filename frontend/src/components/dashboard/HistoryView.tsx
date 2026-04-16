import { SavedAnalysisList } from '../SavedAnalysisList'
import { SavedAnalysisDetail } from '../SavedAnalysisDetail'
import type { 
  SavedAnalysisSummary, 
  SavedAnalysisFull, 
  CompareResponse 
} from '../../types/api'

interface HistoryViewProps {
  viewMode: 'saved-list' | 'saved-detail'
  savedList: SavedAnalysisSummary[] | null
  savedListSearch: string
  setSavedListSearch: (s: string) => void
  deletingId: string | null
  selectedSavedId: string | null
  savedDetail: SavedAnalysisFull | null
  compareResult: CompareResponse | null
  onBack: () => void
  onOpen: (id: string) => void
  onDelete: (id: string) => void
  onDetailBack: () => void
  onCompare: () => void
}

export function HistoryView({
  viewMode,
  savedList,
  savedListSearch,
  setSavedListSearch,
  deletingId,
  selectedSavedId,
  savedDetail,
  compareResult,
  onBack,
  onOpen,
  onDelete,
  onDetailBack,
  onCompare
}: HistoryViewProps) {
  return (
    <div className="history-view w-full">
      {viewMode === 'saved-list' && (
        <SavedAnalysisList
          savedList={savedList}
          savedListSearch={savedListSearch}
          setSavedListSearch={setSavedListSearch}
          deletingId={deletingId}
          onBack={onBack}
          onOpen={onOpen}
          onDelete={onDelete}
        />
      )}

      {viewMode === 'saved-detail' && selectedSavedId && (
        <SavedAnalysisDetail
          savedDetail={savedDetail}
          deletingId={deletingId}
          compareResult={compareResult}
          onBack={onDetailBack}
          onDelete={onDelete}
          onCompare={onCompare}
        />
      )}
    </div>
  )
}
