export class StreamBuffer {
  private buffer: string = '';
  private onChunk: (chunk: string) => void;
  private minChunkSize: number;

  constructor(onChunk: (chunk: string) => void, minChunkSize: number = 100) {
    this.onChunk = onChunk;
    this.minChunkSize = minChunkSize;
  }

  add(text: string): void {
    this.buffer += text;
    this.tryFlush();
  }

  private tryFlush(): void {
    const sentenceEnders = ['. ', '.\n', '? ', '?\n', '! ', '!\n', ':\n', '\n\n'];

    for (const ender of sentenceEnders) {
      const lastIndex = this.buffer.lastIndexOf(ender);
      if (lastIndex !== -1 && lastIndex + ender.length <= this.buffer.length) {
        const chunk = this.buffer.substring(0, lastIndex + ender.length);
        if (chunk.length >= this.minChunkSize || this.buffer.includes('\n\n')) {
          this.onChunk(chunk);
          this.buffer = this.buffer.substring(lastIndex + ender.length);
          return;
        }
      }
    }

    if (this.buffer.length >= this.minChunkSize * 2) {
      const chunk = this.buffer;
      this.buffer = '';
      this.onChunk(chunk);
    }
  }

  flush(): void {
    if (this.buffer.length > 0) {
      this.onChunk(this.buffer);
      this.buffer = '';
    }
  }
}
