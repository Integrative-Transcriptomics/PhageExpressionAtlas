/*

  Herein, are  all Functions that are used on the Help & Info page 

*/

/**
 * Function to initialize the Help page 
 */
export function initializeHelpPage(){
    console.log("Help loaded")

    // .. Table of Content .. 

    // table of contents for easy on-site navigation in data Overview
    const tocContainer = document.querySelector("#toc-container-help")
    const tocAnchors = tocContainer.querySelectorAll("a");   // get all headings/anchors inside the toc container

    // retrieve an Array of all sections by converting links into corresponding section elements
    const sections = Array.from(tocAnchors).map(link => document.querySelector(link.getAttribute('href')));

    // function that will be later passed to the IntersectionObserver to handle the active headings
    const observeFunction = (entries) => {
        // loop through all entries
        entries.forEach(entry => {
            // if an entry is intersecting the specified viewport are in the options, do something
            if (entry.isIntersecting) {
                // remove active class from all links and add it to the current one's parent (bulletlist:li element)
                tocAnchors.forEach(link => link.parentElement.classList.remove('active-heading'));

                // select the active link via the href attribute
                const activeLink = tocContainer.querySelector(`a[href='#${entry.target.id}']`);
                
                // if the links is active, add the class attribute active heading for styling
                if (activeLink) activeLink.parentElement.classList.add("active-heading"); 
            }
        });
    };

    const observerOptions = {
        root: null,
        rootMargin: "-30% 0px -70% 0px",

    };


    // create a intersection observer that will use the observe function and observer options to see which heading is currently active
    const observer = new IntersectionObserver( observeFunction,observerOptions );
    sections.forEach(section => {
        if (section) observer.observe(section);
    });


    //.. caroussel slides ..//

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

    // add a popup for images, that if clicked the same image opens in large
    const images = document.querySelectorAll("img");

    // loop through the images
    images.forEach(img => {

      // on click create popup, popup wrapper (div that spans the whole screen), close button and image
      img.onclick = function() {

        // create popup and wrapper
        const popup = document.createElement("div");
        popup.classList.add("img-viewer");
        const popup_wrapper = document.createElement("div");
        popup_wrapper.classList.add("popup-wrapper");

        // create close button
        const close_btn = document.createElement("sl-icon-button");
        close_btn.name= "x";
        close_btn.label = "Close";

        // add close button function
        close_btn.onclick = function(){
          popup_wrapper.remove(); // remove popup wrapper after clicking close button
        }

        // create big image
        const big_img = document.createElement("img");
        big_img.src = img.src;
        big_img.classList.add("big-img");

        // append close button and big image to the popup
        popup.appendChild(close_btn);
        popup.appendChild(big_img);

        // append popup to popup wrapper
        popup_wrapper.appendChild(popup);
        
        // handle clicks outside of the popup so that it closes/is removed if the popup wrapper but not the popup is clicked
        popup_wrapper.addEventListener('click', (event) => {
          if (!popup.contains(event.target)) {
            popup_wrapper.remove(); 
          }
        });

        // append popup wrapper to the body
        document.body.appendChild(popup_wrapper);

      }
    })


}