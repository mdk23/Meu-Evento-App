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
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-6">
        <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
          <h3 className="text-white font-bold text-base">Attach Service to Event</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-zinc-400 font-bold block mb-1">Catalog Service</label>
            <select
              required
              value={catalogServiceId}
              onChange={(e) => setCatalogServiceId(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-violet-500"
            >
              <option value="">-- Choose Catalog Service --</option>
              {catalogServices.map((cs) => (
                <option key={cs.id} value={cs.id}>
                  {cs.defaultExecutionType === 'INTERNAL' ? '🟢' : '🔵'} {cs.name} ({cs.defaultPrice} MT)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-zinc-400 font-bold block mb-1">Selling Price (MT)</label>
              <input
                type="number"
                value={customSellingPrice}
                onChange={(e) => setCustomSellingPrice(e.target.value)}
                placeholder="Default"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-white text-xs outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 font-bold block mb-1">Estimated Cost (MT)</label>
              <input
                type="number"
                value={customCost}
                onChange={(e) => setCustomCost(e.target.value)}
                placeholder="0"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-white text-xs outline-none focus:border-violet-500"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addingService}
              className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold flex items-center gap-2"
            >
              {addingService ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Attach Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
