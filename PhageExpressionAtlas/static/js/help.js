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


}