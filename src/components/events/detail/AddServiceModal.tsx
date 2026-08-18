import { Loader2, X } from 'lucide-react';
import { SerializedService } from './types';

interface AddServiceModalProps {
  catalogServices: SerializedService[];
  catalogServiceId: string;
  setCatalogServiceId: (id: string) => void;
  customSellingPrice: string;
  setCustomSellingPrice: (price: string) => void;
  customCost: string;
  setCustomCost: (cost: string) => void;
  addingService: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export default function AddServiceModal({
  catalogServices,
  catalogServiceId,
  setCatalogServiceId,
  customSellingPrice,
  setCustomSellingPrice,
  customCost,
  setCustomCost,
  addingService,
  onSubmit,
  onClose,
}: AddServiceModalProps) {
  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="card-h" style={{ borderBottom: '1px solid var(--rule)', paddingBottom: 16 }}>
          <h3 className="h-md">Attach Service to Event</h3>
          <button onClick={onClose} className="icon-btn">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="stack" style={{ marginTop: 20 }}>
          <div className="field">
            <label className="label">Catalog Service</label>
            <select
              required
              value={catalogServiceId}
              onChange={(e) => setCatalogServiceId(e.target.value)}
              className="input"
            >
              <option value="">-- Choose Catalog Service --</option>
              {catalogServices.map((cs) => (
                <option key={cs.id} value={cs.id}>
                  {cs.defaultExecutionType === 'INTERNAL' ? '🟢' : '🔵'} {cs.name} ({cs.defaultPrice} MT)
                </option>
              ))}
            </select>
          </div>

          <div className="grid g2">
            <div className="field">
              <label className="label">Selling Price (MT)</label>
              <input
                type="number"
                value={customSellingPrice}
                onChange={(e) => setCustomSellingPrice(e.target.value)}
                placeholder="Default"
                className="input"
              />
            </div>
            <div className="field">
              <label className="label">Estimated Cost (MT)</label>
              <input
                type="number"
                value={customCost}
                onChange={(e) => setCustomCost(e.target.value)}
                placeholder="0"
                className="input"
              />
            </div>
          </div>

          <div className="row" style={{ justifyContent: 'flex-end', paddingTop: 8 }}>
            <button type="button" onClick={onClose} className="btn ghost sm">
              Cancel
            </button>
            <button type="submit" disabled={addingService} className="btn primary sm">
              {addingService ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Attach Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
