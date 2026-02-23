import {
  auth,
  db,
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
} from "/js/firebase-config.js";

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

// ─── Auth 상태 감지 ───────────────────────────────────────────────────────────
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (user) {
    loggedOutView.style.display = "none";
    loggedInView.style.display  = "block";
    loadPets(user.uid);
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
    if (editingPetId) {
      await updateDoc(doc(db, "users", currentUser.uid, "pets", editingPetId), data);
    } else {
      data.createdAt = serverTimestamp();
      await addDoc(collection(db, "users", currentUser.uid, "pets"), data);
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

  const card = document.createElement("div");
  card.className = "card";
  card.style.cssText = "display:flex; flex-direction:column; gap:8px;";
  card.innerHTML = `
    <div style="font-size:40px; text-align:center; margin-bottom:2px;">${icon}</div>
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
