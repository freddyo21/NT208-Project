import { createPortal } from "react-dom";
import type { ModalItem } from "../dashboard.types";

interface FullListModalProps {
    title: string;
    items: ModalItem[];
    onClose: () => void;
}

export function FullListModal({ title, items, onClose }: FullListModalProps) {
    return createPortal(
        <div className="db-modal-overlay" onClick={onClose}>
            <div className="db-modal" onClick={e => e.stopPropagation()}>
                <div className="db-modal-header">
                    <span>{title}</span>
                    <button className="db-modal-close" onClick={onClose}>✕ CLOSE</button>
                </div>
                <div className="db-modal-body">
                    {items.map((item, i) => (
                        <div key={i} className="db-modal-row">
                            <span className="db-modal-rank">{String(i + 1).padStart(2, "0")}</span>
                            <span className="db-rank-flag">{item.flag}</span>
                            <span className="db-modal-name">{item.name}</span>
                            <div className="db-rank-bar-bg">
                                <div className="db-rank-bar-fill" style={{ width: `${item.pct}%`, background: item.barColor }} />
                            </div>
                            <span className="db-modal-pct">{item.pct}%</span>
                            <span className="db-modal-count">{item.count} hits</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>,
        document.body
    );
}
