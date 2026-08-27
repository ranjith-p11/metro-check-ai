const tesseract = require('tesseract.js');
const path = require('path');

// ──────────────────────────────────────────────────────────────────────────────
// Summary builder — generates missing_fields + human-readable text message
// ──────────────────────────────────────────────────────────────────────────────
const buildSummary = (declarations, violations, status) => {
  const missing_fields = declarations
    .filter(d => !d.is_valid)
    .map(d => d.field_name);

  let summary;
  if (missing_fields.length === 0) {
    summary = 'All mandatory declarations are present. The product packaging is fully compliant with Legal Metrology (Packaged Commodities) Rules, 2011.';
  } else {
    const list = missing_fields.join(', ');
    summary =
      `The following mandatory declaration(s) are MISSING from the product packaging: ${list}. ` +
      `This constitutes a violation under the Legal Metrology (Packaged Commodities) Rules, 2011. ` +
      `Immediate corrective action is required before the product can be cleared for sale.`;
  }

  return { missing_fields, summary };
};

// ──────────────────────────────────────────────────────────────────────────────
// Demo / Mock data
// ──────────────────────────────────────────────────────────────────────────────
const getDemoData = (demoType) => {
  if (demoType === 'warning') {
    const declarations = [
      { field_name: 'Manufacturer', value: 'ABC Foods Pvt Ltd', confidence: 96, is_valid: true },
      { field_name: 'Net Quantity', value: '500 g', confidence: 92, is_valid: true },
      { field_name: 'MRP', value: '₹120.00', confidence: 90, is_valid: true },
      { field_name: 'Consumer Care', value: '1800-XXX-XXXX', confidence: 95, is_valid: true },
      { field_name: 'Date of Manufacture', value: '10/2023', confidence: 91, is_valid: true },
      { field_name: 'Best Before', value: '09/2025', confidence: 88, is_valid: true },
    ];
    const violations = [
      { rule_id: 'LM-006', severity: 'LOW', description: 'Potential font size issue — requires officer verification' }
    ];
    return { score: 81, status: 'WARNING', declarations, violations, ...buildSummary(declarations, violations, 'WARNING') };

  } else if (demoType === 'non-compliant') {
    const declarations = [
      { field_name: 'Manufacturer', value: 'Not detected', confidence: 0, is_valid: false },
      { field_name: 'Net Quantity', value: '500 g', confidence: 85, is_valid: true },
      { field_name: 'MRP', value: 'Not detected', confidence: 0, is_valid: false },
      { field_name: 'Consumer Care', value: 'Not detected', confidence: 0, is_valid: false },
      { field_name: 'Date of Manufacture', value: '10/2023', confidence: 88, is_valid: true },
      { field_name: 'Best Before', value: 'Not detected', confidence: 0, is_valid: false },
    ];
    const violations = [
      { rule_id: 'LM-001', severity: 'HIGH', description: 'Missing Manufacturer / Packer Information' },
      { rule_id: 'LM-003', severity: 'HIGH', description: 'Missing MRP declaration' },
      { rule_id: 'LM-004', severity: 'MEDIUM', description: 'Missing Consumer Care contact details' },
      { rule_id: 'LM-005', severity: 'HIGH', description: 'Missing Best Before / Date of Expiry' },
    ];
    return { score: 54, status: 'NON-COMPLIANT', declarations, violations, ...buildSummary(declarations, violations, 'NON-COMPLIANT') };
  }

  // Default: compliant
  const declarations = [
    { field_name: 'Manufacturer', value: 'ABC Foods Pvt Ltd', confidence: 96, is_valid: true },
    { field_name: 'Net Quantity', value: '500 g', confidence: 98, is_valid: true },
    { field_name: 'MRP', value: '₹120.00', confidence: 92, is_valid: true },
    { field_name: 'Consumer Care', value: '1800-111-2222', confidence: 95, is_valid: true },
    { field_name: 'Date of Manufacture', value: '10/2023', confidence: 94, is_valid: true },
    { field_name: 'Best Before', value: '09/2025', confidence: 97, is_valid: true },
  ];
  const violations = [];
  return { score: 96, status: 'COMPLIANT', declarations, violations, ...buildSummary(declarations, violations, 'COMPLIANT') };
};

