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

const cardCol = rootStyles.getPropertyValue('--cards').trim();


/**
 * Function to initialize the Home Page
 */
export async function initializeHomePage() {
    console.log("Homepage opened");

    const nr_of_studies_span = document.getElementById("nr-studies");
    try {
        const nrOfStudies = await fetch_nr_of_studies();
        nr_of_studies_span.textContent = nrOfStudies;

    } catch (error) {
        console.log(error)
    }
    

    createWordcloud();
}



// wordcloud 
function createWordcloud() {
    
    console.log("Loading wordcloud");

    const wordcloudContainer = document.getElementById("wordcloud");

    const wordcloud = echarts.init(wordcloudContainer);

    const data = [
        { name: 'PhageExpressionAtlas', value: 100 },
        { name: 'host', value: 20 },
        { name: 'bacteriophages', value: 45 },
        { name: 'phage-host interactions', value: 40 },
        { name: 'web-application', value: 40 },
        { name: 'database', value: 35 },
        { name: 'data visualization', value: 35 },
        { name: 'applications', value: 30 },
        { name: 'bioinformatics', value: 30 },
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
        { name: 'accessible', value: 14 },
        { name: 'relationships', value: 14 },
        { name: 'dataset exploration', value: 14 },
        { name: 'research', value: 14 },
        { name: 'phage', value: 14 },
        { name: 'dual rna-seq', value: 14 },
        { name: 'exploration', value: 12 },
        { name: 'heatmap', value: 12 },
        { name: 'genome map', value: 12 },
        { name: 'data availability', value: 11 },
        { name: 'classification', value: 11 },
        { name: 'genome viewer', value: 11 },
        { name: 'expression', value: 11 },
        { name: 'e. coli', value: 11 },
        { name: 'T4', value: 11 },
        { name: 'T7', value: 11 },
        { name: 'atlas', value: 11 },
        { name: 'atlas', value: 11 },
        { name: 'infection', value: 10 },
        { name: 'analyze', value: 10 },
        { name: 'data availability', value: 10 },
        { name: 'studying', value: 10 },
        { name: 'investigating', value: 10 },
        { name: 'genomic', value: 10 },
        { name: 'biology', value: 10 },
        { name: 'evolutionary', value: 10 },
        { name: 'study', value: 10 },


        { name: 'research', value: 14 },
        { name: 'phage', value: 14 },
        { name: 'dual rna-seq', value: 14 },
        { name: 'exploration', value: 12 },
        { name: 'heatmap', value: 12 },
        { name: 'genome map', value: 12 },
        { name: 'data availability', value: 11 },
        { name: 'classification', value: 11 },
        { name: 'genome viewer', value: 11 },
        { name: 'expression', value: 11 },
        { name: 'e. coli', value: 11 },
        { name: 'T4', value: 11 },
        { name: 'T7', value: 11 },
        { name: 'atlas', value: 11 },
        { name: 'atlas', value: 11 },
        { name: 'infection', value: 10 },
        { name: 'analyze', value: 10 },
        { name: 'data availability', value: 10 },
        { name: 'studying', value: 10 },
        { name: 'investigating', value: 10 },
        { name: 'genomic', value: 10 },
        { name: 'biology', value: 10 },
        { name: 'evolutionary', value: 10 },
        { name: 'study', value: 10 },
        { name: 'research', value: 14 },
        { name: 'phage', value: 14 },
        { name: 'dual rna-seq', value: 14 },
        { name: 'exploration', value: 12 },
        { name: 'heatmap', value: 12 },
        { name: 'genome map', value: 12 },
        { name: 'data availability', value: 11 },
        { name: 'classification', value: 11 },
        { name: 'genome viewer', value: 11 },
        { name: 'expression', value: 11 },
        { name: 'e. coli', value: 11 },
        { name: 'T4', value: 11 },
        { name: 'atlas', value: 11 },
        { name: 'atlas', value: 11 },
        { name: 'infection', value: 10 },
        { name: 'analyze', value: 10 },
        { name: 'data availability', value: 10 },
        { name: 'studying', value: 10 },
        { name: 'investigating', value: 10 },
        { name: 'genomic', value: 10 },
        { name: 'biology', value: 10 },
        { name: 'evolutionary', value: 10 },
        { name: 'study', value: 10 },
        { name: 'research', value: 14 },
        { name: 'phage', value: 14 },
        { name: 'dual rna-seq', value: 14 },
        { name: 'exploration', value: 12 },
        { name: 'heatmap', value: 12 },
        { name: 'genome map', value: 12 },
        { name: 'data availability', value: 11 },
        { name: 'classification', value: 11 },
        { name: 'genome viewer', value: 11 },
        { name: 'expression', value: 11 },
        { name: 'e. coli', value: 11 },
        { name: 'T4', value: 11 },
        { name: 'T7', value: 11 },
        { name: 'atlas', value: 11 },
        { name: 'atlas', value: 11 },
        { name: 'infection', value: 10 },
        { name: 'analyze', value: 10 },
        { name: 'data availability', value: 10 },
        { name: 'studying', value: 10 },
        { name: 'investigating', value: 10 },
        { name: 'genomic', value: 10 },
        { name: 'biology', value: 10 },
        { name: 'evolutionary', value: 10 },
        { name: 'study', value: 10 },
        { name: 'research', value: 14 },
        { name: 'phage', value: 14 },
        { name: 'dual rna-seq', value: 14 },
        { name: 'exploration', value: 12 },
        { name: 'heatmap', value: 12 },
        { name: 'genome map', value: 12 },
        { name: 'data availability', value: 11 },
        { name: 'classification', value: 11 },
        { name: 'genome viewer', value: 11 },
        { name: 'expression', value: 11 },
        { name: 'e. coli', value: 11 },
        { name: 'T4', value: 11 },
        { name: 'T7', value: 11 },
        { name: 'atlas', value: 11 },
        { name: 'atlas', value: 11 },
        { name: 'infection', value: 10 },
        { name: 'analyze', value: 10 },
        { name: 'data availability', value: 10 },
        { name: 'studying', value: 10 },
        { name: 'investigating', value: 10 },
        { name: 'genomic', value: 10 },
        { name: 'biology', value: 10 },
        { name: 'evolutionary', value: 10 },
        { name: 'study', value: 10 },


        { name: 'research', value: 14 },
        { name: 'phage', value: 14 },
        { name: 'dual rna-seq', value: 14 },
        { name: 'exploration', value: 12 },
        { name: 'heatmap', value: 12 },
        { name: 'genome map', value: 12 },
        { name: 'data availability', value: 11 },
        { name: 'classification', value: 11 },
        { name: 'genome viewer', value: 11 },
        { name: 'expression', value: 11 },
        { name: 'e. coli', value: 11 },
        { name: 'T4', value: 11 },
        { name: 'T7', value: 11 },
        { name: 'atlas', value: 11 },
        { name: 'atlas', value: 11 },
        { name: 'infection', value: 10 },
        { name: 'analyze', value: 10 },
        { name: 'data availability', value: 10 },
        { name: 'studying', value: 10 },
        { name: 'investigating', value: 10 },
        { name: 'genomic', value: 10 },
        { name: 'biology', value: 10 },
        { name: 'evolutionary', value: 10 },
        { name: 'study', value: 10 },
        { name: 'research', value: 14 },
        { name: 'phage', value: 14 },
        { name: 'dual rna-seq', value: 14 },
        { name: 'exploration', value: 12 },
        { name: 'heatmap', value: 12 },
        { name: 'genome map', value: 12 },
        { name: 'data availability', value: 16 },
        { name: 'classification', value: 16 },
        { name: 'genome viewer', value: 16 },
        { name: 'expression', value: 16 },
        { name: 'e. coli', value: 16 },
        { name: 'T4', value: 16 },
        { name: 'atlas', value: 16 },
        { name: 'atlas', value: 16 },
        { name: 'infection', value: 14 },
        { name: 'analyze', value: 14 },
        { name: 'data availability', value: 14 },
        { name: 'studying', value: 14 },
        { name: 'investigating', value: 14 },
        { name: 'genomic', value: 14 },
        { name: 'biology', value: 14 },
        { name: 'evolutionary', value: 14 },
        { name: 'study', value: 14 },
        { name: 'research', value: 14 },
        { name: 'phage', value: 14 },
        { name: 'dual rna-seq', value: 14 },
        { name: 'exploration', value: 12 },
        { name: 'heatmap', value: 12 },
        { name: 'genome map', value: 12 },
        { name: 'data availability', value: 11 },
        { name: 'classification', value: 11 },
        { name: 'genome viewer', value: 11 },
        { name: 'expression', value: 11 },
        { name: 'e. coli', value: 11 },
        { name: 'T4', value: 11 },
        { name: 'T7', value: 11 },
        { name: 'atlas', value: 11 },
        { name: 'atlas', value: 11 },
        { name: 'infection', value: 14 },
        { name: 'analyze', value: 14 },
        { name: 'data availability', value: 14 },
        { name: 'studying', value: 14 },
        { name: 'investigating', value: 14 },
        { name: 'genomic', value: 14 },
        { name: 'biology', value: 14 },
        { name: 'evolutionary', value: 14 },
        { name: 'study', value: 14 },
        { name: 'research', value: 14 },
        { name: 'phage', value: 14 },
        { name: 'dual rna-seq', value: 14 },
        { name: 'exploration', value: 12 },
        { name: 'heatmap', value: 12 },
        { name: 'genome map', value: 12 },
        { name: 'data availability', value: 11 },
        { name: 'classification', value: 11 },
        { name: 'genome viewer', value: 11 },
        { name: 'expression', value: 11 },
        { name: 'e. coli', value: 11 },
        { name: 'T4', value: 11 },
        { name: 'T7', value: 11 },
        { name: 'atlas', value: 11 },
        { name: 'atlas', value: 11 },
        { name: 'infection', value: 14 },
        { name: 'analyze', value: 14 },
        { name: 'data availability', value: 14 },
        { name: 'studying', value: 14 },
        { name: 'investigating', value: 14 },
        { name: 'genomic', value: 14 },
        { name: 'biology', value: 14 },
        { name: 'evolutionary', value: 14 },
        { name: 'study', value: 14 },
    ];

    var maskImage = new Image()

    const option = {
        series: [{
            type: 'wordCloud',
            maskImage: maskImage,
            layoutAnimation: true,
            left: 'center',
            top: 'center',
            width: '90%',
            height: '100%',
            sizeRange: [8, 120], 
            rotationRange: [-90, 90], 
            rotationStep: 90, 
            gridSize: 3,
            drawOutOfBound: false,
            shrinkToFit: true,
            backgroundColor: '#84BFA9',
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

    maskImage.onload = function (){
        option.series[0].maskImage
        
        // set the chart option and render the chart
        wordcloud.setOption(option);
    }

    maskImage.src = './static/mask-image.png'


    // window.onresize = wordcloud.resize;

    
}



