// Global variables
let timerInterval;
let timeRemaining = 50 * 60; // 50 minutes in seconds
let writingStartTime = null;
let currentCharCount = 0;
let uploadedImage = null;
let imageScale = 100;
let liveFormatFrame = null;

const topics = [
  '온라인 수업의 장단점',
  '환경 보호의 필요성',
  'SNS 사용의 문제점',
  '외국어 학습의 중요성',
  '재택근무의 장단점',
  '대학 등록금 인하에 대한 의견'
];

// DOM elements
const darkModeToggle = document.getElementById('darkModeToggle');
const nameInput = document.getElementById('nameInput');
const timerDisplay = document.getElementById('timer');
const newTopicBtn = document.getElementById('newTopicBtn');
const topicDisplay = document.getElementById('topic');
const imageDropArea = document.getElementById('imageDropArea');
const imageInput = document.getElementById('imageInput');
const dropPlaceholder = document.getElementById('dropPlaceholder');
const imagePreviewContainer = document.getElementById('imagePreviewContainer');
const imagePreview = document.getElementById('imagePreview');
const imageResize = document.getElementById('imageResize');
const removeImageBtn = document.getElementById('removeImageBtn');
const mainWritingArea = document.getElementById('mainWritingArea');
const formatBtn = document.getElementById('formatBtn');
const gridContainer = document.getElementById('gridContainer');
const charCount = document.getElementById('charCount');
const warning = document.getElementById('warning');
const writingTime = document.getElementById('writingTime');
const totalChars = document.getElementById('totalChars');
const charsPerMin = document.getElementById('charsPerMin');
const exportPdfBtn = document.getElementById('exportPdfBtn');
const exportImageBtn = document.getElementById('exportImageBtn');

// Constants
const COLS = 20;
const ROWS = 15;
const TOTAL = COLS * ROWS;

// Initialize
function init() {
  createGrid();
  startTimer();
  loadDarkMode();
  setupEventListeners();
  updateCharCount();
  formatToGrid({ silent: true });

  if (nameInput) {
    nameInput.value = '운 보라 (UN BORA )';
  }
}

// Dark mode
function loadDarkMode() {
  const isDark = localStorage.getItem('darkMode') === 'true';
  if (isDark) {
    document.body.classList.add('dark-mode');
    if (darkModeToggle) darkModeToggle.textContent = '☀️';
  }
}

if (darkModeToggle) {
  darkModeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    darkModeToggle.textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('darkMode', isDark);
  });
}

// Timer
function startTimer() {
  timerInterval = setInterval(() => {
    timeRemaining--;
    updateTimerDisplay();

    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      alert('시간이 종료되었습니다!');
    }
  }, 1000);
}

function updateTimerDisplay() {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  if (timeRemaining <= 300) {
    timerDisplay.style.color = '#e74c3c';
  }
}

// Topic
if (newTopicBtn) {
  newTopicBtn.addEventListener('click', () => {
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
    topicDisplay.textContent = randomTopic;
  });
}

// Event listeners
function setupEventListeners() {
  if (imageDropArea) {
    imageDropArea.addEventListener('click', () => {
      if (!uploadedImage && imageInput) imageInput.click();
    });

    imageDropArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      imageDropArea.classList.add('drag-over');
    });

    imageDropArea.addEventListener('dragleave', () => {
      imageDropArea.classList.remove('drag-over');
    });

    imageDropArea.addEventListener('drop', (e) => {
      e.preventDefault();
      imageDropArea.classList.remove('drag-over');

      const files = e.dataTransfer.files;
      if (files.length > 0) handleImageFile(files[0]);
    });
  }

  if (imageInput) {
    imageInput.addEventListener('change', handleImageSelect);
  }

  if (imageResize) {
    imageResize.addEventListener('input', (e) => {
      imageScale = e.target.value;
      if (imagePreview) {
        imagePreview.style.transform = `scale(${imageScale / 100})`;
      }
    });
  }

  if (removeImageBtn) {
    removeImageBtn.addEventListener('click', () => {
      uploadedImage = null;
      if (imagePreview) imagePreview.src = '';
      if (dropPlaceholder) dropPlaceholder.style.display = 'block';
      if (imagePreviewContainer) imagePreviewContainer.style.display = 'none';
      if (imageInput) imageInput.value = '';
      imageScale = 100;
      if (imageResize) imageResize.value = 100;
    });
  }

  if (mainWritingArea) {
    // live formatting while typing
    mainWritingArea.addEventListener('input', () => {
      if (!writingStartTime) writingStartTime = Date.now();
      updateCharCount();
      scheduleLiveFormat();
    });

    // Korean IME support
    mainWritingArea.addEventListener('compositionend', () => {
      updateCharCount();
      scheduleLiveFormat();
    });
  }

  if (formatBtn) {
    formatBtn.addEventListener('click', () => {
      formatToGrid({ silent: false });
    });
  }
}

