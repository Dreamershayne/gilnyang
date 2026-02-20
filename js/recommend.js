// 맞춤 제품 추천 로직
// TODO: 실제 제품 DB 또는 AI 추천 API 연동

const recommendBtn = document.getElementById("recommend-btn");
const resultArea = document.getElementById("result-area");
const productsGrid = document.getElementById("products-grid");

if (recommendBtn) {
  recommendBtn.addEventListener("click", () => {
    const petType = document.getElementById("pet-type").value;
    const petAge = document.getElementById("pet-age").value;
    const petBreed = document.getElementById("pet-breed").value;
    const petHealth = document.getElementById("pet-health").value;

    if (!petType || !petAge) {
      alert("종류와 나이를 선택해주세요.");
      return;
    }

    recommendBtn.textContent = "추천 중...";
    recommendBtn.disabled = true;

    // TODO: 실제 추천 API 호출로 교체
    setTimeout(() => {
      const mockProducts = getRecommendations(petType, petAge, petHealth);
      renderProducts(mockProducts);
      recommendBtn.textContent = "맞춤 제품 추천받기";
      recommendBtn.disabled = false;
    }, 1000);
  });
}

function getRecommendations(type, age, health) {
  const base = [
    {
      icon: "🍖",
      name: `${age === "senior" ? "노령" : ""} 맞춤 사료`,
      desc: `${type === "cat" ? "고양이" : "강아지"} ${age} 시기에 최적화된 영양 균형 사료`,
      tag: "영양",
    },
    {
      icon: "🪮",
      name: "브러쉬 & 그루밍 세트",
      desc: "매일 가볍게 빗어주면 털 날림을 줄이고 혈액순환에도 좋아요",
      tag: "그루밍",
    },
    {
      icon: "🏠",
      name: "스크래쳐 & 캣타워",
      desc: "스트레스 해소와 운동을 동시에! 고양이 필수 아이템",
      tag: "놀이",
    },
  ];

  if (health && health.includes("관절")) {
    base.push({
      icon: "💊",
      name: "관절 영양제",
      desc: "글루코사민·콘드로이틴 함유 관절 건강 보조제",
      tag: "건강",
    });
  }

  if (age === "senior") {
    base.push({
      icon: "🩺",
      name: "노령견·노령묘 건강 키트",
      desc: "신장·심장 기능 케어에 도움이 되는 노령 맞춤 제품",
      tag: "건강",
    });
  }

  return base;
}

function renderProducts(products) {
  productsGrid.innerHTML = products
    .map(
      (p) => `
    <div class="card" style="display:flex; flex-direction:column; gap:10px;">
      <div style="font-size:36px;">${p.icon}</div>
      <span class="badge badge--green">${p.tag}</span>
      <p style="font-size:16px; font-weight:700;">${p.name}</p>
      <p style="font-size:13px; color:var(--color-text-muted); line-height:1.6;">${p.desc}</p>
    </div>
  `
    )
    .join("");

  resultArea.style.display = "block";
  resultArea.scrollIntoView({ behavior: "smooth", block: "start" });
}
