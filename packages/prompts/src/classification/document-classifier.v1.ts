export const CLASSIFIER_VERSION = 'document-classifier.v1';

export const DOCUMENT_CLASSIFICATION_PROMPT = `You are a financial document classifier. Analyze the provided document image and classify it.

Return ONLY valid JSON:
{
  "document_type": "INVOICE" | "BANK_STATEMENT" | "SALARY_REGISTER" | "LEDGER" | "MIS_REPORT" | "UNKNOWN",
  "confidence": 0-100,
  "reason": "brief explanation"
}`;
