import {
  auth,
  db,
  storage,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  doc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
  ref,
  uploadBytes,
  getDownloadURL,
} from "/js/firebase-config.js";

// ─── 건강 기록 상수 ────────────────────────────────────────────────────────────
const CHECKLIST_TOTALS = { kitten: 5, adult: 4, senior: 5 };
const SYMPTOM_LABELS   = {
  s1: "식욕 감소", s2: "다음(多飮)", s3: "배변 이상", s4: "은신 증가",
  s5: "그루밍 이상", s6: "눈꼽·콧물", s7: "운동 기피", s8: "발성 변화",
};

const loggedOutView = document.getElementById("logged-out-view");
const loggedInView  = document.getElementById("logged-in-view");
const profileLoginBtn = document.getElementById("profile-login-btn");
const addPetBtn    = document.getElementById("add-pet-btn");
const addPetForm   = document.getElementById("add-pet-form");
const cancelPetBtn = document.getElementById("cancel-pet-btn");
const savePetBtn   = document.getElementById("save-pet-btn");
const petsGrid     = document.getElementById("pets-grid");
const noPets       = document.getElementById("no-pets");
const formTitle    = addPetForm.querySelector("h3");

let currentUser   = null;
let editingPetId  = null;  // null: 신규 등록, string: 수정 중
let selectedPhoto = null;  // 선택된 File 객체

// 사진 선택 미리보기
document.getElementById("pet-photo-input").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  selectedPhoto = file;
  const reader = new FileReader();
  reader.onload = (ev) => {
    document.getElementById("pet-photo-placeholder").style.display = "none";
    const img = document.getElementById("pet-photo-img");
    img.src = ev.target.result;
    img.style.display = "block";
  };
  reader.readAsDataURL(file);
});

// ─── Auth 상태 감지 ───────────────────────────────────────────────────────────
onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  if (user) {
    loggedOutView.style.display = "none";
    loggedInView.style.display  = "block";
    await loadPets(user.uid);
    loadHealthRecords(user.uid);
  } else {
    loggedOutView.style.display = "block";
    loggedInView.style.display  = "none";
  }
});

// ─── Google 로그인 ────────────────────────────────────────────────────────────
profileLoginBtn.addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, new GoogleAuthProvider());
  } catch (e) {
    console.error("로그인 오류:", e);
  }
});

// ─── 폼 열기/닫기 ─────────────────────────────────────────────────────────────
addPetBtn.addEventListener("click", () => {
  editingPetId = null;
  resetForm();
  formTitle.textContent = "새 반려동물 등록";
  savePetBtn.textContent = "저장하기";
  addPetForm.style.display = "block";
  addPetBtn.style.display  = "none";
});

cancelPetBtn.addEventListener("click", () => {
  closeForm();
});

function closeForm() {
  addPetForm.style.display = "none";
  addPetBtn.style.display  = "inline-flex";
  editingPetId = null;
  resetForm();
}

function resetForm() {
  document.getElementById("pet-name").value        = "";
  document.getElementById("pet-breed-input").value = "";
  document.getElementById("pet-birthday").value    = "";
  document.getElementById("pet-notes").value       = "";
  document.getElementById("pet-species").value     = "cat";
  document.getElementById("pet-gender").value      = "male";
  document.getElementById("pet-photo-input").value = "";
  document.getElementById("pet-photo-img").style.display = "none";
  document.getElementById("pet-photo-img").src = "";
  document.getElementById("pet-photo-placeholder").style.display = "block";
  selectedPhoto = null;
}

// ─── 저장 (신규 + 수정 공통) ──────────────────────────────────────────────────
savePetBtn.addEventListener("click", async () => {
  const name = document.getElementById("pet-name").value.trim();
  if (!name) { alert("이름을 입력해주세요."); return; }

  const data = {
    name,
    species:  document.getElementById("pet-species").value,
    gender:   document.getElementById("pet-gender").value,
    breed:    document.getElementById("pet-breed-input").value.trim(),
    birthday: document.getElementById("pet-birthday").value,
    notes:    document.getElementById("pet-notes").value.trim(),
    updatedAt: serverTimestamp(),
  };

  savePetBtn.disabled    = true;
  savePetBtn.textContent = "저장 중…";

  try {
    let petId = editingPetId;

    if (editingPetId) {
      await updateDoc(doc(db, "users", currentUser.uid, "pets", editingPetId), data);
    } else {
      data.createdAt = serverTimestamp();
      const docRef = await addDoc(collection(db, "users", currentUser.uid, "pets"), data);
      petId = docRef.id;
    }

    // 사진 업로드
    if (selectedPhoto && petId) {
      const photoRef = ref(storage, `pets/${currentUser.uid}/${petId}`);
      await uploadBytes(photoRef, selectedPhoto);
      const photoURL = await getDownloadURL(photoRef);
      await updateDoc(doc(db, "users", currentUser.uid, "pets", petId), { photoURL });
    }

    closeForm();
    loadPets(currentUser.uid);
  } catch (e) {
    console.error("저장 오류:", e);
    alert("저장 중 오류가 발생했습니다.");
  } finally {
    savePetBtn.disabled    = false;
    savePetBtn.textContent = "저장하기";
  }
});

