import React, { useState, useEffect } from 'react';
import { X, Smartphone, QrCode, Download, CheckCircle, Sparkles } from 'lucide-react';

export function AppDownloadModal({ isOpen, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const copyCode = () => {
    navigator.clipboard?.writeText('GOLDEN50');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'grid',
        placeItems: 'center',
        padding: 16,
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #1c1208 0%, #2b1d0c 100%)',
          color: '#ffffff',
          borderRadius: 24,
          padding: 28,
          maxWidth: 480,
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          border: '1px solid #b4811d',
          position: 'relative',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle background glow */}
        <div
          style={{
            position: 'absolute',
            top: -60,
            right: -60,
            width: 180,
            height: 180,
            background: 'radial-gradient(circle, rgba(223, 165, 0, 0.25) 0%, rgba(0,0,0,0) 70%)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'rgba(255, 255, 255, 0.1)',
            border: 0,
            color: '#fff',
            width: 32,
            height: 32,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        {/* Header Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 999,
            background: 'rgba(223, 165, 0, 0.15)',
            border: '1px solid #dfa500',
            color: '#f5c518',
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 0.5,
            marginBottom: 16,
          }}
        >
          <Sparkles size={14} /> OFFICIAL MOBILE APP
        </div>

        {/* Title */}
        <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>
          Download <span style={{ color: '#f5c518' }}>Golden Food Bowl</span> App
        </h2>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: '#d6c7b2', lineHeight: 1.5 }}>
          Order faster, track live delivery in real-time, and get exclusive discounts directly on your phone!
        </p>

        {/* Promo Offer Box */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px dashed #b4811d',
            borderRadius: 16,
            padding: 14,
            display: 'flex',
            alignItems: 'center',
            justify: 'space-between',
            marginBottom: 20,
          }}
        >
          <div>
            <div style={{ fontSize: 11, color: '#f5c518', fontWeight: 800 }}>⚡ SPECIAL MOBILE OFFER</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginTop: 2 }}>50% OFF First App Order</div>
          </div>
          <button
            type="button"
            onClick={copyCode}
            style={{
              padding: '6px 12px',
              borderRadius: 10,
              background: '#b4811d',
              color: '#fff',
              border: 0,
              fontSize: 11,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {copied ? <CheckCircle size={14} /> : null}
            {copied ? 'COPIED!' : 'GOLDEN50'}
          </button>
        </div>

        {/* App Store & Play Store Download Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          {/* Google Play Store Button */}
          <a
            href="https://play.google.com/store"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              borderRadius: 14,
              background: '#000000',
              border: '1px solid #333333',
              color: '#ffffff',
              textDecoration: 'none',
              transition: 'transform 0.2s',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3.60852 1.48834C3.33618 1.77708 3.18164 2.22271 3.18164 2.78442V21.2156C3.18164 21.7773 3.33618 22.223 3.60852 22.5117L3.68266 22.5858L13.8821 12.3864V11.6136L3.68266 1.41425L3.60852 1.48834Z" fill="#00D2FF"/>
              <path d="M17.2818 15.7861L13.8821 12.3864V11.6136L17.2818 8.21387L17.3601 8.25838L21.3855 10.5471C22.5342 11.1997 22.5342 12.8003 21.3855 13.4529L17.3601 15.7416L17.2818 15.7861Z" fill="#FFD200"/>
              <path d="M17.3601 15.7417L13.8821 12L3.60852 22.2736C3.98774 22.6749 4.60623 22.7289 5.30722 22.3308L17.3601 15.7417Z" fill="#FF3A44"/>
              <path d="M17.3601 8.25838L5.30722 1.66922C4.60623 1.2711 3.98774 1.32511 3.60852 1.72641L13.8821 12L17.3601 8.25838Z" fill="#00E676"/>
            </svg>
            <div>
              <div style={{ fontSize: 9, color: '#a09890', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>GET IT ON</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>Google Play</div>
            </div>
          </a>

          {/* Apple App Store Button */}
          <a
            href="https://www.apple.com/app-store/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              borderRadius: 14,
              background: '#000000',
              border: '1px solid #333333',
              color: '#ffffff',
              textDecoration: 'none',
              transition: 'transform 0.2s',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09999 22C7.78999 22.05 6.79999 20.68 5.95999 19.47C4.24999 17 2.93999 12.45 4.69999 9.39C5.56999 7.87 7.12999 6.91 8.81999 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM15.97 5.17C16.66 4.33 17.13 3.16 17 2C16 2.04 14.74 2.67 14.04 3.5C13.41 4.23 12.86 5.43 13.01 6.58C14.13 6.67 15.28 6 15.97 5.17Z"/>
            </svg>
            <div>
              <div style={{ fontSize: 9, color: '#a09890', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>Download on the</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>App Store</div>
            </div>
          </a>
        </div>

        {/* QR Code Section */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: 16,
            padding: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              background: '#ffffff',
              borderRadius: 12,
              padding: 6,
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <img
              src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://goldenbowl-ivory.vercel.app"
              alt="Scan QR Code to download Golden Food Bowl Mobile App"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
              <QrCode size={14} color="#f5c518" /> Scan QR Code to Download
            </div>
            <div style={{ fontSize: 11, color: '#a09890', marginTop: 4, lineHeight: 1.4 }}>
              Point your smartphone camera at the QR code to open iOS App Store or Google Play Store link.
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 0,
              color: '#a09890',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Continue browsing website
          </button>
        </div>
      </div>
    </div>
  );
}
