// AI 품종 분석기 — Teachable Machine 모델 KgZ4uZ8Et
const MODEL_URL = 'https://teachablemachine.withgoogle.com/models/KgZ4uZ8Et/';

let model = null;

// 모델 로드
async function loadModel() {
  try {
    model = await tmImage.load(MODEL_URL + 'model.json', MODEL_URL + 'metadata.json');
    document.getElementById('model-loading').style.display = 'none';
  } catch (e) {
    document.getElementById('model-loading').textContent = '❌ AI 모델 로드 실패. 페이지를 새로고침해 주세요.';
    console.error('모델 로드 오류:', e);
  }
}

// 파일 선택 처리
document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('file-input');
  const uploadArea = document.getElementById('upload-area');
  const previewArea = document.getElementById('preview-area');
  const previewImg = document.getElementById('preview-img');
  const analyzeBtn = document.getElementById('analyze-btn');

  // 파일 선택
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) showPreview(file);
  });

  // 드래그 앤 드롭
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
  });
  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');
  });
  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) showPreview(file);
  });

  // 분석 버튼
  analyzeBtn.addEventListener('click', analyze);

  // 모델 로드 시작
  loadModel();
});

function showPreview(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const previewImg = document.getElementById('preview-img');
    previewImg.src = e.target.result;
    document.getElementById('upload-area').style.display = 'none';
    document.getElementById('preview-area').style.display = 'block';
    document.getElementById('result-area').style.display = 'none';
  };
  reader.readAsDataURL(file);
}

function resetUpload() {
  document.getElementById('upload-area').style.display = 'block';
  document.getElementById('preview-area').style.display = 'none';
  document.getElementById('result-area').style.display = 'none';
  document.getElementById('file-input').value = '';
  document.getElementById('preview-img').src = '';
}

async function analyze() {
  if (!model) {
    alert('AI 모델을 아직 불러오는 중입니다. 잠시 후 다시 시도해 주세요.');
    return;
  }

  const img = document.getElementById('preview-img');
  const analyzeBtn = document.getElementById('analyze-btn');

  analyzeBtn.disabled = true;
  analyzeBtn.textContent = '분석 중...';

  try {
    const predictions = await model.predict(img);

    // 확률 내림차순 정렬
    predictions.sort((a, b) => b.probability - a.probability);

    displayResults(predictions);
  } catch (e) {
    console.error('분석 오류:', e);
    alert('분석 중 오류가 발생했습니다. 다시 시도해 주세요.');
  } finally {
    analyzeBtn.disabled = false;
    analyzeBtn.textContent = '분석 시작하기';
  }
}

function displayResults(predictions) {
  const resultArea = document.getElementById('result-area');
  const resultContent = document.getElementById('result-content');
  const resultBars = document.getElementById('result-bars');

  const top = predictions[0];
  const topPct = Math.round(top.probability * 100);

  // 상단 1등 결과
  resultContent.innerHTML = `
    <div style="display:flex; align-items:center; gap:16px; flex-wrap:wrap;">
      <div style="font-size:48px;">🐱</div>
      <div>
        <p style="font-size:24px; font-weight:700; color:var(--color-primary); margin:0 0 4px;">${top.className}</p>
        <p style="font-size:15px; color:var(--color-text-muted); margin:0;">일치율 <strong style="color:var(--color-primary);">${topPct}%</strong></p>
      </div>
    </div>
    ${topPct < 50 ? '<p style="margin-top:14px; font-size:13px; color:var(--color-text-muted);">⚠️ 사진이 불명확하거나 학습되지 않은 품종일 수 있어요.</p>' : ''}
  `;

  // 전체 확률 바
  resultBars.innerHTML = predictions.map((p) => {
    const pct = Math.round(p.probability * 100);
    const isTop = p === predictions[0];
    return `
      <div style="margin-bottom:12px;">
        <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
          <span style="font-size:13px; font-weight:${isTop ? '700' : '400'}; color:${isTop ? 'var(--color-primary)' : 'var(--color-text)'};">${p.className}</span>
          <span style="font-size:13px; color:var(--color-text-muted);">${pct}%</span>
        </div>
        <div style="height:6px; background:var(--color-surface-2, #f0f0f0); border-radius:999px; overflow:hidden;">
          <div style="height:100%; width:${pct}%; background:${isTop ? 'var(--color-primary)' : 'var(--color-border, #ccc)'}; border-radius:999px; transition:width .6s ease;"></div>
        </div>
      </div>
    `;
  }).join('');

  resultArea.style.display = 'block';
  resultArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
