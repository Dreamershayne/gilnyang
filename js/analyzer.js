// AI 품종 분석기 로직
// TODO: Claude Vision API 또는 Google Vision API 연동

const fileInput = document.getElementById("file-input");
const uploadArea = document.getElementById("upload-area");
const previewArea = document.getElementById("preview-area");
const previewImg = document.getElementById("preview-img");
const analyzeBtn = document.getElementById("analyze-btn");
const resultArea = document.getElementById("result-area");
const resultContent = document.getElementById("result-content");

// 파일 선택 시 미리보기
if (fileInput) {
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    showPreview(file);
  });
}

// 드래그 앤 드롭
if (uploadArea) {
  uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadArea.classList.add("dragover");
  });

  uploadArea.addEventListener("dragleave", () => {
    uploadArea.classList.remove("dragover");
  });

  uploadArea.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadArea.classList.remove("dragover");
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      showPreview(file);
    }
  });
}

function showPreview(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    previewImg.src = e.target.result;
    uploadArea.style.display = "none";
    previewArea.style.display = "block";
    resultArea.style.display = "none";
  };
  reader.readAsDataURL(file);
}

window.resetUpload = function () {
  uploadArea.style.display = "block";
  previewArea.style.display = "none";
  resultArea.style.display = "none";
  fileInput.value = "";
};

// 분석 버튼 클릭
if (analyzeBtn) {
  analyzeBtn.addEventListener("click", async () => {
    analyzeBtn.textContent = "분석 중...";
    analyzeBtn.disabled = true;

    // TODO: 실제 AI API 호출로 교체
    await new Promise((r) => setTimeout(r, 1500));

    const mockResult = {
      species: "고양이",
      breed: "코리안 숏헤어",
      confidence: 92,
      traits: ["활발함", "호기심 많음", "적응력 좋음"],
      care: "중간 정도의 털 관리가 필요하며, 실내 활동을 충분히 해주세요.",
    };

    showResult(mockResult);
    analyzeBtn.textContent = "분석 시작하기";
    analyzeBtn.disabled = false;
  });
}

function showResult(result) {
  resultContent.innerHTML = `
    <div style="display:flex; align-items:center; gap:16px; margin-bottom:20px;">
      <div style="font-size:48px;">${result.species === "고양이" ? "🐱" : "🐶"}</div>
      <div>
        <p style="font-size:22px; font-weight:800;">${result.breed}</p>
        <p style="color:var(--color-text-muted); font-size:14px;">신뢰도 ${result.confidence}%</p>
      </div>
    </div>
    <div style="margin-bottom:16px;">
      <p style="font-size:14px; font-weight:600; margin-bottom:8px;">특징</p>
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        ${result.traits.map((t) => `<span class="badge badge--green">${t}</span>`).join("")}
      </div>
    </div>
    <div>
      <p style="font-size:14px; font-weight:600; margin-bottom:6px;">케어 가이드</p>
      <p style="font-size:14px; color:var(--color-text-muted); line-height:1.7;">${result.care}</p>
    </div>
    <div style="margin-top:20px; padding-top:20px; border-top:1px solid var(--color-border);">
      <a href="/pages/recommend.html" class="btn btn--primary">이 품종 맞춤 제품 추천받기</a>
    </div>
  `;
  resultArea.style.display = "block";
}
