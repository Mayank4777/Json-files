const fileInput = document.getElementById("fileInput");
const loadBtn = document.getElementById("loadBtn");
const uploadScreen = document.getElementById("uploadScreen");
const chatScreen = document.getElementById("chatScreen");
const chat = document.getElementById("chat");
const chatName = document.getElementById("chatName");

const profileAvatar = document.getElementById("profileAvatar");
const photoInput = document.getElementById("photoInput");

const searchIcon = document.getElementById("searchIcon");
const searchBox = document.getElementById("searchBox");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

const dateIcon = document.getElementById("dateIcon");
const datePicker = document.getElementById("datePicker");

const navArrows = document.getElementById("navArrows");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

const backBtn = document.getElementById("backBtn");

const WINDOW = 1000;
const STEP = 200;

let allMessages = [];
let myName = "";
let otherName = "";
let avatarURL = "";

let start = 0;
let end = 0;

let searchHits = [];
let searchPos = -1;

/* HELPERS */
const initials = n => n.split(" ").map(x => x[0]).join("").slice(0,2);
const fmtDate = t => new Date(t).toLocaleDateString(undefined,{day:"numeric",month:"long",year:"numeric"});
const fmtTime = t => new Date(t).toLocaleString(undefined,{day:"numeric",month:"numeric",year:"numeric",hour:"numeric",minute:"2-digit",hour12:true});

/* AVATAR */
function drawAvatar(el, name) {
  el.innerHTML = "";
  if (avatarURL) {
    const img = document.createElement("img");
    img.src = avatarURL;
    el.appendChild(img);
  } else {
    el.textContent = initials(name);
  }
}

profileAvatar.onclick = () => photoInput.click();
photoInput.onchange = () => {
  avatarURL = URL.createObjectURL(photoInput.files[0]);
  drawAvatar(profileAvatar, otherName);
  render();
};

/* LOAD */
loadBtn.onclick = async () => {
  uploadScreen.classList.add("hidden");
  chatScreen.classList.remove("hidden");

  allMessages = [];

  for (const f of fileInput.files) {
    const data = JSON.parse(await f.text());
    myName = data.participants[1].name;
    otherName = data.participants[0].name;
    chatName.textContent = otherName;
    drawAvatar(profileAvatar, otherName);

    data.messages.forEach(m => {
      if (m.timestamp_ms) {
        allMessages.push({
          sender: m.sender_name,
          text: m.content || "[Media]",
          time: m.timestamp_ms
        });
      }
    });
  }

  allMessages.sort((a,b)=>a.time-b.time);
  end = allMessages.length;
  start = Math.max(0,end-WINDOW);
  render();
  chat.scrollTop = chat.scrollHeight;
};

/* RENDER */
function render() {
  chat.innerHTML = "";
  let lastDate = "";
  const frag = document.createDocumentFragment();

  for (let i=start;i<end;i++) {
    const m = allMessages[i];
    const d = new Date(m.time).toDateString();

    if (d!==lastDate) {
      const div=document.createElement("div");
      div.className="date-divider";
      div.textContent=fmtDate(m.time);
      frag.appendChild(div);
      lastDate=d;
    }

    const row=document.createElement("div");
    row.className="message-row";

    if (m.sender!==myName) {
      const av=document.createElement("div");
      av.className="avatar";
      drawAvatar(av,otherName);
      row.appendChild(av);
    }

    const b=document.createElement("div");
    b.className="bubble "+(m.sender===myName?"me":"");
    b.dataset.index=i;
    b.innerHTML=`<div>${m.text}</div><div class="message-time">${fmtTime(m.time)}</div>`;
    row.appendChild(b);

    frag.appendChild(row);
  }
  chat.appendChild(frag);
}

/* SCROLL */
chat.addEventListener("scroll",()=>{
  if(chat.scrollTop<50 && start>0){
    const h=chat.scrollHeight;
    start=Math.max(0,start-STEP);
    end=start+WINDOW;
    render();
    chat.scrollTop=chat.scrollHeight-h;
  }
});

/* SEARCH */
searchIcon.onclick=()=>{
  searchBox.classList.toggle("hidden");
  navArrows.classList.add("hidden");
};

searchBtn.onclick = () => {
  const q = searchInput.value.toLowerCase().trim();
  if (!q) return;

  clearHighlights();

  searchHits = [];
  searchPos = -1;

  allMessages.forEach((m, i) => {
    if (m.text.toLowerCase().includes(q)) {
      searchHits.push(i);
    }
  });

  if (searchHits.length) {
    navArrows.classList.remove("hidden");
    searchPos = 0;
    jump(searchHits[0], q);
  } else {
    navArrows.classList.add("hidden");
  }
};


nextBtn.onclick = () => {
  if (!searchHits.length) return;
  searchPos = (searchPos + 1) % searchHits.length;
  jump(searchHits[searchPos], searchInput.value.toLowerCase());
};

prevBtn.onclick = () => {
  if (!searchHits.length) return;
  searchPos =
    (searchPos - 1 + searchHits.length) % searchHits.length;
  jump(searchHits[searchPos], searchInput.value.toLowerCase());
};


function jump(index, query) {
  start = Math.max(0, index - Math.floor(WINDOW / 2));
  end = Math.min(allMessages.length, start + WINDOW);

  render();

  setTimeout(() => {
    clearHighlights();

    const bubble = chat.querySelector(`[data-index="${index}"]`);
    if (!bubble) return;

    // highlight matched text
    const textDiv = bubble.firstChild;
    const html = textDiv.textContent.replace(
      new RegExp(`(${query})`, "gi"),
      `<span class="highlight">$1</span>`
    );

    textDiv.innerHTML = html;

    bubble.scrollIntoView({ block: "center" });
  }, 0);
}


/* DATE */
dateIcon.onclick=()=>datePicker.showPicker();
datePicker.onchange=()=>{
  const i=allMessages.findIndex(m=>new Date(m.time).toISOString().slice(0,10)===datePicker.value);
  if(i!==-1) jump(i);
};

/* BACK */
backBtn.onclick=()=>{
  chatScreen.classList.add("hidden");
  uploadScreen.classList.remove("hidden");
};

function clearHighlights() {
  chat.querySelectorAll(".highlight").forEach(el => {
    el.classList.remove("highlight");
  });
}
