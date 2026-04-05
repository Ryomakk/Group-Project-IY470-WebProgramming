document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const dateInput = document.getElementById("start-date");
  const sumDate = document.getElementById("sum-date");
  const sumPlan = document.getElementById("sum-plan");
  const sumType = document.getElementById("sum-type");
  const sumEndDate = document.getElementById("sum-end-date");
  const planButtons = document.querySelectorAll(".small-card");
  const ticketCards = document.querySelectorAll(".card");
  const paymentButtons = document.querySelectorAll(".payment-btn");
  const paymentDetails = document.getElementById("payment-details");
  const payBtn = document.getElementById("pay-btn");
  const invoiceList = document.getElementById("invoice-list");
  const confirmModal = document.getElementById("confirmModal");
  const modalContent = document.getElementById("modalContent");
  const closeModalBtn = document.getElementById("closeModalBtn");
  
  // Payment inputs
  const cardNumberInput = document.getElementById("card-number");
  const cardNameInput = document.getElementById("card-name");
  const expDateInput = document.getElementById("exp-date");
  const cvcInput = document.getElementById("cvc");
  
  // Error elements
  const cardNumberError = document.getElementById("card-number-error");
  const cardNameError = document.getElementById("card-name-error");
  const expError = document.getElementById("exp-error");
  const cvcError = document.getElementById("cvc-error");

  // State
  let paymentMethodSelected = false;
  let selectedMonths = 1;
  let selectedTicketType = "Normal";

  // Date helpers
  function formatDateDMY(date) {
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  }

  function addMonths(date, months) {
    const d = new Date(date);
    const startDay = d.getDate();
    d.setMonth(d.getMonth() + months);
    if (d.getDate() < startDay) d.setDate(0);
    return d;
  }

  function updateEndDate() {
    if (!dateInput.value || !selectedMonths) {
      sumEndDate.textContent = "—";
      return;
    }
    const start = new Date(dateInput.value);
    const end = addMonths(start, selectedMonths);
    sumEndDate.textContent = formatDateDMY(end);
  }

  // Discount helpers
  function getDiscountRate(selectedGym, ticketType) {
    if (ticketType === "Student") return selectedGym === "uGym" ? 0.20 : 0.15;
    if (ticketType === "Pensioners") return selectedGym === "uGym" ? 0.15 : 0.20;
    return 0;
  }

  function isDiscountableItem(itemName) {
    const name = itemName.toLowerCase();
    return !name.includes("massage") && !name.includes("physio");
  }

  // Validation
  function validatePaymentForm() {
    const cardNumberValid = cardNumberInput.value.replace(/\s/g, "").length === 16;
    const cardNameValid = /^[A-Za-z\s]{2,}$/.test(cardNameInput.value);
    const expValid = /^(0[1-9]|1[0-2])\/\d{2}$/.test(expDateInput.value);
    const cvcValid = /^\d{3}$/.test(cvcInput.value);

    const allValid = paymentMethodSelected && cardNumberValid && cardNameValid && expValid && cvcValid;
    payBtn.disabled = !allValid;
  }

  // Invoice rendering
  function renderInvoice() {
    const raw = localStorage.getItem("invoiceData");
    if (!raw) {
      invoiceList.innerHTML = "<div>No invoice data found. Please go to gym comparison first.</div>";
      return "0.00";
    }
    
    const data = JSON.parse(raw);
    const discountRate = getDiscountRate(data.selectedGym, selectedTicketType);
    let monthlyTotal = 0;
    let discountAmount = 0;
    let html = "";

    html += `<div><strong>Gym:</strong> ${data.selectedGymLabel}</div>`;
    html += `<div><strong>Access Type:</strong> ${data.gymAccess}</div>`;
    html += `<div><strong>Extras:</strong> ${data.extras.length ? data.extras.join(", ") : "None"}</div>`;
    html += `<div><strong>Category:</strong> ${selectedTicketType}</div>`;
    html += `<div><strong>Payment Plan:</strong> ${selectedMonths} month${selectedMonths > 1 ? "s" : ""}</div>`;
    html += `<hr class="invoice-divider">`;

    data.items.forEach(item => {
      const original = Number(item.price);
      let final = original;
      let note = "";
      
      if (isDiscountableItem(item.name) && discountRate > 0) {
        final = original * (1 - discountRate);
        note = ` (${Math.round(discountRate * 100)}% off)`;
      }
      
      monthlyTotal += final;
      discountAmount += (original - final);
      html += `<div><strong>${item.name}:</strong> £${final.toFixed(2)}/month${note}</div>`;
    });

    const planTotal = monthlyTotal * selectedMonths;
    const totalDue = planTotal + Number(data.joiningFee);

    html += `<div><strong>Joining Fee:</strong> £${Number(data.joiningFee).toFixed(2)}</div>`;
    html += `<div><strong>Monthly Discount:</strong> -£${discountAmount.toFixed(2)}</div>`;
    html += `<div><strong>Plan Total:</strong> £${planTotal.toFixed(2)}</div>`;
    html += `<div><strong>Total Due:</strong> £${totalDue.toFixed(2)}</div>`;
    
    invoiceList.innerHTML = html;
    return totalDue.toFixed(2);
  }

  // Event Listeners
  
  // Date selection
  dateInput.addEventListener("change", () => {
    sumDate.textContent = dateInput.value ? formatDateDMY(new Date(dateInput.value)) : "—";
    updateEndDate();
  });

  // Plan selection
  planButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      planButtons.forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      sumPlan.textContent = btn.dataset.plan;
      selectedMonths = parseInt(btn.dataset.months, 10);
      updateEndDate();
      renderInvoice();
    });
  });

  // Category selection
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
      paymentDetails.classList.remove("hidden");
      paymentMethodSelected = true;
      validatePaymentForm();
    });
  });

  // Input formatting and validation
  cardNumberInput.addEventListener("input", () => {
    let value = cardNumberInput.value.replace(/\D/g, "").slice(0, 16);
    value = value.replace(/(\d{4})(?=\d)/g, "$1 ");
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

  cardNameInput.addEventListener("input", () => {
    cardNameInput.value = cardNameInput.value.replace(/[^a-zA-Z\s]/g, "");
    
    if (cardNameInput.value.length < 2) {
      cardNameError.textContent = "Enter a valid name";
      cardNameInput.classList.add("invalid");
    } else {
      cardNameError.textContent = "";
      cardNameInput.classList.remove("invalid");
    }
    validatePaymentForm();
  });

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

  // Confirm payment button - shows modal
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
    confirmModal.classList.remove("hidden");
  });

  // Complete purchase - saves to backend and redirects
  closeModalBtn.addEventListener("click", async () => {
    const invoiceData = JSON.parse(localStorage.getItem("invoiceData") || "{}");
    
    if (!invoiceData.selectedGym) {
      alert("No gym selected. Please go to comparison page.");
      return;
    }
    
    const startDate = dateInput.value;
    const endDateParts = sumEndDate.textContent.split('/');
    const mysqlEndDate = `${endDateParts[2]}-${endDateParts[1]}-${endDateParts[0]}`;
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
      const response = await fetch('/api/save_membership', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok) {
        alert(`Success! Your Membership ID: ${result.membershipId}\nTotal Paid: £${price}`);
        localStorage.removeItem('invoiceData');
        // Use routes passed from HTML
        window.location.href = window.appRoutes.index;
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

  // Initialize
  renderInvoice();
});