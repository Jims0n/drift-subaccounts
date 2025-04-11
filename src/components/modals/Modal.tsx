import React, { ReactNode } from "react";

interface ModalProps {
  children: ReactNode;
  onClose?: () => void;
  header?: string;
}

export const Modal = ({ children, onClose, header }: ModalProps) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="bg-slate-800 p-6 rounded-xl shadow-xl z-10 min-w-[350px] relative">
        {header && (
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">{header}</h2>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white focus:outline-none"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}; 