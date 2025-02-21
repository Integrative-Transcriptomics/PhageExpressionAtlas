let graph_data_promise = Promise.resolve(null);


/**
 * Function to initialize the Dataset Exploration Page
 */
export async function initializeExplorationPage(){
    console.log("Exploration loaded");

    // get all selections 
    const phage_select = document.getElementById("phages-select");
    const host_select = document.getElementById("hosts-select");
    const study_select = document.getElementById("studies-select");
    const phage_genes_select = document.getElementById("phage-genes-select");
    const host_genes_select = document.getElementById("host-genes-select");

    // fetch all datasets (overview)
    let datasets_info = await fetch_datasets_overview().catch(error => {
        console.error("Error fetching dataset:", error);
        return null;
    })

    if(datasets_info) {
        fillSelectors(datasets_info, phage_select, host_select, study_select, phage_genes_select, host_genes_select);
    } else{
        // TODO handle, if datasets overview was not able to fetch aka selectors can not be filled
    }
    
    

    study_select.addEventListener('sl-change', async ()=> {
        const study = study_select.value;
        const downloadButton = document.getElementById("download-dataset-button")

        if(study){

            try{
                let dataset_unpickled = await fetch_specific_unpickled_dataset(study,"TPM_means");
                
                fillGeneSelects(dataset_unpickled, phage_genes_select, host_genes_select);
            }
            catch(error){
                console.log('Failed to fetch unpickled Data', error)
            }

            // fetch graph data and plot the graphs 
            graph_data_promise = fetch_graph_data(study);
            graph_data_promise.then(graph_data => {
                const heatmap_data = graph_data.heatmap_data;
                const chord_data = graph_data.chord_data;
                const class_timeseries_data = graph_data.class_time_data;

                createHeatmap(heatmap_data);
                createChordDiagram(chord_data);
                createClassTimeseries(class_timeseries_data.phages);

                return graph_data;
            }).catch(error => {
                console.log('Failed to fetch data for the Graphs', error)
                return null; 
            });

            // configure download dataset button 
            downloadButton.removeAttribute("disabled")
            const tooltip = downloadButton.parentElement; 
            tooltip.content = "Download Dataset"
            downloadDataset(study);

            // configure select all und deselect all buttons of gene selects
            const selectAllButtonPhages = document.querySelector("#phage-genes-select .select-all-button");
            const selectAllButtonHosts = document.querySelector("#host-genes-select .select-all-button");

            selectAllButtonPhages.addEventListener('click', () => {
                const options = Array.from(phage_genes_select.querySelectorAll('sl-option')).map(option => option.value);

                setValueAndTriggerChange(phage_genes_select, options);
            });

            selectAllButtonHosts.addEventListener('click', () => {
                const options = Array.from(host_genes_select.querySelectorAll('sl-option')).map(option => option.value);

                setValueAndTriggerChange(host_genes_select, options);
            });

            const deselectAllButtonPhages = document.querySelector("#phage-genes-select .deselect-all-button");
            const deselectAllButtonHosts = document.querySelector("#host-genes-select .deselect-all-button");

            deselectAllButtonPhages.addEventListener('click', () => {
                // clear selections
                phage_genes_select.setAttribute("value", "")
                phage_genes_select.shadowRoot.querySelector('input').value = "";
                document.getElementById('phage-genes-timeseries-container').innerHTML = "";

            })

        
            deselectAllButtonHosts.addEventListener('click', () => {
                // clear selections
                host_genes_select.setAttribute("value", "")
                host_genes_select.shadowRoot.querySelector('input').value = "";
                document.getElementById('host-genes-timeseries-container').innerHTML = "";
            })
            
        }else{
            phage_genes_select.innerHTML= '';
            host_genes_select.innerHTML= '';
            downloadButton.setAttribute("disabled",'')
            const tooltip = downloadButton.parentElement; 
            tooltip.content = "Please make your selections first";

            resetGraphs();
        }
    });

    

    phage_genes_select.addEventListener('sl-change',async () => {
        const selectedPhageGenes = phage_genes_select.value;

        const graph_data = await graph_data_promise; 
        
        if (graph_data && selectedPhageGenes.length > 0){

            createGeneTimeseries(graph_data.class_time_data.phages, selectedPhageGenes,"phage-genes-timeseries-container")

        }
    });

    host_genes_select.addEventListener('sl-change',async () => {
        const selectedHostGenes = host_genes_select.value;

        const graph_data = await graph_data_promise; 
        
        if (graph_data && selectedHostGenes.length > 0){

            createGeneTimeseries(graph_data.class_time_data.hosts, selectedHostGenes,"host-genes-timeseries-container")

        }
    });
      
}




