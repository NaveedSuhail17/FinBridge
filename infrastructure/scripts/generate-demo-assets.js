#!/usr/bin/env node
/**
 * Generates demo asset PDFs for FinBridge hackathon demo.
 * Run from repo root: node infrastructure/scripts/generate-demo-assets.js
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const DEMO_DIR = path.join(__dirname, '../../demo-assets');
const AI_EVAL_DIR = path.join(__dirname, '../../ai-evaluation/sample-invoices');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// ─── Colour palette ───────────────────────────────────────────────────────────
const BRAND_BLUE = '#1E40AF';
const BRAND_DARK = '#1E293B';
const GREY_MID = '#64748B';
const GREY_LIGHT = '#F1F5F9';
const GREEN = '#16A34A';
const BLACK = '#0F172A';

function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * Draws a full-page invoice PDF.
 */
function createInvoicePDF(outputPath, invoice) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    const W = doc.page.width;
    const L = 50; // left margin
    const R = W - 50; // right margin

    // ── Header bar ──────────────────────────────────────────────────────────────
    doc.rect(0, 0, W, 90).fill(BRAND_BLUE);

    doc.fillColor('white').font('Helvetica-Bold').fontSize(26).text('INVOICE', L, 22);

    doc
      .fillColor('white')
      .font('Helvetica')
      .fontSize(10)
      .text(invoice.vendor.name, L, 55)
      .text(invoice.vendor.address, L, 68);

    // GST on right side of header
    doc
      .fillColor('white')
      .font('Helvetica')
      .fontSize(9)
      .text(`GSTIN: ${invoice.vendor.gstin}`, R - 200, 55, { width: 200, align: 'right' })
      .text(`PAN: ${invoice.vendor.pan}`, R - 200, 68, { width: 200, align: 'right' });

    // ── Invoice meta ────────────────────────────────────────────────────────────
    doc
      .fillColor(BRAND_DARK)
      .font('Helvetica-Bold')
      .fontSize(11)
      .text('Invoice Number:', L, 110)
      .font('Helvetica')
      .text(invoice.invoice_number, L + 110, 110);

    doc
      .font('Helvetica-Bold')
      .text('Invoice Date:', L, 128)
      .font('Helvetica')
      .text(formatDate(invoice.invoice_date), L + 110, 128);

    doc
      .font('Helvetica-Bold')
      .text('Due Date:', L, 146)
      .font('Helvetica')
      .text(formatDate(invoice.due_date), L + 110, 146);

    // Bill To box
    doc.rect(R - 220, 105, 220, 80).fillAndStroke(GREY_LIGHT, '#CBD5E1');
    doc
      .fillColor(BRAND_BLUE)
      .font('Helvetica-Bold')
      .fontSize(9)
      .text('BILL TO', R - 210, 112);
    doc
      .fillColor(BRAND_DARK)
      .font('Helvetica-Bold')
      .fontSize(10)
      .text(invoice.bill_to.name, R - 210, 126)
      .font('Helvetica')
      .fontSize(9)
      .text(invoice.bill_to.address, R - 210, 140, { width: 200 })
      .text(`GSTIN: ${invoice.bill_to.gstin}`, R - 210, 166);

    // ── Line items table ─────────────────────────────────────────────────────────
    const tableTop = 210;
    const colDesc = L;
    const colHSN = L + 230;
    const colQty = L + 310;
    const colRate = L + 370;
    const colAmt = R - 60;

    // Table header
    doc.rect(L, tableTop, R - L, 24).fill(BRAND_DARK);
    doc.fillColor('white').font('Helvetica-Bold').fontSize(9);
    doc.text('Description', colDesc + 4, tableTop + 8);
    doc.text('HSN/SAC', colHSN, tableTop + 8);
    doc.text('Qty', colQty, tableTop + 8);
    doc.text('Rate (INR)', colRate, tableTop + 8);
    doc.text('Amount (INR)', colAmt, tableTop + 8, { width: 65, align: 'right' });

    // Rows
    let y = tableTop + 24;
    let rowBg = false;
    for (const item of invoice.line_items) {
      const rowH = 28;
      if (rowBg) doc.rect(L, y, R - L, rowH).fill('#F8FAFC');
      doc
        .fillColor(BRAND_DARK)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(item.description, colDesc + 4, y + 6, { width: 220 });
      doc
        .font('Helvetica')
        .text(item.hsn, colHSN, y + 10)
        .text(item.qty.toString(), colQty, y + 10)
        .text(formatINR(item.rate), colRate, y + 10);
      doc.text(formatINR(item.amount), colAmt, y + 10, { width: 65, align: 'right' });
      doc
        .moveTo(L, y + rowH)
        .lineTo(R, y + rowH)
        .strokeColor('#E2E8F0')
        .lineWidth(0.5)
        .stroke();
      y += rowH;
      rowBg = !rowBg;
    }

    // ── Totals ───────────────────────────────────────────────────────────────────
    const totalsX = R - 230;
    y += 10;

    const addTotalRow = (label, value, bold = false, color = BRAND_DARK) => {
      doc
        .fillColor(GREY_MID)
        .font('Helvetica')
        .fontSize(9)
        .text(label, totalsX, y, { width: 120, align: 'right' });
      doc
        .fillColor(color)
        .font(bold ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(bold ? 10 : 9)
        .text(formatINR(value), totalsX + 120, y, { width: 65, align: 'right' });
      y += 18;
    };

    addTotalRow('Subtotal', invoice.subtotal);
    addTotalRow(`CGST (${invoice.cgst_rate}%)`, invoice.cgst_amount);
    addTotalRow(`SGST (${invoice.sgst_rate}%)`, invoice.sgst_amount);
    doc
      .moveTo(totalsX, y - 2)
      .lineTo(R, y - 2)
      .strokeColor(BRAND_BLUE)
      .lineWidth(1)
      .stroke();
    addTotalRow('TOTAL DUE', invoice.total_amount, true, BRAND_BLUE);

    // ── Bank details ─────────────────────────────────────────────────────────────
    y += 15;
    doc.rect(L, y, 260, 70).fillAndStroke('#EFF6FF', '#BFDBFE');
    doc
      .fillColor(BRAND_BLUE)
      .font('Helvetica-Bold')
      .fontSize(9)
      .text('BANK DETAILS', L + 8, y + 8);
    doc
      .fillColor(BRAND_DARK)
      .font('Helvetica')
      .fontSize(8.5)
      .text(`Account Name: ${invoice.vendor.bank.account_name}`, L + 8, y + 22)
      .text(`Bank: ${invoice.vendor.bank.bank_name}`, L + 8, y + 34)
      .text(`Account No: ${invoice.vendor.bank.account_number}`, L + 8, y + 46)
      .text(`IFSC: ${invoice.vendor.bank.ifsc}`, L + 8, y + 58);

    // ── Payment status stamp ──────────────────────────────────────────────────────
    doc
      .fillColor('#DCFCE7')
      .rect(R - 130, y + 10, 120, 40)
      .fill();
    doc
      .fillColor(GREEN)
      .font('Helvetica-Bold')
      .fontSize(14)
      .text('PENDING', R - 125, y + 22, { width: 110, align: 'center' });

    // ── Footer ────────────────────────────────────────────────────────────────────
    doc
      .fillColor(GREY_MID)
      .font('Helvetica')
      .fontSize(8)
      .text(
        'This is a computer-generated invoice. No signature required.',
        L,
        doc.page.height - 40,
        { align: 'center', width: R - L },
      );

    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

// ─── Invoice data ─────────────────────────────────────────────────────────────

const INVOICES = [
  // 01 — IT Services: Cloud infrastructure
  {
    filename: 'invoice-01.pdf',
    invoice_number: 'INV-2024-001842',
    invoice_date: '2024-01-15',
    due_date: '2024-02-14',
    currency: 'INR',
    vendor: {
      name: 'Tech Solutions Pvt Ltd',
      address: '14th Floor, Prestige Tech Park, Outer Ring Road, Bangalore 560103',
      gstin: '29AABCT7654D1Z1',
      pan: 'AABCT7654D',
      bank: {
        account_name: 'Tech Solutions Pvt Ltd',
        bank_name: 'HDFC Bank',
        account_number: '50100234567890',
        ifsc: 'HDFC0001234',
      },
    },
    bill_to: {
      name: 'TechVision Solutions',
      address: '7th Floor, Embassy Tech Village, Bangalore 560103',
      gstin: '29AABCT9876D1Z3',
    },
    line_items: [
      {
        description: 'AWS EC2 Reserved Instances (24 months)',
        hsn: '998313',
        qty: 4,
        rate: 28500,
        amount: 114000,
      },
      {
        description: 'AWS S3 Storage (50 TB/month)',
        hsn: '998313',
        qty: 1,
        rate: 12200,
        amount: 12200,
      },
      {
        description: 'AWS CloudFront CDN — Annual Plan',
        hsn: '998313',
        qty: 1,
        rate: 8900,
        amount: 8900,
      },
      {
        description: 'DevOps Managed Services (Monthly)',
        hsn: '998314',
        qty: 1,
        rate: 22000,
        amount: 22000,
      },
    ],
    subtotal: 157100,
    cgst_rate: 9,
    cgst_amount: 14139,
    sgst_rate: 9,
    sgst_amount: 14139,
    total_amount: 185378,
  },

  // 02 — Retail: Office equipment
  {
    filename: 'invoice-02.pdf',
    invoice_number: 'INV-2024-003391',
    invoice_date: '2024-01-22',
    due_date: '2024-02-21',
    currency: 'INR',
    vendor: {
      name: 'Metro Office Supplies',
      address: 'Shop 42, Commercial Street, Bangalore 560001',
      gstin: '29AABCM4561E1Z7',
      pan: 'AABCM4561E',
      bank: {
        account_name: 'Metro Office Supplies',
        bank_name: 'ICICI Bank',
        account_number: '627205034567',
        ifsc: 'ICIC0006272',
      },
    },
    bill_to: {
      name: 'Sunrise Retail Pvt Ltd',
      address: '103 Linking Road, Mumbai 400050',
      gstin: '27AABCS7654E1Z8',
    },
    line_items: [
      {
        description: 'Dell Latitude 5540 Laptop (i7, 16GB, 512GB SSD)',
        hsn: '847130',
        qty: 3,
        rate: 8900,
        amount: 26700,
      },
      {
        description: 'HP LaserJet Pro M404dn Printer',
        hsn: '844351',
        qty: 2,
        rate: 2150,
        amount: 4300,
      },
      {
        description: 'Office Chairs (Ergonomic, High-back)',
        hsn: '940161',
        qty: 5,
        rate: 890,
        amount: 4450,
      },
      {
        description: 'A4 Paper Reams (80 GSM, 500 sheets)',
        hsn: '480256',
        qty: 40,
        rate: 210,
        amount: 8400,
      },
    ],
    subtotal: 43850,
    cgst_rate: 9,
    cgst_amount: 3946.5,
    sgst_rate: 9,
    sgst_amount: 3946.5,
    total_amount: 51743,
  },

  // 03 — IT Services: SaaS subscriptions
  {
    filename: 'invoice-03.pdf',
    invoice_number: 'INV-2024-005027',
    invoice_date: '2024-02-01',
    due_date: '2024-03-02',
    currency: 'INR',
    vendor: {
      name: 'CloudBase Technologies',
      address: 'Cyber City, Tower B, Floor 8, Gurugram 122002',
      gstin: '06AABCC3421F1Z4',
      pan: 'AABCC3421F',
      bank: {
        account_name: 'CloudBase Technologies',
        bank_name: 'Axis Bank',
        account_number: '9200034512367',
        ifsc: 'UTIB0002456',
      },
    },
    bill_to: {
      name: 'TechVision Solutions',
      address: '7th Floor, Embassy Tech Village, Bangalore 560103',
      gstin: '29AABCT9876D1Z3',
    },
    line_items: [
      {
        description: 'Jira Software — Enterprise (100 users, annual)',
        hsn: '998314',
        qty: 1,
        rate: 38000,
        amount: 38000,
      },
      {
        description: 'Confluence — Enterprise (100 users, annual)',
        hsn: '998314',
        qty: 1,
        rate: 18000,
        amount: 18000,
      },
      {
        description: 'Slack Business+ (50 users, annual)',
        hsn: '998314',
        qty: 1,
        rate: 12000,
        amount: 12000,
      },
      {
        description: 'GitHub Enterprise (50 seats, annual)',
        hsn: '998313',
        qty: 1,
        rate: 12000,
        amount: 12000,
      },
    ],
    subtotal: 80000,
    cgst_rate: 9,
    cgst_amount: 7200,
    sgst_rate: 9,
    sgst_amount: 7200,
    total_amount: 94400,
  },

  // 04 — Manufacturing: Logistics / freight
  {
    filename: 'invoice-04.pdf',
    invoice_number: 'INV-2024-007841',
    invoice_date: '2024-02-10',
    due_date: '2024-03-11',
    currency: 'INR',
    vendor: {
      name: 'FastFreight Logistics',
      address: 'Warehouse Complex, JNPT Road, Nhava Sheva, Mumbai 400707',
      gstin: '27AABCF8743G1Z2',
      pan: 'AABCF8743G',
      bank: {
        account_name: 'FastFreight Logistics Pvt Ltd',
        bank_name: 'SBI',
        account_number: '37829456012',
        ifsc: 'SBIN0005321',
      },
    },
    bill_to: {
      name: 'Apex Manufacturing Ltd',
      address: 'Plot 45, GIDC Industrial Estate, Ahmedabad 382330',
      gstin: '24AABCA4321F1Z6',
    },
    line_items: [
      {
        description: 'Inbound Freight — Mumbai to Ahmedabad (FTL, 22T)',
        hsn: '996511',
        qty: 3,
        rate: 4500,
        amount: 13500,
      },
      {
        description: 'Port Handling & Documentation Charges',
        hsn: '996713',
        qty: 1,
        rate: 8200,
        amount: 8200,
      },
      {
        description: 'Customs Clearance — Import (CHA fees)',
        hsn: '996713',
        qty: 1,
        rate: 5300,
        amount: 5300,
      },
    ],
    subtotal: 27000,
    cgst_rate: 9,
    cgst_amount: 2430,
    sgst_rate: 9,
    sgst_amount: 2430,
    total_amount: 31860,
  },

  // 05 — Consulting: Recruitment / HR
  {
    filename: 'invoice-05.pdf',
    invoice_number: 'INV-2024-009114',
    invoice_date: '2024-02-20',
    due_date: '2024-03-21',
    currency: 'INR',
    vendor: {
      name: 'Prime HR Consultants',
      address: 'Level 5, Raheja Towers, MG Road, Bangalore 560001',
      gstin: '29AABCP1928H1Z9',
      pan: 'AABCP1928H',
      bank: {
        account_name: 'Prime HR Consultants',
        bank_name: 'Kotak Mahindra Bank',
        account_number: '3812000567123',
        ifsc: 'KKBK0000381',
      },
    },
    bill_to: {
      name: 'TechVision Solutions',
      address: '7th Floor, Embassy Tech Village, Bangalore 560103',
      gstin: '29AABCT9876D1Z3',
    },
    line_items: [
      {
        description: 'Executive Search — Senior Software Engineers (3 positions)',
        hsn: '998519',
        qty: 3,
        rate: 22000,
        amount: 66000,
      },
      {
        description: 'Background Verification Services (per candidate)',
        hsn: '998519',
        qty: 3,
        rate: 3200,
        amount: 9600,
      },
      {
        description: 'Recruitment Process Outsourcing — Q1 Retainer',
        hsn: '998519',
        qty: 1,
        rate: 20600,
        amount: 20600,
      },
    ],
    subtotal: 96200,
    cgst_rate: 9,
    cgst_amount: 8658,
    sgst_rate: 9,
    sgst_amount: 8658,
    total_amount: 113516,
  },
];

// Additional 5 invoices for AI evaluation (invoices 06–10)
const AI_EVAL_EXTRA_INVOICES = [
  {
    filename: 'invoice-06.pdf',
    invoice_number: 'INV-2024-010231',
    invoice_date: '2024-03-01',
    due_date: '2024-03-31',
    currency: 'INR',
    vendor: {
      name: 'DataMind Analytics',
      address: 'WeWork Spectrum, Whitefield, Bangalore 560066',
      gstin: '29AABCD5431J1Z3',
      pan: 'AABCD5431J',
      bank: {
        account_name: 'DataMind Analytics LLP',
        bank_name: 'HDFC Bank',
        account_number: '50200112345678',
        ifsc: 'HDFC0002345',
      },
    },
    bill_to: {
      name: 'TechVision Solutions',
      address: '7th Floor, Embassy Tech Village, Bangalore 560103',
      gstin: '29AABCT9876D1Z3',
    },
    line_items: [
      {
        description: 'Business Intelligence Dashboard — 3-month Licence',
        hsn: '998314',
        qty: 1,
        rate: 45000,
        amount: 45000,
      },
      {
        description: 'Data Engineering Consulting (40 hours)',
        hsn: '998519',
        qty: 40,
        rate: 2500,
        amount: 100000,
      },
    ],
    subtotal: 145000,
    cgst_rate: 9,
    cgst_amount: 13050,
    sgst_rate: 9,
    sgst_amount: 13050,
    total_amount: 171100,
  },
  {
    filename: 'invoice-07.pdf',
    invoice_number: 'INV-2024-011547',
    invoice_date: '2024-03-08',
    due_date: '2024-04-07',
    currency: 'INR',
    vendor: {
      name: 'SecureNet Services',
      address: 'DLF Cyber Hub, Tower D, Gurugram 122002',
      gstin: '06AABCS9821K1Z6',
      pan: 'AABCS9821K',
      bank: {
        account_name: 'SecureNet Services Pvt Ltd',
        bank_name: 'Yes Bank',
        account_number: '10520100045678',
        ifsc: 'YESB0001052',
      },
    },
    bill_to: {
      name: 'TechVision Solutions',
      address: '7th Floor, Embassy Tech Village, Bangalore 560103',
      gstin: '29AABCT9876D1Z3',
    },
    line_items: [
      {
        description: 'Annual Penetration Testing — Web & Mobile',
        hsn: '998399',
        qty: 1,
        rate: 85000,
        amount: 85000,
      },
      {
        description: 'SOC-as-a-Service (12 months)',
        hsn: '998399',
        qty: 12,
        rate: 8500,
        amount: 102000,
      },
    ],
    subtotal: 187000,
    cgst_rate: 9,
    cgst_amount: 16830,
    sgst_rate: 9,
    sgst_amount: 16830,
    total_amount: 220660,
  },
  {
    filename: 'invoice-08.pdf',
    invoice_number: 'INV-2024-013002',
    invoice_date: '2024-03-15',
    due_date: '2024-04-14',
    currency: 'INR',
    vendor: {
      name: 'Bright Digital Media',
      address: '301 Andheri Kurla Road, Andheri East, Mumbai 400093',
      gstin: '27AABCB6218L1Z4',
      pan: 'AABCB6218L',
      bank: {
        account_name: 'Bright Digital Media Pvt Ltd',
        bank_name: 'ICICI Bank',
        account_number: '066305009876',
        ifsc: 'ICIC0000663',
      },
    },
    bill_to: {
      name: 'Sunrise Retail Pvt Ltd',
      address: '103 Linking Road, Mumbai 400050',
      gstin: '27AABCS7654E1Z8',
    },
    line_items: [
      {
        description: 'Digital Marketing Campaign — Q2 2024 (Meta + Google)',
        hsn: '998361',
        qty: 1,
        rate: 60000,
        amount: 60000,
      },
      {
        description: 'Influencer Marketing — 5 Micro-Influencers',
        hsn: '998361',
        qty: 5,
        rate: 12000,
        amount: 60000,
      },
      {
        description: 'Creative Content Production (30 assets)',
        hsn: '998381',
        qty: 30,
        rate: 1200,
        amount: 36000,
      },
    ],
    subtotal: 156000,
    cgst_rate: 9,
    cgst_amount: 14040,
    sgst_rate: 9,
    sgst_amount: 14040,
    total_amount: 184080,
  },
  {
    filename: 'invoice-09.pdf',
    invoice_number: 'INV-2024-014789',
    invoice_date: '2024-03-22',
    due_date: '2024-04-21',
    currency: 'INR',
    vendor: {
      name: 'Apex Manufacturing',
      address: 'Plot 12, Vatva GIDC, Ahmedabad 382445',
      gstin: '24AABCA7832M1Z1',
      pan: 'AABCA7832M',
      bank: {
        account_name: 'Apex Manufacturing Co',
        bank_name: 'Bank of Baroda',
        account_number: '26340100001234',
        ifsc: 'BARB0VATVA1',
      },
    },
    bill_to: {
      name: 'Apex Manufacturing Ltd',
      address: 'Plot 45, GIDC Industrial Estate, Ahmedabad 382330',
      gstin: '24AABCA4321F1Z6',
    },
    line_items: [
      {
        description: 'Steel Coils HR (IS 10748) — Grade 2, 2mm',
        hsn: '720811',
        qty: 25000,
        rate: 52,
        amount: 1300000,
      },
      {
        description: 'Welding Electrodes (E6013, 3.15mm, 20kg box)',
        hsn: '831110',
        qty: 80,
        rate: 1150,
        amount: 92000,
      },
    ],
    subtotal: 1392000,
    cgst_rate: 9,
    cgst_amount: 125280,
    sgst_rate: 9,
    sgst_amount: 125280,
    total_amount: 1642560,
  },
  {
    filename: 'invoice-10.pdf',
    invoice_number: 'INV-2024-016341',
    invoice_date: '2024-03-31',
    due_date: '2024-04-30',
    currency: 'INR',
    vendor: {
      name: 'Global Supplies Co',
      address: 'Unit 7, Industrial Area Phase II, Chandigarh 160002',
      gstin: '04AABCG3412N1Z8',
      pan: 'AABCG3412N',
      bank: {
        account_name: 'Global Supplies Co',
        bank_name: 'Punjab National Bank',
        account_number: '3182002100056789',
        ifsc: 'PUNB0318200',
      },
    },
    bill_to: {
      name: 'Apex Manufacturing Ltd',
      address: 'Plot 45, GIDC Industrial Estate, Ahmedabad 382330',
      gstin: '24AABCA4321F1Z6',
    },
    line_items: [
      {
        description: 'Polypropylene Granules (Repol H110MAS)',
        hsn: '390210',
        qty: 5000,
        rate: 98,
        amount: 490000,
      },
      {
        description: 'Polyethylene HDPE (Relene M60275)',
        hsn: '390120',
        qty: 2000,
        rate: 102,
        amount: 204000,
      },
      {
        description: 'Packaging Tape (48mm x 65m, Brown)',
        hsn: '391910',
        qty: 500,
        rate: 45,
        amount: 22500,
      },
    ],
    subtotal: 716500,
    cgst_rate: 9,
    cgst_amount: 64485,
    sgst_rate: 9,
    sgst_amount: 64485,
    total_amount: 845470,
  },
];

function createSupportingPDF(outputPath, title, content) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    const W = doc.page.width;
    const L = 50;
    const R = W - 50;

    // Header bar
    doc.rect(0, 0, W, 80).fill(BRAND_BLUE);
    doc.fillColor('white').font('Helvetica-Bold').fontSize(20).text(title, L, 25);
    doc
      .fillColor('white')
      .font('Helvetica')
      .fontSize(10)
      .text('FinBridge Financial Platform', L, 52);

    doc
      .fillColor(BRAND_DARK)
      .font('Helvetica')
      .fontSize(10)
      .text(content, L, 100, { width: R - L });

    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

async function main() {
  console.log('🚀 Generating FinBridge demo assets...\n');

  // ── Demo invoices ────────────────────────────────────────────────────────────
  ensureDir(path.join(DEMO_DIR, 'invoices'));
  for (const inv of INVOICES) {
    const outPath = path.join(DEMO_DIR, 'invoices', inv.filename);
    await createInvoicePDF(outPath, inv);
    console.log(`  ✓ demo-assets/invoices/${inv.filename}`);
  }

  // ── Supporting documents ─────────────────────────────────────────────────────
  ensureDir(path.join(DEMO_DIR, 'salary-registers'));
  await createSupportingPDF(
    path.join(DEMO_DIR, 'salary-registers', 'salary-register-q1-fy2024.pdf'),
    'Salary Register — Q1 FY2024',
    'TechVision Solutions | Period: April 2024 – June 2024\n\n' +
      'Employee ID  | Name                | Designation           | Gross Salary  | Deductions | Net Pay\n' +
      '-------------|---------------------|-----------------------|---------------|------------|--------\n' +
      'EMP-001      | Ananya Kapoor       | Product Manager       | 180,000       | 28,450     | 151,550\n' +
      'EMP-002      | Rohan Mehta         | Senior SDE-II         | 160,000       | 25,200     | 134,800\n' +
      'EMP-003      | Sneha Iyer          | Data Engineer         | 140,000       | 21,800     | 118,200\n' +
      'EMP-004      | Vivek Sharma        | Frontend Developer    | 120,000       | 18,500     | 101,500\n' +
      'EMP-005      | Pooja Nambiar       | QA Lead               | 130,000       | 20,100     | 109,900\n\n' +
      'Total Gross: ₹ 7,30,000 | Total Net: ₹ 6,15,950\n\nCertified by: CFO, TechVision Solutions',
  );
  console.log('  ✓ demo-assets/salary-registers/salary-register-q1-fy2024.pdf');

  ensureDir(path.join(DEMO_DIR, 'bank-statements'));
  await createSupportingPDF(
    path.join(DEMO_DIR, 'bank-statements', 'bank-statement-jan-2024.pdf'),
    'Bank Statement — January 2024',
    'TechVision Solutions | HDFC Bank | Account: 50100112233445\n\n' +
      'Date         | Narration                              | Debit (INR)  | Credit (INR) | Balance\n' +
      '-------------|----------------------------------------|--------------|--------------|--------\n' +
      '01-Jan-2024  | Opening Balance                        |              |              | 45,32,100\n' +
      '05-Jan-2024  | NEFT — Client ABC Payment              |              | 8,50,000     | 53,82,100\n' +
      '10-Jan-2024  | IMPS — Tech Solutions (INV-001842)     | 1,85,378     |              | 51,96,722\n' +
      '15-Jan-2024  | RTGS — Salary January 2024             | 6,15,950     |              | 45,80,772\n' +
      '22-Jan-2024  | IMPS — Metro Office (INV-003391)       | 51,743       |              | 45,29,029\n' +
      '25-Jan-2024  | NEFT — Client XYZ Payment              |              | 12,00,000    | 57,29,029\n' +
      '31-Jan-2024  | Closing Balance                        |              |              | 57,29,029\n\n' +
      'Generated by: HDFC Bank NetBanking Portal',
  );
  console.log('  ✓ demo-assets/bank-statements/bank-statement-jan-2024.pdf');

  ensureDir(path.join(DEMO_DIR, 'reports'));
  await createSupportingPDF(
    path.join(DEMO_DIR, 'reports', 'mis-report-q3-2024.pdf'),
    'MIS Report — Q3 FY2024',
    'TechVision Solutions | July 2024 – September 2024\n\n' +
      'EXPENSE SUMMARY\n\n' +
      'Category              | Q3 Budget     | Q3 Actual     | Variance\n' +
      '----------------------|---------------|---------------|--------\n' +
      'Infrastructure        | 5,00,000      | 5,55,378      | +55,378\n' +
      'Human Resources       | 25,00,000     | 24,68,500     | -31,500\n' +
      'Marketing             | 3,00,000      | 2,84,080      | -15,920\n' +
      'Operations            | 2,00,000      | 1,92,340      | -7,660\n' +
      'Professional Services | 4,00,000      | 4,27,016      | +27,016\n\n' +
      'Total: Budget ₹39,00,000 | Actual ₹39,27,314 | Variance: +₹27,314 (0.7% over)\n\n' +
      'Key Observations:\n' +
      '• Infrastructure spend up 11% due to increased cloud usage in product launch month\n' +
      '• HR under-budget due to 2 open positions in Q3\n' +
      '• Overall variance within acceptable 2% band',
  );
  console.log('  ✓ demo-assets/reports/mis-report-q3-2024.pdf');

  // ── AI evaluation invoices ───────────────────────────────────────────────────
  ensureDir(AI_EVAL_DIR);

  // Copy demo invoices 01–05 to ai-evaluation/sample-invoices/
  for (const inv of INVOICES) {
    const src = path.join(DEMO_DIR, 'invoices', inv.filename);
    const dst = path.join(AI_EVAL_DIR, inv.filename);
    fs.copyFileSync(src, dst);
    console.log(`  ✓ ai-evaluation/sample-invoices/${inv.filename} (copied)`);
  }

  // Generate additional invoices 06–10
  for (const inv of AI_EVAL_EXTRA_INVOICES) {
    const outPath = path.join(AI_EVAL_DIR, inv.filename);
    await createInvoicePDF(outPath, inv);
    console.log(`  ✓ ai-evaluation/sample-invoices/${inv.filename}`);
  }

  // Export invoice data as JSON for expected-json generation
  const allInvoices = [...INVOICES, ...AI_EVAL_EXTRA_INVOICES];
  const exportPath = path.join(__dirname, '../../ai-evaluation/.invoice-data.json');
  fs.writeFileSync(exportPath, JSON.stringify(allInvoices, null, 2));

  console.log('\n✅ Demo assets generated successfully!\n');
  console.log('  demo-assets/invoices/        — 5 invoice PDFs');
  console.log('  demo-assets/salary-registers/ — salary register PDF');
  console.log('  demo-assets/bank-statements/  — bank statement PDF');
  console.log('  demo-assets/reports/          — MIS report PDF');
  console.log('  ai-evaluation/sample-invoices/ — 10 invoice PDFs (5 copied + 5 new)');
}

main().catch((err) => {
  console.error('❌ Generation failed:', err);
  process.exit(1);
});
