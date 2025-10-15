<template>
  <div class="container-fluid py-4">
    <div class="row">
      <!-- Sidebar with tickets -->
      <div class="col-4 border-end">
        <h4 class="mb-3">Support Tickets</h4>

        <!-- Add Ticket Form -->
        <div class="card mb-3">
          <div
            class="card-header d-flex justify-content-between align-items-center"
            @click="showForm = !showForm"
            style="cursor: pointer;"
          >
            <span><i class="bi bi-plus-circle me-2"></i>Add New Ticket</span>
            <i :class="showForm ? 'bi bi-chevron-up' : 'bi bi-chevron-down'"></i>
          </div>

          <div v-show="showForm" class="card-body">
            <div class="mb-2">
              <label class="form-label">Subject</label>
              <input v-model="newTicket.subject" class="form-control" placeholder="Enter subject" />
            </div>
            <div class="mb-2">
              <label class="form-label">Request</label>
              <input v-model="newTicket.request" class="form-control" placeholder="Enter request" />
            </div>
            <div class="mb-2">
              <label class="form-label">Description</label>
              <textarea
                v-model="newTicket.description"
                class="form-control"
                rows="3"
                placeholder="Enter description"
              ></textarea>
            </div>
            <button class="btn btn-primary w-100" @click="submitTicket">Submit</button>
          </div>
        </div>

        <!-- Filter -->
        <div class="mb-3">
          <select v-model="filter" class="form-select">
            <option>All</option>
            <option>Open</option>
            <option>Answered</option>
            <option>Closed</option>
          </select>
        </div>

        <!-- Ticket list -->
        <ul class="list-group">
          <li
            v-for="ticket in filteredTickets"
            :key="ticket.ticket_id"
            class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
            :class="{ active: selectedTicket && selectedTicket.ticket_id === ticket.ticket_id }"
            @click="selectTicket(ticket)"
          >
            <div>
              <strong>{{ ticket.subject }}</strong><br />
              <small>Status: {{ ticket.status || ticket.ticket_status }}</small>
            </div>
            <span class="badge bg-primary rounded-pill">
              {{ ticket.priority || "N/A" }}
            </span>
          </li>
        </ul>
      </div>

      <!-- Messages Panel -->
      <div class="col-8">
        <div v-if="!selectedTicket" class="text-center mt-5">
          <h5>Select a ticket to view messages</h5>
        </div>

        <div v-else>
          <h4 class="mb-3">
            Ticket #{{ selectedTicket.ticket_id }} - {{ selectedTicket.subject }}
          </h4>

          <div class="chat-box border rounded p-3 mb-3" style="height: 400px; overflow-y: auto;">
            <div v-if="loadingMessages" class="text-center text-muted">
              Loading messages...
            </div>

            <div v-else-if="messages.length === 0" class="text-center text-muted">
              No messages yet for this ticket.
            </div>

            <div v-else>
              <div v-for="msg in messages" :key="msg.id" class="mb-3">
                <div :class="msg.sender === 'Admin' ? 'text-end' : 'text-start'">
                  <div
                    :class="[
                      'd-inline-block p-2 rounded',
                      msg.sender === 'Admin'
                        ? 'bg-primary text-white'
                        : 'bg-light border'
                    ]"
                    style="max-width: 70%;"
                  >
                    <strong>{{ msg.sender }}</strong>
                    <p class="mb-1">{{ msg.text }}</p>
                    <small class="text-muted">{{ formatDate(msg.date) }}</small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Reply box -->
          <div class="input-group">
            <input
              v-model="newMessage"
              type="text"
              class="form-control"
              placeholder="Type your reply..."
              @keyup.enter="sendMessage"
            />
            <button class="btn btn-primary" @click="sendMessage">Send</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from "vue";
import axios from "axios";
import jwtDecode from "jwt-decode";

const filter = ref("All");
const tickets = ref([]);
const selectedTicket = ref(null);
const messages = ref([]);
const newMessage = ref("");
const loadingMessages = ref(false);
const showForm = ref(false);

const token = localStorage.getItem("token");
const decoded = token ? jwtDecode(token) : null;
const userId = decoded?.id || decoded?.user_id; // <-- adjust to your backend token

// New ticket form
const newTicket = ref({
  subject: "",
  request: "",
  description: "",
});

// Helper: date format
const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleString();
};

// Fetch all tickets
const fetchTickets = async () => {
  try {
    const res = await axios.get("http://localhost:3001/tickets", {
      headers: { Authorization: `Bearer ${token}` },
    });
    tickets.value = Array.isArray(res.data) ? res.data : res.data.data || [];
  } catch (err) {
    console.error("Error fetching tickets:", err);
    tickets.value = [];
  }
};

// Computed ticket filter
const filteredTickets = computed(() => {
  if (filter.value === "All") return tickets.value;
  return tickets.value.filter(
    (t) => t.status === filter.value || t.ticket_status === filter.value
  );
});

// Fetch messages for a ticket
const selectTicket = async (ticket) => {
  selectedTicket.value = ticket;
  messages.value = [];
  loadingMessages.value = true;

  try {
    const res = await axios.get(
      `http://localhost:3001/tickets/${ticket.ticket_id}/messages`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const data = Array.isArray(res.data)
      ? res.data
      : res.data.messages || res.data.data || [];

    messages.value = data.map((msg) => ({
      id: msg.message_id || msg.id || Date.now(),
      text: msg.message || msg.text || msg.content || "",
      date: msg.created_at || msg.date || new Date().toISOString(),
      sender:
        msg.sender ||
        (msg.role?.toLowerCase() === "admin"
          ? "Admin"
          : msg.user_id === userId
          ? "User"
          : "Admin"),
    }));

    await nextTick();
    const chatBox = document.querySelector(".chat-box");
    if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
  } catch (err) {
    console.error("Error fetching messages:", err.response?.data || err);
  } finally {
    loadingMessages.value = false;
  }
};

// Send new message
const sendMessage = async () => {
  if (!newMessage.value.trim() || !selectedTicket.value) return;

  const newMsgObj = {
    id: Date.now(),
    text: newMessage.value,
    sender: "User",
    date: new Date().toISOString(),
  };

  try {
    const payload = {
      user_id: userId,
      message: newMessage.value,
      role: "user",
      created_at: new Date().toISOString(),
    };

    await axios.post(
      `http://localhost:3001/tickets/${selectedTicket.value.ticket_id}/messages`,
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Show instantly
    messages.value.push(newMsgObj);
    newMessage.value = "";

    await nextTick();
    const chatBox = document.querySelector(".chat-box");
    if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
  } catch (err) {
    console.error("Error sending message:", err.response?.data || err);
  }
};

// Submit new ticket
const submitTicket = async () => {
  if (
    !newTicket.value.subject ||
    !newTicket.value.request ||
    !newTicket.value.description
  ) {
    alert("Please fill out all fields.");
    return;
  }

  try {
    await axios.post(
      "http://localhost:3001/tickets",
      { ...newTicket.value, user_id: userId },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    alert("Ticket added successfully!");
    showForm.value = false;
    newTicket.value = { subject: "", request: "", description: "" };
    await fetchTickets();
  } catch (err) {
    console.error("Error adding ticket:", err);
    alert("Failed to add ticket.");
  }
};

onMounted(fetchTickets);
</script>

<style scoped>
.chat-box {
  background: #f9f9f9;
}
.list-group-item.active {
  background-color: #0d6efd;
  color: white;
}
</style>
