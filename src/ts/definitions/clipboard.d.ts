interface Clipboard {
    copy(newClipText: string): void;
}

interface Window { Clipboard: Clipboard; }

