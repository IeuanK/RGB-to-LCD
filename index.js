const fs          = require("fs");
const ImageLoader = require("./imageloader");

const version  = '0.0.1';
let resolution = 100;

let output = 'output.png';

let silent = false;

if (process.argv.length < 3) {
	console.log("No file specified");
	process.exit(1);
}

const file = process.argv[2];

if (process.argv.indexOf('-h') > -1 || process.argv.indexOf('--help') > -1) {
	printHelp();
}

if (process.argv.indexOf('-v') > -1 || process.argv.indexOf('--version') > -1) {
	console.log(version);
	process.exit(0);
}

for (let i = 0; i < process.argv.length; i++) {
	let arg = process.argv[i];
	if (arg.indexOf('--resolution=') > -1) {
		resolution = parseInt(arg.split('=')[1], 10);
		if (resolution > 100) {
			console.error('Resolution must be between 1 and 100');
			process.exit(1);
		}
	}
	if (arg.indexOf('--output=') > -1) {
		output = arg.split('=')[1];
	}
	if (arg.indexOf('--silent') > -1 || arg.indexOf('-s') > -1) {
		silent = true;
	}
}

function printHelp() {
	const help = [
		"Usage: node index.js <input> [options]",
		"Options:",
		"  -h, --help  Show this help message and exit",
		"  -v, --version  Show the version and exit",
		"  -s, --silent  Don't print any messages",
		"  --resolution=5  Define the resolution of the image, 0-100, default is 50",
		"  --output=output.png  Define the output file, default is output.png",
	];
	console.log(help.join("\n"));
	process.exit(0);
}

let loader = new ImageLoader(file, resolution, output);
if (silent) {
	loader.silent = true;
}
loader.load();