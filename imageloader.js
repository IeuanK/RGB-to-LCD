const fs          = require("fs");
const Jimp        = require("jimp");
const cliProgress = require('cli-progress');

class ImageLoader {
	filename;
	resolution;

	sourceWidth  = 0;
	sourceHeight = 0;

	imageObject = null;

	targetWidth  = 1;
	targetHeight = 1;
	sectionSize  = 1;

	resFactor = 1;

	array = [];

	output = 'output.png';

	silent = false;

	constructor(file, resolution, output) {
		this.filename   = file;
		this.resolution = resolution;
		this.output     = output;
	}


	logMessage(...message) {
		if (!this.silent) {
			console.log(...message);
		}
	}

	logError(...message) {
		if (!this.silent) {
			console.error(...message);
		}
	}

	load() {
		this.logMessage(`\n[Loading ${this.filename}]`);
		Jimp.read(this.filename).then(image => {
			this.imageObject = image;


			this.sourceWidth  = image.getWidth();
			this.sourceHeight = image.getHeight();

			this.resFactor = this.resolution / 100;

			this.targetWidth  = Math.floor(this.resFactor * this.sourceWidth);
			this.targetHeight = Math.floor(this.resFactor * this.sourceHeight);

			this.logMessage([
				`Image loaded`,
				`Resolution: ${this.resolution}`,
				`Resolution factor: ${this.resFactor}`,
				`Sections: ${this.targetWidth}x${this.targetHeight}`,
				`Section size: ${this.sectionSize}`,
				`Source size: ${this.sourceWidth}x${this.sourceHeight}`,
			].join("\n"));

			this.logMessage('Getting pixels');
			this.getPixels(image);

			this.logMessage('Generating output');
			this.processArray();
		}).catch(err => {
			this.logMessage(err);
		});
	}

	getPixels(image) {
		if (this.resFactor < 1) {
			image = image.resize(this.targetWidth, this.targetHeight);
		}

		let multibar = new cliProgress.MultiBar({
			clearOnComplete: false,
			hideCursor:      true

		}, cliProgress.Presets.legacy);


		let yProgress = multibar.create(this.targetHeight, 0);
		let xProgress = multibar.create(this.targetWidth, 0);

		for (let y = 0; y < this.targetHeight; y++) {
			let xAr = [];

			yProgress.update(y);

			for (let x = 0; x < this.targetWidth; x++) {
				xProgress.update(x);

				let color = 0;
				color     = image.getPixelColor(x * this.sectionSize, y * this.sectionSize);
				xAr.push(color);
			}

			this.array.push(xAr);
		}

		multibar.stop();
	}

	processArray() {
		const scaleFactor = 3;
		let multibar  = new cliProgress.MultiBar({
			clearOnComplete: false,
			hideCursor:      true

		}, cliProgress.Presets.legacy);
		let yProgress = multibar.create(this.targetHeight, 0);
		let xProgress = multibar.create(this.targetWidth, 0);

		new Jimp(this.targetWidth * scaleFactor, this.targetHeight * scaleFactor, '#ffffff', (err, image) => {
			for (let y = 0; y < this.array.length; y++) {
				yProgress.update(y);
				let xAr = this.array[y];
				for (let x = 0; x < xAr.length; x++) {
					xProgress.update(x);
					let rgb = Jimp.intToRGBA(xAr[x]);
					let r   = rgb.r;
					let g   = rgb.g;
					let b   = rgb.b;

					let bg = {
						r: 0,
						g: 0,
						b: 0
					};

					// Set R color
					image.setPixelColor(Jimp.rgbaToInt(r, bg.g, bg.b, 255), x * scaleFactor, y * scaleFactor);
					image.setPixelColor(Jimp.rgbaToInt(r, bg.g, bg.b, 255), x * scaleFactor, (y * scaleFactor) + 1);
					image.setPixelColor(Jimp.rgbaToInt(r, bg.g, bg.b, 255), x * scaleFactor, (y * scaleFactor) + 2);

					// Set B color
					image.setPixelColor(Jimp.rgbaToInt(bg.r, g, bg.b, 255), (x * scaleFactor) + 1, y * scaleFactor);
					image.setPixelColor(Jimp.rgbaToInt(bg.r, g, bg.b, 255), (x * scaleFactor) + 1, (y * scaleFactor) + 1);
					image.setPixelColor(Jimp.rgbaToInt(bg.r, g, bg.b, 255), (x * scaleFactor) + 1, (y * scaleFactor) + 2);

					// Set G color
					image.setPixelColor(Jimp.rgbaToInt(bg.r, bg.g, b, 255), (x * scaleFactor) + 2, y * scaleFactor);
					image.setPixelColor(Jimp.rgbaToInt(bg.r, bg.g, b, 255), (x * scaleFactor) + 2, (y * scaleFactor) + 1);
					image.setPixelColor(Jimp.rgbaToInt(bg.r, bg.g, b, 255), (x * scaleFactor) + 2, (y * scaleFactor) + 2);
				}
			}
			multibar.stop();
			this.logMessage('Saving image');
			image.write(this.output);

			this.logMessage('Image saved to ' + this.output);
		});
	}
}

module.exports = ImageLoader;