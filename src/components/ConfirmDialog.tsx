import React from "react";
import { AlertTriangle, Trash2, HelpCircle, AlertCircle } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText,
  cancelText = "Cancel",
  type = "warning",
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "danger":
        return <Trash2 className="w-6 h-6 text-rose-600" />;
      case "warning":
        return <AlertTriangle className="w-6 h-6 text-amber-600" />;
      default:
        return <HelpCircle className="w-6 h-6 text-indigo-600" />;
    }
  };

  const getThemeClasses = () => {
    switch (type) {
      case "danger":
        return {
          iconBg: "bg-rose-50 border border-rose-100",
          confirmBtn: "bg-rose-600 hover:bg-rose-700 text-white shadow-xs focus:ring-rose-200"
        };
      case "warning":
        return {
          iconBg: "bg-amber-50 border border-amber-100",
          confirmBtn: "bg-amber-600 hover:bg-amber-700 text-white shadow-xs focus:ring-amber-200"
        };
      default:
        return {
          iconBg: "bg-indigo-50 border border-indigo-100",
          confirmBtn: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs focus:ring-indigo-200"
        };
    }
  };

  const themes = getThemeClasses();

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div 
        id="confirm-dialog-card"
        className="bg-white rounded-[24px] max-w-md w-full border border-slate-200 shadow-2xl p-6 flex flex-col gap-5 animate-in zoom-in-95 duration-200"
      >
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-2xl shrink-0 ${themes.iconBg}`}>
            {getIcon()}
          </div>
          <div className="space-y-1.5 flex-1 min-w-0">
            <h3 className="text-base font-black text-slate-950 tracking-tight leading-snug">{title}</h3>
            <p className="text-slate-500 text-xs font-semibold leading-relaxed font-sans">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3.5 border-t border-slate-100 pt-4 mt-1">
          <button
            type="button"
            id="confirm-btn-cancel"
            onClick={onCancel}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            id="confirm-btn-action"
            onClick={onConfirm}
            className={`px-5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${themes.confirmBtn}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
