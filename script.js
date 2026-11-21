
// =====================================
// ADVERTISING PALACE
// SUPABASE WEBSITE SYSTEM
// =====================================

const SUPABASE_URL = "https://ckvsalffcovthrsxfrmu.supabase.co";
const SUPABASE_KEY = "sb_publishable_aO0937qCIuyw1PJcCyh03w_LqMphmBL";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

// =====================================
// NOTIFICATIONS
// =====================================

function notify(message) {
  alert(message);
}

// =====================================
// LOAD ADVERTISEMENTS
// =====================================

let allAds = [];

async function loadAdvertisements() {
  const grid = document.getElementById("serverGrid");
  const empty = document.getElementById("emptyState");

  if (!grid) return;

  grid.innerHTML = "<p>Loading servers...</p>";

  const { data, error } = await db
    .from("advertisements")
    .select("*")
    .eq("status", "approved")
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    grid.textContent = "Unable to load servers.";
    return;
  }

  allAds = data || [];
  filterAdvertisements();
}

// =====================================
// DISPLAY SERVERS
// =====================================

function displayAdvertisements(ads) {
  const grid = document.getElementById("serverGrid");
  const empty = document.getElementById("emptyState");
  const status = document.getElementById("directoryStatus");

  grid.innerHTML = "";

  if (empty) empty.hidden = ads.length !== 0;

  if (status) {
    status.textContent = ads.length + " servers found";
  }

  ads.forEach(ad => {
    const card = document.createElement("article");
    card.className = "server-card";

    const title = document.createElement("h3");
    title.textContent = ad.server_name;

    const category = document.createElement("span");
    category.className = "server-category";
    category.textContent = ad.category;

    const description = document.createElement("p");
    description.textContent = ad.description;

    const owner = document.createElement("p");
    owner.textContent = "Owner: " + ad.owner_name;

    card.append(title, category, description, owner);

    if (ad.featured) {
      const featured = document.createElement("strong");
      featured.textContent = "⭐ FEATURED";
      card.prepend(featured);
    }

    const link = document.createElement("a");
    link.className = "btn";
    link.textContent = "JOIN SERVER ↗";
    link.href = ad.invite_link;
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    card.appendChild(link);
    grid.appendChild(card);
  });
}

// =====================================
// SEARCH SERVERS
// =====================================

function filterAdvertisements() {
  const search = document.getElementById("searchInput");
  const category = document.getElementById("categoryFilter");

  const term = search ? search.value.toLowerCase() : "";
  const selected = category ? category.value : "all";

  const filtered = allAds.filter(ad => {
    const matchesSearch =
      ad.server_name.toLowerCase().includes(term) ||
      ad.description.toLowerCase().includes(term);

    const matchesCategory =
      selected === "all" || ad.category === selected;

    return matchesSearch && matchesCategory;
  });

  displayAdvertisements(filtered);
}

// =====================================
// SUBMIT ADVERTISEMENT
// =====================================

document.getElementById("adForm")
  .addEventListener("submit", async event => {
    event.preventDefault();

    const form = event.currentTarget;
    const data = new FormData(form);

    const invite = data.get("invite_link").trim();

    if (!/^https:\/\/(discord\.gg\/|discord\.com\/invite\/)[A-Za-z0-9-]+\/?$/.test(invite)) {
      return notify("Please enter a valid Discord invite link.");
    }

    const button = form.querySelector("button");
    button.disabled = true;
    button.textContent = "SUBMITTING...";

    const { error } = await db
      .from("advertisements")
      .insert({
        server_name: data.get("server_name").trim(),
        description: data.get("description").trim(),
        invite_link: invite,
        owner_name: data.get("owner_name").trim(),
        category: data.get("category"),
        status: "pending",
        featured: false
      });

    button.disabled = false;
    button.textContent = "SUBMIT ADVERTISEMENT →";

    if (error) {
      console.error(error);
      return notify("Could not submit advertisement. Please try again.");
    }

    form.reset();
    notify("Advertisement submitted! Waiting for approval.");
  });

// =====================================
// APPLICATIONS
// =====================================

document.querySelectorAll(".application-button")
  .forEach(button => {
    button.addEventListener("click", () => {
      const type = button.dataset.type;
      const form = document.getElementById("applicationForm");

      form.elements.application_type.value = type;
      document.getElementById("applicationTitle").textContent =
        type + " Application";

      form.scrollIntoView({ behavior: "smooth" });
    });
  });

document.getElementById("applicationForm")
  .addEventListener("submit", async event => {
    event.preventDefault();

    const form = event.currentTarget;
    const data = new FormData(form);

    const button = form.querySelector("button");
    button.disabled = true;

    const { error } = await db
      .from("applications")
      .insert({
        application_type: data.get("application_type"),
        applicant_name: data.get("applicant_name").trim(),
        contact: data.get("contact").trim(),
        answers: data.get("answers").trim(),
        status: "pending"
      });

    button.disabled = false;

    if (error) {
      console.error(error);
      return notify("Application failed. Please try again.");
    }

    form.reset();
    notify("Your application has been submitted!");
  });

// =====================================
// ANNOUNCEMENTS
// =====================================

async function loadAnnouncements() {
  const container = document.getElementById("announcementList");
  if (!container) return;

  const { data, error } = await db
    .from("announcements")
    .select("title,message,created_at")
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (error) {
    container.textContent = "Unable to load announcements.";
    console.error(error);
    return;
  }

  container.innerHTML = "";

  if (!data.length) {
    container.textContent = "No announcements yet. Check back soon!";
    return;
  }

  data.forEach(item => {
    const card = document.createElement("article");
    card.className = "card";

    const title = document.createElement("h3");
    title.textContent = item.title;

    const message = document.createElement("p");
    message.textContent = item.message;

    card.append(title, message);
    container.appendChild(card);
  });
}

// =====================================
// MOBILE MENU
// =====================================

document.getElementById("menuToggle")
  .addEventListener("click", () => {
    document.getElementById("navigation")
      .classList.toggle("open");
  });

// =====================================
// SEARCH LISTENERS
// =====================================

document.getElementById("searchInput")
  .addEventListener("input", filterAdvertisements);

document.getElementById("categoryFilter")
  .addEventListener("change", filterAdvertisements);

// =====================================
// WEBSITE STARTUP
// =====================================

document.getElementById("year").textContent =
  new Date().getFullYear();

loadAdvertisements();
loadAnnouncements();

console.log("👑 Advertising Palace loaded!");

