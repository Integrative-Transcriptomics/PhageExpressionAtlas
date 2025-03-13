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

const links = document.querySelectorAll(".page-link"); // select all page links

const currentPath = window.location.pathname;          // get the current path 

links.forEach(link => {                                // iterate through links to add active-link attribute if its the current path
    if (link.getAttribute("href") === currentPath) {
        link.classList.add("active-link");
    } else {
        link.classList.remove("active-link");
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


function toggleSpinner(spinnerID, show){
    const spinner = document.getElementById(spinnerID);
    spinner.style.display = show ? "block":"none"; 
}