// ─── 목록 불러오기 ────────────────────────────────────────────────────────────
async function loadPets(uid) {
  try {
    const q        = query(collection(db, "users", uid, "pets"), orderBy("createdAt", "asc"));
    const snapshot = await getDocs(q);

    petsGrid.innerHTML = "";

    if (snapshot.empty) {
      noPets.style.display = "block";
      return;
    }
    noPets.style.display = "none";

    snapshot.forEach((docSnap) => {
      petsGrid.appendChild(buildCard(docSnap.id, docSnap.data()));
    });
  } catch (e) {
    console.error("불러오기 오류:", e);
  }
}

function buildCard(id, pet) {
  const icon        = pet.species === "dog" ? "🐶" : "🐱";
  const genderLabel = pet.gender === "female" ? "암컷" : "수컷";
  const speciesLabel = pet.species === "dog" ? "강아지" : "고양이";
  const age         = pet.birthday ? calcAge(pet.birthday) : null;
  const photoHTML   = pet.photoURL
    ? `<img src="${escAttr(pet.photoURL)}" alt="${escAttr(pet.name)}" style="width:80px; height:80px; border-radius:50%; object-fit:cover; margin:0 auto 2px; display:block;" />`
    : `<div style="font-size:40px; text-align:center; margin-bottom:2px;">${icon}</div>`;

  const card = document.createElement("div");
  card.className = "card";
  card.style.cssText = "display:flex; flex-direction:column; gap:8px;";
  card.innerHTML = `
    ${photoHTML}
    <p style="font-size:17px; font-weight:700; text-align:center; margin:0;">${escHtml(pet.name)}</p>
    <p style="font-size:13px; color:var(--color-text-muted); text-align:center; margin:0; line-height:1.6;">
      ${speciesLabel}${pet.breed ? " · " + escHtml(pet.breed) : ""}
      · ${genderLabel}${age !== null ? " · " + age : ""}
    </p>
    ${pet.notes ? `<p style="font-size:12px; color:var(--color-text-muted); margin:4px 0 0; border-top:1px solid var(--color-border); padding-top:8px; line-height:1.5;">${escHtml(pet.notes)}</p>` : ""}
    <div style="display:flex; gap:8px; margin-top:auto; padding-top:12px;">
      <button class="btn btn--outline" style="flex:1; font-size:13px;" data-action="edit" data-id="${id}">수정</button>
      <button class="btn btn--outline" style="flex:1; font-size:13px; color:var(--color-error,#e53935);" data-action="delete" data-id="${id}" data-name="${escAttr(pet.name)}">삭제</button>
    </div>
  `;
  return card;
}

// 카드 버튼 이벤트 (이벤트 위임)
petsGrid.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const { action, id, name } = btn.dataset;
  if (action === "edit")   editPet(id);
  if (action === "delete") deletePet(id, name);
});

