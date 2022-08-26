const fs   = require("fs");
const Jimp = require("jimp");

class ImageLoader {
	filename;
	resolution;

	sourceWidth  = 0;
	sourceHeight = 0;

	imageObject = null;

	sectionsX   = 1;
	sectionsY   = 1;
	sectionSize = 1;

	resFactor = 1;

	array = [];

	output = 'output.png';

	constructor(file, resolution, output) {
		this.filename   = file;
		this.resolution = resolution;
		this.output     = output;
	}

	load() {
		Jimp.read(this.filename).then(image => {
			this.sourceWidth  = image.getWidth();
			this.sourceHeight = image.getHeight();

			this.resFactor = this.resolution / 100;

			this.imageObject = image;
			this.sectionsX   = Math.floor(this.resFactor * this.sourceWidth);
			this.sectionsY   = Math.floor(this.resFactor * this.sourceHeight);

			this.sectionSize = Math.floor(this.sourceWidth / this.sectionsX);

			console.log([
				``,
				`Image loaded`,
				`Resolution: ${this.resolution}`,
				`Resolution factor: ${this.resFactor}`,
				`Sections: ${this.sectionsX}x${this.sectionsY}`,
				`Section size: ${this.sectionSize}`,
				`Source size: ${this.sourceWidth}x${this.sourceHeight}`,
			].join("\n"));

			this.getPixels(image);

			this.processArray();
		}).catch(err => {
			console.log(err);
		});
	}

	getPixels(image) {
		for (let y = 0; y < this.sectionsY; y++) {
			let xAr = [];
			for (let x = 0; x < this.sectionsX; x++) {
				let color = 0;
				if (this.sectionSize === 1) {
					color = image.getPixelColor(x * this.sectionSize, y * this.sectionSize);
				} else {
					color = this.getSectionAverage(image, x * this.sectionSize, y * this.sectionSize, this.sectionSize);
				}
				xAr.push(color);
			}
			this.array.push(xAr);
		}
	}

	getSectionAverage(image, x, y, section) {
		let r = [];
		let g = [];
		let b = [];
		for (let i = 0; i < section; i++) {
			for (let j = 0; j < section; j++) {
				let rgb = Jimp.intToRGBA(image.getPixelColor(x, y));
				r.push(rgb.r);
				g.push(rgb.g);
				b.push(rgb.b);
			}
		}
		let avgR = Math.floor(r.reduce((a, b) => a + b, 0) / r.length);
		let avgG = Math.floor(g.reduce((a, b) => a + b, 0) / g.length);
		let avgB = Math.floor(b.reduce((a, b) => a + b, 0) / b.length);
		return Jimp.rgbaToInt(avgR, avgG, avgB, 255);
	}

	processArray() {
		new Jimp(this.sectionsX * 3, this.sectionsY * 3, '#ffffff', (err, image) => {
			for (let y = 0; y < this.array.length; y++) {
				let xAr = this.array[y];
				for (let x = 0; x < xAr.length; x++) {
					let rgb = Jimp.intToRGBA(xAr[x]);
					let r   = rgb.r;
					let g   = rgb.g;
					let b   = rgb.b;

					let bg = 0;

					image.setPixelColor(Jimp.rgbaToInt(r, bg, bg, 255), x * 3, y * 3);
					image.setPixelColor(Jimp.rgbaToInt(r, bg, bg, 255), x * 3, (y * 3) + 1);
					image.setPixelColor(Jimp.rgbaToInt(r, bg, bg, 255), x * 3, (y * 3) + 2);
					image.setPixelColor(Jimp.rgbaToInt(bg, g, bg, 255), (x * 3) + 1, y * 3);
					image.setPixelColor(Jimp.rgbaToInt(bg, g, bg, 255), (x * 3) + 1, (y * 3) + 1);
					image.setPixelColor(Jimp.rgbaToInt(bg, g, bg, 255), (x * 3) + 1, (y * 3) + 2);
					image.setPixelColor(Jimp.rgbaToInt(bg, bg, b, 255), (x * 3) + 2, y * 3);
					image.setPixelColor(Jimp.rgbaToInt(bg, bg, b, 255), (x * 3) + 2, (y * 3) + 1);
					image.setPixelColor(Jimp.rgbaToInt(bg, bg, b, 255), (x * 3) + 2, (y * 3) + 2);
				}
			}
			image.write(this.output);
		});
	}
}

module.exports = ImageLoader;