import 'reflect-metadata';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { AppDataSource } from './data-source';
import { PlatformUser } from './entities/platform-user.entity';
import { Tenant } from './entities/tenant.entity';
import { Role } from './entities/role.entity';
import { UserTenant } from './entities/user-tenant.entity';
import { AccountingFirm } from './entities/accounting-firm.entity';
import { Company } from './entities/company.entity';
import { Upload } from './entities/upload.entity';
import { ExtractionJob } from './entities/extraction-job.entity';
import { ExtractionResult } from './entities/extraction-result.entity';
import { Invoice } from './entities/invoice.entity';
import { Review } from './entities/review.entity';
import { Transaction } from './entities/transaction.entity';
import { PaymentHead } from './entities/payment-head.entity';
import { PaymentSubHead } from './entities/payment-sub-head.entity';
import { BusinessTypeTemplate } from './entities/business-type-template.entity';
import {
  TenantType,
  BusinessType,
  ExtractionStatus,
  ReviewStatus,
  TransactionStatus,
  FileType,
} from './entities/enums';

dotenv.config({ path: '../../.env' });

const BCRYPT_ROUNDS = 10;
const DEFAULT_PASSWORD = 'Password@123';

async function hash(p: string): Promise<string> {
  return bcrypt.hash(p, BCRYPT_ROUNDS);
}

const PAYMENT_HEAD_TREES: Record<
  BusinessType,
  Array<{
    code: string;
    name: string;
    description: string;
    subHeads: Array<{ code: string; name: string }>;
  }>
