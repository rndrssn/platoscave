// Contract tests: the downloadable PDF CV exists and is linked from the CV views and the shared footer.
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function testPdfFileExists() {
  const pdfPath = path.join(root, 'cv', 'Robert-Andersson-CV.pdf');
  assert(fs.existsSync(pdfPath), 'cv/Robert-Andersson-CV.pdf is missing');
  const head = fs.readFileSync(pdfPath).subarray(0, 5).toString('latin1');
  assert(head === '%PDF-', 'cv/Robert-Andersson-CV.pdf is not a PDF file');
}

function testMastheadLinks() {
  const pages = [
    ['modules/experience-skill-graph/cv/index.html', '../../../cv/Robert-Andersson-CV.pdf'],
    ['modules/experience-skill-graph/index.html', '../../cv/Robert-Andersson-CV.pdf'],
  ];
  pages.forEach(([rel, href]) => {
    const html = read(rel);
    const link = html.match(/<a class="experience-skill-download[^"]*"[^>]*>/);
    assert(link, `${rel}: missing masthead PDF download link`);
    assert(link[0].includes(`href="${href}"`), `${rel}: PDF link should point to ${href}`);
    assert(/\sdownload[\s>]/.test(link[0]), `${rel}: PDF link should carry the download attribute`);
  });
}

function testFooterLink() {
  const js = read('js/nav-controller.js');
  assert(js.includes("rootPrefix + 'cv/Robert-Andersson-CV.pdf'"), 'Footer should link to the PDF CV');
  assert(js.includes("contact-social-link--pdf"), 'Footer PDF link should use the pdf icon class');
}

function testIconWired() {
  assert(fs.existsSync(path.join(root, 'assets', 'images', 'icons', 'pdf.svg')), 'pdf.svg icon is missing');
  assert(read('css/components/hero-cv.css').includes("icons/pdf.svg"), 'hero-cv.css should mask the pdf icon');
}

testPdfFileExists();
testMastheadLinks();
testFooterLink();
testIconWired();
console.log('PASS: test-cv-pdf-download-contract');