// ──────────────────────────────────────────────────────────────────────────────
// Real OCR + Compliance Analysis
// ──────────────────────────────────────────────────────────────────────────────
const runOCR = async (imagePath) => {
  const workerPath = path.resolve(__dirname, '../../../eng.traineddata');
  
  // Try with local traineddata first, fall back to auto-download
  try {
    const result = await tesseract.recognize(imagePath, 'eng', {
      logger: () => {}, // suppress verbose logging
    });
    return result.data.text;
  } catch (err) {
    console.error('OCR recognition error:', err.message);
    throw new Error('OCR failed: ' + err.message);
  }
};

const extractDeclarationsFromText = (text) => {
  const declarations = [];
  const violations = [];
  let score = 100;

  // ── MRP ──────────────────────────────────────────────────────────────────────
  const mrpMatch = text.match(
    /(MRP|M\.R\.P|Maximum Retail Price)[:\s]*(Rs\.?|INR|₹)?\s*([\d,]+(\.\d{1,2})?)/i
  ) || text.match(/(₹|Rs\.?)\s*([\d,]+(\.\d{1,2})?)/i);

  if (mrpMatch) {
    declarations.push({ field_name: 'MRP', value: mrpMatch[0].trim(), confidence: 85, is_valid: true });
  } else {
    declarations.push({ field_name: 'MRP', value: 'Not detected', confidence: 0, is_valid: false });
    violations.push({ rule_id: 'LM-003', severity: 'HIGH', description: 'Missing MRP declaration' });
    score -= 20;
  }

  // ── Net Quantity ──────────────────────────────────────────────────────────────
  const qtyMatch = text.match(/(Net\s*(?:Weight|Quantity|Contents|Wt\.?))[:\s]*([\d.]+\s*(?:g|kg|ml|l|gm|Kg|KG|Gm|GM|Lt|LT|ltr|Ltr))/i)
    || text.match(/([\d.]+)\s*(g|kg|ml|l|gm|Kg|KG|Gm|GM|Lt|LT|ltr|Ltr)\b/i);

  if (qtyMatch) {
    declarations.push({ field_name: 'Net Quantity', value: qtyMatch[0].trim(), confidence: 82, is_valid: true });
  } else {
    declarations.push({ field_name: 'Net Quantity', value: 'Not detected', confidence: 0, is_valid: false });
    violations.push({ rule_id: 'LM-002', severity: 'HIGH', description: 'Missing Net Quantity / Net Weight declaration' });
    score -= 20;
  }

  // ── Manufacturer / Packer ─────────────────────────────────────────────────────
  const mfgMatch = text.match(/(Manufactured\s*by|Mfd\.?\s*by|Packed\s*by|Marketed\s*by)[:\s]+([A-Za-z][A-Za-z0-9\s&.,()Pvt Ltd]+)/i);
  if (mfgMatch) {
    const val = mfgMatch[2].split('\n')[0].trim().substring(0, 60);
    declarations.push({ field_name: 'Manufacturer', value: val, confidence: 78, is_valid: true });
  } else {
    declarations.push({ field_name: 'Manufacturer', value: 'Not detected', confidence: 0, is_valid: false });
    violations.push({ rule_id: 'LM-001', severity: 'HIGH', description: 'Missing Manufacturer / Packer information' });
    score -= 20;
  }

  // ── Consumer Care ─────────────────────────────────────────────────────────────
  const careMatch = text.match(/(1800[\s-]?\d{3}[\s-]?\d{3,4})/i)
    || text.match(/(toll[\s-]?free)[:\s]*([\d\s-]+)/i)
    || text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i)
    || text.match(/(consumer[\s-]?care|helpline|customer[\s-]?care)[:\s]*([\d\s+-]+)/i);

  if (careMatch) {
    declarations.push({ field_name: 'Consumer Care', value: careMatch[0].trim(), confidence: 75, is_valid: true });
  } else {
    declarations.push({ field_name: 'Consumer Care', value: 'Not detected', confidence: 0, is_valid: false });
    violations.push({ rule_id: 'LM-004', severity: 'MEDIUM', description: 'Missing Consumer Care contact details' });
    score -= 10;
  }

  // ── Date of Manufacture ───────────────────────────────────────────────────────
  const mfgDateMatch = text.match(/(Mfg\.?\s*Date?|Date\s*of\s*Mfg\.?|Manufactured\s*On)[:\s]*(\d{2}[\/\-.]\d{4}|\d{2}[\/\-.]\d{2}[\/\-.]\d{4}|[A-Za-z]{3}\.?\s*\d{4})/i)
    || text.match(/(Best\s*Before|Use\s*By|Expiry)[:\s]*(\d{2}[\/\-.]\d{4}|\d{2}[\/\-.]\d{2}[\/\-.]\d{4})/i);

  if (mfgDateMatch) {
    declarations.push({ field_name: 'Date of Manufacture', value: mfgDateMatch[0].trim(), confidence: 88, is_valid: true });
  } else {
    declarations.push({ field_name: 'Date of Manufacture', value: 'Not detected', confidence: 0, is_valid: false });
    violations.push({ rule_id: 'LM-005', severity: 'HIGH', description: 'Missing Date of Manufacture / Best Before date' });
    score -= 20;
  }

  // ── Final Status ──────────────────────────────────────────────────────────────
  score = Math.max(score, 0);
  let status = 'COMPLIANT';
  if (score < 70) status = 'NON-COMPLIANT';
  else if (score < 90) status = 'WARNING';

  const { missing_fields, summary } = buildSummary(declarations, violations, status);
  return { score, status, declarations, violations, missing_fields, summary };
};

