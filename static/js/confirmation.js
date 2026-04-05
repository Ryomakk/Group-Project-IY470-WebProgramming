document.addEventListener("DOMContentLoaded", () => { // Runs when the page has fully loaded
  
  // ===== DOM ELEMENTS =====
  const dateInput = document.getElementById("start-date"); // Input where user selects start date
  const sumDate = document.getElementById("sum-date"); // Displays selected start date in summary
  const sumPlan = document.getElementById("sum-plan"); // Displays selected plan
  const sumType = document.getElementById("sum-type"); // Displays membership type
  const sumEndDate = document.getElementById("sum-end-date"); // Displays calculated end date
  const planButtons = document.querySelectorAll(".small-card"); // All plan selection buttons
  const ticketCards = document.querySelectorAll(".card"); // All membership cards
  const paymentButtons = document.querySelectorAll(".payment-btn"); // Payment method buttons
  const paymentDetails = document.getElementById("payment-details"); // Hidden payment form
  const payBtn = document.getElementById("pay-btn"); // Confirm payment button
  const invoiceList = document.getElementById("invoice-list"); // Invoice display area
  const confirmModal = document.getElementById("confirmModal"); // Popup modal container
  const modalContent = document.getElementById("modalContent"); // Modal text content
  const closeModalBtn = document.getElementById("closeModalBtn"); // Final purchase button
  
  // ===== PAYMENT INPUTS =====
  const cardNumberInput = document.getElementById("card-number"); // Card number field
  const cardNameInput = document.getElementById("card-name"); // Cardholder name field
  const expDateInput = document.getElementById("exp-date"); // Expiry date field
  const cvcInput = document.getElementById("cvc"); // CVC field
  
  // ===== ERROR ELEMENTS =====
  const cardNumberError = document.getElementById("card-number-error"); // Error message for card number
  const cardNameError = document.getElementById("card-name-error"); // Error message for name
  const expError = document.getElementById("exp-error"); // Error message for expiry
  const cvcError = document.getElementById("cvc-error"); // Error message for CVC

  // ===== STATE VARIABLES =====
  let paymentMethodSelected = false; // Tracks if user selected a payment method
  let selectedMonths = 1; // Default plan duration (1 month)
  let selectedTicketType = "Normal"; // Default membership type

  // ===== DATE FUNCTIONS =====

  // Formats a date into DD/MM/YYYY for display
  function formatDateDMY(date) {
    const d = String(date.getDate()).padStart(2, "0"); // Ensures 2-digit day
    const m = String(date.getMonth() + 1).padStart(2, "0"); // Month is 0-based
    const y = date.getFullYear(); // Gets full year
    return `${d}/${m}/${y}`; // Returns formatted string
  }

  // Adds a number of months to a date (used for end date calculation)
  function addMonths(date, months) {
    const d = new Date(date); // Create a copy of date
    const startDay = d.getDate(); // Store original day
    d.setMonth(d.getMonth() + months); // Add months
    if (d.getDate() < startDay) d.setDate(0); // Fix overflow (e.g. Feb shorter months)
    return d;
  }

  // Updates the end date shown in the summary
  function updateEndDate() {
    if (!dateInput.value || !selectedMonths) { // If no date or plan selected
      sumEndDate.textContent = "—"; // Show placeholder
      return;
    }
    const start = new Date(dateInput.value); // Get start date
    const end = addMonths(start, selectedMonths); // Calculate end date
    sumEndDate.textContent = formatDateDMY(end); // Display formatted date
  }

  // ===== DISCOUNT FUNCTIONS =====

  // Returns discount rate depending on gym and membership type
  function getDiscountRate(selectedGym, ticketType) {
    if (ticketType === "Student") return selectedGym === "uGym" ? 0.20 : 0.15;
    if (ticketType === "Pensioners") return selectedGym === "uGym" ? 0.15 : 0.20;
    return 0; // Normal users get no discount
  }

  // Checks if an item is eligible for discount
  function isDiscountableItem(itemName) {
    const name = itemName.toLowerCase();
    return !name.includes("massage") && !name.includes("physio"); // These services are excluded
  }

  // ===== VALIDATION =====

  // Validates all payment inputs and enables/disables button
  function validatePaymentForm() {
    const cardNumberValid = cardNumberInput.value.replace(/\s/g, "").length === 16; // Must be 16 digits
    const cardNameValid = /^[A-Za-z\s]{2,}$/.test(cardNameInput.value); // Only letters, min length 2
    const expValid = /^(0[1-9]|1[0-2])\/\d{2}$/.test(expDateInput.value); // Format MM/YY
    const cvcValid = /^\d{3}$/.test(cvcInput.value); // Must be exactly 3 digits

    const allValid = paymentMethodSelected && cardNumberValid && cardNameValid && expValid && cvcValid;
    payBtn.disabled = !allValid; // Disable button if any condition fails
  }

  // ===== INVOICE GENERATION =====

  // Builds and displays invoice dynamically
  function renderInvoice() {
    const raw = localStorage.getItem("invoiceData"); // Retrieve stored data
    if (!raw) {
      invoiceList.innerHTML = "<div>No invoice data found. Please go to gym comparison first.</div>";
      return "0.00";
    }
    
    const data = JSON.parse(raw); // Convert JSON to object
    const discountRate = getDiscountRate(data.selectedGym, selectedTicketType); // Get discount rate
    let monthlyTotal = 0; // Tracks monthly cost
    let discountAmount = 0; // Tracks total discount
    let html = ""; // HTML output

    // Basic info
    html += `<div><strong>Gym:</strong> ${data.selectedGymLabel}</div>`;
    html += `<div><strong>Access Type:</strong> ${data.gymAccess}</div>`;
    html += `<div><strong>Extras:</strong> ${data.extras.length ? data.extras.join(", ") : "None"}</div>`;
    html += `<div><strong>Category:</strong> ${selectedTicketType}</div>`;
    html += `<div><strong>Payment Plan:</strong> ${selectedMonths} month${selectedMonths > 1 ? "s" : ""}</div>`;
    html += `<hr class="invoice-divider">`;

    // Loop through items and apply discount if applicable
    data.items.forEach(item => {
      const original = Number(item.price);
      let final = original;
      let note = "";
      
      if (isDiscountableItem(item.name) && discountRate > 0) {
        final = original * (1 - discountRate); // Apply discount
        note = ` (${Math.round(discountRate * 100)}% off)`;
      }
      
      monthlyTotal += final;
      discountAmount += (original - final);
      html += `<div><strong>${item.name}:</strong> £${final.toFixed(2)}/month${note}</div>`;
    });

    const planTotal = monthlyTotal * selectedMonths; // Total for plan duration
    const totalDue = planTotal + Number(data.joiningFee); // Add joining fee

    // Final breakdown
    html += `<div><strong>Joining Fee:</strong> £${Number(data.joiningFee).toFixed(2)}</div>`;
    html += `<div><strong>Monthly Discount:</strong> -£${discountAmount.toFixed(2)}</div>`;
    html += `<div><strong>Plan Total:</strong> £${planTotal.toFixed(2)}</div>`;
    html += `<div><strong>Total Due:</strong> £${totalDue.toFixed(2)}</div>`;
    
    invoiceList.innerHTML = html; // Render to page
    return totalDue.toFixed(2); // Return final amount
  }

  // ===== EVENT LISTENERS =====

  // When user selects a date
  dateInput.addEventListener("change", () => {
    sumDate.textContent = dateInput.value ? formatDateDMY(new Date(dateInput.value)) : "—";
    updateEndDate(); // Update end date automatically
  });

  // Plan selection logic
  planButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      planButtons.forEach(b => b.classList.remove("selected")); // Remove previous selection
      btn.classList.add("selected"); // Highlight clicked button
      sumPlan.textContent = btn.dataset.plan; // Update summary
      selectedMonths = parseInt(btn.dataset.months, 10); // Store selected months
      updateEndDate();
      renderInvoice(); // Recalculate invoice
    });
  });

  // Membership type selection
  ticketCards.forEach(card => {
    card.querySelector(".btn").addEventListener("click", () => {
      ticketCards.forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
      selectedTicketType = card.dataset.type;
      sumType.textContent = selectedTicketType;
      renderInvoice();
    });
  });

  // Payment method selection
  paymentButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      paymentButtons.forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      paymentDetails.classList.remove("hidden"); // Show form
      paymentMethodSelected = true;
      validatePaymentForm();
    });
  });

  // Card number formatting and validation
  cardNumberInput.addEventListener("input", () => {
    let value = cardNumberInput.value.replace(/\D/g, "").slice(0, 16); // Only digits
    value = value.replace(/(\d{4})(?=\d)/g, "$1 "); // Add space every 4 digits
    cardNumberInput.value = value;

    if (value.replace(/\s/g, "").length !== 16) {
      cardNumberError.textContent = "Card number must be 16 digits";
      cardNumberInput.classList.add("invalid");
    } else {
      cardNumberError.textContent = "";
      cardNumberInput.classList.remove("invalid");
    }
    validatePaymentForm();
  });

  // Name validation
  cardNameInput.addEventListener("input", () => {
    cardNameInput.value = cardNameInput.value.replace(/[^a-zA-Z\s]/g, ""); // Remove invalid chars
    
    if (cardNameInput.value.length < 2) {
      cardNameError.textContent = "Enter a valid name";
      cardNameInput.classList.add("invalid");
    } else {
      cardNameError.textContent = "";
      cardNameInput.classList.remove("invalid");
    }
    validatePaymentForm();
  });

  // Expiry date formatting
  expDateInput.addEventListener("input", () => {
    let value = expDateInput.value.replace(/\D/g, "").slice(0, 4);
    if (value.length >= 3) {
      value = value.slice(0, 2) + "/" + value.slice(2);
    }
    expDateInput.value = value;

    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(value)) {
      expError.textContent = "Format MM/YY";
      expDateInput.classList.add("invalid");
    } else {
      expError.textContent = "";
      expDateInput.classList.remove("invalid");
    }
    validatePaymentForm();
  });

  // CVC validation
  cvcInput.addEventListener("input", () => {
    cvcInput.value = cvcInput.value.replace(/\D/g, "").slice(0, 3);
    
    if (cvcInput.value.length !== 3) {
      cvcError.textContent = "CVC must be 3 digits";
      cvcInput.classList.add("invalid");
    } else {
      cvcError.textContent = "";
      cvcInput.classList.remove("invalid");
    }
    validatePaymentForm();
  });

  // Confirm payment button
  payBtn.addEventListener("click", () => {
    if (!dateInput.value) {
      alert("Please choose a start date.");
      dateInput.focus();
      return;
    }
    
    const totalPrice = renderInvoice();
    modalContent.innerHTML = `
      <div>Total Amount: £${totalPrice}</div>
      <div>Click below to complete your purchase</div>
    `;
    confirmModal.classList.remove("hidden"); // Show modal
  });

  // Final purchase and backend saving
  closeModalBtn.addEventListener("click", async () => {
    const invoiceData = JSON.parse(localStorage.getItem("invoiceData") || "{}");
    
    if (!invoiceData.selectedGym) {
      alert("No gym selected. Please go to comparison page.");
      return;
    }
    
    const startDate = dateInput.value;
    const endDateParts = sumEndDate.textContent.split('/');
    const mysqlEndDate = `${endDateParts[2]}-${endDateParts[1]}-${endDateParts[0]}`; // Convert to YYYY-MM-DD
    const priceText = invoiceList.lastElementChild.textContent;
    const price = priceText.match(/[\d.]+/)[0];

    const payload = {
      gymName: invoiceData.selectedGymLabel,
      plan: `${selectedMonths} Month${selectedMonths > 1 ? 's' : ''}`,
      startDate: startDate,
      endDate: mysqlEndDate,
      ticketType: selectedTicketType,
      price: price
    };

    try {
      const response = await fetch('/api/save_membership', { // Send data to backend
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok) {
        alert(`Success! Your Membership ID: ${result.membershipId}\nTotal Paid: £${price}`);
        localStorage.removeItem('invoiceData'); // Clear stored data
        window.location.href = window.appRoutes.index; // Redirect home
      } else if (response.status === 401) {
        alert('Session expired. Please login again.');
        window.location.href = window.appRoutes.accountPage;
      } else {
        alert('Error: ' + (result.message || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('Network error. Please try again.');
    }
  });

  // Initial load
  renderInvoice(); // Display invoice when page loads
});