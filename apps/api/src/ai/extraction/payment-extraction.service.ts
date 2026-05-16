import { Injectable, Logger } from '@nestjs/common';
import { ClaudeVisionService } from './claude-vision.service';
import { PaymentValidatorService } from '../validators/payment-validator.service';
import { PaymentExtractionSchema, PaymentExtraction } from '../validators/extraction-schemas';
import { PAYMENT_EXTRACTION_PROMPT, PAYMENT_PROMPT_VERSION } from '@finbridge/prompts';

export interface PaymentExtractionResult {
  promptVersion: string;
  rawResponse: string;
  parsed: PaymentExtraction;
  validationErrors: string[];
  confidenceScore: number;
}

@Injectable()
export class PaymentExtractionService {
  private readonly logger = new Logger(PaymentExtractionService.name);

  constructor(
    private readonly claudeVision: ClaudeVisionService,
    private readonly validator: PaymentValidatorService,
  ) {}

  async extract(filePath: string): Promise<PaymentExtractionResult> {
    const rawResponse = await this.claudeVision.analyzeImage(filePath, PAYMENT_EXTRACTION_PROMPT);

    let parsed: PaymentExtraction;
    try {
      const json = JSON.parse(rawResponse);
      parsed = PaymentExtractionSchema.parse(json);
    } catch {
      throw new Error(`Failed to parse payment extraction response: ${rawResponse.slice(0, 200)}`);
    }

    const validationErrors = this.validator.validate(parsed);
    const confidenceScore = parsed.confidence.overall;

    this.logger.log(`Payment extraction complete. Confidence: ${confidenceScore}%`);

    return {
      promptVersion: PAYMENT_PROMPT_VERSION,
      rawResponse,
      parsed,
      validationErrors,
      confidenceScore,
    };
  }
}
