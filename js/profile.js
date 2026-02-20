import {
  auth,
  db,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from "/js/firebase-config.js";

const loggedOutView = document.getElementById("logged-out-view");
const loggedInView = document.getElementById("logged-in-view");
const profileLoginBtn = document.getElementById("profile-login-btn");
const addPetBtn = document.getElementById("add-pet-btn");
const addPetForm = document.getElementById("add-pet-form");
const cancelPetBtn = document.getElementById("cancel-pet-btn");
const savePetBtn = document.getElementById("save-pet-btn");
const petsGrid = document.getElementById("pets-grid");
const noPets = document.getElementById("no-pets");

let currentUser = null;

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (user) {
    loggedOutView.style.display = "none";
    loggedInView.style.display = "block";
    loadPets(user.uid);
  } else {
    loggedOutView.style.display = "block";
    loggedInView.style.display = "none";
  }
});

// 로그인 버튼
if (profileLoginBtn) {
  profileLoginBtn.addEventListener("click", async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error("로그인 오류:", e);
    }
  });
}

// 프로필 추가 폼 열기/닫기
if (addPetBtn) {
  addPetBtn.addEventListener("click", () => {
    addPetForm.style.display = "block";
    addPetBtn.style.display = "none";
  });
}

if (cancelPetBtn) {
  cancelPetBtn.addEventListener("click", () => {
    addPetForm.style.display = "none";
    addPetBtn.style.display = "inline-flex";
  });
}

// 반려동물 저장
if (savePetBtn) {
  savePetBtn.addEventListener("click", async () => {
    const name = document.getElementById("pet-name").value.trim();
    const species = document.getElementById("pet-species").value;
    const gender = document.getElementById("pet-gender").value;
    const breed = document.getElementById("pet-breed-input").value.trim();
    const birthday = document.getElementById("pet-birthday").value;
    const notes = document.getElementById("pet-notes").value.trim();

    if (!name) {
      alert("이름을 입력해주세요.");
      return;
    }

    try {
      await addDoc(collection(db, `users/${currentUser.uid}/pets`), {
        name,
        species,
        gender,
        breed,
        birthday,
        notes,
        createdAt: serverTimestamp(),
      });

      addPetForm.style.display = "none";
      addPetBtn.style.display = "inline-flex";
      document.getElementById("pet-name").value = "";
      document.getElementById("pet-breed-input").value = "";
      document.getElementById("pet-birthday").value = "";
      document.getElementById("pet-notes").value = "";

      loadPets(currentUser.uid);
    } catch (e) {
      console.error("저장 오류:", e);
    }
  });
}

// 반려동물 목록 불러오기
async function loadPets(uid) {
  try {
    const q = query(
      collection(db, `users/${uid}/pets`),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);

    petsGrid.innerHTML = "";

    if (snapshot.empty) {
      noPets.style.display = "block";
      return;
    }

    noPets.style.display = "none";

    snapshot.forEach((docSnap) => {
      const pet = docSnap.data();
      const icon = pet.species === "cat" ? "🐱" : "🐶";
      const genderLabel = pet.gender === "male" ? "수컷" : "암컷";
      const age = pet.birthday
        ? calcAge(pet.birthday)
        : "나이 미입력";

      const card = document.createElement("div");
      card.className = "pet-card";
      card.innerHTML = `
        <div class="pet-card__img">${icon}</div>
        <div class="pet-card__body">
          <p class="pet-card__name">${pet.name}</p>
          <p class="pet-card__info">${pet.breed || "품종 미입력"} · ${genderLabel} · ${age}</p>
          ${pet.notes ? `<p style="font-size:13px; color:var(--color-text-muted); margin-top:8px; line-height:1.5;">${pet.notes}</p>` : ""}
        </div>
      `;
      petsGrid.appendChild(card);
    });
  } catch (e) {
    console.error("불러오기 오류:", e);
  }
}

function calcAge(birthday) {
  const birth = new Date(birthday);
  const now = new Date();
  const months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth());
  if (months < 12) return `${months}개월`;
  return `${Math.floor(months / 12)}살`;
}
