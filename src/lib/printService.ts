/**
 * COROT HEALTHCARE HOSPICARE - CLINICAL & FINANCIAL PRINT ENGINE
 * Generates formatted print views with Hospital Branding, Headers, Footers & Signatures.
 */

import { Hospital } from '../types';

export function openPrintWindow(title: string, contentHtml: string, hospital?: Hospital): void {
  const printWindow = window.open('', '_blank', 'width=900,height=800');
  if (!printWindow) {
    alert('Please allow popups to open the print document preview.');
    return;
  }

  const hospName = hospital?.name || 'Corot Healthcare Hospicare';
  const hospAddress = hospital ? `${hospital.address}, ${hospital.city}, ${hospital.state} - ${hospital.pin}` : 'Medical District';
  const hospContact = hospital ? `Tel: ${hospital.phone} | Emergency: ${hospital.emergency_contact}` : '24x7 Emergency Services';
  const regDetails = hospital ? `Reg No: ${hospital.registration_no} | GST: ${hospital.gst_number || 'N/A'}` : '';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title} - ${hospName}</title>
        <meta charset="utf-8" />
        <style>
          @page {
            size: A4;
            margin: 15mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            color: #111827;
            background: #ffffff;
            margin: 0;
            padding: 20px;
            font-size: 13px;
            line-height: 1.5;
          }
          .header-container {
            border-bottom: 2px solid #0f2444;
            padding-bottom: 12px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .hosp-title {
            font-size: 20px;
            font-weight: 700;
            color: #0f2444;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .hosp-tagline {
            font-size: 11px;
            color: #0284c7;
            margin-top: 2px;
            font-weight: 600;
          }
          .hosp-meta {
            font-size: 11px;
            color: #4b5563;
            margin-top: 4px;
          }
          .doc-type-badge {
            display: inline-block;
            background: #0f2444;
            color: #ffffff;
            font-weight: 700;
            font-size: 12px;
            padding: 4px 12px;
            border-radius: 4px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .patient-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 12px;
            margin-bottom: 18px;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px 16px;
            font-size: 12px;
          }
          .patient-box .label {
            color: #64748b;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            display: block;
          }
          .patient-box .value {
            font-weight: 600;
            color: #0f172a;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 16px 0;
            font-size: 12px;
          }
          th {
            background: #f1f5f9;
            color: #334155;
            text-align: left;
            padding: 8px 10px;
            font-weight: 600;
            border-bottom: 1px solid #cbd5e1;
            text-transform: uppercase;
            font-size: 10px;
            letter-spacing: 0.5px;
          }
          td {
            padding: 8px 10px;
            border-bottom: 1px solid #e2e8f0;
            color: #1e293b;
          }
          .totals-table {
            width: 320px;
            margin-left: auto;
            margin-top: 10px;
          }
          .totals-table td {
            padding: 6px 10px;
          }
          .grand-total {
            background: #0f2444;
            color: #ffffff !important;
            font-size: 14px;
            font-weight: 700;
          }
          .grand-total td {
            color: #ffffff !important;
          }
          .footer-sign {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            padding-top: 20px;
            border-top: 1px dashed #cbd5e1;
            font-size: 11px;
            color: #64748b;
          }
          .signature-box {
            text-align: center;
          }
          .signature-line {
            width: 180px;
            border-top: 1px solid #334155;
            margin-bottom: 6px;
          }
          .stamp {
            border: 1.5px solid #0284c7;
            color: #0284c7;
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: 700;
            text-transform: uppercase;
            font-size: 9px;
            display: inline-block;
            margin-bottom: 8px;
          }
          .print-btn-bar {
            background: #0f172a;
            padding: 12px;
            text-align: center;
            margin: -20px -20px 20px -20px;
          }
          .btn-print {
            background: #2563eb;
            color: #ffffff;
            border: none;
            padding: 8px 24px;
            font-size: 14px;
            font-weight: 600;
            border-radius: 6px;
            cursor: pointer;
          }
          @media print {
            .print-btn-bar {
              display: none !important;
            }
            body {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-btn-bar">
          <button class="btn-print" onclick="window.print()">🖨️ Click Here to Print Document</button>
        </div>

        <div class="header-container">
          <div>
            <h1 class="hosp-title">${hospName}</h1>
            <div class="hosp-tagline">${hospital?.tagline || 'Healthcare Excellence & Research'}</div>
            <div class="hosp-meta">${hospAddress}</div>
            <div class="hosp-meta">${hospContact} | ${regDetails}</div>
          </div>
          <div style="text-align: right;">
            <div class="doc-type-badge">${title}</div>
            <div style="font-size: 10px; color: #64748b; margin-top: 6px; font-family: monospace;">
              ISSUED: ${new Date().toLocaleString()}
            </div>
          </div>
        </div>

        ${contentHtml}

        <div class="footer-sign">
          <div>
            <div>• This is a computer-generated medical record under COROT HEALTHCARE HOSPICARE ERP.</div>
            <div>• Verified & encrypted under Hospital ID: <strong>${hospital?.code || 'COROT-APEX-01'}</strong></div>
          </div>
          <div class="signature-box">
            <div class="stamp">OFFICIALLY VERIFIED</div>
            <div class="signature-line"></div>
            <div>Authorized Medical Signatory</div>
          </div>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
