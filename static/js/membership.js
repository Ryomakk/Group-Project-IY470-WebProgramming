// Price data lookup table - stores monthly prices as [uGymPrice, PowerZonePrice]
// Access tiers: none (no gym), super (limited hours), off (restricted hours), any (full access)
const prices = {
  none: [0, 0],      // No gym membership selected
  super: [16, 13],   // Super off-peak: uGym £16, Power Zone £13
  off: [21, 19],     // Off-peak: uGym £21, Power Zone £19
  any: [30, 24]      // Anytime access: uGym £30, Power Zone £24
};

// One-time setup fees charged when joining each gym
const joiningFees = {
  uGym: 10,          // uGym charges £10 joining fee
  powerZone: 30      // Power Zone charges £30 joining fee
};

// Application state - tracks current user selections
let gymType = 'none';    // Current tier: none/super/off/any
let extras = [];         // Array of selected add-ons: Swimming, Classes, Massage, Physio
let selectedGym = null;  // Final choice after clicking Select Plan: uGym or powerZone

// Cache DOM elements for price displays to avoid repeated queries
const uPrice = document.getElementById('uPrice');      // uGym monthly total display
const pPrice = document.getElementById('pPrice');      // Power Zone monthly total display
const uBreak = document.getElementById('uBreakdown');  // uGym itemized list
const pBreak = document.getElementById('pBreakdown');  // Power Zone itemized list

// Age Verification Functions

// Called when user confirms they are 16+ - stores consent and hides modal
function verifyAge() {
  localStorage.setItem('ageVerified', 'true');
  document.getElementById('ageGate').classList.add('hidden');
}

// Called when user declines age verification - shows alert and blocks access
function cancelAge() {
  alert('You must be over 16 to access this site.');
}

// Check for existing age verification on page load to skip modal
if (localStorage.getItem('ageVerified')) {
  document.getElementById('ageGate').classList.add('hidden');
}

//Alternative: Uncomment below to ALWAYS show age gate for testing
localStorage.removeItem('ageVerified');

// Core Pricing Calculation Engine

// Main function that recalculates totals and updates UI when selections change
function calculate() {
  // Start with base membership price from lookup table
  let uTotal = prices[gymType][0];  // uGym base price
  let pTotal = prices[gymType][1];  // Power Zone base price
  
  // Build HTML strings for itemized breakdown lists
  let uList = [];
  let pList = [];
  
  // Add base gym access line to breakdown based on selected tier
  if (gymType === 'none') {
    uList.push('<li><span class="item-name">No gym access</span><span class="item-price">£0</span></li>');
    pList.push('<li><span class="item-name">No gym access</span><span class="item-price">£0</span></li>');
  } else if (gymType === 'super') {
    uList.push('<li><span class="item-name">Gym Super Off-Peak</span><span class="item-price">£16</span></li>');
    pList.push('<li><span class="item-name">Gym Super Off-Peak</span><span class="item-price">£13</span></li>');
  } else if (gymType === 'off') {
    uList.push('<li><span class="item-name">Gym Off-Peak</span><span class="item-price">£21</span></li>');
    pList.push('<li><span class="item-name">Gym Off-Peak</span><span class="item-price">£19</span></li>');
  } else if (gymType === 'any') {
    uList.push('<li><span class="item-name">Gym Anytime</span><span class="item-price">£30</span></li>');
    pList.push('<li><span class="item-name">Gym Anytime</span><span class="item-price">£24</span></li>');
  }
  
  // Loop through selected extras and add appropriate pricing
  // Prices differ based on whether user has gym membership (add-on) or not (standalone)
  for (let i = 0; i < extras.length; i++) {
    let extra = extras[i];
    
    // Swimming: £25/£20 standalone, £15/£12.50 as add-on
    if (extra === 'Swimming') {
      if (gymType === 'none') {
        // Standalone swimming pricing (no gym membership)
        uTotal = uTotal + 25;
        pTotal = pTotal + 20;
        uList.push('<li><span class="item-name">Swimming only</span><span class="item-price">£25</span></li>');
        pList.push('<li><span class="item-name">Swimming only</span><span class="item-price">£20</span></li>');
      } else {
        // Add-on pricing when combined with gym membership
        uTotal = uTotal + 15;
        pTotal = pTotal + 12.5;
        uList.push('<li><span class="item-name">Swimming</span><span class="item-price">£15</span></li>');
        pList.push('<li><span class="item-name">Swimming</span><span class="item-price">£12.50</span></li>');
      }
    }
    
    // Classes: £20 both standalone, £10 uGym add-on, Free for Power Zone add-on
    if (extra === 'Classes') {
      if (gymType === 'none') {
        uTotal = uTotal + 20;
        pTotal = pTotal + 20;
        uList.push('<li><span class="item-name">Classes only</span><span class="item-price">£20</span></li>');
        pList.push('<li><span class="item-name">Classes only</span><span class="item-price">£20</span></li>');
      } else {
        uTotal = uTotal + 10;
        uList.push('<li><span class="item-name">Classes</span><span class="item-price">£10</span></li>');
        pList.push('<li><span class="item-name">Classes</span><span class="item-price free">Free</span></li>');
      }
    }
    
    // Massage: £30 standalone, £25 add-on (same price at both gyms)
    if (extra === 'Massage') {
      if (gymType === 'none') {
        uTotal = uTotal + 30;
        pTotal = pTotal + 30;
        uList.push('<li><span class="item-name">Massage only</span><span class="item-price">£30</span></li>');
        pList.push('<li><span class="item-name">Massage only</span><span class="item-price">£30</span></li>');
      } else {
        uTotal = uTotal + 25;
        pTotal = pTotal + 25;
        uList.push('<li><span class="item-name">Massage</span><span class="item-price">£25</span></li>');
        pList.push('<li><span class="item-name">Massage</span><span class="item-price">£25</span></li>');
      }
    }
    
    // Physio: £25/£30 standalone, £20/£25 add-on (uGym cheaper at both tiers)
    if (extra === 'Physio') {
      if (gymType === 'none') {
        uTotal = uTotal + 25;
        pTotal = pTotal + 30;
        uList.push('<li><span class="item-name">Physio only</span><span class="item-price">£25</span></li>');
        pList.push('<li><span class="item-name">Physio only</span><span class="item-price">£30</span></li>');
      } else {
        uTotal = uTotal + 20;
        pTotal = pTotal + 25;
        uList.push('<li><span class="item-name">Physio</span><span class="item-price">£20</span></li>');
        pList.push('<li><span class="item-name">Physio</span><span class="item-price">£25</span></li>');
      }
    }
  }
  
  // Update DOM with calculated monthly totals (formatted to 2 decimal places)
  uPrice.textContent = uTotal.toFixed(2);
  pPrice.textContent = pTotal.toFixed(2);
  
  // Inject itemized lists into breakdown sections
  uBreak.innerHTML = uList.join('');
  pBreak.innerHTML = pList.join('');
  
  // Show joining fee info when gym selected, hide if "none" selected
  updateJoiningFeeDisplay(gymType);
  
  // Compare totals and highlight cheaper option with badge
  showWinner(uTotal, pTotal);
}