/**
 * Function to fill and update all selectors 
 * @param {Dataset[]} datasets_info - Array of Datasets Overview: only unique datasets/no matrix data.
 * @param {sl-select} phage_select - Shoelace's select element for phages.
 * @param {sl-select} host_select - Shoelace's select element for hosts.
 * @param {sl-select} study_select - Shoelace's select element for studies.
 * @param {sl-select} phage_genes_select - Shoelace's select element for phage genes.
 * @param {sl-select} host_genes_select - Shoelace's select element for host genes.
 */
async function fillSelectors(datasets_info, phage_select, host_select, study_select, phage_genes_select, host_genes_select ){

    // get all initial single selector options 
    const phages = [...new Set(datasets_info.map(dataset => dataset.phageName))]; // get all phages

    // randomly choose a default phage value
    const numberOfPhages = phages.length;
    const randomInt = Math.floor(Math.random() * numberOfPhages);            // create a random integer
    const defaultPhage = phages[randomInt];                                  // randomly set a default value for the first select (Phages)


    let params = new URLSearchParams(window.location.search);

    let select1Value = params.get("select1") || defaultPhage;
    let select2Value = params.get("select2");
    let select3Value = params.get("select3");

    let validRows = datasets_info.filter(dataset =>  dataset.phageName === select1Value); // filter the dataset based on the default value 

    const hosts = [...new Set(validRows.map(dataset => dataset.hostName))];  // get all hosts
    const studies = [...new Set(validRows.map(dataset => dataset.source))];  // get all datasets

    if(select1Value && select2Value &&select3Value){
        // fill the selectors based on the defaultPhage
        fillOptions(phage_select, phages, select1Value);
        fillOptions(host_select, hosts, select2Value);
        fillOptions(study_select, studies, select3Value);
    }
    else{
        // fill the selectors based on the defaultPhage
        fillOptions(phage_select, phages, select1Value);
        fillOptions(host_select, hosts, hosts[0]);
        fillOptions(study_select, studies, studies[0]);
    }

    // reset URL
    resetURL();


    study_select.addEventListener('sl-change', () => {
        let study = study_select.value;

        let study_dataset_pickled_TPM = datasets_info.filter(dataset => dataset.source === study)[0]; // filter dataset

        fillStudyInfo(study_dataset_pickled_TPM, study_select);  // fill study info based on changes of study_select
        updateSelections(datasets_info, phage_select, host_select, study_select, study_select.id);
    })

    // configure deselect All Buttons to reset Selections 
    const deselectAllButton = document.getElementById("deselect-all-button");
    deselectAllButton.addEventListener('click', triggerClearEvent);

    // listen for changes in the selects 
    phage_select.addEventListener('sl-change', () =>{
        updateSelections(datasets_info, phage_select, host_select, study_select, phage_select.id);

        if(!study_select.shadowRoot.querySelector('input').value){
            resetOptions(phage_genes_select.id);
            resetOptions(host_genes_select.id);
        }
        
    });

    host_select.addEventListener('sl-change', () =>{
        updateSelections(datasets_info, phage_select, host_select, study_select, host_select.id); 
        
        if(!study_select.shadowRoot.querySelector('input').value){
            resetOptions(phage_genes_select.id);
            resetOptions(host_genes_select.id);
        }
    });
}



/**
 * Function to fill a single selector for Phage-Host Interaction
 * @param {sl-select} select - select element.
 * @param {string[]} options - Options for the select element.
 * @param {string} defaultValue - Default Value for the select element.
 */
