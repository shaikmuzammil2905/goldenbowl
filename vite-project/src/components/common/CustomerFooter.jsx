import React from 'react';
import { Link } from 'react-router-dom';
import { Smartphone, QrCode, MapPin, Heart, ShieldCheck, Clock } from 'lucide-react';

export function CustomerFooter({ onOpenAppModal }) {
  return (
    <footer
      style={{
        background: 'linear-gradient(180deg, #1c1208 0%, #120b04 100%)',
        color: '#f5efe6',
        padding: '36px 20px 80px',
        marginTop: 40,
        borderTop: '2px solid #b4811d',
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Top App Download Showcase Section */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(180, 129, 29, 0.4)',
            borderRadius: 20,
            padding: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 20,
            flexWrap: 'wrap',
            marginBottom: 32,
          }}
        >
          <div style={{ maxWidth: 460 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 999,
                background: 'rgba(245, 197, 24, 0.15)',
                color: '#f5c518',
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 0.5,
                marginBottom: 8,
              }}
            >
              <Smartphone size={13} /> OFFICIAL MOBILE APPS
            </span>
            <h3 style={{ margin: '4px 0 8px', fontSize: 20, fontWeight: 900, color: '#ffffff' }}>
              Download Golden Food Bowl App
            </h3>
            <p style={{ margin: 0, fontSize: 12.5, color: '#d6c7b2', lineHeight: 1.5 }}>
              Available for iOS &amp; Android. Get real-time order tracking, instant delivery updates, and 50% OFF your first order.
            </p>
          </div>

          {/* iOS & Android Store Download Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {/* Google Play Store Badge */}
            <button
              type="button"
              onClick={onOpenAppModal}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 16px',
                borderRadius: 14,
                background: '#000000',
                border: '1px solid #444444',
                color: '#ffffff',
                cursor: 'pointer',
                textAlign: 'left',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
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
                <div style={{ fontSize: 13, fontWeight: 900, color: '#ffffff', lineHeight: 1.1 }}>Google Play</div>
              </div>
            </button>

            {/* Apple App Store Badge */}
            <button
              type="button"
              onClick={onOpenAppModal}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 16px',
                borderRadius: 14,
                background: '#000000',
                border: '1px solid #444444',
                color: '#ffffff',
                cursor: 'pointer',
                textAlign: 'left',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                transition: 'transform 0.2s',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09999 22C7.78999 22.05 6.79999 20.68 5.95999 19.47C4.24999 17 2.93999 12.45 4.69999 9.39C5.56999 7.87 7.12999 6.91 8.81999 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM15.97 5.17C16.66 4.33 17.13 3.16 17 2C16 2.04 14.74 2.67 14.04 3.5C13.41 4.23 12.86 5.43 13.01 6.58C14.13 6.67 15.28 6 15.97 5.17Z"/>
              </svg>
              <div>
                <div style={{ fontSize: 9, color: '#a09890', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>Download on the</div>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#ffffff', lineHeight: 1.1 }}>App Store</div>
              </div>
            </button>
          </div>
        </div>

        {/* Footer Navigation Columns */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24, marginBottom: 28 }}>
          <div>
            <h4 style={{ fontSize: 15, fontWeight: 900, color: '#f5c518', margin: '0 0 12px' }}>Golden Food Bowl</h4>
            <p style={{ fontSize: 12, color: '#a09890', lineHeight: 1.6, margin: 0 }}>
              Serving fresh, authentic gourmet food bowls across Bengaluru. Fast delivery in 25 minutes or less!
            </p>
          </div>

          <div>
            <h4 style={{ fontSize: 13, fontWeight: 800, color: '#ffffff', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Quick Links</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#d6c7b2' }}>
              <Link to="/customer/home" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
              <Link to="/customer/search" style={{ color: 'inherit', textDecoration: 'none' }}>Menu &amp; Categories</Link>
              <Link to="/customer/offers" style={{ color: 'inherit', textDecoration: 'none' }}>Golden Offers</Link>
              <Link to="/customer/orders" style={{ color: 'inherit', textDecoration: 'none' }}>Track My Order</Link>
              <Link to="/admin" style={{ color: 'inherit', textDecoration: 'none' }}>Admin Console</Link>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: 13, fontWeight: 800, color: '#ffffff', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Our Kitchens</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#d6c7b2' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} color="#f5c518" /> Bowl Indiranagar</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} color="#f5c518" /> Bowl Koramangala</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} color="#f5c518" /> Bowl MG Road &amp; BTM</span>
            </div>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div style={{ paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.08)', textAlign: 'center', fontSize: 11, color: '#78716c' }}>
          © 2026 Golden Food Bowl. All rights reserved. • Designed with <Heart size={10} color="#dc2626" style={{ display: 'inline', verticalAlign: 'middle' }} /> for fresh, delicious food.
        </div>
      </div>
    </footer>
  );
}
