import { aiRepository } from '../../modules/ai/ai.repository';
import { AIService } from '../../modules/ai/ai.service';

// Chunking overlap settings
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

export class DocumentProcessor {
    /**
     * Process a resource title/summary and mock extract from URL if needed.
     * In a full production app, this would use a PDF/DOCX parser library.
     * For this MVP, we will use the title, summary, and mock content.
     */
    static async processResource(resourceId: string, title: string, summary: string, fileUrl: string) {
        try {
            console.log(`Starting document processing for resource ${resourceId}`);

            // 1. Gather text content to chunk
            // MVP: We combine title and summary as the primary searchable text, 
            // plus a contextual description since we aren't running proper OCR/PDF extraction
            const fullText = `
Resource Title: ${title}
Summary/Description: ${summary || "No description provided."}
File Link: ${fileUrl}
      `.trim();

            // 2. Chunk text
            const chunks = this.chunkText(fullText, CHUNK_SIZE, CHUNK_OVERLAP);

            // 3. Generate embeddings
            const dbChunks = [];
            for (let i = 0; i < chunks.length; i++) {
                const textChunk = chunks[i];
                const embedding = await AIService.embedText(textChunk);

                dbChunks.push({
                    resourceId,
                    chunkIndex: i,
                    content: textChunk,
                    embedding: embedding || undefined // falls back to no embedding if API fails
                });
            }

            // 4. Save to DB
            await aiRepository.insertDocumentChunks(dbChunks);
            console.log(`Successfully chunked and embedded ${chunks.length} segments for ${resourceId}`);

        } catch (err) {
            console.error(`Failed to process document ${resourceId}:`, err);
        }
    }

    static chunkText(text: string, size: number, overlap: number): string[] {
        const chunks: string[] = [];
        let i = 0;
        while (i < text.length) {
            chunks.push(text.substring(i, i + size));
            i += size - overlap;
        }
        return chunks;
    }
}