// UI Update Functions

// Creates or updates joining fee display below Select Plan buttons
function updateJoiningFeeDisplay(type) {
  // Update uGym joining fee badge
  let uJoiningDiv = document.getElementById('uJoiningFee');
  if (type !== 'none') {
    // Create element if it doesn't exist yet (first time selecting)
    if (!uJoiningDiv) {
      uJoiningDiv = document.createElement('div');
      uJoiningDiv.id = 'uJoiningFee';
      uJoiningDiv.className = 'joining-fee-display';
      const uBtn = document.getElementById('uSelectBtn');
      uBtn.parentNode.insertBefore(uJoiningDiv, uBtn.nextSibling);
    }
    uJoiningDiv.innerHTML = '<span>Joining Fee (one-time): £10</span>';
    uJoiningDiv.style.display = 'block';
  } else {
    // Hide if no gym selected
    if (uJoiningDiv) uJoiningDiv.style.display = 'none';
  }
  
  // Update Power Zone joining fee badge
  let pJoiningDiv = document.getElementById('pJoiningFee');
  if (type !== 'none') {
    if (!pJoiningDiv) {
      pJoiningDiv = document.createElement('div');
      pJoiningDiv.id = 'pJoiningFee';
      pJoiningDiv.className = 'joining-fee-display';
      const pBtn = document.getElementById('pSelectBtn');
      pBtn.parentNode.insertBefore(pJoiningDiv, pBtn.nextSibling);
    }
    pJoiningDiv.innerHTML = '<span>Joining Fee (one-time): £30</span>';
    pJoiningDiv.style.display = 'block';
  } else {
    if (pJoiningDiv) pJoiningDiv.style.display = 'none';
  }
}