function fillOptions(select, options, defaultValue) {

    // clear existing options
    select.innerHTML = ''; 

    if (select.hasAttribute('multiple')){
        select.innerHTML = `<div class="options-config">
                        <sl-button size="small" class="select-all-button" >
                            <sl-icon slot="prefix" name="check"> </sl-icon>
                            Select all
                        </sl-button>
                        <sl-button size="small" class="deselect-all-button">
                            <sl-icon slot="prefix" name="x"> </sl-icon>
                            Deselect all</sl-button>
                    </div>`;
    }

    options.forEach(option => {
    
      // remove whitespaces and replace them with underscores for value attribute
      const optionUnderscore = option.replace(/\s+/g, '_');

      // create option element, change value/text content and append to select element
      const opt = document.createElement('sl-option');
      opt.value = optionUnderscore;
      opt.textContent = option;
      select.appendChild(opt);
    });


    // change default value
    if(defaultValue){

        setTimeout(() => {
            setValueAndTriggerChange(select, defaultValue);
        }, 10);
    }
}

/**
 * Function that sets the value of an select element and triggers an sl-change event
 * @param {sl-select} select - select element.
 * @param {string} value - Value for the select element.
 */
async function setValueAndTriggerChange(select, value) {

    await select.updateComplete;  // wait for Shoelace to render the component

    if(select.hasAttribute('multiple')){
        select.value = value
    }else{
        select.value = value.replace(/\s+/g, '_');
        select.shadowRoot.querySelector('input').value = value;
    }

    // dispatch an "sl-change" event to trigger event listeners
    select.dispatchEvent(new Event('sl-change', { bubbles: true }));
}


/**
 * Function to fill information about selected dataset in info-study
 * @param {Dataset} dataset - Array of Datasets.
 * @param {HTMLElement} study_select - Shoelace's select element for Studies.
 */
function fillStudyInfo(dataset, study_select){
    
    // fill info-study
    const option = study_select.shadowRoot.querySelector('input').value; // get currently selected study
    const infoContainer = document.getElementById("info-study");         // get info container

    if(option){
        // update content
        infoContainer.innerHTML = `
                                    <p class="small-p">First Author: ${dataset.firstAuthor}</p>
                                    <p class="small-p">Year: ${dataset.year}</p>
                                    <p class="small-p">Journal: ${dataset.journal}</p>
                                    <p class="small-p">Pubmed ID: ${dataset.pubmedID}</p>
                                    <p class="small-p">Description:</p>
                                    <p class="small-p">${dataset.description}</p>`;
    }else{
        infoContainer.innerHTML = "No Information available";
    }
}

/**
 * Function to reset a single selector for Phage-Host Interaction by removing all options
 * @param {string} selectId - ID of the select element.
 */
function resetOptions(selectId){
    const select = document.getElementById(selectId);

    // clear existing options
    select.innerHTML = ''; 

}

/**
 * Function to trigger a clear event for the select elements
 */
function triggerClearEvent(){
    const selectors = document.querySelectorAll(".selector.single");
    
    selectors.forEach(selector => {
        // clear selections
        selector.setAttribute("value", "")
        selector.shadowRoot.querySelector('input').value = "";
        
        // dispatch an "sl-change" event to trigger event listeners
        selector.dispatchEvent(new Event('sl-change', { bubbles: true }));
    })

    resetOptions("hosts-select");
    resetOptions("studies-select");
    
}


/**
 * Function to update single selectors options for Phage-Host Interaction
 * @param {Dataset[]} datasets - Array of Datasets.
 * @param {sl-select} phage_select - Select element for Phages.
 * @param {sl-select} host_select - Select element for Hosts.
 * @param {sl-select} study_select - Select element for Studies.
 */
