// ===== Teachable Machine 고양이 품종 분석기 =====
const MODEL_URL = "https://teachablemachine.withgoogle.com/models/qZJNJSKNK/";

// 품종별 상세 정보
const BREED_INFO = {
  "브리티시 쇼트헤어(British Shorthair)": {
    emoji: "🐱",
    traits: ["온순함", "독립적", "조용함"],
    care: "주 2~3회 빗질이 필요합니다. 비만에 취약하니 식이 관리에 신경 써주세요. 조용하고 안정적인 환경을 좋아합니다.",
  },
  "아메리칸 쇼트헤어(American Shorthair)": {
    emoji: "🐱",
    traits: ["활발함", "사교적", "건강함"],
    care: "적당한 운동과 놀이가 필요합니다. 털 빠짐이 적어 관리가 수월한 편입니다.",
  },
  "러시안 블루(Russian Blue)": {
    emoji: "🐱",
    traits: ["예민함", "충성스러움", "조용함"],
    care: "낯선 환경에 예민하니 안정적인 루틴을 유지해주세요. 짧은 털이라 주 1회 빗질로 충분합니다.",
  },
  "샴(Siamese)": {
    emoji: "🐱",
    traits: ["수다스러움", "애정 많음", "지능적"],
    care: "관심과 상호작용을 매우 좋아합니다. 혼자 두는 시간을 최소화하고 장난감으로 지적 자극을 주세요.",
  },
  "페르시안(Persian)": {
    emoji: "🐱",
    traits: ["온화함", "조용함", "실내 적합"],
    care: "매일 빗질이 필수입니다. 얼굴 주름 사이를 자주 닦아주고, 눈 분비물 관리에 신경 써주세요.",
  },
  "메인쿤(Maine Coon)": {
    emoji: "🐱",
    traits: ["대형묘", "사교적", "장난기 많음"],
    care: "주 2~3회 빗질이 필요합니다. 대형 화장실과 충분한 운동 공간을 제공해주세요.",
  },
  "노르웨이숲(Norwegian Forest Cat)": {
    emoji: "🐱",
    traits: ["독립적", "활동적", "영리함"],
    care: "겨울에 털이 두꺼워지며 주 2~3회 빗질이 필요합니다. 높은 곳을 좋아하니 캣타워를 권장합니다.",
  },
  "스핑크스(Sphynx)": {
    emoji: "🐱",
    traits: ["애교 많음", "사교적", "체온 관리 필요"],
    care: "털이 없어 주 1회 목욕이 필요합니다. 추위에 약하니 실내 온도 관리가 중요합니다.",
  },
  "먼치킨(Munchkin)": {
    emoji: "🐱",
    traits: ["활발함", "호기심 많음", "적응력 좋음"],
    care: "짧은 다리지만 활동적입니다. 척추·관절 건강을 위해 낮은 가구 배치를 권장합니다.",
  },
  "뱅갈(Bengal)": {
    emoji: "🐱",
    traits: ["에너지 넘침", "지능적", "물 좋아함"],
    care: "운동량이 매우 많습니다. 퍼즐 장난감과 충분한 놀이 시간을 꼭 제공해주세요.",
  },
  "코리안 숏헤어-치즈태비(Orange Tabby)": {
    emoji: "🐈",
    traits: ["친화적", "식욕 왕성", "애교 많음"],
    care: "비만에 주의하며 식사량을 조절해주세요. 사람과 잘 어울리는 편입니다.",
  },
  "코리안 숏헤어-고등어태비(Mackerel Tabby)": {
    emoji: "🐈",
    traits: ["활발함", "영리함", "독립적"],
    care: "적당한 놀이와 스크래처를 제공해주세요. 건강하고 관리가 수월한 편입니다.",
  },
  "코리안숏헤어-올블랙(Solid Black)": {
    emoji: "🐈‍⬛",
    traits: ["신비로움", "영리함", "독립적"],
    care: "정기적인 빗질로 털 윤기를 유지해주세요. 건강하고 강한 체질을 가진 경우가 많습니다.",
  },
  "코리안숏헤어-턱시도(Tuxedo)": {
    emoji: "🐱",
    traits: ["사교적", "활발함", "애교 있음"],
    care: "주 1~2회 빗질로 충분합니다. 사람을 좋아하고 다묘 가정에도 잘 적응합니다.",
  },
  "코리안숏헤어-젖소(Cow Pattern)": {
    emoji: "🐱",
    traits: ["온순함", "적응력 좋음", "사교적"],
    care: "정기적인 빗질과 스크래처를 제공해주세요. 실내 생활에 잘 적응합니다.",
  },
  "코리안숏헤어-삼색(Calico)": {
    emoji: "🐱",
    traits: ["독립적", "영리함", "개성 강함"],
    care: "삼색이는 대부분 암컷입니다. 충분한 놀이와 개인 공간을 확보해주세요.",
  },
  "코리안숏헤어-카오스(Tortoiseshell)": {
    emoji: "🐱",
    traits: ["개성 강함", "애정 많음", "고집 있음"],
    care: "'토르티튜드'라 불리는 강한 개성이 있습니다. 일관된 방식으로 대해주세요.",
  },
  "코리안숏헤어-화이트(Solid White)": {
    emoji: "🐱",
    traits: ["우아함", "조용함", "청결함"],
    care: "흰 털 관리를 위해 주 1~2회 빗질을 권장합니다. 일부 흰 고양이는 청각에 유의가 필요합니다.",
  },
};