// Compares totals and applies winner styling to cheaper gym card
function showWinner(uTotal, pTotal) {
  let uCard = document.getElementById('uGymCard');
  let pCard = document.getElementById('pGymCard');
  let winnerText = document.getElementById('winnerText');
  
  // Remove any existing winner badges from previous calculations
  let oldBadges = document.querySelectorAll('.winner-badge');
  for (let i = 0; i < oldBadges.length; i++) {
    oldBadges[i].remove();
  }
  
  // Clear previous winner classes
  uCard.classList.remove('winner');
  pCard.classList.remove('winner');
  
  // Determine winner and update UI accordingly
  if (uTotal < pTotal) {
    // uGym is cheaper - add green border and badge
    uCard.classList.add('winner');
    winnerText.innerHTML = '<strong>uGym</strong> offers better value';
    
    // Create trophy badge element
    let badge = document.createElement('div');
    badge.className = 'winner-badge';
    badge.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg> Best Value';
    uCard.querySelector('.gym-body').appendChild(badge);
    
  } else if (pTotal < uTotal) {
    // Power Zone is cheaper
    pCard.classList.add('winner');
    winnerText.innerHTML = '<strong>Power Zone</strong> offers better value';
    
    let badge = document.createElement('div');
    badge.className = 'winner-badge';
    badge.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg> Best Value';
    pCard.querySelector('.gym-body').appendChild(badge);
    
  } else {
    // Equal pricing - neutral message
    winnerText.innerHTML = '<strong>Same price</strong> - choose based on features';
  }
}

// Selection Event Handlers

// Called when user clicks a gym access tier card (none/super/off/any)
function selectGymType(type) {
  // Remove active class from all tier cards
  let gymCards = document.querySelectorAll('#gymOptions .option-card');
  for (let i = 0; i < gymCards.length; i++) {
    gymCards[i].classList.remove('active');
  }
  
  // Add active class to clicked card
  let selectedCard = document.querySelector('[data-type="' + type + '"]');
  if (selectedCard) {
    selectedCard.classList.add('active');
  }
  
  // Update state and recalculate prices
  gymType = type;
  calculate();
}

// Called when user clicks an extra service card (Swimming/Classes/Massage/Physio)
function toggleService(service) {
  let card = document.querySelector('[data-service="' + service + '"]');
  let found = false;
  let position = -1;
  
  // Search if service already in selected extras array
  for (let i = 0; i < extras.length; i++) {
    if (extras[i] === service) {
      found = true;
      position = i;
      break;
    }
  }
  
  // Toggle: remove if exists, add if not
  if (found) {
    extras.splice(position, 1);  // Remove from array
    card.classList.remove('active');  // Update visual state
  } else {
    extras.push(service);  // Add to array
    card.classList.add('active');  // Update visual state
  }
  
  // Recalculate totals with new extras list
  calculate();
}

// Called when user clicks Select Plan button on a gym card
function selectGym(gym) {
  let uBtn = document.getElementById('uSelectBtn');
  let pBtn = document.getElementById('pSelectBtn');
  let uCard = document.getElementById('uGymCard');
  let pCard = document.getElementById('pGymCard');
  let resultBar = document.getElementById('resultBar');
  let selectedName = document.getElementById('selectedGymName');
  
  // If clicking already selected gym, deselect it (toggle off)
  if (selectedGym === gym) {
    selectedGym = null;
    uBtn.classList.remove('selected');
    uBtn.innerHTML = 'Select Plan';
    pBtn.classList.remove('selected');
    pBtn.innerHTML = 'Select Plan';
    uCard.classList.remove('selected');
    pCard.classList.remove('power-selected');
    resultBar.classList.remove('visible');  // Hide bottom bar
  } else {
    // Select new gym and update all UI states
    selectedGym = gym;
    
    if (gym === 'uGym') {
      // uGym selected state
      uBtn.classList.add('selected');
      uBtn.innerHTML = 'Selected';
      pBtn.classList.remove('selected');
      pBtn.innerHTML = 'Select Plan';
      uCard.classList.add('selected');
      pCard.classList.remove('power-selected');
      selectedName.textContent = 'uGym Membership';
    } else {
      // Power Zone selected state
      pBtn.classList.add('selected');
      pBtn.innerHTML = 'Selected';
      uBtn.classList.remove('selected');
      uBtn.innerHTML = 'Select Plan';
      pCard.classList.add('power-selected');
      uCard.classList.remove('selected');
      selectedName.textContent = 'Power Zone Membership';
    }
    
    // Show fixed bottom bar with summary
    resultBar.classList.add('visible');
  }
}

