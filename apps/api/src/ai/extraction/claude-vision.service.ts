import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';

const CLAUDE_MODEL = 'claude-opus-4-7';
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
    const mediaType =
      ext === '.pdf' ? 'application/pdf' : ext === '.png' ? 'image/png' : 'image/jpeg';

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await this.client.messages.create({
          model: CLAUDE_MODEL,
          max_tokens: 4096,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: mediaType as
                      | 'image/png'
                      | 'image/jpeg'
                      | 'image/gif'
                      | 'image/webp',
                    data: base64,
                  },
                },
                { type: 'text', text: prompt },
              ],
            },
          ],
        });

        const content = response.content[0];
        if (content.type !== 'text') throw new Error('Unexpected response type from Claude');
        return content.text;
      } catch (err) {
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