function updateSelections(datasets, phage_select, host_select, study_select, changedSelect) {
    const phageValue = phage_select.shadowRoot.querySelector('input').value;
    const hostValue = host_select.shadowRoot.querySelector('input').value;
    const studyValue = study_select.shadowRoot.querySelector('input').value;

    let validRows = datasets;

    // filter by phage if selected
    if (phageValue) {
        validRows = filterDatasetByValue(validRows, 'phageName', phageValue);
    }

    // get unique hosts and studies
    const hosts_filtered = getUniqueValues(validRows, 'hostName');
    const studies_filtered = getUniqueValues(validRows, 'source');

    // if phage is selected, handle host and study options
    if (phageValue) {
        if (hostValue && !studyValue) {
            fillOptions(host_select, hosts_filtered, null);
            validRows = filterDatasetByValue(validRows, 'hostName', hostValue);
            fillOptions(study_select, getUniqueValues(validRows, 'source'), null);
        } else if (studyValue && !hostValue) {
            fillOptions(study_select, studies_filtered, null);
            validRows = filterDatasetByValue(validRows, 'source', studyValue);
            fillOptions(host_select, getUniqueValues(validRows, 'hostName'), null);
        } else if (studyValue && hostValue) {
            if (changedSelect === host_select.id) {
                validRows = filterDatasetByValue(validRows, 'hostName', hostValue);
                fillOptions(study_select, getUniqueValues(validRows, 'source'), null);
                resetGraphs();
            } else if (changedSelect === study_select.id) {
                // validRows = filterDatasetByValue(validRows, 'source', studyValue);
                fillOptions(host_select, getUniqueValues(validRows, 'hostName'), null);
            } else if (changedSelect === phage_select.id) {
                validRows = filterDatasetByValue(datasets, 'phageName', phageValue);
                fillOptions(host_select, getUniqueValues(validRows, 'hostName'), null);
                fillOptions(study_select, getUniqueValues(validRows, 'source'), null);
                // reset host and study select inputs
                host_select.setAttribute("value", "");
                host_select.shadowRoot.querySelector('input').value = "";
                study_select.setAttribute("value", "");
                study_select.shadowRoot.querySelector('input').value = "";
                resetGraphs();
            }
        } else {
            fillOptions(host_select, hosts_filtered, null);
            fillOptions(study_select, studies_filtered, null);
        }
    }
}

function resetURL() {
    window.history.replaceState({}, document.title, '/dataset-exploration');
}

/**
 * Function that extracts all values with a given key from a dataset and returns an array of unique values.
 * @param {Dataset[]} dataset - Array of Datasets
 * @param {String} key - String
 * @returns {String[]} - filtered Dataset
 */
function getUniqueValues(dataset, key) {
    return [...new Set(dataset.map(item => item[key]))];
}

/**
 * Function that filters a dataset by a value with a key.
 * @param {Dataset[]} dataset - Array of datasets
 * @param {String} key - key
 * @param {String} value - value
 * @returns {Dataset[]}
 */
function filterDatasetByValue(dataset, key, value) {
    return dataset.filter(item => item[key] === value);
}

/**
 * Function that fills the Gene Selects
 * @param {Dataset} dataset - Dataset.
 * @param {sl-select} phage_genes_select - Shoelace's select element for phage genes.
 * @param {sl-select} host_genes_select - Shoelace's select element for host genes.
 */
function fillGeneSelects(dataset, phage_genes_select, host_genes_select){

    // access matrix Data
    const matrixData = dataset.matrixData.data;   

    
    
    // seperate host and phage matrix data to get genes later on seperatly 
    const hostMatrix = matrixData.filter(row => row.entity === "host");
    const phageMatrix = matrixData.filter(row => row.entity === "phage");

    

    // extract all host and phage genes from seperate matrix data 
    const phageSymbols = phageMatrix.map( row => {return row.symbol});
    const hostSymbols = hostMatrix.map( row => {return row.symbol});

    // set default options 
    // const shuffledPhages = phageSymbols.sort((a, b) => 0.5 - Math.random()); // shuffle gene list
    // const shuffledHosts = hostSymbols.sort((a, b) => 0.5 - Math.random()); // shuffle host list

    const defaultPhageGenes = phageSymbols.slice(0,3);
    const defaultHostGenes = hostSymbols.slice(0,3);
    
    // fill the select elements 
    fillOptions(phage_genes_select,phageSymbols, defaultPhageGenes);
    fillOptions(host_genes_select,hostSymbols, defaultHostGenes);  
}

/**
 * Function that handles the download of the chosen Dataset/Study
 * @param {string} study - selected Study.
 */
