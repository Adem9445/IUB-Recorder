// donate.js
// Handles circular donate button; submits hidden PayPal form

const donateBtn = document.getElementById('donate-btn');
const donateForm = document.getElementById('donate-form');

if (donateBtn && donateForm) {
  donateBtn.addEventListener('click', () => {
    try {
      donateForm.submit();
    } catch (e) {
      // Fallback: open PayPal donate page
      window.open('https://www.paypal.com/donate?business=4CYARW24XNSSG&no_recurring=0&item_name=Videre%20utvikling%20IUB&currency_code=NOK', '_blank');
    }
  });
}
