/*

  Herein, are  all Functions that are used on the Help & Info page 

*/

/**
 * Function to initialize the Help page 
 */
export function initializeHelpPage(){
    // add global guard to prevent safari from running the function twice 
    if (window.__help_rendered__) return;
    window.__help_rendered__ = true;

    console.log("Help loaded")


    // collect all caroussel slide references and add on click function
    const slide_references = document.querySelectorAll(".slide-reference");

    // loop through them 
    slide_references.forEach(ref => {
      const carousel = document.getElementById(ref.dataset.link); // get the according carousel

      // add on click function
      ref.onclick = function(){
        
        // use shoelaces goToSlide function to open a certain slide
        carousel.goToSlide(parseInt(ref.dataset.slide)-1); // -1 to account for 0 being the first value (instead of normally: slide 1 instead of slide 0)
        
      }
    })


}