async function downloadDataset(study){

    const datasets = await Promise.all([
        fetch_specific_unpickled_dataset(study, "fractional"),
        fetch_specific_unpickled_dataset(study, "TPM"),
        fetch_specific_unpickled_dataset(study, "TPM_means"),
        fetch_specific_unpickled_dataset(study, "TPM_std")
    ]);


    // extract id, matrix data and normalization and save the rest for saving of only necessary info
    const { id, matrixData, normalization, ...filteredDataset } = datasets[0];

    // get the keys (to ensure correct order of the csv file later (order of constructor, not alphabetical order))
    // here it does not matter which normalization dataset
    const keys = Object.keys(filteredDataset);
    
    // convert json -> csv (information)
    var csv = Papa.unparse({
        fields: keys,
        data: [filteredDataset]
    });

    // create zip file with JSZip
    const zip = new JSZip();

    // add files to the zip file
    zip.file(`${study}.txt`, csv)
    zip.file(`${study}.csv`, csv)

    datasets.forEach(dataset => {
        const normalization = dataset.normalization;

        const matrixCsv = convertMatrixToCSV(dataset);

        zip.file(`${study}_matrix_data_${normalization}.csv`, matrixCsv)
    })
    
 
    // access the download button 
    const downloadButton = document.getElementById("download-dataset-button")

    // generate zip and add it to the download button
    zip.generateAsync({type:"blob"}).then(function(content) {
        const url = URL.createObjectURL(content);
        // add dataset url to download button
        downloadButton.href = url;
        downloadButton.download = study;
    })
    
}

/**
 * Function converts the matrix Data of a dataset into a content for a csv file
 * @param {Dataset} dataset - Dataset.
 * @returns {string} - CSV file content.
 */
function convertMatrixToCSV(dataset) {
    const matrix = dataset.matrixData.data;
    const timePoints = dataset.matrixData.columns; 
    const fields = ["geneID", "symbol", "entity", ...timePoints.map(String)];

    // convert the matrix so that each time point has a seperate column again
    const csvData = matrix.map(row => {
        let rowData = {
            geneID: row.geneID,
            symbol: row.symbol,
            entity: row.entity
        };
      
        // add time points as separate columns
        timePoints.forEach((timePoint, index) => {
            rowData[`${timePoint}`] = row.values[index]; 
        });
      
        return rowData;
    });

    // convert json -> csv (matrixData)
    const matrixCsv = Papa.unparse({
        fields: fields,
        data: csvData
    })


    return matrixCsv 
}   

/**
 * Function to create the heatmaps 
 * 
*/
function createHeatmap(data){

    var data_phages = [{
        z: data.phage_data.z,
        x: data.phage_data.x,
        y: data.phage_data.y,
        type: 'heatmap',
        colorscale: 'RdBu',
        coloraxis: 'coloraxis'
    }]

    const layout_phages = {
        xaxis: {
            title: {text: 'Time [min]',
                font: {
                    size: 12,
                    family: 'Arial, sans-serif',
                    color: 'black'
                }
            },
            type: 'category',
            tickmode: 'array', 
            ticktext: data.x 
        },
        margin: {
            l: 20,  // left margin
            r: 20,  // right margin
            b: 50,  // bottom margin
            t: 20   // top margin
        },
        yaxis: {
            title: {text: 'Genes',
                font: {
                    size: 12,
                    family: 'Arial, sans-serif',
                    color: 'black'
                }
            },
            type: 'category',
            ticks: '',
            tickmode: 'array', 
            ticktext: data.y, 
            showticklabels: false,
        },
        coloraxis: {
            cmin: -1.5, 
            cmax: 1.5,
            colorscale: [
                [0, '#6788ee'],    
                [0.2, '#9abbff'],  
                [0.4, '#c9d7f0'],  
                [0.6, '#edd1c2'],  
                [0.8, '#f7a889'],  
                [1, '#e26952']     
            ] 

        }
    };

    const dendrogram = JSON.parse(data.phage_data.dendrogram).data

    // console.log(JSON.parse(data.phage_data.dendrogram));

    var data_hosts = [{
        z: data.host_data.z,
        x: data.host_data.x,
        y: data.host_data.y,
        type: 'heatmap',
        coloraxis: 'coloraxis'
    }]
    const layout_hosts =  {
        xaxis: {
            title: {text: 'Time [min]',
                font: {
                    size: 12,
                    family: 'Arial, sans-serif',
                    color: 'black'
                }
            },
            type: 'category',
            tickmode: 'array', 
            ticktext: data.x 
        },
        yaxis: {
            title: {text: 'Genes',
                font: {
                    size: 12,
                    family: 'Arial, sans-serif',
                    color: 'black'
                }
            },
            ticks: '',
            type: 'category',
            tickmode: 'array', 
            ticktext: data.y, 
            showticklabels: false,
        },
        margin: {
            b: 50,  // bottom margin
            t: 20   // top margin
        },
        coloraxis: {
            cmin: -1.5, 
            cmax: 1.5, 
            colorscale: [
                [0, '#6788ee'],    
                [0.2, '#9abbff'],  
                [0.4, '#c9d7f0'],  
                [0.6, '#edd1c2'],  
                [0.8, '#f7a889'],  
                [1, '#e26952']     
            ]

        }
    };

    Plotly.newPlot('phage-heatmap-container', data_phages, layout_phages)

    Plotly.newPlot('host-heatmap-container', data_hosts, layout_hosts)

    
}