> = {
  [BusinessType.MANUFACTURING]: [
    {
      code: 'RM',
      name: 'Raw Materials',
      description: 'Purchases of raw materials and inputs',
      subHeads: [
        { code: 'RM-01', name: 'Steel & Metal' },
        { code: 'RM-02', name: 'Plastic & Polymers' },
        { code: 'RM-03', name: 'Chemicals' },
        { code: 'RM-04', name: 'Packaging Materials' },
      ],
    },
    {
      code: 'OPS',
      name: 'Operations',
      description: 'Plant and factory operating expenses',
      subHeads: [
        { code: 'OPS-01', name: 'Electricity & Utilities' },
        { code: 'OPS-02', name: 'Machine Maintenance' },
        { code: 'OPS-03', name: 'Labor & Contract Work' },
      ],
    },
    {
      code: 'LOG',
      name: 'Logistics',
      description: 'Freight, shipping and warehousing',
      subHeads: [
        { code: 'LOG-01', name: 'Inbound Freight' },
        { code: 'LOG-02', name: 'Outbound Freight' },
        { code: 'LOG-03', name: 'Warehousing' },
      ],
    },
    {
      code: 'ADM',
      name: 'Administration',
      description: 'General and administrative expenses',
      subHeads: [
        { code: 'ADM-01', name: 'Office Supplies' },
        { code: 'ADM-02', name: 'Travel & Entertainment' },
        { code: 'ADM-03', name: 'Professional Fees' },
      ],
    },
  ],
  [BusinessType.IT_SERVICES]: [
    {
      code: 'INFRA',
      name: 'Infrastructure',
      description: 'Cloud, hosting and IT infrastructure',
      subHeads: [
        { code: 'INFRA-01', name: 'Cloud Services (AWS/GCP/Azure)' },
        { code: 'INFRA-02', name: 'Hosting & Domains' },
        { code: 'INFRA-03', name: 'Hardware Purchases' },
        { code: 'INFRA-04', name: 'Software Licenses' },
      ],
    },
    {
      code: 'HR',
      name: 'Human Resources',
      description: 'Payroll, recruitment and benefits',
      subHeads: [
        { code: 'HR-01', name: 'Salaries & Wages' },
        { code: 'HR-02', name: 'Contractor Payments' },
        { code: 'HR-03', name: 'Recruitment & Onboarding' },
        { code: 'HR-04', name: 'Training & Certifications' },
      ],
    },
    {
      code: 'MKT',
      name: 'Marketing',
      description: 'Sales and marketing expenditure',
      subHeads: [
        { code: 'MKT-01', name: 'Digital Advertising' },
        { code: 'MKT-02', name: 'Events & Conferences' },
        { code: 'MKT-03', name: 'PR & Communications' },
      ],
    },
    {
      code: 'OPS',
      name: 'Operations',
      description: 'Day-to-day operational expenses',
      subHeads: [
        { code: 'OPS-01', name: 'Office Rent & Utilities' },
        { code: 'OPS-02', name: 'Internet & Telecom' },
        { code: 'OPS-03', name: 'Professional Services' },
      ],
    },
  ],
  [BusinessType.CONSULTING]: [
    {
      code: 'PROJ',
      name: 'Project Costs',
      description: 'Direct costs per engagement',
      subHeads: [
        { code: 'PROJ-01', name: 'Consultant Fees' },
        { code: 'PROJ-02', name: 'Travel & Accommodation' },
        { code: 'PROJ-03', name: 'Research & Data' },
      ],
    },
    {
      code: 'OVER',
      name: 'Overhead',
      description: 'Firm overhead and fixed costs',
      subHeads: [
        { code: 'OVER-01', name: 'Office & Facilities' },
        { code: 'OVER-02', name: 'Technology Tools' },
        { code: 'OVER-03', name: 'Legal & Compliance' },
        { code: 'OVER-04', name: 'Insurance' },
      ],
    },
    {
      code: 'BDV',
      name: 'Business Development',
      description: 'Sales, marketing and BD costs',
      subHeads: [
        { code: 'BDV-01', name: 'Proposals & RFP Costs' },
        { code: 'BDV-02', name: 'Client Entertainment' },
        { code: 'BDV-03', name: 'Marketing Materials' },
      ],
    },
  ],
  [BusinessType.RETAIL]: [
    {
      code: 'COGS',
      name: 'Cost of Goods Sold',
      description: 'Direct merchandise costs',
      subHeads: [
        { code: 'COGS-01', name: 'Inventory Purchases' },
        { code: 'COGS-02', name: 'Import Duties & Taxes' },
        { code: 'COGS-03', name: 'Supplier Payments' },
      ],
    },
    {
      code: 'STORE',
      name: 'Store Operations',
      description: 'Retail store running costs',
      subHeads: [
        { code: 'STORE-01', name: 'Rent & CAM Charges' },
        { code: 'STORE-02', name: 'Utilities' },
        { code: 'STORE-03', name: 'Store Staff Wages' },
        { code: 'STORE-04', name: 'Store Fixtures & Maintenance' },
      ],
    },
    {
      code: 'MKTS',
      name: 'Marketing & Sales',
      description: 'Promotions and customer acquisition',
      subHeads: [
        { code: 'MKTS-01', name: 'Promotions & Discounts' },
        { code: 'MKTS-02', name: 'Advertising' },
        { code: 'MKTS-03', name: 'Loyalty Programme Costs' },
      ],
    },
    {
      code: 'LGST',
      name: 'Logistics & Fulfilment',
      description: 'Supply chain and delivery costs',
      subHeads: [
        { code: 'LGST-01', name: 'Warehousing' },
        { code: 'LGST-02', name: 'Last-Mile Delivery' },
        { code: 'LGST-03', name: 'Returns Handling' },
      ],
    },
  ],
};

const SAMPLE_VENDORS = [
  'Tech Solutions Pvt Ltd',
  'Global Supplies Co',
  'Metro Office Supplies',
  'CloudBase Technologies',
  'FastFreight Logistics',
  'Bright Digital Media',
  'Prime HR Consultants',
  'SecureNet Services',
  'DataMind Analytics',
  'Apex Manufacturing',
];