function handleImageSelect(e) {
  const file = e.target.files[0];
  if (file) handleImageFile(file);
}

function handleImageFile(file) {
  if (!file.type.match('image/(png|jpeg|jpg)')) {
    alert('PNG, JPG, JPEG 파일만 업로드 가능합니다.');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    uploadedImage = e.target.result;
    if (imagePreview) imagePreview.src = uploadedImage;
    if (dropPlaceholder) dropPlaceholder.style.display = 'none';
    if (imagePreviewContainer) imagePreviewContainer.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

// Grid creation
function createGrid() {
  if (!gridContainer) return;

  gridContainer.innerHTML = '';

  for (let i = 0; i < TOTAL; i++) {
    const cell = document.createElement('div');
    cell.className = 'grid-cell';

    // first column visual hint
    if (i % COLS === 0) {
      cell.classList.add('indent-col');
    }

    const span = document.createElement('span');
    cell.appendChild(span);
    gridContainer.appendChild(cell);
  }
}

// Real-time formatting scheduler
function scheduleLiveFormat() {
  if (liveFormatFrame) cancelAnimationFrame(liveFormatFrame);

  liveFormatFrame = requestAnimationFrame(() => {
    formatToGrid({ silent: true });
    liveFormatFrame = null;
  });
}

// Tokenize text for 원고지 display
// Rules:
// - newline stays as its own token
// - continuous numbers split every 2 digits
//   600 -> ["60", "0"]
//   700 -> ["70", "0"]
//   2026 -> ["20", "26"]
function tokenizeText(text) {
  const tokens = [];
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    if (ch === '\n') {
      tokens.push('\n');
      i++;
      continue;
    }

    if (/\d/.test(ch)) {
      let num = '';
      while (i < text.length && /\d/.test(text[i])) {
        num += text[i];
        i++;
      }

      for (let j = 0; j < num.length; j += 2) {
        tokens.push(num.slice(j, j + 2));
      }
      continue;
    }

    tokens.push(ch);
    i++;
  }

  return tokens;
}

// 원고지 formatting
// - Textarea content is never changed
// - Enter => new paragraph with indent
// - Auto wrap => next row without indent
// - If a non-first row starts with a space, ignore that space
function formatToGrid(options = {}) {
  const { silent = false } = options;
  if (!mainWritingArea || !gridContainer) return;

  const text = mainWritingArea.value;
  const tokens = tokenizeText(text);
  const spans = gridContainer.querySelectorAll('.grid-cell span');

  const punctuationSet = new Set([
    '.', ',', '!', '?', '…', ';', ':', '·',
    '。', '，', '、', '~', '～'
  ]);

  // clear grid
  spans.forEach((span) => {
    span.textContent = '';
    span.classList.remove('punctuation');
    span.classList.remove('punc');
  });

  let row = 0;
  let col = 1; // first row of paragraph starts with indent
  let paragraphStart = true; // true at start and right after Enter

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    // newline = new paragraph
    if (token === '\n') {
      row += 1;
      if (row >= ROWS) break;
      col = 1;
      paragraphStart = true;
      continue;
    }

    // auto wrap = next row without indent
    if (col >= COLS) {
      row += 1;
      if (row >= ROWS) break;
      col = 0;
      paragraphStart = false;
    }

    // remove leading spaces at start of non-first rows
    // case 1: wrapped row starts with space => col === 0
    // case 2: user pressed Enter, then typed spaces after indent => paragraphStart === true and col >= 1
    if (token === ' ') {
      if ((row > 0 && col === 0) || paragraphStart) {
        continue;
      }
    }

    const idx = row * COLS + col;
    if (idx >= TOTAL) break;

    spans[idx].textContent = token;

    if (token.length === 1 && punctuationSet.has(token)) {
      spans[idx].classList.add('punctuation');
      spans[idx].classList.add('punc');
    }

    col += 1;
    paragraphStart = false;
  }

  if (!silent) {
    const previewSection = document.getElementById('gridPreviewSection');
    if (previewSection) {
      previewSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }
}

function updateCharCount() {
  if (!mainWritingArea) return;

  const text = mainWritingArea.value;
  currentCharCount = text.length;

  if (charCount) charCount.textContent = currentCharCount;
  if (totalChars) totalChars.textContent = `${currentCharCount}자`;

  if (warning) {
    if (currentCharCount > 0 && currentCharCount < 300) {
      warning.style.display = 'block';
    } else {
      warning.style.display = 'none';
    }
  }

  updateWritingStats();
}

// Writing statistics
function updateWritingStats() {
  if (!writingStartTime) return;

  const elapsed = Math.floor((Date.now() - writingStartTime) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  if (writingTime) writingTime.textContent = `${minutes}분 ${seconds}초`;

  if (elapsed > 0 && charsPerMin) {
    const cpm = Math.floor((currentCharCount / elapsed) * 60);
    charsPerMin.textContent = cpm;
  }
}

setInterval(updateWritingStats, 1000);

// Export to PDF
if (exportPdfBtn) {
  exportPdfBtn.addEventListener('click', async () => {
    formatToGrid({ silent: true });

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');

    const exportContainer = document.createElement('div');
    exportContainer.style.width = '210mm';
    exportContainer.style.padding = '20mm';
    exportContainer.style.background = 'white';
    exportContainer.style.position = 'absolute';
    exportContainer.style.left = '-9999px';
    document.body.appendChild(exportContainer);

    const name = nameInput ? (nameInput.value || '이름 없음') : '이름 없음';
    const topic = topicDisplay ? topicDisplay.textContent : '';
    const date = new Date().toLocaleDateString('ko-KR');

    exportContainer.innerHTML = `
      <div style="font-family: 'Noto Sans KR', sans-serif; color: #000;">
        <div style="border-bottom: 3px solid #000; padding-bottom: 10px; margin-bottom: 20px;">
          <h1 style="font-size: 24px; margin-bottom: 10px;">TOPIK II 53번 쓰기 연습</h1>
          <div style="display: flex; justify-content: space-between; font-size: 14px;">
            <div><strong>이름:</strong> ${name}</div>
            <div><strong>날짜:</strong> ${date}</div>
          </div>
        </div>

        <div style="margin-bottom: 20px; padding: 15px; background: #f5f5f5; border-left: 4px solid #3498db;">
          <p style="margin-bottom: 5px; font-size: 12px; color: #666;">다음 주제에 대해 200~300자로 자신의 의견을 쓰십시오.</p>
          <p style="font-size: 16px; font-weight: bold;">${topic}</p>
        </div>

        ${uploadedImage ? `<div style="text-align: center; margin-bottom: 20px;"><img src="${uploadedImage}" style="max-width: 100%; max-height: 200px; border-radius: 8px;"></div>` : ''}

        <div id="exportGrid" style="display: grid; grid-template-columns: repeat(20, 1fr); gap: 0; border: 2px solid #000; margin-bottom: 20px;"></div>

        <div style="text-align: right; font-size: 14px;">
          <strong>글자 수:</strong> ${currentCharCount} / 400자
        </div>
      </div>
    `;

    const exportGrid = exportContainer.querySelector('#exportGrid');
    const cells = gridContainer.querySelectorAll('.grid-cell span');

    for (let i = 0; i < TOTAL; i++) {
      const cell = document.createElement('div');
      cell.style.border = '1px solid #000';
      cell.style.aspectRatio = '1';
      cell.style.display = 'flex';
      cell.style.alignItems = 'center';
      cell.style.justifyContent = 'center';
      cell.style.fontSize = cells[i].textContent.length >= 2 ? '10px' : '12px';
      cell.textContent = cells[i].textContent;
      exportGrid.appendChild(cell);
    }

    const canvas = await html2canvas(exportContainer, {
      scale: 2,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(`TOPIK_II_53번_${name}_${date}.pdf`);

    document.body.removeChild(exportContainer);
  });
}

// Export to Image
if (exportImageBtn) {
  exportImageBtn.addEventListener('click', async () => {
    formatToGrid({ silent: true });

    const exportContainer = document.createElement('div');
    exportContainer.style.width = '1200px';
    exportContainer.style.padding = '40px';
    exportContainer.style.background = 'white';
    exportContainer.style.position = 'absolute';
    exportContainer.style.left = '-9999px';
    document.body.appendChild(exportContainer);

    const name = nameInput ? (nameInput.value || '이름 없음') : '이름 없음';
    const topic = topicDisplay ? topicDisplay.textContent : '';
    const date = new Date().toLocaleDateString('ko-KR');

    exportContainer.innerHTML = `
      <div style="font-family: 'Noto Sans KR', sans-serif; color: #000;">
        <div style="border-bottom: 3px solid #000; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="font-size: 36px; margin-bottom: 15px;">TOPIK II 53번 쓰기 연습</h1>
          <div style="display: flex; justify-content: space-between; font-size: 18px;">
            <div><strong>이름:</strong> ${name}</div>
            <div><strong>날짜:</strong> ${date}</div>
          </div>
        </div>

        <div style="margin-bottom: 30px; padding: 20px; background: #f5f5f5; border-left: 6px solid #3498db;">
          <p style="margin-bottom: 10px; font-size: 16px; color: #666;">다음 주제에 대해 600~700자로 자신의 의견을 쓰십시오.</p>
          <p style="font-size: 24px; font-weight: bold;">${topic}</p>
        </div>

        ${uploadedImage ? `<div style="text-align: center; margin-bottom: 30px;"><img src="${uploadedImage}" style="max-width: 100%; max-height: 300px; border-radius: 8px;"></div>` : ''}

        <div id="exportGrid" style="display: grid; grid-template-columns: repeat(20, 1fr); gap: 0; border: 2px solid #000; margin-bottom: 30px;"></div>

        <div style="text-align: right; font-size: 20px;">
          <strong>글자 수:</strong> ${currentCharCount} / 700자
        </div>
      </div>
    `;

    const exportGrid = exportContainer.querySelector('#exportGrid');
    const cells = gridContainer.querySelectorAll('.grid-cell span');

    for (let i = 0; i < TOTAL; i++) {
      const cell = document.createElement('div');
      cell.style.border = '1px solid #000';
      cell.style.aspectRatio = '1';
      cell.style.display = 'flex';
      cell.style.alignItems = 'center';
      cell.style.justifyContent = 'center';
      cell.style.fontSize = cells[i].textContent.length >= 2 ? '14px' : '18px';
      cell.textContent = cells[i].textContent;
      exportGrid.appendChild(cell);
    }

    const canvas = await html2canvas(exportContainer, {
      scale: 2,
      backgroundColor: '#ffffff'
    });

    const link = document.createElement('a');
    link.download = `TOPIK_II_53번_${name}_${date}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    document.body.removeChild(exportContainer);
  });
}

// Initialize on load
init();