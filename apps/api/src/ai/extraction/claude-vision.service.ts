import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';

const CLAUDE_MODEL = 'claude-sonnet-4-5';
const MAX_RETRIES = 3;
const TIMEOUT_MS = 60000;

@Injectable()
export class ClaudeVisionService {
  private readonly client: Anthropic;
  private readonly logger = new Logger(ClaudeVisionService.name);

  constructor(private readonly config: ConfigService) {
    this.client = new Anthropic({
      apiKey: this.config.get<string>('ANTHROPIC_API_KEY'),
      timeout: TIMEOUT_MS,
    });
  }

  async analyzeImage(filePath: string, prompt: string): Promise<string> {
    const fileBuffer = fs.readFileSync(filePath);
    const base64 = fileBuffer.toString('base64');
    const ext = path.extname(filePath).toLowerCase();
    const isPdf = ext === '.pdf';
    const imageMediaType = ext === '.png' ? 'image/png' : 'image/jpeg';

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        // PDFs use type:'document'; images use type:'image' — different Anthropic API shapes
        const fileContent: Anthropic.MessageParam['content'][0] = isPdf
          ? ({
              type: 'document',
              source: { type: 'base64', media_type: 'application/pdf', data: base64 },
            } as Anthropic.DocumentBlockParam)
          : ({
              type: 'image',
              source: { type: 'base64', media_type: imageMediaType, data: base64 },
            } as Anthropic.ImageBlockParam);

        const response = await this.client.messages.create({
          model: CLAUDE_MODEL,
          max_tokens: 4096,
          messages: [
            {
              role: 'user',
              content: [fileContent, { type: 'text', text: prompt }],
            },
          ],
        });

        const content = response.content[0];
        if (content.type !== 'text') throw new Error('Unexpected response type from Claude');
        return content.text;
      } catch (err) {
        // Do not retry non-transient 4xx errors (bad key, invalid request, etc.)
        if (err instanceof Anthropic.APIError && err.status >= 400 && err.status < 500) {
          throw err;
        }
        lastError = err as Error;
        this.logger.warn(
          `Claude API attempt ${attempt}/${MAX_RETRIES} failed: ${lastError.message}`,
        );
        if (attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, 2 ** attempt * 1000));
        }
      }
    }

    throw lastError ?? new Error('Claude Vision API failed after all retries');
  }
}
