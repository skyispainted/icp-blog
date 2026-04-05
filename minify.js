const { minify } = require('html-minifier-terser');
const CleanCSS = require('clean-css');
const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, 'index.html');
const outputFile = path.join(__dirname, 'index.min.html');

async function minifyHtml() {
    try {
        let html = fs.readFileSync(inputFile, 'utf8');

        // 先压缩内联CSS
        const cleanCss = new CleanCSS({
            level: 2,
            compatibility: '*',
            format: false
        });

        // 提取并压缩所有<style>标签内的CSS
        html = html.replace(/<style>([\s\S]*?)<\/style>/gi, (match, css) => {
            const minifiedCss = cleanCss.minify(css).styles;
            return `<style>${minifiedCss}</style>`;
        });

        // 然后压缩HTML
        const minified = await minify(html, {
            collapseWhitespace: true,
            removeComments: true,
            removeRedundantAttributes: true,
            removeEmptyAttributes: true,
            removeOptionalTags: false,
            collapseBooleanAttributes: true,
            minifyJs: true,
            useShortDoctype: true,
            removeAttributeQuotes: true,
            removeTagWhitespace: true,
            sortAttributes: true,
            sortClassName: true
        });

        fs.writeFileSync(outputFile, minified, 'utf8');

        const originalSize = fs.statSync(inputFile).size;
        const minifiedSize = fs.statSync(outputFile).size;
        const savedPercent = ((originalSize - minifiedSize) / originalSize * 100).toFixed(2);

        console.log(`✅ HTML已最小化`);
        console.log(`   原文件: ${inputFile} (${(originalSize / 1024).toFixed(2)} KB)`);
        console.log(`   输出: ${outputFile} (${(minifiedSize / 1024).toFixed(2)} KB)`);
        console.log(`   减少: ${savedPercent}%`);
    } catch (err) {
        console.error('❌ 错误:', err.message);
    }
}

minifyHtml();