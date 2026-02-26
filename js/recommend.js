import {
  auth,
  db,
  onAuthStateChanged,
  collection,
  getDocs,
  query,
  orderBy,
} from "/js/firebase-config.js";

// ─── DOM refs ────────────────────────────────────────────────────────────────
const recommendBtn = document.getElementById("recommend-btn");
const resultArea   = document.getElementById("result-area");
const productsGrid = document.getElementById("products-grid");
const petTypeEl    = document.getElementById("pet-type");
const petBreedEl   = document.getElementById("pet-breed");
const petAgeEl     = document.getElementById("pet-age");
const petHealthEl  = document.getElementById("pet-health");

const NAVER_WORKER_URL = "https://naver-shopping-proxy.chloepark813.workers.dev";

// ─── 카테고리 메타 ──────────────────────────────────────────────────────────
const CATEGORIES = {
  nutrition: { label: "영양",       icon: "🍖", badgeClass: "badge--green"  },
  grooming:  { label: "그루밍",     icon: "🪮", badgeClass: "badge--blue"   },
  health:    { label: "건강",       icon: "💊", badgeClass: "badge--red"    },
  play:      { label: "놀이",       icon: "🎾", badgeClass: "badge--yellow" },
  living:    { label: "리빙",       icon: "🏡", badgeClass: "badge--green"  },
  travel:    { label: "이동/외출",  icon: "🚗", badgeClass: "badge--blue"   },
  hygiene:   { label: "위생",       icon: "🧴", badgeClass: "badge--red"    },
  rescue:    { label: "구조/입양",  icon: "🆘", badgeClass: "badge--yellow" },
};

// ─── 로그인 상태 감지 → 펫 프로필 자동 로드 ─────────────────────────────────
onAuthStateChanged(auth, async (user) => {
  if (!user) return;
  try {
    const petsRef = collection(db, "users", user.uid, "pets");
    const snap = await getDocs(query(petsRef, orderBy("createdAt", "desc")));
    if (snap.empty) return;

    const pets = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (pets.length === 1) {
      fillForm(pets[0]);
    } else {
      showPetSelector(pets);
    }
  } catch (e) {
    console.error("펫 프로필 로드 오류:", e);
  }
});

