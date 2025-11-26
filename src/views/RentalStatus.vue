<template>
  <div class="container py-4">
    <h2 class="text-center fw-bold mb-4 text-primary">RENTAL STATUS</h2>

    <div class="row justify-content-center">
      <div
        v-for="(rental, index) in rentals"
        :key="index"
        class="col-md-6 col-lg-5 d-flex justify-content-center"
      >
        <div class="card rental-card shadow-bottom border-0 m-3">
          <div
            class="card-body d-flex justify-content-between align-items-center text-center"
          >
            <!-- LEFT SIDE -->
            <div class="left-section w-50">
              <div class="d-flex flex-column align-items-center mb-3">
                <img
                  :src="profile.profile_pic_url || require('@/assets/user.png')"
                  alt="Profile"
                  class="rounded-circle border mb-2"
                  width="70"
                  height="70"
                />
              </div>

              <div>
                <p class="mb-1" align="left"><strong>Student ID:</strong> {{ rental.stud_id }}</p>
                <p class="mb-1" align="left">
                  <strong>Student Name:</strong> {{ rental.f_name }} {{ rental.l_name }}
                </p>
                <p class="mb-1" align="left"><strong>Course:</strong> {{ rental.course_name }}</p>
                <p class="mb-1" align="left"><strong>Email:</strong> {{ rental.email }}</p>
              </div>
            </div>

            <!-- RIGHT SIDE -->
            <div class="right-section w-50">
              <div class="mb-2">
                <i class="bi bi-hdd-stack fs-3 text-secondary"></i>
                <div class="fw-bold">{{ rental.locker_number }}</div>
              </div>

              <div>
                <p class="status-badge"
                :class="{
                  'pending-status': rental.rental_status === 'pending',
                  'active-status': rental.rental_status === 'active',
                  'expired-status': rental.rental_status === 'expired',
                  'cancelled-status': rental.rental_status === 'cancelled'
                  }">
                  {{ rental.rental_status }}
                </p>

                <p class="mb-1">
                  <strong>Rental Start:</strong><br />{{ formatDate(rental.start_date) }}
                </p>
                <p class="mb-1">
                  <strong>Rental End:</strong><br />{{ formatDate(rental.due_date) }}
                </p>
                <p class="mb-1">
                  <strong>Balance:</strong><br />
                  <span class="text-danger fw-bold">₱{{ rental.balance ? Number(rental.balance).toFixed(2) : '0.00' }}</span>
                </p>
              </div>

              <div class="d-flex flex-column align-items-center gap-2">
                <button 
                  class="btn btn-primary btn-sm"
                  @click="viewPaymentHistory(rental.rental_id)"
                >
                  Payment History
                </button>
                <button 
                  class="btn btn-success btn-sm"
                  @click="openPaymentModal(rental)"
                  :disabled="!canMakePayment(rental)"
                  v-if="rental.balance > 0"
                >
                  Make Payment
                </button>
                <!-- ✅ Add note for expired rentals -->
                <small v-if="rental.rental_status === 'expired' && rental.balance > 0" class="text-warning">
                  <i class="bi bi-info-circle"></i> Pay balance only (won't reactivate)
                </small>
                <small v-if="rental.balance > 0 && !canMakePayment(rental)" class="text-muted">
                  {{ getPaymentStatusMessage(rental) }}
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- NO DATA -->
      <div v-if="rentals.length === 0" class="text-muted text-center mt-5">
        <i class="bi bi-info-circle"></i> No rental records found
      </div>
    </div>

    <!-- PAYMENT HISTORY MODAL -->
    <div v-if="showPaymentHistory" class="modal fade show d-block" tabindex="-1">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Payment History - Locker {{ selectedRental?.locker_number }}</h5>
            <button type="button" class="btn-close" @click="showPaymentHistory = false"></button>
          </div>
          <div class="modal-body">
            <div v-if="paymentHistory.length === 0" class="text-center text-muted py-4">
              No payment records found
            </div>
            <div v-else class="table-responsive">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="payment in paymentHistory" :key="payment.payment_id">
                    <td>{{ formatDate(payment.payment_date) }}</td>
                    <td>₱{{ Number(payment.amount_paid).toFixed(2) }}</td>
                    <td>
                      <span class="badge bg-secondary">{{ payment.payment_method }}</span>
                    </td>
                    <td>
                      <span 
                        :class="[
                          'badge',
                          payment.status === 'Verified' ? 'bg-success' :
                          payment.status === 'Rejected' ? 'bg-danger' : 'bg-warning text-dark'
                        ]"
                      >
                        {{ payment.status }}
                      </span>
                    </td>
                    <td class="text-muted small">{{ payment.remarks || '—' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showPaymentHistory" class="modal-backdrop fade show"></div>

    <!-- PAYMENT MODAL -->
    <div v-if="showPaymentModal" class="modal fade show d-block" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Make Payment - Locker {{ selectedRental?.locker_number }}</h5>
            <button type="button" class="btn-close" @click="closePaymentModal"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <p><strong>Current Balance:</strong> ₱{{ Number(selectedRental?.balance).toFixed(2) }}</p>
              <p class="text-muted small">Minimum payment: ₱60.00</p>
            </div>

            <div class="mb-3">
              <label class="form-label">Payment Amount</label>
              <input 
                v-model.number="paymentAmount" 
                type="number" 
                class="form-control"
                :min="60"
                :max="selectedRental?.balance"
                step="0.01"
                placeholder="Enter amount (min ₱60)"
              />
              <div class="form-text">
                You can pay any amount between ₱60 and ₱{{ Number(selectedRental?.balance).toFixed(2) }}
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label">Payment Method</label>
              <select v-model="paymentMethod" class="form-select">
                <option value="">Select method</option>
                <option value="cash">Cash</option>
                <option value="qr">GCash QR</option>
              </select>
            </div>

            <!-- QR CODE SECTION -->
            <div v-if="paymentMethod === 'qr' && !qrGenerated" class="mb-3">
              <button 
                class="btn btn-primary w-100"
                @click="generateQR"
                :disabled="!paymentAmount || paymentAmount < 60"
              >
                Generate QR Code
              </button>
            </div>

            <div v-if="qrGenerated" class="mb-3 text-center">
              <img :src="qrCodeUrl" alt="GCash QR" class="img-fluid mb-3" style="max-width: 300px;" />
              <p class="text-muted small">Scan this QR code with GCash to pay ₱{{ Number(paymentAmount || 0).toFixed(2) }}</p>
              
              <div class="mb-3">
                <label class="form-label">Reference Number</label>
                <input 
                  v-model="referenceNumber" 
                  type="text" 
                  class="form-control"
                  placeholder="Enter GCash reference number"
                />
              </div>

              <div class="mb-3">
                <label class="form-label">Upload Receipt</label>
                <input 
                  type="file" 
                  class="form-control"
                  accept="image/*"
                  @change="handleReceiptUpload"
                />
              </div>
            </div>

            <!-- <div v-if="paymentError" class="alert alert-danger">
              {{ paymentError }}
            </div> -->
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closePaymentModal">Cancel</button>
            <button 
              type="button" 
              class="btn btn-primary"
              @click="submitPayment"
              :disabled="!canSubmitPayment"
            >
              Submit Payment
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showPaymentModal" class="modal-backdrop fade show"></div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "RentStatus",
  data() {
    return {
      rentals: [],
      profile: {
        user_id: "",
        profile_pic_url: "",
      },
      showPaymentHistory: false,
      showPaymentModal: false,
      selectedRental: null,
      paymentHistory: [],
      paymentAmount: 60,
      paymentMethod: "",
      qrGenerated: false,
      qrCodeUrl: "",
      referenceNumber: "",
      receiptFile: null,
      receiptBase64: "",
      paymentError: "",
    };
  },
  computed: {
    canSubmitPayment() {
      if (this.paymentMethod === "cash") {
        return this.paymentAmount >= 60 && this.paymentAmount <= this.selectedRental?.balance;
      } else if (this.paymentMethod === "qr") {
        return (
          this.qrGenerated &&
          this.referenceNumber &&
          this.receiptBase64 &&
          this.paymentAmount >= 60 &&
          this.paymentAmount <= this.selectedRental?.balance
        );
      }
      return false;
    },
  },
  methods: {
    async fetchRentals() {
      try {
        const res = await axios.get("http://localhost:3001/rent-status", {
          withCredentials: true,
        });
        this.rentals = res.data;
      } catch (err) {
        console.error("Error fetching rent status:", err);
      }
    },

    async fetchProfile() {
      try {
        const res = await axios.get("http://localhost:3001/settings", {
          withCredentials: true,
        });
        if (res.data.user) {
          this.profile.user_id = res.data.user.user_id;
          this.profile.profile_pic_url = `http://localhost:3001/profile-pic/${res.data.user.user_id}`;
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    },

    canMakePayment(rental) {
      // Check if there are pending payments
      if (rental.pending_payment) return false;

      // ❌ no payments allowed if the rental is expired or cancelled
      if (/*rental.rental_status === 'expired' ||*/ rental.rental_status === 'cancelled') {
        return false;
      }
      
      // Check if balance exists
      if (!rental.balance || rental.balance <= 0) return false;

      return true;
    },

    getPaymentStatusMessage(rental) {
      
      if (rental.pending_payment) {
        return "Payment pending verification";
      }
      // if (rental.rental_status === 'expired') {
      //   return "rental is expired. payments are not allowed.";
      // }
      if (rental.rental_status === 'cancelled') {
        return "rental was cancelled. payments are not allowed.";
      }
      return "";
    },
    async viewPaymentHistory(rentalId) {
      try {
        const res = await axios.get(
          `http://localhost:3001/history/${rentalId}`,
          { withCredentials: true }
        );
        this.paymentHistory = res.data.payments || [];
        this.selectedRental = this.rentals.find(r => r.rental_id === rentalId);
        this.showPaymentHistory = true;
      } catch (err) {
        console.error("Error fetching payment history:", err);
        alert("Failed to load payment history");
      }
    },

    openPaymentModal(rental) {
      this.selectedRental = rental;
      this.paymentAmount = 60; // Default to minimum
      this.paymentMethod = "";
      this.qrGenerated = false;
      this.qrCodeUrl = "";
      this.referenceNumber = "";
      this.receiptFile = null;
      this.receiptBase64 = "";
      this.paymentError = "";
      this.showPaymentModal = true;
    },

    closePaymentModal() {
      this.showPaymentModal = false;
      this.selectedRental = null;
      this.paymentError = "";
    },

    async generateQR() {
      try {
        this.paymentError = "";
        const res = await axios.post(
          "http://localhost:3001/generate-qr",
          {
            rental_id: this.selectedRental.rental_id,
            amount: this.paymentAmount,
          },
          { withCredentials: true }
        );
        
        this.qrCodeUrl = `http://localhost:3001${res.data.qr_download}`;
        this.qrGenerated = true;
      } catch (err) {
        console.error("Error generating QR:", err);
        this.paymentError = err.response?.data?.error || "Failed to generate QR code";
      }
    },

    handleReceiptUpload(event) {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        // Get base64 without the data:image/...;base64, prefix
        this.receiptBase64 = e.target.result.split(',')[1];
      };
      reader.readAsDataURL(file);
    },

    async submitPayment() {
      try {
        this.paymentError = "";

        if (this.paymentAmount < 60) {
          this.paymentError = "Minimum payment is ₱60";
          return;
        }

        if (this.paymentAmount > this.selectedRental.balance) {
          this.paymentError = "Amount exceeds remaining balance";
          return;
        }
        // console.log("Payload:", payload);
        // console.log("Rental selected:", this.selectedRental);

        const payload = {
          rental_id: this.selectedRental.rental_id,
          amount_paid_now: this.paymentAmount,
          payment_method: this.paymentMethod,
        };

        if (this.paymentMethod === "qr") {
          if (!this.referenceNumber) {
            this.paymentError = "Reference number is required";
            return;
          }
          if (!this.receiptBase64) {
            this.paymentError = "Receipt image is required";
            return;
          }
          payload.reference_number = this.referenceNumber;
          payload.receipt = this.receiptBase64;
        }

        const res = await axios.post(
          "http://localhost:3001/record",
          payload,
          { withCredentials: true }
        );

        alert(res.data.message);
        this.closePaymentModal();
        this.fetchRentals(); // Refresh rental data
      } catch (err) {
        console.error("Error submitting payment:", err);
        this.paymentError = err.response?.data?.error || "Failed to submit payment";
      }
    },

    formatDate(dateStr) {
      if (!dateStr) return "—";
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    },
  },
  mounted() {
    this.fetchRentals();
    this.fetchProfile();
  },
};
</script>

<style scoped>
.rental-card {
  width: 550px;
  border-radius: 14px;
  background-color: #fff;
  padding: 18px 20px;
  margin: 15px;
}

.shadow-bottom {
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
}

.card-body {
  font-size: 14px;
  color: #333;
}

.left-section,
.right-section {
  text-align: center;
}

.btn {
  border-radius: 20px;
  font-weight: 500;
  padding: 6px 18px;
}

.btn-primary {
  background-color: #007bff;
  border: none;
}

.btn-success {
  background-color: #28a745;
  border: none;
}

.btn-outline-primary {
  border: 1px solid #007bff;
  color: #007bff;
}

.btn-outline-primary:hover {
  background-color: #007bff;
  color: #fff;
}

img {
  object-fit: cover;
  border: 2px solid #ddd;
}

.rental-card:hover {
  transform: translateY(-4px);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 10px 18px rgba(0, 0, 0, 0.18);
}

.modal-backdrop {
  z-index: 1040;
}
.modal {
  z-index: 1050;
}

.pending-status {
  color: #ffc107;
  font-weight: bold;
}

.active-status {
  color: #1a7f37;
  font-weight: bold;
}

.expired-status {
  color: #b91c1c;
  font-weight: bold;
}

.cancelled-status {
  color: #6b7280;
  font-weight: bold;
}

</style>