import { Injectable, Logger } from '@nestjs/common';
import { ClaudeVisionService } from './claude-vision.service';
import { BankStatementValidatorService } from '../validators/bank-statement-validator.service';
import {
  BankStatementExtractionSchema,
  BankStatementExtraction,
} from '../validators/extraction-schemas';
import {
  BANK_STATEMENT_EXTRACTION_PROMPT,
  BANK_STATEMENT_PROMPT_VERSION,
} from '@finbridge/prompts';

export interface BankStatementExtractionResult {
  promptVersion: string;
  rawResponse: string;
  parsed: BankStatementExtraction;
  validationErrors: string[];
  confidenceScore: number;
}

@Injectable()
export class BankStatementExtractionService {
  private readonly logger = new Logger(BankStatementExtractionService.name);

  constructor(
    private readonly claudeVision: ClaudeVisionService,
    private readonly validator: BankStatementValidatorService,
  ) {}

  async extract(filePath: string): Promise<BankStatementExtractionResult> {
    const rawResponse = await this.claudeVision.analyzeImage(
      filePath,
      BANK_STATEMENT_EXTRACTION_PROMPT,
    );

    let parsed: BankStatementExtraction;
    try {
      const json = JSON.parse(
        rawResponse
          .replace(/^```(?:json)?\s*/i, '')
          .replace(/\s*```$/i, '')
          .trim(),
      );
      parsed = BankStatementExtractionSchema.parse(json);
    } catch {
      throw new Error(
        `Failed to parse bank statement extraction response: ${rawResponse.slice(0, 200)}`,
      );
    }

    const validationErrors = this.validator.validate(parsed);
    const confidenceScore = parsed.confidence.overall;

    this.logger.log(`Bank statement extraction complete. Confidence: ${confidenceScore}%`);

    return {
      promptVersion: BANK_STATEMENT_PROMPT_VERSION,
      rawResponse,
      parsed,
      validationErrors,
      confidenceScore,
    };
  }
}
