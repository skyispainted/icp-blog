const { minify } = require('html-minifier-terser');
const CleanCSS = require('clean-css');
const { minify: terserMinify } = require('terser');
const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, 'index.html');
const outputFile = path.join(__dirname, 'index.min.html');

const cleanCss = new CleanCSS({ level: 2, compatibility: '*' });

async function minifyHtml() {
    try {
        let html = fs.readFileSync(inputFile, 'utf8');

        // 1. 压缩CSS
        html = html.replace(/<style>([\s\S]*?)<\/style>/gi, (match, css) => {
            const result = cleanCss.minify(css);
            return `<style>${result.styles}</style>`;
        });

        // 2. 压缩JS
        const scriptMatches = html.match(/<script>([\s\S]*?)<\/script>/gi);
        if (scriptMatches) {
            for (const match of scriptMatches) {
                const js = match.replace(/<script>|<\/script>/gi, '');
                try {
                    const minified = await terserMinify(js, {
                        compress: { dead_code: true, unused: true },
                        mangle: true,
                        format: { comments: false }
                    });
                    html = html.replace(match, `<script>${minified.code}</script>`);
                } catch (e) {
                    console.log('JS压缩失败，保留原样');
                }
            }
        }

        // 3. 压缩HTML
        const minified = await minify(html, {
            collapseWhitespace: true,
            removeComments: true,
            removeRedundantAttributes: true,
            removeEmptyAttributes: true,
            collapseBooleanAttributes: true
        });

        fs.writeFileSync(outputFile, minified, 'utf8');

        const originalSize = fs.statSync(inputFile).size;
        const minifiedSize = fs.statSync(outputFile).size;
        const savedPercent = ((originalSize - minifiedSize) / originalSize * 100).toFixed(2);

        console.log(`✅ HTML已最小化`);
        console.log(`   原文件: ${(originalSize / 1024).toFixed(2)} KB`);
        console.log(`   输出: ${(minifiedSize / 1024).toFixed(2)} KB`);
        console.log(`   减少: ${savedPercent}%`);
    } catch (err) {
        console.error('❌ 错误:', err);
    }
}

minifyHtml();