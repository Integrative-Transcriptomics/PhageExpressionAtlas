/*
   Herein, are  all Functions that are used on the Home page 
*/
console.log("Home.js loaded")

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
 * Function to initialize the Home Page
 */
export async function initializeHomePage() {
    if (window.__homepage_rendered__) return;
    window.__homepage_rendered__ = true;

    console.log("Homepage initialized");

    // .. Fill the span element .. 
    const nr_of_studies_span = document.getElementById("nr-studies");
    try {
        const nrOfStudies = await fetch_nr_of_studies(); // fetch the number of studies currently in the backend
        nr_of_studies_span.textContent = nrOfStudies; // fill the span element with the number of studies

    } catch (error) {
        console.log(error)
    }
    
    // .. Create Wordcloud ..
    createWordcloud();
}


/*
 * Function that creates the wordcloud
*/
async function createWordcloud() {

    const init_data = [
        { name: 'PhageExpressionAtlas', value: 120 },
        { name: 'host', value: 20 },
        { name: 'bacteriophages', value: 40 },
        { name: 'phage-host interactions', value: 38 },
        { name: 'web-application', value: 38 },
        { name: 'database', value: 35 },
        { name: 'data visualization', value: 35 },
        { name: 'application', value: 30 },
        { name: 'bioinformatics', value: 30 },
        { name: 'dual RNA-seq', value: 30 },
        { name: 'transcriptional architecture', value: 33 },
        { name: 'bacteria', value: 25 },
        { name: 'visualization', value: 25 },
        { name: 'response', value: 22 },
        { name: 'architecture', value: 22 },
        { name: 'explore', value: 18 },
        { name: 'host response', value: 22 },
        { name: 'genome', value: 16 },
        { name: 'genetic', value: 16 },
        { name: 'data', value: 16 },
        { name: 'studies', value: 16 },
        { name: 'accessible', value: 14 },
        { name: 'infection', value: 14 },
        { name: 'publications', value: 16 },
        { name: 'publication visualization', value: 16 },
        { name: 'relationships', value: 14 },
        { name: 'dataset exploration', value: 14 },
        { name: 'research', value: 14 },
        { name: 'phage', value: 14 },
        { name: 'dual RNA-seq', value: 14 },
        { name: 'data overview', value: 14 },
        { name: 'dataset exploration', value: 14 },
        { name: 'genome viewer', value: 14 },
        { name: 'help & info', value: 14 },
        { name: 'exploration', value: 12 },
        { name: 'heatmap', value: 12 },
        { name: 'genome map', value: 12 },
        { name: 'data availability', value: 11 },
        { name: 'classification', value: 11 },
        { name: 'genome viewer', value: 11 },
        { name: 'expression', value: 11 },
        { name: 'E. coli', value: 11 },
        { name: 'T4', value: 11 },
        { name: 'T7', value: 11 },
        { name: 'atlas', value: 11 },
        { name: 'early phase', value: 11 },
        { name: 'middle phase', value: 11 },
        { name: 'late phase', value: 11 },
        { name: 'phase', value: 11 },
        { name: 'phage gene classification', value: 11 },
        { name: 'infection', value: 10 },
        { name: 'analyze', value: 10 },
        { name: 'data availability', value: 10 },
        { name: 'studying', value: 10 },
        { name: 'investigating', value: 10 },
        { name: 'genomic', value: 10 },
        { name: 'biology', value: 10 },
        { name: 'evolutionary', value: 10 },
        { name: 'study', value: 10 },
        { name: 'early', value: 10 },
        { name: 'middle', value: 10 },
        { name: 'late', value: 10 },
        { name: 'time', value: 11 },
        { name: 'transcriptomics', value: 11 },
        { name: 'phage infection', value: 11 },
        { name: 'biomedicine', value: 11 },
        { name: 'DNA', value: 11 },
        { name: 'RNA', value: 11 },
        { name: 'dual RNA-seq', value: 11 },
        { name: 'time-resolved', value: 11 },
    ];


    const datasets= await fetch_datasets_overview(); // fetch datasets

    let phages = createUniqueCountDataset(datasets, "phageName"); // count how often phages are represented in the db 

    // adjust the values to match the other values 
    phages = phages.map(entry => ({
        ...entry,
        value: entry.value +13
    }));

    // do the same with hosts
    let hosts = createUniqueCountDataset(datasets, "hostName");
    hosts = hosts.map(entry => ({
        ...entry,
        value: entry.value +13
    }));

    // combine the data
    let data = [...init_data, ...phages, ...hosts];

    const wordcloudContainer = document.getElementById("wordcloud"); // get wordcloud container

    const wordcloud = echarts.init(wordcloudContainer); // initialize the wordcloud with echarts

    

    // create new image for mask image (will be needed for phage shape)
    var maskImage = new Image()

    

    // set the mask image and options to the wordcloud 
    maskImage.onload = function (){
        const canvas = document.createElement('canvas');
        canvas.width = maskImage.width;
        canvas.height = maskImage.height;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(maskImage, 0, 0);

        // This helps ECharts skip redundant pixel reads
        const maskCanvas = canvas;

        // set all options for the wordcloud
        const option = {
            series: [{
                type: 'wordCloud',
                maskImage: maskCanvas,
                layoutAnimation: true,
                left: 'center',
                top: 'center',
                width: '90%',
                height: '90%',
                sizeRange: [8, 120], 
                rotationRange: [-90, 90], 
                rotationStep: 30, 
                gridSize: 2,
                drawOutOfBound: false,
                shrinkToFit: true,
                textStyle: {
                    color: function (params) {
                        return colors[params.dataIndex % colors.length];
                    }, 
                },
                emphasis: {
                    focus: 'self',
                },
                

                data: data 
            }]
        };
        
        // set the chart option and render the chart
        wordcloud.setOption(option);
    }

    maskImage.src = './static/mask-image.png'


    window.onresize = wordcloud.resize;

    
}



