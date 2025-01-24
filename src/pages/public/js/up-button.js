document.addEventListener("DOMContentLoaded", function() {
  // Get the button
  const upbutton = document.getElementById("upBtn");
  if (!upbutton) {
    console.error("Up button element not found");
    return;
  }

  // Initially hide the button
  upbutton.style.display = "none";

  // When the user scrolls down 20px from the top of the document, show the button
  window.onscroll = function() {
    scrollFunction();
  };

  function scrollFunction() {
    upbutton.style.display = window.scrollY > 20 ? "block" : "none";
  }

  // When the user clicks on the button, scroll to the top of the document
  upbutton.addEventListener("click", function() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});