// ===== DOM 요소 =====
const fileInput = document.getElementById("file-input");
const uploadArea = document.getElementById("upload-area");
const previewArea = document.getElementById("preview-area");
const previewImg = document.getElementById("preview-img");
const analyzeBtn = document.getElementById("analyze-btn");
const resultArea = document.getElementById("result-area");
const resultContent = document.getElementById("result-content");
const resultBars = document.getElementById("result-bars");
const modelLoading = document.getElementById("model-loading");

let model = null;

// ===== 모델 로드 =====
async function loadModel() {
  try {
    model = await tmImage.load(MODEL_URL + "model.json", MODEL_URL + "metadata.json");
    if (modelLoading) modelLoading.style.display = "none";
  } catch (e) {
    if (modelLoading) modelLoading.textContent = "⚠️ 모델 로딩 실패. 페이지를 새로고침해주세요.";
    console.error("모델 로딩 오류:", e);
  }
}

loadModel();

// ===== 파일 선택 =====
if (fileInput) {
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) showPreview(file);
  });
}

// ===== 드래그 앤 드롭 =====
if (uploadArea) {
  uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadArea.classList.add("dragover");
  });
  uploadArea.addEventListener("dragleave", () => uploadArea.classList.remove("dragover"));
  uploadArea.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadArea.classList.remove("dragover");
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) showPreview(file);
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

// ===== 분석 실행 =====
if (analyzeBtn) {
  analyzeBtn.addEventListener("click", async () => {
    if (!model) {
      alert("AI 모델이 아직 로딩 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    analyzeBtn.textContent = "🤖 분석 중...";
    analyzeBtn.disabled = true;

    try {
      const predictions = await model.predict(previewImg);
      predictions.sort((a, b) => b.probability - a.probability);
      showResult(predictions);
    } catch (e) {
      console.error("분석 오류:", e);
      alert("분석 중 오류가 발생했습니다. 다른 사진으로 다시 시도해주세요.");
    }

    analyzeBtn.textContent = "다시 분석하기";
    analyzeBtn.disabled = false;
  });
}

// ===== 결과 표시 =====
function showResult(predictions) {
  const top = predictions[0];
  const topName = top.className;
  const topConf = Math.round(top.probability * 100);
  const info = BREED_INFO[topName] || { emoji: "🐱", traits: [], care: "" };

  // 1등 결과 카드
  resultContent.innerHTML = `
    <div style="display:flex; align-items:center; gap:16px; margin-bottom:20px;">
      <div style="font-size:56px; line-height:1;">${info.emoji}</div>
      <div>
        <p style="font-size:22px; font-weight:800; margin-bottom:4px;">${topName}</p>
        <div style="display:flex; align-items:center; gap:8px;">
          <div style="height:8px; width:${topConf}px; max-width:200px; background:var(--color-primary); border-radius:4px;"></div>
          <span style="font-size:14px; font-weight:700; color:var(--color-primary);">${topConf}%</span>
        </div>
      </div>
    </div>
    ${info.traits.length ? `
    <div style="margin-bottom:16px;">
      <p style="font-size:13px; font-weight:600; color:var(--color-text-muted); margin-bottom:8px;">특징</p>
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        ${info.traits.map((t) => `<span class="badge badge--green">${t}</span>`).join("")}
      </div>
    </div>` : ""}
    ${info.care ? `
    <div style="margin-bottom:20px;">
      <p style="font-size:13px; font-weight:600; color:var(--color-text-muted); margin-bottom:6px;">케어 가이드</p>
      <p style="font-size:14px; line-height:1.7;">${info.care}</p>
    </div>` : ""}
    <a href="/pages/recommend.html" class="btn btn--primary" style="width:100%;">이 품종 맞춤 제품 추천받기</a>
  `;

  // 전체 확률 바
  resultBars.innerHTML = predictions.map((p) => {
    const pct = Math.round(p.probability * 100);
    return `
      <div style="margin-bottom:10px;">
        <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:4px;">
          <span>${p.className}</span>
          <span style="font-weight:700; color:${pct >= 50 ? "var(--color-primary)" : "var(--color-text-muted)"};">${pct}%</span>
        </div>
        <div style="height:6px; background:var(--color-border); border-radius:3px; overflow:hidden;">
          <div style="height:100%; width:${pct}%; background:var(--color-primary-light); border-radius:3px; transition:width 0.6s ease;"></div>
        </div>
      </div>
    `;
  }).join("");

  resultArea.style.display = "block";
  resultArea.scrollIntoView({ behavior: "smooth", block: "start" });
}
