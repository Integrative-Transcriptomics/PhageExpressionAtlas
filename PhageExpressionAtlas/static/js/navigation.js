/* 

This javascript file is used to facilitate the navigation between the different subpages:
 - Home 
 - Data Overview
 - Dataset Exploration 
 - Genome Viewer
 - Help & Info 

 Each subpage is initialized dynamically with the help of a DOMContentLoaded EventListener

*/ 


// ---- NAVIGATIONBAR ----------------------------------------------------------
// change the links in the navigation to active, if they are clicked/ active
// the active attribute is then later used in css to adjust the style

const links = document.querySelectorAll(".page-links-container a"); // select all page links

const currentPath = window.location.pathname;          // get the current path 

links.forEach(link => {                                // iterate through links to add active-link class attribute if its the current path
    if (link.getAttribute("href") === currentPath) {
        link.classList.add("active-link");
    } else {
        link.classList.remove("active-link");
    }
})

// handle mobile menu button
const mobileMenuButton = document.querySelector("#mobile-menu-button sl-icon-button");

let isMenuOpen = false;

mobileMenuButton.addEventListener('click', ()=>{
    const linkContainerMobile = document.querySelector(".page-links-container.mobile");

    if(isMenuOpen){
        linkContainerMobile.style.display = "none"; // hide link container
        mobileMenuButton.name="list"; // change icon to hamburger 

        // animate transition
        mobileMenuButton.style.transition = "transform 0.3s ease"; 
        mobileMenuButton.style.transform = "rotate(0deg)";

        isMenuOpen = false; // set boolean to false
    }
    else{
        linkContainerMobile.style.display = "flex"; // show link container
        mobileMenuButton.name="x"; // change icon to x

        // animate transition
        mobileMenuButton.style.transition = "transform 0.3s ease";
        mobileMenuButton.style.transform = "rotate(90deg)";

        isMenuOpen = true; // set boolean to true
    }

    
})


// ----- INITIALIZE SUBPAGES ----------------------------------------------------
// EventListener for initializing the dynamic page content
// The according javascript files for each subpage are lazy loaded depending on which path is active
document.addEventListener("DOMContentLoaded", async () => {

    // initialize different pages based on the path
    if (currentPath === "/") {
        const { initializeHomePage } = await import("./home.js");
        initializeHomePage();
    } else if (currentPath === "/data-overview") {
        const { initializeOverviewPage } = await import("./dataOverview.js");
        initializeOverviewPage();
    }
    else if (currentPath === "/dataset-exploration") {
        const { initializeExplorationPage } = await import("./datasetExploration.js");
        initializeExplorationPage();
    }
    else if (currentPath === "/genome-viewer") {
        const { initializeViewerPage } = await importShim("/static/js/genomeViewer.js");
        initializeViewerPage();
    }
    else if (currentPath === "/help") {
        const { initializeHelpPage } = await import("./help.js");
        initializeHelpPage();
    }
})

// -------------- Global Functions ----------------------------------------
/** 
 * Function to show or hide a spinner element (loading indicator) based on a boolean
 * @param {String} spinnerID - Spinner ID.
 * @param {Boolean} show - True or false. 
*/
function toggleSpinner(spinnerID, show){
    const spinner = document.getElementById(spinnerID);
    spinner.style.display = show ? "block":"none"; 
}




