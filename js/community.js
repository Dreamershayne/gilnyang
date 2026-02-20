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

const writeBtn = document.getElementById("write-btn");
const postForm = document.getElementById("post-form");
const cancelPostBtn = document.getElementById("cancel-post-btn");
const submitPostBtn = document.getElementById("submit-post-btn");
const loginNotice = document.getElementById("login-notice");
const communityLoginBtn = document.getElementById("community-login-btn");
const postsList = document.getElementById("posts-list");

let currentUser = null;

onAuthStateChanged(auth, (user) => {
  currentUser = user;
});

// 글쓰기 버튼
if (writeBtn) {
  writeBtn.addEventListener("click", () => {
    if (!currentUser) {
      loginNotice.style.display = "block";
      return;
    }
    postForm.style.display = postForm.style.display === "none" ? "block" : "none";
    loginNotice.style.display = "none";
  });
}

// 취소
if (cancelPostBtn) {
  cancelPostBtn.addEventListener("click", () => {
    postForm.style.display = "none";
  });
}

// 로그인 버튼 (커뮤니티 내)
if (communityLoginBtn) {
  communityLoginBtn.addEventListener("click", async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      loginNotice.style.display = "none";
    } catch (e) {
      console.error("로그인 오류:", e);
    }
  });
}

// 게시글 제출
if (submitPostBtn) {
  submitPostBtn.addEventListener("click", async () => {
    const title = document.getElementById("post-title").value.trim();
    const body = document.getElementById("post-body").value.trim();

    if (!title || !body) {
      alert("제목과 내용을 모두 입력해주세요.");
      return;
    }

    try {
      await addDoc(collection(db, "posts"), {
        title,
        body,
        authorName: currentUser.displayName || "익명",
        authorId: currentUser.uid,
        createdAt: serverTimestamp(),
      });

      document.getElementById("post-title").value = "";
      document.getElementById("post-body").value = "";
      postForm.style.display = "none";
      loadPosts();
    } catch (e) {
      console.error("게시글 저장 오류:", e);
    }
  });
}

// 게시글 불러오기
async function loadPosts() {
  try {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return;

    // 샘플 게시글 제거 후 Firebase 데이터 삽입
    const samplePosts = postsList.querySelectorAll(".post-card");
    samplePosts.forEach((p) => p.remove());

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const date = data.createdAt?.toDate().toLocaleDateString("ko-KR") || "";
      const card = document.createElement("div");
      card.className = "post-card";
      card.innerHTML = `
        <div class="post-card__meta">
          <span>${data.authorName}</span>
          <span>${date}</span>
        </div>
        <p class="post-card__title">${data.title}</p>
        <p class="post-card__excerpt">${data.body.substring(0, 100)}${data.body.length > 100 ? "..." : ""}</p>
      `;
      postsList.prepend(card);
    });
  } catch (e) {
    console.error("게시글 불러오기 오류:", e);
  }
}

loadPosts();
