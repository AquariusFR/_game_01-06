import * as _ from 'lodash';
import ImageToLoad from 'app/loader/image-to-load';

const baseUrl: String = './';

export default class LoaderImage {
	imagesToLoad: Array<ImageToLoad>;

	public callback: (loaded: Array<ImageToLoad>) => void;

	loadImages(imagesToLoad: Array<ImageToLoad>): Promise<Array<ImageToLoad>> {
		this.imagesToLoad = imagesToLoad;

		return new Promise<Array<ImageToLoad>>(execute);
		function execute(resolve) {


			function onProgress(img: string, imageEl: HTMLElement, index: number, id: string) {
				// fires every time an image is done or errors.
				// imageEl will be falsy if error
				console.log('just ' + (!imageEl ? 'failed: ' : 'loaded: ') + img);
			}
			function onComplete(loaded: Array<ImageToLoad>, errors: Array<string>): void {

				// fires when whole list is done. cache is primed.
				console.log('done', loaded);
				resolve(loaded);
			}
			let preloader = new Preloader(imagesToLoad, onProgress, onComplete);

		}
	}
}

interface Options {
	pipeline: boolean;
	auto: boolean;
}


class Preloader {
	options: Options;
	queue: Array<ImageToLoad>;
	completed: Array<ImageToLoad>;
	errors: Array<String>;

	onProgress: (src: string, image: HTMLElement, index: number, id: string) => void;
	onComplete: (loaded: Array<ImageToLoad>, errors: Array<string>) => void;

	constructor(imagesToLoad: Array<ImageToLoad>, onProgress: (src: string, image: HTMLElement, index: number, id: string) => void, onComplete: (loaded: Array<ImageToLoad>, errors: Array<string>) => void, option?: Options) {
		this.options = {
			pipeline: false,
			auto: true
		};

		this.onProgress = onProgress;
		this.onComplete = onComplete;

		this.addQueue(imagesToLoad);
		if (this.queue.length) {
			this.processQueue();
		}
	}

	addQueue(images: Array<ImageToLoad>): void {
		// stores a local array, dereferenced from original
		this.queue = images.slice();
	}

	reset(): void {
		// reset the arrays
		this.completed = [];
		this.errors = [];
	}


	processQueue(): void {

		let self = this;

		// process all queue items
		this.reset();

		if (!this.options.pipeline) {

			_(this.queue).forEach(function (value: String, index: number) {
				self.load(self.queue[index], index);
			});
		}
		else {
			this.load(this.queue[0], 0);
		}
	}


	load(imageObject: ImageToLoad, index): void {
		var src = imageObject.url,
			image: HTMLImageElement = new Image(),
			self = this, o = this.options;

		// set some event handlers
		image.onerror = image.onabort = function () {
			this.onerror = this.onabort = this.onload = null;

			self.errors.push(src);

			o.pipeline && self.loadNext(index);
		};

		image.onload = function () {
			this.onerror = this.onabort = this.onload = null;

			// store progress. this === image
			imageObject.result = image;
			self.completed.push(imageObject); // this.src may differ
			self.checkProgress.call(self, src, this, imageObject.name);
			o.pipeline && self.loadNext(index);
		};

		// actually load
		image.src = src;
	};

	loadNext(index): void {
		// when pipeline loading is enabled, calls next item
		index++;
		this.queue[index] && this.load(this.queue[index], index);
	}

	checkProgress(src: string, image: HTMLElement, id: string): void {
		// intermediate checker for queue remaining. not exported.
		// called on preLoader instance as scope
		var args = [];

		// call onProgress
		this.onProgress.call(this, src, image, this.completed.length, id);

		if (this.completed.length + this.errors.length === this.queue.length) {
			args.push(this.completed);
			this.errors.length && args.push(this.errors);
			this.onComplete(this.completed, []);
		}
	}
};