// Reset all selections to initial state (called by reset button)
function resetAll() {
  // Clear state variables
  gymType = 'none';
  extras = [];
  selectedGym = null;
  
  // Clear all tier card active states and reset to "none"
  let allGymCards = document.querySelectorAll('#gymOptions .option-card');
  for (let i = 0; i < allGymCards.length; i++) {
    allGymCards[i].classList.remove('active');
  }
  document.querySelector('[data-type="none"]').classList.add('active');
  
  // Clear all service card active states
  let allServiceCards = document.querySelectorAll('.service-card');
  for (let i = 0; i < allServiceCards.length; i++) {
    allServiceCards[i].classList.remove('active');
  }
  
  // Reset select buttons to default text
  document.getElementById('uSelectBtn').classList.remove('selected');
  document.getElementById('uSelectBtn').innerHTML = 'Select Plan';
  document.getElementById('pSelectBtn').classList.remove('selected');
  document.getElementById('pSelectBtn').innerHTML = 'Select Plan';
  
  // Remove selected borders from cards
  document.getElementById('uGymCard').classList.remove('selected');
  document.getElementById('pGymCard').classList.remove('power-selected');
  
  // Hide bottom result bar
  document.getElementById('resultBar').classList.remove('visible');
  
  // Hide joining fee displays
  let uJoiningDiv = document.getElementById('uJoiningFee');
  let pJoiningDiv = document.getElementById('pJoiningFee');
  if (uJoiningDiv) uJoiningDiv.style.display = 'none';
  if (pJoiningDiv) pJoiningDiv.style.display = 'none';
  
  // Recalculate with reset state (back to £0)
  calculate();
}

// Invoice and Navigation Functions

// Returns human-readable label for current gym access tier
function getSelectedGymAccessLabel() {
  const labels = {
    none: "No Gym Access",
    super: "Super Off-Peak",
    off: "Off-Peak",
    any: "Anytime"
  };
  return labels[gymType] || "No Gym Access";
}

// Parses breakdown list HTML to extract item names and prices for invoice
function getSelectedInvoiceItems() {
  const breakdownId = selectedGym === "uGym" ? "uBreakdown" : "pBreakdown";
  const list = document.getElementById(breakdownId);
  const items = [];

  if (!list) return items;

  const rows = list.querySelectorAll("li");

  // Loop through breakdown rows and extract data
  for (let i = 0; i < rows.length; i++) {
    const nameEl = rows[i].querySelector(".item-name");
    const priceEl = rows[i].querySelector(".item-price");

    const name = nameEl ? nameEl.textContent.trim() : "";
    const rawPrice = priceEl ? priceEl.textContent.trim() : "£0";

    // Parse price - handle "Free" text vs £ amounts
    let numericPrice = 0;
    let displayPrice = rawPrice;

    if (rawPrice.toLowerCase() === "free") {
      numericPrice = 0;
      displayPrice = "Free";
    } else {
      numericPrice = parseFloat(rawPrice.replace("£", "")) || 0;
      displayPrice = "£" + numericPrice.toFixed(2);
    }

    items.push({
      name: name,
      price: numericPrice,
      displayPrice: displayPrice
    });
  }

  return items;
}

// Saves complete selection data to localStorage for confirmation page
function saveInvoiceData() {
  if (!selectedGym) return;  // Don't save if nothing selected

  // Get current displayed monthly price
  const monthlyPrice = selectedGym === "uGym"
    ? parseFloat(uPrice.textContent)
    : parseFloat(pPrice.textContent);

  const joiningFee = joiningFees[selectedGym] || 0;

  // Build data object with all necessary invoice details
  const invoiceData = {
    selectedGym: selectedGym,
    selectedGymLabel: selectedGym === "uGym" ? "uGym Membership" : "Power Zone Membership",
    gymAccess: getSelectedGymAccessLabel(),
    extras: extras,
    items: getSelectedInvoiceItems(),
    monthlyPrice: monthlyPrice,
    joiningFee: joiningFee,
    totalDueToday: monthlyPrice + joiningFee  // First payment includes joining fee
  };

  // Store as JSON string in localStorage
  localStorage.setItem("invoiceData", JSON.stringify(invoiceData));
}

// Legacy storage method - saves simpler key-value pairs
function continueToConfirm() {
  let price;
  let extrasList = extras.join(', ') || 'None';
  
  // Get current monthly price from appropriate display
  if (selectedGym === 'uGym') {
    price = uPrice.textContent;
  } else {
    price = pPrice.textContent;
  }
  
  // Save individual fields for backward compatibility
  localStorage.setItem('gymChoice', selectedGym);
  localStorage.setItem('gymType', gymType);
  localStorage.setItem('extras', extrasList);
  localStorage.setItem('monthlyPrice', price);
  localStorage.setItem('joiningFee', joiningFees[selectedGym]);
  
  // Also save structured data object
  saveInvoiceData();
  
  // Navigate to confirmation page
  window.location.href = '/confirm';
}

// Initialize calculator when DOM is fully loaded
document.addEventListener('DOMContentLoaded', calculate);