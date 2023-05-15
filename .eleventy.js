const pluginSitemap = require("@quasibit/eleventy-plugin-sitemap");
const pluginRss = require("@11ty/eleventy-plugin-rss");
const pluginNavigation = require("@11ty/eleventy-navigation");
const markdownIt = require("markdown-it");
const prettyData = require("pretty-data");
const htmlmin = require("html-minifier");
const linkedom = require("linkedom");

module.exports = function(eleventyConfig) {
	eleventyConfig.addPassthroughCopy('src/manifest.json');
	eleventyConfig.addPassthroughCopy("src/fonts");
	eleventyConfig.addPassthroughCopy({ "src/assets/*.{svg,jpg,png}": "assets" });
	eleventyConfig.addPassthroughCopy({ "src/assets/favicons/*.{svg,jpg,png,ico}": "assets/favicons" });
	eleventyConfig.addPassthroughCopy( "src/episodes/**/*.(gif|jpg|png|webp|svg)");
	eleventyConfig.addPassthroughCopy( "src/episodes/**/*.(mp3|m4a|wav|aac|ogg|aiff|wma|flac)");

	// Маркдаун
	let options = {
		html: true,
		breaks: true,
		linkify: true
	};
	eleventyConfig.setLibrary("md", markdownIt(options).disable("code"));

	// Sitemap
	eleventyConfig.addPlugin(pluginSitemap, {
		sitemap: {
			hostname: "https://inclusivepineapple.github.io/",
		},
	});

	// Навигация
	eleventyConfig.addPlugin(pluginNavigation);

	// RSS
	eleventyConfig.addPlugin(pluginRss);

	eleventyConfig.addTransform("xmlmin", function(content, outputPath) {
		if(outputPath && outputPath.endsWith(".xml")) {
			let result = prettyData.pd.xmlmin(content);
			return result;
		}
		return content;
	});

	// Даты
	eleventyConfig.addFilter("readableDate", (value) => {
		return value.toLocaleString("ru", {
			year: "numeric",
			month: "long",
			day: "numeric"
		}).replace(" г.", "");
	});

	eleventyConfig.addFilter("htmlDateString", (value) => {
		return value.toISOString();
	});

	// Сортировка
	eleventyConfig.addFilter("slice", (array, n) => {
		if( n < 0 ) {
			return array.slice(n);
		}

		return array.slice(0, n);
	});

	eleventyConfig.addFilter("min", (...numbers) => {
		return Math.min.apply(null, numbers);
	});

	// Трансформации
	eleventyConfig.addTransform("htmlmin", (content, outputPath) => {
		if(outputPath && outputPath.endsWith(".html")) {
			let result = htmlmin.minify(
				content, {
					removeComments: true,
					collapseWhitespace: true
				}
			);
			return result;
		}
		return content;
	});

	const htmlTransforms = [
		require('./src/transforms/title-id-transform.js')
	];

	eleventyConfig.addTransform('html-transform', async (content, outputPath) => {
		if (!outputPath || !outputPath.endsWith('.html')) {
			return content;
		}

		const window = linkedom.parseHTML(content);

		for (const transform of htmlTransforms) {
			await transform(window, content, outputPath);
		}

		return window.document.toString();
	})

	return {
		dir: {
			input: "src",
			output: "dist",
			includes: "_partials",
			layouts: "templates",
			data: "data",
		},
		dataTemplateEngine: "njk",
		markdownTemplateEngine: false,
		htmlTemplateEngine: "njk",
		passthroughFileCopy: true,
		templateFormats: [
			"md",
			"njk",
		],
	};
};
