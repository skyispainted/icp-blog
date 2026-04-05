const { minify } = require('html-minifier-terser');
const CleanCSS = require('clean-css');
const { minify: terserMinify } = require('terser');
const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, 'index.html');
const outputFile = path.join(__dirname, 'index.min.html');

async function minifyJs(code) {
    const result = await terserMinify(code, {
        compress: {
            drop_console: false,
            dead_code: true,
            conditionals: true,
            evaluate: true,
            sequences: true,
            unused: true
        },
        mangle: true,
        format: {
            comments: false
        }
    });
    return result.code;
}

async function minifyHtml() {
    try {
        let html = fs.readFileSync(inputFile, 'utf8');

        // 1. 压缩内联CSS
        const cleanCss = new CleanCSS({
            level: 2,
            compatibility: '*',
            format: false
        });

        html = html.replace(/<style>([\s\S]*?)<\/style>/gi, async (match, css) => {
            const minifiedCss = cleanCss.minify(css).styles;
            return `<style>${minifiedCss}</style>`;
        });

        // 2. 压缩内联JS
        html = await html.replaceAsync(/<script>([\s\S]*?)<\/script>/gi, async (match, js) => {
            try {
                const minifiedJs = await minifyJs(js);
                return `<script>${minifiedJs}</script>`;
            } catch (e) {
                return match; // 如果压缩失败，保留原样
            }
        });

        // 3. 压缩HTML
        const minified = await minify(html, {
            collapseWhitespace: true,
            removeComments: true,
            removeRedundantAttributes: true,
            removeEmptyAttributes: true,
            removeOptionalTags: false,
            collapseBooleanAttributes: true,
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

// 为String添加replaceAsync方法
String.prototype.replaceAsync = async function(re, asyncCb) {
    const matches = [];
    this.replace(re, (match, ...args) => {
        matches.push({ match, args, offset: args[args.length - 2] });
        return match;
    });

    let result = this;
    for (const m of matches.reverse()) {
        const replacement = await asyncCb(m.match, ...m.args);
        result = result.slice(0, m.offset) + replacement + result.slice(m.offset + m.match.length);
    }
    return result;
};

minifyHtml();