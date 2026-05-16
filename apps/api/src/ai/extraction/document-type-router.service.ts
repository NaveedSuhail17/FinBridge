import { Injectable } from '@nestjs/common';
import { FileType } from '../../database/entities/enums';
import { DocumentClassification } from '../validators/extraction-schemas';
import { PaymentExtractionService, PaymentExtractionResult } from './payment-extraction.service';
import {
  SalaryRegisterExtractionService,
  SalaryRegisterExtractionResult,
} from './salary-register-extraction.service';
import {
  BankStatementExtractionService,
  BankStatementExtractionResult,
} from './bank-statement-extraction.service';

type ExtractionPayload =
  | { documentType: FileType.PAYMENT; result: PaymentExtractionResult }
  | { documentType: FileType.SALARY_REGISTER; result: SalaryRegisterExtractionResult }
  | { documentType: FileType.BANK_STATEMENT; result: BankStatementExtractionResult };

@Injectable()
export class DocumentTypeRouterService {
  constructor(
    private readonly paymentExtractor: PaymentExtractionService,
    private readonly salaryExtractor: SalaryRegisterExtractionService,
    private readonly bankExtractor: BankStatementExtractionService,
  ) {}

  async route(
    classification: DocumentClassification,
    filePath: string,
  ): Promise<ExtractionPayload> {
    switch (classification.document_type) {
      case 'PAYMENT': {
        const result = await this.paymentExtractor.extract(filePath);
        return { documentType: FileType.PAYMENT, result };
      }
      case 'SALARY_REGISTER': {
        const result = await this.salaryExtractor.extract(filePath);
        return { documentType: FileType.SALARY_REGISTER, result };
      }
      case 'BANK_STATEMENT': {
        const result = await this.bankExtractor.extract(filePath);
        return { documentType: FileType.BANK_STATEMENT, result };
      }
      default:
        throw new Error(
          `Unsupported document type for routing: ${classification.document_type}. Only INVOICE, PAYMENT, SALARY_REGISTER, BANK_STATEMENT are supported.`,
        );
    }
  }
}