// 생일 → 폼 select 값
function birthdayToFormAge(birthday) {
  if (!birthday) return "";
  const ageYears = (Date.now() - new Date(birthday).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  if (ageYears < 1) return "kitten";
  if (ageYears < 3) return "young";
  if (ageYears < 8) return "adult";
  return "senior";
}

// 펫 데이터 → 폼 자동 채우기
function fillForm(pet) {
  if (pet.species) petTypeEl.value  = pet.species;
  if (pet.breed)   petBreedEl.value = pet.breed;
  const age = birthdayToFormAge(pet.birthday);
  if (age) petAgeEl.value = age;
  if (pet.notes) petHealthEl.value = pet.notes;
}

// 펫 여러 마리일 때 선택 UI 동적 삽입
function showPetSelector(pets) {
  const existing = document.getElementById("pet-selector-banner");
  if (existing) existing.remove();

  const banner = document.createElement("div");
  banner.id = "pet-selector-banner";
  banner.style.cssText = [
    "border:1px solid var(--color-border,#e0e0e0)",
    "border-radius:12px",
    "padding:16px 20px",
    "margin-bottom:20px",
    "background:var(--color-bg-secondary,#f5f5f5)",
  ].join(";");

  const label = document.createElement("p");
  label.style.cssText = "font-size:13px; color:var(--color-text-muted,#888); margin-bottom:10px;";
  label.textContent = "🐾 등록된 반려동물을 선택하면 자동으로 정보가 채워져요";

  const select = document.createElement("select");
  select.className = "form-control";
  select.innerHTML =
    `<option value="">아이를 선택해주세요</option>` +
    pets.map((p, i) =>
      `<option value="${i}">${p.name}${p.species === "cat" ? " 😺" : " 🐶"}</option>`
    ).join("");

  select.addEventListener("change", () => {
    const idx = parseInt(select.value, 10);
    if (!isNaN(idx) && pets[idx]) fillForm(pets[idx]);
  });

  banner.appendChild(label);
  banner.appendChild(select);
  document.getElementById("input-form").insertBefore(banner, document.getElementById("input-form").firstChild);
}

// ─── 추천받기 버튼 ─────────────────────────────────────────────────────────
if (recommendBtn) {
  recommendBtn.addEventListener("click", async () => {
    const petType = petTypeEl.value;
    const petAge  = petAgeEl.value;

    if (!petType || !petAge) {
      alert("종류와 나이를 선택해주세요.");
      return;
    }

    recommendBtn.textContent = "추천 중...";
    recommendBtn.disabled = true;

    try {
      const firestoreAge = formAgeToFirestore(petAge);
      const petHealth = petHealthEl.value.trim();
      const products = await fetchProducts(petType, firestoreAge, petHealth);
      renderCategoryCards(products);
    } catch (e) {
      console.error("제품 로드 오류:", e);
      alert("제품을 불러오지 못했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      recommendBtn.textContent = "맞춤 제품 추천받기";
      recommendBtn.disabled = false;
    }
  });
}

// 폼 나이 값 → Firestore targetAge 키
function formAgeToFirestore(formAge) {
  const map = { kitten: "kitten", young: "adult", adult: "adult", senior: "senior" };
  return map[formAge] || formAge;
}

// Firestore products 컬렉션 → 클라이언트 필터링
async function fetchProducts(species, age, healthInput = "") {
  const snap = await getDocs(collection(db, "products"));
  const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  // 건강 키워드 추출 (쉼표/공백 구분)
  const healthKeywords = healthInput
    ? healthInput.split(/[,，\s]+/).map(k => k.trim()).filter(Boolean)
    : [];

  // species + age 필터
  let filtered = all.filter(p =>
    Array.isArray(p.targetSpecies) && p.targetSpecies.includes(species) &&
    Array.isArray(p.targetAge) && p.targetAge.includes(age)
  );
  if (!filtered.length) {
    filtered = all.filter(p =>
      Array.isArray(p.targetSpecies) && p.targetSpecies.includes(species)
    );
  }

  // 건강 키워드 있으면 매칭 제품 상단으로 정렬
  if (healthKeywords.length > 0) {
    filtered.sort((a, b) => {
      const aMatch = (a.healthTags || []).some(tag =>
        healthKeywords.some(k => tag.includes(k) || k.includes(tag))
      );
      const bMatch = (b.healthTags || []).some(tag =>
        healthKeywords.some(k => tag.includes(k) || k.includes(tag))
      );
      return bMatch - aMatch;
    });
  }

  return filtered;
}

// ─── 카테고리 카드 렌더링 ──────────────────────────────────────────────────
function renderCategoryCards(products) {
  if (!products.length) {
    productsGrid.style.cssText = "display:block;";
    productsGrid.innerHTML = `
      <p style="text-align:center; color:var(--color-text-muted); padding:40px 0; line-height:2;">
        😿 조건에 맞는 추천 제품이 아직 없어요.<br>
        <small>곧 다양한 제품을 추가할게요!</small>
      </p>`;
    resultArea.style.display = "block";
    resultArea.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  // 카테고리별 그룹핑
  const grouped = Object.fromEntries(Object.keys(CATEGORIES).map(k => [k, []]));
  for (const p of products) {
    if (grouped[p.category] !== undefined) grouped[p.category].push(p);
  }
  const available = Object.entries(CATEGORIES).filter(([cat]) => grouped[cat].length > 0);

  productsGrid.style.cssText = "display:flex; flex-direction:column; gap:24px;";
  productsGrid.innerHTML = `
    <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:16px;">
      ${available.map(([cat, info]) => `
        <div class="card category-card" data-category="${cat}"
             style="cursor:pointer; display:flex; flex-direction:column; gap:10px; transition:box-shadow 0.2s, transform 0.15s;"
             onmouseover="this.style.transform='translateY(-2px)'"
             onmouseout="this.style.transform=''">
          <div style="font-size:36px;">${info.icon}</div>
          <span class="badge ${info.badgeClass}">${info.label}</span>
          <p style="font-size:16px; font-weight:700;">${info.label} 제품</p>
          <p class="cat-arrow" style="font-size:13px; color:var(--color-text-muted); line-height:1.6;">
            ${grouped[cat].length}개 추천 · 탭하여 보기 ▾
          </p>
        </div>
      `).join("")}
    </div>

    ${available.map(([cat, info]) => `
      <div id="product-list-${cat}" style="display:none;">
        <p style="font-size:15px; font-weight:700; margin-bottom:14px;">${info.icon} ${info.label} 추천 제품</p>
        <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:16px;">
          ${grouped[cat].map(p => renderProductCard(p, info)).join("")}
        </div>
        <div id="naver-products-${cat}"></div>
      </div>
    `).join("")}
  `;

  // 카드 클릭 → 해당 카테고리 제품 목록 토글
  productsGrid.querySelectorAll(".category-card").forEach(card => {
    card.addEventListener("click", () => {
      const cat  = card.dataset.category;
      const list = document.getElementById(`product-list-${cat}`);
      if (!list) return;
      const isOpen = list.style.display !== "none";

      // 모두 닫기
      available.forEach(([c]) => {
        const l = document.getElementById(`product-list-${c}`);
        if (l) l.style.display = "none";
      });
      productsGrid.querySelectorAll(".category-card").forEach(c => {
        c.style.boxShadow = "";
        const arrow = c.querySelector(".cat-arrow");
        if (arrow) arrow.textContent = arrow.textContent.replace("▴", "▾");
      });

      if (!isOpen) {
        list.style.display = "block";
        // 네이버 실제 제품 로드
        const petType = petTypeEl.value === "cat" ? "고양이" : "강아지";
        const queryMap = {
          nutrition: `${petType} 사료`,
          grooming:  `${petType} 브러쉬 그루밍`,
          health:    `${petType} 영양제 건강`,
          play:      `${petType} 장난감`,
          living:    `${petType} 하우스 리빙`,
          travel:    `${petType} 이동장 캐리어`,
          hygiene:   `${petType} 위생 모래 패드`,
          rescue:    `${petType} 구조 입양 용품`,
        };
        const naverSection = document.getElementById(`naver-products-${cat}`);
        if (naverSection && !naverSection.dataset.loaded) {
          naverSection.innerHTML = "<p style='color:var(--color-text-muted);'>🔍 실제 제품 검색 중...</p>";
          fetchNaverProducts(queryMap[cat]).then(items => {
            naverSection.innerHTML = `
              <p style="font-size:14px; font-weight:700; margin-top:24px; margin-bottom:8px;">
                🛍️ 네이버 쇼핑 인기 제품 TOP 4
              </p>
              ${renderNaverProductCards(items)}
            `;
            naverSection.dataset.loaded = "true";
          });
        }
        card.style.boxShadow = "0 0 0 2px var(--color-primary, #2E7D32)";
        const arrow = card.querySelector(".cat-arrow");
        if (arrow) arrow.textContent = arrow.textContent.replace("▾", "▴");
        setTimeout(() => list.scrollIntoView({ behavior: "smooth", block: "nearest" }), 50);
      }
    });
  });

  resultArea.style.display = "block";
  resultArea.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ─── 개별 제품 카드 HTML 생성 ────────────────────────────────────────────────
function renderProductCard(p, catInfo) {
  const badge = p.badge
    ? p.badge === "온유집사 추천"
      ? `<span class="badge" style="font-size:11px; width:fit-content;
           background:linear-gradient(90deg,#f59e0b,#ef4444); color:#fff;
           border:none; padding:3px 10px;">⭐ 온유집사 추천</span>`
      : `<span class="badge badge--green" style="font-size:11px; width:fit-content;">${p.badge}</span>`
    : "";
  const imgHtml = p.imageUrl
    ? `<img src="${p.imageUrl}" alt="${p.name}"
           style="width:100%; height:140px; object-fit:contain; border-radius:8px;
                  background:var(--color-bg-secondary,#f5f5f5);">`
    : `<div style="font-size:48px; text-align:center; padding:20px;
                   background:var(--color-bg-secondary,#f5f5f5); border-radius:8px;">${catInfo.icon}</div>`;

  return `
    <a href="${p.link}" target="_blank" rel="noopener noreferrer sponsored"
       style="text-decoration:none; color:inherit; display:block;">
      <div class="card"
           style="display:flex; flex-direction:column; gap:10px; height:100%; transition:transform 0.15s;"
           onmouseover="this.style.transform='translateY(-2px)'"
           onmouseout="this.style.transform=''">
        ${imgHtml}
        ${badge}
        <p style="font-size:15px; font-weight:700; line-height:1.4;">${p.name}</p>
        <p style="font-size:13px; color:var(--color-text-muted); line-height:1.6; flex:1;">${p.description || ""}</p>
        <span style="font-size:13px; font-weight:600; color:var(--color-primary,#2E7D32);">쿠팡에서 보기 →</span>
      </div>
    </a>
  `;
}

// ─── 네이버 쇼핑 연동 ────────────────────────────────────────────────────────
async function fetchNaverProducts(query) {
  try {
    const res = await fetch(`${NAVER_WORKER_URL}/?query=${encodeURIComponent(query)}`);
    const data = await res.json();
    return data.items || [];
  } catch (e) {
    console.error("네이버 API 오류:", e);
    return [];
  }
}

function renderNaverProductCards(items) {
  if (!items.length) return "<p style='color:var(--color-text-muted);'>검색 결과가 없어요.</p>";
  return `
    <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:16px; margin-top:16px;">
      ${items.map(item => {
        const name = item.title.replace(/<[^>]+>/g, "");
        const price = parseInt(item.lprice).toLocaleString();
        return `
          <a href="${item.link}" target="_blank" rel="noopener noreferrer"
             style="text-decoration:none; color:inherit;">
            <div class="card" style="display:flex; flex-direction:column; gap:10px; height:100%;
                 transition:transform 0.15s;"
                 onmouseover="this.style.transform='translateY(-2px)'"
                 onmouseout="this.style.transform=''">
              <img src="${item.image}" alt="${name}"
                   style="width:100%; height:140px; object-fit:contain; border-radius:8px;
                          background:var(--color-bg-secondary,#f5f5f5);">
              <p style="font-size:14px; font-weight:700; line-height:1.4;">${name}</p>
              <p style="font-size:15px; font-weight:800; color:var(--color-primary,#2E7D32);">
                ${price}원~
              </p>
              <span style="font-size:13px; color:var(--color-text-muted);">네이버 쇼핑에서 보기 →</span>
            </div>
          </a>
        `;
      }).join("")}
    </div>
  `;
}