function resetGraphs(){
    const graph_container = document.querySelectorAll(".graph-container");

    graph_container.forEach(card => {
        card.innerHTML = '';
    })
}


// function createHeatmap(dataset, selectedStudy){
    
//     // retrieve Heatmap container
//     const phageHeatmapContainer = document.getElementById("phage-heatmap-container");
//     const hostHeatmapContainer = document.getElementById("host-heatmap-container");

//     if(selectedStudy){

//         // get timepoints for x-axis
//         const timepoints = dataset.matrixData.columns;

//         // access matrix Data
//         const matrixData = dataset.matrixData.data;   
//         console.log(typeof(matrixData));
        
//         // seperate host and phage matrix data to get genes later on seperatly 
//         const hostMatrix = matrixData.filter(row => row.entity === "host");
//         const phageMatrix = matrixData.filter(row => row.entity === "phage");

//         // extract all host and phage genes from seperate matrix data 
//         const phageSymbols = phageMatrix.map( row => {return row.symbol});
//         const hostSymbols = hostMatrix.map( row => {return row.symbol});

//         const phageValues = phageMatrix.map( row => {return row.values});
//         const hostValues = hostMatrix.map( row => {return row.values});

//         var heatmapDataPhages = [];

//         phageMatrix.forEach((entry, geneIdx) => {
//             let mean = calculateMean(entry.values);
//             let std = calculateStd(entry.values, mean);

//             entry.values.forEach((value, timeIdx) => {
//                 let zscore = (value - mean) / std;
//                 heatmapDataPhages.push([timeIdx, geneIdx, zscore]);
//             });
//         })


//         const phageOptions = createHeatmapOptions(timepoints, phageSymbols, heatmapDataPhages);
        
        
//         createEchartsChart(phageHeatmapContainer, phageOptions)
//     }
// }

// function calculateMean(values) {
//     const sum = values.reduce((a, b) => a + b, 0);
//     return sum / values.length;
// }

// // function to calculate the standard deviation of an array
// function calculateStd(values, mean) {
//     const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
//     return Math.sqrt(variance);
// }



// function createHeatmapOptions(timepoints, genes, values){

//     const option = {
//         tooltip: {
//           position: 'top'
//         },
//         grid: {
//           height: '50%',
//           top: '10%'
//         },
//         xAxis: {
//           type: 'category',
//           data: timepoints,
//           splitArea: {
//             show: true
//           }
//         },
//         yAxis: {
//           type: 'category',
//           data: genes,
//           splitArea: {
//             show: true
//           }
//         },
//         visualMap: {
//           min: -1.5,
//           max: 1.5,
//           calculable: true,
//           orient: 'horizontal',
//           left: 'center',
//           bottom: '5%',
//           inRange: {
//             color: ['#0000FF', '#FFFFFF', '#FF0000'] 
//           }
//         },
//         series: [
//           {
//             name: 'TPM',
//             type: 'heatmap',
//             data: values,
//             label: {
//               show: false
//             },
//             emphasis: {
//               itemStyle: {
//                 shadowBlur: 10,
//                 shadowColor: 'rgba(0, 0, 0, 0.5)'
//               }
//             }
//           }
//         ]
//     };

