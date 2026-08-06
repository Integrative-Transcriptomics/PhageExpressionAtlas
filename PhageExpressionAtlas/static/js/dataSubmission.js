/*
   Herein, are  all Functions that are used on the Submission page 
*/

// retrieve the colors from index.css
const rootStyles = getComputedStyle(document.documentElement);
const colors = [
    rootStyles.getPropertyValue('--col3').trim(),
    rootStyles.getPropertyValue('--col4').trim(),
    rootStyles.getPropertyValue('--col1').trim(),
    rootStyles.getPropertyValue('--col2').trim(),
    rootStyles.getPropertyValue('--col5').trim(),
    rootStyles.getPropertyValue('--col6').trim(),
    rootStyles.getPropertyValue('--col7').trim(),
];


/**
 * Function to initialize the Dataset Submission page
 */
export async function initializeDataSubmissionPage() {
    console.log("Dataset Submission page initialized");

    initializeTemplateDownloadButton();
}


/**
 * Function to initialize the Excel template download button
 */
function initializeTemplateDownloadButton() {
    const downloadButton = document.getElementById("download-template-button");

    if (!downloadButton) {
        console.warn("Download template button not found.");
        return;
    }

    downloadButton.addEventListener("click", downloadTemplate);
}


/**
 * Function that handles the download of the Excel submission template
 */
function downloadTemplate(event) {
    event.preventDefault();

    window.location.href = "/download_submission_template";
}