function randomAmount(min: number, max: number): string {
  return (Math.random() * (max - min) + min).toFixed(2);
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function main() {
  await AppDataSource.initialize();
  console.log('🌱  Starting seed...');

  const userRepo = AppDataSource.getRepository(PlatformUser);
  const tenantRepo = AppDataSource.getRepository(Tenant);
  const roleRepo = AppDataSource.getRepository(Role);
  const userTenantRepo = AppDataSource.getRepository(UserTenant);
  const firmRepo = AppDataSource.getRepository(AccountingFirm);
  const companyRepo = AppDataSource.getRepository(Company);
  const uploadRepo = AppDataSource.getRepository(Upload);
  const extractionJobRepo = AppDataSource.getRepository(ExtractionJob);
  const extractionResultRepo = AppDataSource.getRepository(ExtractionResult);
  const invoiceRepo = AppDataSource.getRepository(Invoice);
  const reviewRepo = AppDataSource.getRepository(Review);
  const transactionRepo = AppDataSource.getRepository(Transaction);
  const paymentHeadRepo = AppDataSource.getRepository(PaymentHead);
  const paymentSubHeadRepo = AppDataSource.getRepository(PaymentSubHead);
  const templateRepo = AppDataSource.getRepository(BusinessTypeTemplate);

  // ── Roles ────────────────────────────────────────────────────────────────────

  const roles = ['PLATFORM_ADMIN', 'ACCOUNTING_FIRM_ADMIN', 'ACCOUNTANT', 'COMPANY_USER'] as const;
  const descriptions = {
    PLATFORM_ADMIN: 'Full platform access',
    ACCOUNTING_FIRM_ADMIN: 'Manages accountants and companies in a firm',
    ACCOUNTANT: 'Reviews and approves extracted transactions',
    COMPANY_USER: 'Uploads invoices and views reports',
  };
  const roleMap: Record<string, Role> = {};
  for (const name of roles) {
    roleMap[name] =
      (await roleRepo.findOneBy({ name })) ??
      (await roleRepo.save(roleRepo.create({ name, description: descriptions[name] })));
  }
  console.log('  ✓ Roles');

  // ── Platform Tenant + Admin ───────────────────────────────────────────────────

  const platformTenant =
    (await tenantRepo.findOneBy({ type: TenantType.PLATFORM })) ??
    (await tenantRepo.save(
      tenantRepo.create({ type: TenantType.PLATFORM, name: 'FinBridge Platform' }),
    ));

  const adminUser =
    (await userRepo.findOneBy({ email: 'admin@finbridge.com' })) ??
    (await userRepo.save(
      userRepo.create({
        email: 'admin@finbridge.com',
        passwordHash: await hash(DEFAULT_PASSWORD),
        name: 'Platform Admin',
      }),
    ));

  if (!(await userTenantRepo.findOneBy({ userId: adminUser.id, tenantId: platformTenant.id }))) {
    await userTenantRepo.save(
      userTenantRepo.create({
        userId: adminUser.id,
        tenantId: platformTenant.id,
        roleId: roleMap['PLATFORM_ADMIN'].id,
      }),
    );
  }
  console.log('  ✓ Platform Admin user');

  // ── Accounting Firms ──────────────────────────────────────────────────────────

  const firm1Tenant =
    (await tenantRepo.findOneBy({
      name: 'Sharma & Associates',
      type: TenantType.ACCOUNTING_FIRM,
    })) ??
    (await tenantRepo.save(
      tenantRepo.create({
        type: TenantType.ACCOUNTING_FIRM,
        name: 'Sharma & Associates',
        parentTenantId: platformTenant.id,
      }),
    ));

  const firm1 =
    (await firmRepo.findOneBy({ contactEmail: 'contact@sharma-associates.com' })) ??
    (await firmRepo.save(
      firmRepo.create({
        tenantId: firm1Tenant.id,
        name: 'Sharma & Associates',
        gstNumber: '29AABCS1429B1Z1',
        contactEmail: 'contact@sharma-associates.com',
        contactPhone: '+91-9876543210',
        address: '42 MG Road, Bangalore 560001',
      }),
    ));

  const firm2Tenant =
    (await tenantRepo.findOneBy({
      name: 'Mehta Financial Services',
      type: TenantType.ACCOUNTING_FIRM,
    })) ??
    (await tenantRepo.save(
      tenantRepo.create({
        type: TenantType.ACCOUNTING_FIRM,
        name: 'Mehta Financial Services',
        parentTenantId: platformTenant.id,
      }),
    ));

  const firm2 =
    (await firmRepo.findOneBy({ contactEmail: 'info@mehta-financial.com' })) ??
    (await firmRepo.save(
      firmRepo.create({
        tenantId: firm2Tenant.id,
        name: 'Mehta Financial Services',
        gstNumber: '27AABCM2341C1Z5',
        contactEmail: 'info@mehta-financial.com',
        contactPhone: '+91-9867452310',
        address: '15 Nariman Point, Mumbai 400021',
      }),
    ));

  console.log('  ✓ Accounting firms');

  // ── Accountants ───────────────────────────────────────────────────────────────

  const accountantUser =
    (await userRepo.findOneBy({ email: 'accountant@finbridge.com' })) ??
    (await userRepo.save(
      userRepo.create({
        email: 'accountant@finbridge.com',
        passwordHash: await hash(DEFAULT_PASSWORD),
        name: 'Rajesh Sharma',
      }),
    ));
  if (!(await userTenantRepo.findOneBy({ userId: accountantUser.id, tenantId: firm1Tenant.id }))) {
    await userTenantRepo.save(
      userTenantRepo.create({
        userId: accountantUser.id,
        tenantId: firm1Tenant.id,
        roleId: roleMap['ACCOUNTING_FIRM_ADMIN'].id,
      }),
    );
  }

  const extraDefs = [
    {
      email: 'priya@sharma-associates.com',
      name: 'Priya Nair',
      tenantId: firm1Tenant.id,
      role: 'ACCOUNTANT',
    },
    {
      email: 'amit@sharma-associates.com',
      name: 'Amit Kumar',
      tenantId: firm1Tenant.id,
      role: 'ACCOUNTANT',
    },
    {
      email: 'divya@mehta-financial.com',
      name: 'Divya Patel',
      tenantId: firm2Tenant.id,
      role: 'ACCOUNTANT',
    },
    {
      email: 'ravi@mehta-financial.com',
      name: 'Ravi Menon',
      tenantId: firm2Tenant.id,
      role: 'ACCOUNTANT',
    },
  ];
  const extraAccountants: PlatformUser[] = [];
  for (const def of extraDefs) {
    const u =
      (await userRepo.findOneBy({ email: def.email })) ??
      (await userRepo.save(
        userRepo.create({
          email: def.email,
          passwordHash: await hash(DEFAULT_PASSWORD),
          name: def.name,
        }),
      ));
    if (!(await userTenantRepo.findOneBy({ userId: u.id, tenantId: def.tenantId }))) {
      await userTenantRepo.save(
        userTenantRepo.create({
          userId: u.id,
          tenantId: def.tenantId,
          roleId: roleMap[def.role].id,
        }),
      );
    }
    extraAccountants.push(u);
  }
  console.log('  ✓ Accountant users');

  // ── Companies ─────────────────────────────────────────────────────────────────

  const company1Tenant =
    (await tenantRepo.findOneBy({ name: 'TechVision Solutions', type: TenantType.COMPANY })) ??
    (await tenantRepo.save(
      tenantRepo.create({
        type: TenantType.COMPANY,
        name: 'TechVision Solutions',
        parentTenantId: firm1Tenant.id,
      }),
    ));
  if (!(await companyRepo.findOneBy({ contactEmail: 'finance@techvision.in' }))) {
    await companyRepo.save(
      companyRepo.create({
        tenantId: company1Tenant.id,
        accountingFirmId: firm1.id,
        name: 'TechVision Solutions',
        gstNumber: '29AABCT9876D1Z3',
        businessType: BusinessType.IT_SERVICES,
        contactEmail: 'finance@techvision.in',
        contactPhone: '+91-9988776655',
        address: '7th Floor, Embassy Tech Village, Bangalore 560103',
      }),
    );
  }

  const company2Tenant =
    (await tenantRepo.findOneBy({ name: 'Sunrise Retail Pvt Ltd', type: TenantType.COMPANY })) ??
    (await tenantRepo.save(
      tenantRepo.create({
        type: TenantType.COMPANY,
        name: 'Sunrise Retail Pvt Ltd',
        parentTenantId: firm1Tenant.id,
      }),
    ));
  if (!(await companyRepo.findOneBy({ contactEmail: 'accounts@sunriseretail.com' }))) {
    await companyRepo.save(
      companyRepo.create({
        tenantId: company2Tenant.id,
        accountingFirmId: firm1.id,
        name: 'Sunrise Retail Pvt Ltd',
        gstNumber: '27AABCS7654E1Z8',
        businessType: BusinessType.RETAIL,
        contactEmail: 'accounts@sunriseretail.com',
        address: '103 Linking Road, Mumbai 400050',
      }),
    );
  }

  const company3Tenant =
    (await tenantRepo.findOneBy({ name: 'Apex Manufacturing Ltd', type: TenantType.COMPANY })) ??
    (await tenantRepo.save(
      tenantRepo.create({
        type: TenantType.COMPANY,
        name: 'Apex Manufacturing Ltd',
        parentTenantId: firm2Tenant.id,
      }),
    ));
  if (!(await companyRepo.findOneBy({ contactEmail: 'finance@apexmfg.com' }))) {
    await companyRepo.save(
      companyRepo.create({
        tenantId: company3Tenant.id,
        accountingFirmId: firm2.id,
        name: 'Apex Manufacturing Ltd',
        gstNumber: '24AABCA4321F1Z6',
        businessType: BusinessType.MANUFACTURING,
        contactEmail: 'finance@apexmfg.com',
        address: 'Plot 45, GIDC Industrial Estate, Ahmedabad 382330',
      }),
    );
  }
  console.log('  ✓ Companies');

  // ── Company User ───────────────────────────────────────────────────────────────

  const companyUser =
    (await userRepo.findOneBy({ email: 'user@company.com' })) ??
    (await userRepo.save(
      userRepo.create({
        email: 'user@company.com',
        passwordHash: await hash(DEFAULT_PASSWORD),
        name: 'Ananya Kapoor',
      }),
    ));
  if (!(await userTenantRepo.findOneBy({ userId: companyUser.id, tenantId: company1Tenant.id }))) {
    await userTenantRepo.save(
      userTenantRepo.create({
        userId: companyUser.id,
        tenantId: company1Tenant.id,
        roleId: roleMap['COMPANY_USER'].id,
      }),
    );
  }
  console.log('  ✓ Company user');

  // ── Business Type Templates ────────────────────────────────────────────────────

  for (const [btype, tree] of Object.entries(PAYMENT_HEAD_TREES)) {
    if (!(await templateRepo.findOneBy({ businessType: btype as BusinessType }))) {
      await templateRepo.save(
        templateRepo.create({
          businessType: btype as BusinessType,
          defaultTree: tree as unknown as Record<string, unknown>,
        }),
      );
    }
  }
  console.log('  ✓ Business type templates');

  // ── Payment Heads ──────────────────────────────────────────────────────────────

  const company1HeadMap: Record<
    string,
    { head: PaymentHead; subMap: Record<string, PaymentSubHead> }
  > = {};
  for (const hd of PAYMENT_HEAD_TREES[BusinessType.IT_SERVICES]) {
    const head =
      (await paymentHeadRepo.findOneBy({ tenantId: company1Tenant.id, code: hd.code })) ??
      (await paymentHeadRepo.save(
        paymentHeadRepo.create({
          tenantId: company1Tenant.id,
          code: hd.code,
          name: hd.name,
          description: hd.description,
        }),
      ));
    const subMap: Record<string, PaymentSubHead> = {};
    for (const sd of hd.subHeads) {
      subMap[sd.code] =
        (await paymentSubHeadRepo.findOneBy({ tenantId: company1Tenant.id, code: sd.code })) ??
        (await paymentSubHeadRepo.save(
          paymentSubHeadRepo.create({
            tenantId: company1Tenant.id,
            paymentHeadId: head.id,
            code: sd.code,
            name: sd.name,
          }),
        ));
    }
    company1HeadMap[hd.code] = { head, subMap };
  }

  const company2HeadMap: Record<
    string,
    { head: PaymentHead; subMap: Record<string, PaymentSubHead> }
  > = {};
  for (const hd of PAYMENT_HEAD_TREES[BusinessType.RETAIL]) {
    const head =
      (await paymentHeadRepo.findOneBy({ tenantId: company2Tenant.id, code: hd.code })) ??
      (await paymentHeadRepo.save(
        paymentHeadRepo.create({
          tenantId: company2Tenant.id,
          code: hd.code,
          name: hd.name,
          description: hd.description,
        }),
      ));
    const subMap: Record<string, PaymentSubHead> = {};
    for (const sd of hd.subHeads) {
      subMap[sd.code] =
        (await paymentSubHeadRepo.findOneBy({ tenantId: company2Tenant.id, code: sd.code })) ??
        (await paymentSubHeadRepo.save(
          paymentSubHeadRepo.create({
            tenantId: company2Tenant.id,
            paymentHeadId: head.id,
            code: sd.code,
            name: sd.name,
          }),
        ));
    }
    company2HeadMap[hd.code] = { head, subMap };
  }
  console.log('  ✓ Payment heads and sub-heads');

  // ── Sample Invoices ────────────────────────────────────────────────────────────

  type InvoiceScenario = {
    tenantId: string;
    uploadedBy: string;
    reviewedBy: string;
    reviewStatus: ReviewStatus;
    extractionStatus: ExtractionStatus;
    headCode: string;
    subHeadCode: string;
    headMap: typeof company1HeadMap;
  };

  const scenarios: InvoiceScenario[] = [
    ...Array(8)
      .fill(null)
      .map(() => ({
        tenantId: company1Tenant.id,
        uploadedBy: companyUser.id,
        reviewedBy: accountantUser.id,
        reviewStatus: ReviewStatus.APPROVED,
        extractionStatus: ExtractionStatus.COMPLETED,
        headCode: 'INFRA',
        subHeadCode: 'INFRA-01',
        headMap: company1HeadMap,
      })),
    ...Array(5)
      .fill(null)
      .map(() => ({
        tenantId: company1Tenant.id,
        uploadedBy: companyUser.id,
        reviewedBy: accountantUser.id,
        reviewStatus: ReviewStatus.PENDING,
        extractionStatus: ExtractionStatus.COMPLETED,
        headCode: 'INFRA',
        subHeadCode: 'INFRA-02',
        headMap: company1HeadMap,
      })),
    ...Array(3)
      .fill(null)
      .map(() => ({
        tenantId: company1Tenant.id,
        uploadedBy: companyUser.id,
        reviewedBy: accountantUser.id,
        reviewStatus: ReviewStatus.REJECTED,
        extractionStatus: ExtractionStatus.COMPLETED,
        headCode: 'HR',
        subHeadCode: 'HR-01',
        headMap: company1HeadMap,
      })),
    ...Array(4)
      .fill(null)
      .map(() => ({
        tenantId: company2Tenant.id,
        uploadedBy: companyUser.id,
        reviewedBy: extraAccountants[0].id,
        reviewStatus: ReviewStatus.APPROVED,
        extractionStatus: ExtractionStatus.COMPLETED,
        headCode: 'COGS',
        subHeadCode: 'COGS-01',
        headMap: company2HeadMap,
      })),
  ];

  let invoiceCount = 0;
  for (let i = 0; i < scenarios.length; i++) {
    const s = scenarios[i];
    const vendor = SAMPLE_VENDORS[i % SAMPLE_VENDORS.length];
    const subtotal = parseFloat(randomAmount(10000, 200000));
    const tax = parseFloat((subtotal * 0.18).toFixed(2));
    const total = parseFloat((subtotal + tax).toFixed(2));
    const invoiceDate = daysAgo(Math.floor(Math.random() * 90) + 1);

    const upload = await uploadRepo.save(
      uploadRepo.create({
        tenantId: s.tenantId,
        filePath: `/uploads/${s.tenantId}/invoice-sample-${i + 1}.pdf`,
        fileName: `invoice-${i + 1}.pdf`,
        fileSize: Math.floor(Math.random() * 500000) + 50000,
        mimeType: 'application/pdf',
        fileType: FileType.INVOICE,
        uploadedBy: s.uploadedBy,
        createdAt: daysAgo(Math.floor(Math.random() * 60) + 5),
      }),
    );

    const invoiceStatus =
      s.reviewStatus === ReviewStatus.APPROVED
        ? TransactionStatus.APPROVED
        : s.reviewStatus === ReviewStatus.REJECTED
          ? TransactionStatus.REJECTED
          : TransactionStatus.PENDING;

    const invoice = await invoiceRepo.save(
      invoiceRepo.create({
        tenantId: s.tenantId,
        uploadId: upload.id,
        vendorName: vendor,
        invoiceNumber: `INV-${2024000 + i + 1}`,
        invoiceDate,
        amount: total,
        subtotal,
        taxAmount: tax,
        currency: 'INR',
        status: invoiceStatus,
      }),
    );

    const extractionJob = await extractionJobRepo.save(
      extractionJobRepo.create({
        tenantId: s.tenantId,
        uploadId: upload.id,
        status: s.extractionStatus,
        promptVersion: 'invoice.extraction.v1',
      }),
    );

    const extractionResult = await extractionResultRepo.save(
      extractionResultRepo.create({
        extractionJobId: extractionJob.id,
        rawResponse: JSON.stringify({
          vendor_name: vendor,
          invoice_number: `INV-${2024000 + i + 1}`,
          total_amount: total,
        }),
        parsedResponse: {
          vendor_name: vendor,
          invoice_number: `INV-${2024000 + i + 1}`,
          invoice_date: invoiceDate.toISOString(),
          currency: 'INR',
          subtotal,
          tax_amount: tax,
          total_amount: total,
          confidence: 0.85 + Math.random() * 0.1,
        },
        confidenceScore: 85 + Math.random() * 10,
        validationErrors: [],
      }),
    );

    await reviewRepo.save(
      reviewRepo.create({
        tenantId: s.tenantId,
        extractionResultId: extractionResult.id,
        reviewedBy: s.reviewStatus !== ReviewStatus.PENDING ? s.reviewedBy : undefined,
        status: s.reviewStatus,
        rejectionReason:
          s.reviewStatus === ReviewStatus.REJECTED ? 'Duplicate invoice detected' : undefined,
        completedAt:
          s.reviewStatus !== ReviewStatus.PENDING
            ? daysAgo(Math.floor(Math.random() * 5))
            : undefined,
      }),
    );

    if (s.reviewStatus === ReviewStatus.APPROVED) {
      const { head, subMap } = s.headMap[s.headCode];
      const subHead = subMap[s.subHeadCode];
      await transactionRepo.save(
        transactionRepo.create({
          tenantId: s.tenantId,
          invoiceId: invoice.id,
          vendorName: vendor,
          amount: total,
          currency: 'INR',
          transactionDate: invoiceDate,
          paymentHeadId: head.id,
          paymentSubHeadId: subHead.id,
          status: TransactionStatus.APPROVED,
        }),
      );
    }
    invoiceCount++;
  }

  console.log(`  ✓ ${invoiceCount} sample invoices with extractions + reviews`);
  console.log('\n✅  Seed complete!\n');
  console.log('  Demo accounts:');
  console.log('  ┌─────────────────────────────────────────────────────────────┐');
  console.log('  │  admin@finbridge.com      Password@123  Platform Admin       │');
  console.log('  │  accountant@finbridge.com Password@123  Firm Admin (Firm 1)  │');
  console.log('  │  user@company.com         Password@123  Company User         │');
  console.log('  └─────────────────────────────────────────────────────────────┘');
}

main()
  .catch((e) => {
    console.error('❌  Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await AppDataSource.destroy();
  });