//     return option;
// }

function createEchartsChart(container, option){
    var chart = echarts.init(container);   

    chart.setOption(option);
}



function convertDataToHeatmapFormat(matrix_data){

}


function createChordDiagram(data){

    

    
}

function createClassTimeseries(data){
    data = JSON.parse(data)

    const traces = [];
    const uniqueGenes = [...new Set(data.map(item => item.Symbol))];

    const classColorMap = {
        'early': '#cbd8ad',
        'middle': '#D4B9A3',
        'late': '#A89A8E'
    };

    uniqueGenes.forEach(gene => {
        const traceData = data.filter(item => item.Symbol === gene);
        const classValue = traceData[0].ClassMax;

        if (classValue === null) return; // if not classified, skip gene 

        const timepoints = traceData.map(item=> item.Time);
        const values = traceData.map(item=> item.Value);

        let lineColor = classColorMap[classValue] || 'gray';

        if (classValue === null){

        } else{
            traces.push({
                x: timepoints, 
                y: values, 
                mode: 'lines', 
                line: {color: lineColor, width: 1},
                name: classValue,
                legendgroup: classValue,
                hovertemplate: `Gene: ${gene}`
            });
        }

        
    });

    // iterate over traces and hide duplicate group legends 
    const legendGroups = new Set();
    traces.forEach(trace => {
        if (legendGroups.has(trace.legendgroup)) {
            trace.showlegend = false; // hide legend for subsequent traces in the same group
        } else {
            trace.showlegend = true; // show legend for the first trace in the group
            legendGroups.add(trace.legendgroup);
        }
    });

    // specify the plot layout
    const layout =  {
        xaxis: {
            title: {text: 'Time [min]',
                font: {
                    size: 12,
                    family: 'Arial, sans-serif',
                    color: 'black'
                }
            },
            type: 'category',
            tickmode: 'array', 
            ticktext: data.x 
        },
        yaxis: {
            title: {text: 'Relative Expression',
                font: {
                    size: 12,
                    family: 'Arial, sans-serif',
                    color: 'black'
                }
            },
            ticktext: data.y 
        },
        margin: {
            b: 50,  // bottom margin
            t: 20   // top margin
        },
        legend: {
            tracegroupgap: 8, 
            itemsizing: 'constant', 
            font: {
                size: 12, 
                family: 'Arial, sans-serif'
            }
        }
    };


    Plotly.newPlot("class-timeseries-container", traces,layout)

}

/**
 * Function created time series plot of phage and host genes
 * @param {String} data - data.
 * @param {String[]} selectedGenes - Array of selected Genes.
 * @param {String} container - Container for Plot.
 */
function createGeneTimeseries(data, selectedGenes, container){
    data = JSON.parse(data);

    const traces = [];

    selectedGenes.forEach(gene => {
        const traceData = data.filter(item => item.Symbol === gene);
        
        const timepoints = traceData.map(item=> item.Time);
        const values = traceData.map(item=> item.Value);

        traces.push({
            x: timepoints, 
            y: values, 
            mode: 'lines', 
            line: { width: 1},
            name: gene,
        });
    });

    // specify the plot layout
    const layout =  {
        xaxis: {
            title: {text: 'Time [min]',
                font: {
                    size: 12,
                    family: 'Arial, sans-serif',
                    color: 'black'
                }
            },
            type: 'category',
            tickmode: 'array', 
            ticktext: data.x 
        },
        yaxis: {
            title: {text: 'Relative Expression',
                font: {
                    size: 12,
                    family: 'Arial, sans-serif',
                    color: 'black'
                }
            },
            ticktext: data.y 
        },
        margin: {
            b: 50,  // bottom margin
            t: 20   // top margin
        },
        legend: {
            tracegroupgap: 8, 
            itemsizing: 'constant', 
            font: {
                size: 12, 
                family: 'Arial, sans-serif'
            }
        }
    };


    Plotly.newPlot(container, traces,layout)
    




}