// ─── 수정 ─────────────────────────────────────────────────────────────────────
async function editPet(petId) {
  try {
    const snap = await getDoc(doc(db, "users", currentUser.uid, "pets", petId));
    if (!snap.exists()) return;
    const p = snap.data();

    document.getElementById("pet-name").value        = p.name     || "";
    document.getElementById("pet-species").value     = p.species  || "cat";
    document.getElementById("pet-gender").value      = p.gender   || "male";
    document.getElementById("pet-breed-input").value = p.breed    || "";
    document.getElementById("pet-birthday").value    = p.birthday || "";
    document.getElementById("pet-notes").value       = p.notes    || "";

    // 기존 사진 미리보기
    if (p.photoURL) {
      document.getElementById("pet-photo-placeholder").style.display = "none";
      const img = document.getElementById("pet-photo-img");
      img.src = p.photoURL;
      img.style.display = "block";
    } else {
      document.getElementById("pet-photo-placeholder").style.display = "block";
      document.getElementById("pet-photo-img").style.display = "none";
    }
    selectedPhoto = null;

    editingPetId           = petId;
    formTitle.textContent  = "프로필 수정";
    savePetBtn.textContent = "수정 완료";
    addPetForm.style.display = "block";
    addPetBtn.style.display  = "none";
    addPetForm.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (e) {
    console.error("수정 로드 오류:", e);
  }
}

// ─── 삭제 ─────────────────────────────────────────────────────────────────────
async function deletePet(petId, name) {
  if (!confirm(`"${name}"의 프로필을 삭제할까요?`)) return;
  try {
    await deleteDoc(doc(db, "users", currentUser.uid, "pets", petId));
    loadPets(currentUser.uid);
  } catch (e) {
    console.error("삭제 오류:", e);
    alert("삭제 중 오류가 발생했습니다.");
  }
}

// ─── 건강 기록 로딩 ───────────────────────────────────────────────────────────
async function loadHealthRecords(uid) {
  const now      = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthKR  = `${now.getFullYear()}년 ${now.getMonth() + 1}월`;
  document.getElementById("checklist-month-label").textContent = monthKR;

  // ── 체크리스트 완료율 ──────────────────────────────────────────────────────
  try {
    const petsSnap = await getDocs(collection(db, "users", uid, "pets"));
    const pets = petsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    let totalItems = 0, doneItems = 0;

    await Promise.all(pets.map(async (pet) => {
      const ageGroup = calcAgeGroup(pet.birthday);
      const total    = CHECKLIST_TOTALS[ageGroup] || 4;
      totalItems    += total;

      const docSnap = await getDoc(doc(db, "users", uid, "checklist", `${monthKey}_${pet.id}`));
      if (docSnap.exists()) {
        const items = docSnap.data().items || {};
        doneItems  += Object.keys(items).length;
      }
    }));

    const pct = totalItems ? Math.round((doneItems / totalItems) * 100) : 0;
    document.getElementById("checklist-summary").innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:8px;">
        <span style="font-size:28px; font-weight:800; color:#2F5BFF;">${pct}%</span>
        <span style="font-size:13px; color:var(--color-text-muted);">${doneItems} / ${totalItems} 완료</span>
      </div>
      <div style="background:var(--color-bg-alt,#EFEFED); border-radius:100px; height:10px; overflow:hidden;">
        <div style="width:${pct}%; height:100%; background:#2F5BFF; border-radius:100px; transition:width .4s;"></div>
      </div>
      <p style="font-size:12px; color:var(--color-text-muted); margin:10px 0 0;">
        ${pct === 100 ? "🎉 이달 케어 완료!" : pct >= 50 ? "👍 절반 이상 완료했어요" : "아직 체크하지 않은 항목이 있어요"}
      </p>
      <a href="/pages/health-checklist.html" style="font-size:13px; color:#2F5BFF; text-decoration:none; display:inline-block; margin-top:12px;">
        체크리스트 바로가기 →
      </a>
    `;
  } catch (e) {
    console.error("체크리스트 로드 오류:", e);
    document.getElementById("checklist-summary").innerHTML =
      `<p style="font-size:13px; color:var(--color-text-muted);">불러오기 실패</p>`;
  }

  // ── 최근 7일 증상 기록 ────────────────────────────────────────────────────
  try {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    });

    const records = await Promise.all(days.map(async (dateKey) => {
      const snap = await getDoc(doc(db, "users", uid, "symptoms", dateKey));
      return { dateKey, data: snap.exists() ? snap.data() : null };
    }));

    const hasAny = records.some(r => r.data);
    const el     = document.getElementById("symptom-summary");

    if (!hasAny) {
      el.innerHTML = `<p style="font-size:13px; color:var(--color-text-muted); line-height:1.8;">최근 7일 증상 기록이 없어요.</p>`;
      return;
    }

    el.innerHTML = records
      .filter(r => r.data)
      .map(({ dateKey, data }) => {
        const symptoms   = Object.keys(data.symptoms || {});
        const isWarning  = symptoms.length >= 3;
        const dateLabel  = dateKey.slice(5).replace("-", "/");
        const sympLabels = symptoms.map(id => SYMPTOM_LABELS[id] || id).join(", ");
        return `
          <div style="padding:10px 0; border-bottom:1px solid var(--color-border,#E8E8E6);">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
              <span style="font-size:13px; font-weight:700; color:${isWarning ? "#C62828" : "var(--color-text)"};">
                ${isWarning ? "🔴" : "🟡"} ${dateLabel}
              </span>
              ${isWarning ? `<span style="font-size:11px; padding:1px 8px; border-radius:100px; background:#FFEBEE; color:#C62828; border:1px solid #FFCDD2;">병원 권장</span>` : ""}
            </div>
            <p style="font-size:12px; color:var(--color-text-muted); margin:0; line-height:1.6;">
              ${sympLabels || "이상 없음"}
            </p>
          </div>
        `;
      }).join("") +
      `<a href="/pages/health-checklist.html" style="font-size:13px; color:#2F5BFF; text-decoration:none; display:inline-block; margin-top:12px;">
        증상 체크하러 가기 →
      </a>`;
  } catch (e) {
    console.error("증상 기록 로드 오류:", e);
    document.getElementById("symptom-summary").innerHTML =
      `<p style="font-size:13px; color:var(--color-text-muted);">불러오기 실패</p>`;
  }
}

function calcAgeGroup(birthday) {
  if (!birthday) return "adult";
  const years = (Date.now() - new Date(birthday).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  if (years < 1) return "kitten";
  if (years < 8) return "adult";
  return "senior";
}

// ─── 유틸 ─────────────────────────────────────────────────────────────────────
function calcAge(birthday) {
  const birth  = new Date(birthday);
  const now    = new Date();
  const months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth());
  if (months < 1)  return "1개월 미만";
  if (months < 12) return `${months}개월`;
  return `${Math.floor(months / 12)}살`;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function escAttr(str) {
  return String(str).replace(/"/g, "&quot;");
}
