// Type definitions for imagesLoaded 3.1.8+
// Project: https://github.com/desandro/imagesloaded
// Definitions by: Chris Charabaruk <http://github.com/coldacid>
// Definitions: https://github.com/borisyankov/DefinitelyTyped

///<reference path="jquery.d.ts" />

declare module ImagesLoaded {
  type ElementSelector = Element | NodeList | Array<Element> | string;

  /** interface for an image currently loading or completed */
  interface LoadingImage {
    img: HTMLImageElement;
    isLoaded: boolean;
  }

  interface ImagesLoadedOptions {
      debug?: boolean;
      background?: boolean;
  }

  interface ImagesLoadedCallback {
    (instance?: ImagesLoaded): void;
  }

  interface ImagesLoadedListener {
    (instance: ImagesLoaded, image?: LoadingImage): void;
  }

  interface ImagesLoaded {
    new (elem: ElementSelector, callback: ImagesLoadedCallback): ImagesLoaded;

    images: Array<LoadingImage>;
    progressedCount: number;
    isComplete: boolean;
    jqDeferred: JQueryDeferred<ImagesLoaded.ImagesLoaded>;

    // event listeners
    on(event: string, listener: ImagesLoadedListener): void;
    off(event: string, listener: ImagesLoadedListener): void;

    addImage(img: HTMLImageElement): void;
    addBackground(url: string, elem: HTMLElement): void;
  }

  interface ImagesLoadedConstructor {
    /**
     * Creates a new ImagesLoaded object with the provided callback
     * @param elem Element, NodeList, Element array, or selector string for images to watch
     * @param callback function triggered after all images have been loaded
     */
    (elem: ElementSelector, options?: ImagesLoadedOptions, callback?: ImagesLoadedCallback): ImagesLoaded;
  }
}

declare var imagesLoaded: ImagesLoaded.ImagesLoadedConstructor;

declare module 'imagesloaded' {
  export = imagesLoaded;
}

interface JQuery {
  imagesLoaded(callback?: ImagesLoaded.ImagesLoadedCallback): JQueryDeferred<ImagesLoaded.ImagesLoaded>;
}