// ──────────────────────────────────────────────────────────────────────────────
// Main exported function
// ──────────────────────────────────────────────────────────────────────────────
const analyzeImage = async (imagePath, useDemoData, demoType, db) => {
  // Demo mode — always works, returns structured data immediately
  if (useDemoData || !imagePath) {
    await new Promise(resolve => setTimeout(resolve, 1800)); // simulate processing
    return getDemoData(demoType || 'compliant');
  }

  // Real OCR mode
  try {
    console.log('[OCR] Starting analysis on:', imagePath);
    const text = await runOCR(imagePath);
    console.log('[OCR] Extracted text length:', text.length);

    if (!text || text.trim().length < 5) {
      // Text extraction yielded nothing useful — return a partial result
      console.warn('[OCR] Very little text extracted, returning minimal compliance result.');
      const decls = [{ field_name: 'Image Quality', value: 'Low — very little text could be extracted', confidence: 0, is_valid: false }];
      const viols = [{ rule_id: 'LM-IMG', severity: 'MEDIUM', description: 'Image quality is too low for automated OCR. Please use a clearer image or verify manually.' }];
      return {
        score: 50,
        status: 'WARNING',
        declarations: decls,
        violations: viols,
        missing_fields: ['MRP', 'Net Quantity', 'Manufacturer', 'Consumer Care', 'Date of Manufacture'],
        summary: 'Image quality is insufficient for OCR. All mandatory fields could not be verified: MRP, Net Quantity, Manufacturer, Consumer Care, Date of Manufacture. Please re-upload a higher quality image.',
        extractedText: text
      };
    }

    const result = extractDeclarationsFromText(text);
    return { ...result, extractedText: text };

  } catch (err) {
    console.error('[OCR] Fatal error:', err.message);
    return {
      score: 50,
      status: 'WARNING',
      declarations: [
        { field_name: 'OCR Status', value: 'OCR engine encountered an error', confidence: 0, is_valid: false }
      ],
      violations: [
        { rule_id: 'LM-SYS', severity: 'MEDIUM', description: `OCR processing error: ${err.message}. Please try again or use Demo Mode for verification.` }
      ],
      missing_fields: ['MRP', 'Net Quantity', 'Manufacturer', 'Consumer Care', 'Date of Manufacture'],
      summary: `OCR engine error: ${err.message}. Unable to verify mandatory fields. Please re-upload a clearer image or use Demo Mode.`,
      extractedText: ''
    };
  }
};

module.exports = { analyzeImage };
