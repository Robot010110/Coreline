// Logo.jsx
// The Coreline brand lockup: the cream app-icon tile carrying the mark
// (see CorelineMark.jsx) next to the CORELINE wordmark.
import { BrandTile } from "./CorelineMark";

export default function Logo({ withSubtitle = true }) {
  return (
    <div className="flex items-center gap-3">
      <BrandTile className="h-10 w-10 rounded-xl shadow-lg shadow-black/40" />
      <div className="leading-tight">
        <p className="font-display font-bold text-white text-[17px] tracking-wide">
          CORE<span className="text-[#F47A20]">LINE</span>
        </p>
        {withSubtitle && (
          <p className="text-[11px] uppercase tracking-[0.16em] text-[#8B93A8] -mt-0.5">
            Market Management
          </p>
        )}
      </div>
    </div>
  );
}
