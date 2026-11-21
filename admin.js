
// ADVERTISING PALACE ADMIN PANEL

const SUPABASE_URL = "https://ckvsalffcovthrsxfrmu.supabase.co";
const SUPABASE_KEY = "sb_publishable_aO0937qCIuyw1PJcCyh03w_LqMphmBL";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const loginSection = document.getElementById("loginSection");
const dashboard = document.getElementById("adminDashboard");
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

function showMessage(element, message) {
  if (element) element.textContent = message;
}

function makeElement(tag, text, className) {
  const element = document.createElement(tag);
  element.textContent = text || "";
  if (className) element.className = className;
  return element;
}

// CHECK WHETHER THE ACCOUNT IS AN ADMIN

async function checkAdmin() {
  const { data: { user } } = await db.auth.getUser();

  if (!user) {
    loginSection.hidden = false;
    dashboard.hidden = true;
    return;
  }

  const { data: profile, error } = await db
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile || profile.is_admin !== true) {
    await db.auth.signOut();
    loginSection.hidden = false;
    dashboard.hidden = true;
    showMessage(loginMessage, "This account does not have administrator access.");
    return;
  }

  loginSection.hidden = true;
  dashboard.hidden = false;

  loadAdvertisements();
  loadApplications();
}

// ADMIN LOGIN

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  showMessage(loginMessage, "Signing in...");

  const { error } = await db.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    showMessage(loginMessage, "Login failed: " + error.message);
    return;
  }

  await checkAdmin();
});

// LOG OUT

document.getElementById("logoutButton").addEventListener("click", async () => {
  await db.auth.signOut();
  dashboard.hidden = true;
  loginSection.hidden = false;
  showMessage(loginMessage, "You have logged out.");
});

// LOAD PENDING ADVERTISEMENTS

async function loadAdvertisements() {
  const container = document.getElementById("pendingAds");
  container.replaceChildren(makeElement("p", "Loading..."));

  const { data, error } = await db
    .from("advertisements")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  container.replaceChildren();

  if (error) {
    container.append(makeElement("p", "Could not load advertisements: " + error.message));
    return;
  }

  if (!data || data.length === 0) {
    container.append(makeElement("p", "No pending advertisements."));
    return;
  }

  data.forEach((ad) => {
    const card = makeElement("div", "", "server-card");

    card.append(makeElement("h3", ad.server_name));
    card.append(makeElement("p", ad.description));
    card.append(makeElement("p", "Owner: " + (ad.owner_name || "Unknown")));
    card.append(makeElement("p", "Category: " + (ad.category || "Other")));

    const invite = makeElement("a", "Open Discord Invite");
    invite.href = ad.invite_link;
    invite.target = "_blank";
    invite.rel = "noopener noreferrer";
    card.append(invite);

    const approve = makeElement("button", "Approve");
    approve.type = "button";
    approve.addEventListener("click", () => updateAd(ad.id, "approved"));

    const reject = makeElement("button", "Reject");
    reject.type = "button";
    reject.addEventListener("click", () => updateAd(ad.id, "rejected"));

    card.append(approve, reject);
    container.append(card);
  });
}

// APPROVE OR REJECT AN ADVERTISEMENT

async function updateAd(id, status) {
  const { error } = await db
    .from("advertisements")
    .update({ status })
    .eq("id", id);

  if (error) {
    alert("Could not update advertisement: " + error.message);
    return;
  }

  alert("Advertisement " + status + "!");
  loadAdvertisements();
}

// LOAD APPLICATIONS

async function loadApplications() {
  const container = document.getElementById("applicationsList");
  container.replaceChildren(makeElement("p", "Loading..."));

  const { data, error } = await db
    .from("applications")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  container.replaceChildren();

  if (error) {
    container.append(makeElement("p", "Could not load applications: " + error.message));
    return;
  }

  if (!data || data.length === 0) {
    container.append(makeElement("p", "No pending applications."));
    return;
  }

  data.forEach((application) => {
    const card = makeElement("div", "", "server-card");

    card.append(makeElement("h3", application.application_type + " Application"));
    card.append(makeElement("p", "Applicant: " + application.applicant_name));
    card.append(makeElement("p", "Contact: " + application.contact));
    card.append(makeElement("p", "Answers: " + application.answers));

    const approve = makeElement("button", "Approve");
    approve.type = "button";
    approve.addEventListener("click", () => updateApplication(application.id, "approved"));

    const reject = makeElement("button", "Reject");
    reject.type = "button";
    reject.addEventListener("click", () => updateApplication(application.id, "rejected"));

    card.append(approve, reject);
    container.append(card);
  });
}

// APPROVE OR REJECT AN APPLICATION

async function updateApplication(id, status) {
  const { error } = await db
    .from("applications")
    .update({ status })
    .eq("id", id);

  if (error) {
    alert("Could not update application: " + error.message);
    return;
  }

  alert("Application " + status + "!");
  loadApplications();
}

// PUBLISH ANNOUNCEMENTS

document.getElementById("announcementForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const title = document.getElementById("announcementTitle").value.trim();
  const message = document.getElementById("announcementMessage").value.trim();
  const status = document.getElementById("announcementStatus");

  showMessage(status, "Publishing...");

  const { error } = await db
    .from("announcements")
    .insert([{
      title,
      message,
      published: true
    }]);

  if (error) {
    showMessage(status, "Could not publish: " + error.message);
    return;
  }

  showMessage(status, "Announcement published!");
  document.getElementById("announcementForm").reset();
});

// CHECK LOGIN WHEN THE PAGE OPENS

checkAdmin();
