
// ADVERTISING PALACE COMMUNITY CHAT

const SUPABASE_URL = "https://ckvsalffcovthrsxfrmu.supabase.co";
const SUPABASE_KEY = "sb_publishable_aO0937qCIuyw1PJcCyh03w_LqMphmBL";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const accountSection = document.getElementById("accountSection");
const chatSection = document.getElementById("chatSection");
const accountStatus = document.getElementById("accountStatus");
const chatStatus = document.getElementById("chatStatus");
const messagesBox = document.getElementById("messages");

let currentUser = null;
let channel = null;
const displayedMessages = new Set();

function showStatus(element, message) {
  element.textContent = message;
}

// SAFE MESSAGE DISPLAY

function displayMessage(message) {
  if (displayedMessages.has(message.id)) return;

  displayedMessages.add(message.id);

  const card = document.createElement("div");
  card.className = "message";

  const username = document.createElement("strong");
  username.textContent = message.sender_name;

  const content = document.createElement("p");
  content.textContent = message.content;

  const time = document.createElement("small");
  time.className = "muted";
  time.textContent = new Date(message.created_at).toLocaleString();

  card.append(username, content, time);
  messagesBox.append(card);

  messagesBox.scrollTop = messagesBox.scrollHeight;
}

// LOAD RECENT MESSAGES

async function loadMessages() {
  messagesBox.replaceChildren();
  displayedMessages.clear();

  const { data, error } = await db
    .from("chat_messages")
    .select("id, sender_name, content, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    showStatus(chatStatus, "Could not load chat: " + error.message);
    return;
  }

  (data || []).reverse().forEach(displayMessage);
}

// LIVE CHAT UPDATES

function startLiveChat() {
  if (channel) {
    db.removeChannel(channel);
  }

  channel = db
    .channel("advertising-palace-live-chat")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "chat_messages"
      },
      (payload) => {
        displayMessage(payload.new);
      }
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        showStatus(chatStatus, "You're connected to live chat!");
      }

      if (status === "CHANNEL_ERROR") {
        showStatus(chatStatus, "Live chat connection failed. Refresh the page.");
      }
    });
}

// SHOW LOGGED-IN MEMBER

async function showChat(user) {
  currentUser = user;

  accountSection.style.display = "none";
  chatSection.style.display = "block";

  const username =
    user.user_metadata?.username ||
    user.email?.split("@")[0] ||
    "Member";

  document.getElementById("welcomeText").textContent =
    "Welcome, " + username + "! Be kind and have fun.";

  await loadMessages();
  startLiveChat();
}

// CREATE ACCOUNT

document.getElementById("signupForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const username = document.getElementById("signupUsername").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value;

  if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) {
    showStatus(accountStatus, "Username must be 3–24 letters, numbers or underscores.");
    return;
  }

  showStatus(accountStatus, "Creating your account...");

  const { data, error } = await db.auth.signUp({
    email,
    password,
    options: {
      data: { username }
    }
  });

  if (error) {
    showStatus(accountStatus, error.message);
    return;
  }

  if (data.session) {
    showStatus(accountStatus, "Account created!");
    await showChat(data.user);
  } else {
    showStatus(
      accountStatus,
      "Account created! Check your email for a confirmation link, then log in."
    );
  }
});

// LOG IN

document.getElementById("loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  showStatus(accountStatus, "Logging in...");

  const { data, error } = await db.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    showStatus(accountStatus, error.message);
    return;
  }

  showStatus(accountStatus, "Welcome back!");
  await showChat(data.user);
});

// SEND MESSAGE

document.getElementById("messageForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!currentUser) return;

  const input = document.getElementById("messageInput");
  const content = input.value.trim();

  if (!content || content.length > 500) return;

  const username =
    currentUser.user_metadata?.username ||
    currentUser.email?.split("@")[0] ||
    "Member";

  const sendButton = document.getElementById("sendButton");
  sendButton.disabled = true;
  showStatus(chatStatus, "Sending...");

  const { error } = await db
    .from("chat_messages")
    .insert({
      user_id: currentUser.id,
      sender_name: username,
      content,
      source: "website"
    });

  sendButton.disabled = false;

  if (error) {
    showStatus(chatStatus, "Message failed: " + error.message);
    return;
  }

  input.value = "";
  showStatus(chatStatus, "Message sent!");
});

// LOG OUT

document.getElementById("logoutButton").addEventListener("click", async () => {
  await db.auth.signOut();

  if (channel) {
    await db.removeChannel(channel);
    channel = null;
  }

  currentUser = null;
  displayedMessages.clear();
  messagesBox.replaceChildren();

  chatSection.style.display = "none";
  accountSection.style.display = "block";

  showStatus(accountStatus, "You have logged out.");
});

// CHECK EXISTING LOGIN

async function initializeChat() {
  const { data, error } = await db.auth.getSession();

  if (error) {
    showStatus(accountStatus, error.message);
    accountSection.style.display = "block";
    return;
  }

  if (data.session) {
    await showChat(data.session.user);
  } else {
    accountSection.style.display = "block";
    chatSection.style.display = "none";
  }
}

initializeChat();
