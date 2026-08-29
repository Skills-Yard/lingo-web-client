"use client";

import { useEffect } from "react";
import Image from "next/image";
import type { CoverSlide } from "@/lib/constants/instructionsIntro";

interface RevealModalProps {
  slide: CoverSlide;
  onClose: () => void;
}

export function RevealModal({ slide, onClose }: RevealModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    /* Backdrop */
    <div
      className="reveal-modal-backdrop"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      {/* Sheet / Card */}
      <div
        className="reveal-modal-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          className="reveal-modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>

        {/* Glowing box image */}
        <div className="reveal-modal-img-wrap">
          <Image
            src="/images/box.png"
            alt="Reveal box"
            width={140}
            height={140}
            className="reveal-modal-img"
          />
        </div>

        {/* Title */}
        <h2 className="reveal-modal-title">
          <span className="reveal-modal-highlight">{slide.revealSubject}</span>
          <br />
          <span className="reveal-modal-subtitle">{slide.title}</span>
        </h2>

        {/* Divider diamond */}
        <div className="reveal-modal-divider" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M9 0L11.25 6.75H18L12.375 10.5L14.625 17.25L9 13.5L3.375 17.25L5.625 10.5L0 6.75H6.75L9 0Z"
              fill="currentColor"
            />
          </svg>
        </div>

        {/* Description */}
        <p className="reveal-modal-description">{slide.revealDescription}</p>

        {/* REMEMBER callout */}
        <div className="reveal-modal-remember">
          <div className="reveal-modal-remember-icon" aria-hidden="true">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4" />
              <circle cx="12" cy="16" r="0.5" fill="currentColor" />
            </svg>
          </div>
          <div>
            <p className="reveal-modal-remember-label">REMEMBER:</p>
            <p className="reveal-modal-remember-text">{slide.revealRemember}</p>
          </div>
        </div>
      </div>

      <style>{`
        .reveal-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 50;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          background: rgba(0, 0, 0, 0.55);
          backdrop-filter: blur(4px);
          padding: 0;
          animation: reveal-backdrop-in 0.25s ease;
        }
        @media (min-width: 768px) {
          .reveal-modal-backdrop {
            align-items: center;
            padding: 1.5rem;
          }
        }
        @keyframes reveal-backdrop-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .reveal-modal-sheet {
          position: relative;
          width: 100%;
          max-width: 100%;
          background: #ffffff;
          border-radius: 20px 20px 0 0;
          padding: 2rem 1.75rem 2.25rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 0.85rem;
          animation: reveal-sheet-up 0.35s cubic-bezier(0.22, 1, 0.36, 1);
          box-shadow: 0 -8px 40px rgba(0,0,0,0.18);
        }
        @media (min-width: 768px) {
          .reveal-modal-sheet {
            max-width: 360px;
            border-radius: 20px;
            padding: 2.25rem 2rem 2.5rem;
            animation: reveal-sheet-pop 0.3s cubic-bezier(0.22, 1, 0.36, 1);
            box-shadow: 0 24px 60px rgba(0,0,0,0.22);
          }
        }
        @keyframes reveal-sheet-up {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes reveal-sheet-pop {
          from { transform: scale(0.88); opacity: 0; }
          to   { transform: scale(1);    opacity: 1; }
        }
        .dark .reveal-modal-sheet {
          background: #1e2028;
        }

        .reveal-modal-close {
          position: absolute;
          top: 0.9rem;
          right: 1rem;
          width: 2rem;
          height: 2rem;
          border-radius: 50%;
          border: none;
          background: #f1f1f1;
          color: #555;
          font-size: 0.8rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s, transform 0.15s;
          flex-shrink: 0;
        }
        .reveal-modal-close:hover {
          background: #e2e2e2;
          transform: scale(1.1);
        }
        .dark .reveal-modal-close {
          background: #2e3140;
          color: #ccc;
        }
        .dark .reveal-modal-close:hover {
          background: #3a3f52;
        }

        .reveal-modal-img-wrap {
          margin-top: 0.5rem;
          width: 120px;
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          filter: drop-shadow(0 0 18px rgba(0, 220, 180, 0.45));
        }
        .reveal-modal-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .reveal-modal-title {
          font-size: 1.15rem;
          font-weight: 700;
          line-height: 1.4;
          color: #1a1c22;
          margin: 0;
        }
        .dark .reveal-modal-title {
          color: #f5f5f5;
        }
        .reveal-modal-highlight {
          color: var(--color-primary, #00d4aa);
        }
        .reveal-modal-subtitle {
          color: inherit;
          font-size: 1.1rem;
        }

        .reveal-modal-divider {
          color: var(--color-primary, #00d4aa);
          opacity: 0.8;
          line-height: 0;
        }

        .reveal-modal-description {
          font-size: 0.875rem;
          color: #555;
          line-height: 1.65;
          max-width: 28ch;
          margin: 0;
        }
        .dark .reveal-modal-description {
          color: #a8aabf;
        }

        .reveal-modal-remember {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          background: #f7f8fa;
          border: 1px solid #ebebeb;
          border-radius: 12px;
          padding: 0.85rem 1rem;
          width: 100%;
          text-align: left;
          margin-top: 0.25rem;
        }
        .dark .reveal-modal-remember {
          background: #262a36;
          border-color: #363b4e;
        }
        .reveal-modal-remember-icon {
          flex-shrink: 0;
          color: var(--color-primary, #00d4aa);
          margin-top: 2px;
        }
        .reveal-modal-remember-label {
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          color: var(--color-primary, #00d4aa);
          margin: 0 0 0.2rem;
        }
        .reveal-modal-remember-text {
          font-size: 0.82rem;
          color: #444;
          line-height: 1.5;
          margin: 0;
        }
        .dark .reveal-modal-remember-text {
          color: #b8bace;
        }
      `}</style>
    </div>
  );
}
