import { Injectable, Logger } from '@nestjs/common';
import { ClaudeVisionService } from './claude-vision.service';
import { SalaryRegisterValidatorService } from '../validators/salary-register-validator.service';
import {
  SalaryRegisterExtractionSchema,
  SalaryRegisterExtraction,
} from '../validators/extraction-schemas';
import {
  SALARY_REGISTER_EXTRACTION_PROMPT,
  SALARY_REGISTER_PROMPT_VERSION,
} from '@finbridge/prompts';

export interface SalaryRegisterExtractionResult {
  promptVersion: string;
  rawResponse: string;
  parsed: SalaryRegisterExtraction;
  validationErrors: string[];
  confidenceScore: number;
}

@Injectable()
export class SalaryRegisterExtractionService {
  private readonly logger = new Logger(SalaryRegisterExtractionService.name);

  constructor(
    private readonly claudeVision: ClaudeVisionService,
    private readonly validator: SalaryRegisterValidatorService,
  ) {}

  async extract(filePath: string): Promise<SalaryRegisterExtractionResult> {
    const rawResponse = await this.claudeVision.analyzeImage(
      filePath,
      SALARY_REGISTER_EXTRACTION_PROMPT,
    );

    let parsed: SalaryRegisterExtraction;
    try {
      const json = JSON.parse(rawResponse);
      parsed = SalaryRegisterExtractionSchema.parse(json);
    } catch {
      throw new Error(
        `Failed to parse salary register extraction response: ${rawResponse.slice(0, 200)}`,
      );
    }

    const validationErrors = this.validator.validate(parsed);
    const confidenceScore = parsed.confidence.overall;

    this.logger.log(`Salary register extraction complete. Confidence: ${confidenceScore}%`);

    return {
      promptVersion: SALARY_REGISTER_PROMPT_VERSION,
      rawResponse,
      parsed,
      validationErrors,
      confidenceScore,
    };
  }
}
