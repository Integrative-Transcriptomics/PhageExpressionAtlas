/*

    Herein, are  all Functions that are used on the Data Overview page 

*/

/**
 * Function to initialize the Data Overview Page
 */
export async function initializeOverviewPage(){

    console.log("Overview loaded")

    // .. Table of Content .. 

    // table of contents for easy on-site navigation in data Overview
    const tocContainer = document.querySelector("#toc-container")
    const tocAnchors = tocContainer.querySelectorAll("a");   // get all headings/anchors inside the toc container

    // retrieve an Array of all sections by converting links into corresponding section elements
    const sections = Array.from(tocAnchors).map(link => document.querySelector(link.getAttribute('href')));

    // function that will be later passed to the IntersectionObserver to handle the active headings
    const observeFunction = (entries) => {
        // loop through all entries
        entries.forEach(entry => {
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

    //TODO adjust values when everything is set
    const observerOptions = {
        root: null,
        rootMargin: "-30% 0px -70% 0px",

    };


    // create a intersection observer that will use the observe function and observer options to see which heading is currently active
    const observer = new IntersectionObserver( observeFunction,observerOptions );
    sections.forEach(section => {
        if (section) observer.observe(section);
    });

    // .. Fill Span element .. 
    // get the span element that should hold the number of different researchers
    const nrReasearchersContainer = document.getElementById("nr-researchers"); 

    try {
        const nrOfStudies = await fetch_nr_of_studies();   // fetch the nr. of studies in the backend
        nrReasearchersContainer.textContent = nrOfStudies; // fill the span element with the number of studies
    } catch (error) {
        console.log(error)
    }



    // .. Visualizations .. 

    // fetch host sunburst data
    fetch_host_sunburst_data()
        .then(data => {createHostsSunburst(data)})
        .catch((error) => {console.log("Error fetching suburst data", error)
    });

    
    // fetch datasets overview (no matrix data) and create all visualizations based on the datasets
    try{
        const datasets = await fetch_datasets_overview(); // retrieve the datasets without matrix data
        createSankey(datasets)
    
        createDataTable(datasets);

        // create default chart
        createPhagesPie(datasets);

        // const phagesRadiogroup = document.getElementById("phages-radiogroup");

        // phagesRadiogroup.addEventListener('sl-change', (event) => {
        //     const selectedChart = event.target.value;

        //     if(selectedChart === 'pie'){
        //         createPhagesPie(datasets);
        //     } 
        //     else if (selectedChart === 'donut'){
        //         createPhagesDonut(datasets);
        //     }

        // });

    }
    catch(error){
        console.log("Error fetching dataset", error)
    }
    
    
    const phages = await fetch_phages_dict(); // fetch phages as dictionary
    createPhageTypePie(phages); // create default chart

    // // change the chart type based on the selected radio group button
    // const phageTypeRadiogroup = document.getElementById("phage-type-radiogroup");
     
    // // add  an eventlistener for the chart type radio buttons and change the chart type depending on that
    // phageTypeRadiogroup.addEventListener('sl-change', (event) => {
    //     const selectedChart = event.target.value;

    //     if(selectedChart === 'pie'){
    //         createPhageTypePie(phages);
    //     } 
    //     else if (selectedChart === 'donut'){
    //         createPhageTypeDonut(phages);
    //     }
    // });
    

}

// -- variables --
// colors from index.css
const rootStyles = getComputedStyle(document.documentElement);

const col1 = rootStyles.getPropertyValue('--col1').trim();
const col2 = rootStyles.getPropertyValue('--col2').trim();
const col3 = rootStyles.getPropertyValue('--col3').trim();
const col4 = rootStyles.getPropertyValue('--col4').trim();
const col5 = rootStyles.getPropertyValue('--col5').trim();
const col6 = rootStyles.getPropertyValue('--col6').trim();
const col7 = rootStyles.getPropertyValue('--col7').trim();
const col8 = rootStyles.getPropertyValue('--col8').trim();
const col9 = rootStyles.getPropertyValue('--col9').trim();
const cards = rootStyles.getPropertyValue('--cards').trim();
const textCol = getComputedStyle(document.documentElement).getPropertyValue('--text-primary-light').trim();

// -- functions used in the initializeOverviewPage() function --

/**
 * Function creates Sankey Chart 
 * @param {Dataset[]} datasets - Array of Datasets.
 */
function createSankey(datasets){
    // extract nodes and links from the dataset dictionary
    let nodes = new Set(); // use an set to only add unique values
    let links = [];

    // iterate through all datasets
    datasets.forEach(dataset => {

        // add nodes
        nodes.add(dataset.source);
        nodes.add(dataset.phageName);
        nodes.add(dataset.hostName);
        nodes.add(dataset.hostGroup);

        // add links
        links.push({source: dataset.source, target:dataset.phageName, value:1});
        links.push({source: dataset.phageName, target:dataset.hostName, value:1});
        links.push({source: dataset.hostName, target:dataset.hostGroup, value:1});

    })

    nodes = Array.from(nodes).map(node => ({ name: node }));      // convert set into array

    const container = document.getElementById("overview-sankey"); // create echarts sankey diagram

    toggleSpinner("sankey-spinner", false)                        // hide the sankey spinner (loading indicator)

    var sankeyChart = echarts.init(container);                    // initialize chart

    new ResizeObserver(() => sankeyChart.resize()).observe(container); // add resize observer for the chart

    // configure chart options
    var option = {
        tooltip: {
            trigger: 'item',
            triggerOn: 'mousemove'
        },
        series:{
            type: 'sankey',
            layout: 'none',
            emphasis:{
                focus: 'adjacency'
            },
            data: nodes, 
            links: links,
            label: {
                show: true,
                fontSize: 13
            },
            levels: [
                {
                  depth: 0,
                  itemStyle: {
                    color: col3
                  }, 
                },
                {
                  depth: 1,
                  itemStyle: {
                    color: col5
                  }
                },
                {
                  depth: 2,
                  itemStyle: {
                    color: col7
                  }
                }, 
                {
                    depth: 3,
                    itemStyle: {
                      color: col9
                    }
                }
            ],
            lineStyle: {
                color: 'gradient',
                opacity: 0.4,
                curveness: 0.5
            }
            

        }, 
        graphic: [
            {
              type: 'text',
              left: '3%',
              top: '0%',
              style: {
                text: 'Studies', 
                font: 'bold 14px Arial',
                fill: col3
              }
            },
            {
              type: 'text',
              left: '28%',
              top: '0%',
              style: {
                text: 'Phages',  
                font: 'bold 14px Arial',
                fill: col5,
              }
            },
            {
              type: 'text',
              left: '51%',
              top: '0%',
              style: {
                text: 'Host strains', 
                font: 'bold 14px Arial',
                fill: col7
              }
            }, 
            {
                type: 'text',
                right: '19%',
                top: '0%',
                style: {
                  text: 'Hosts', 
                  font: 'bold 14px Arial',
                  fill: col8
                }
            }
          ]
    };

    sankeyChart.setOption(option); // set options to the charts

    // download chart when button is clicked
    downloadEChartsChart(sankeyChart, "download-sankey-button", "Overview_dataset_distribution.png", "Overview of PhageExpressionAtlas");
}

/**
 * Function creates Phage Type Pie Chart
 * @param {Phage[]} phages - Array of Phages.
 */
function createPhageTypePie(phages){

    const chartData = createUniqueCountDataset(phages, "phageType"); //count how often each phage occurs
    
    const container = document.getElementById("dist-phage-type"); // get the container

    var chart = echarts.init(container); // initialize the echart
    new ResizeObserver(() => chart.resize()).observe(container); // add a resize observer to the container

    // create chart options
    var option = {
        tooltip: {
            trigger: 'item'
        },
        legend: {
            top: '5%',
            left: 'center'
        },
        label: {
            show: true,
            overflow: 'truncate',
            width: 90,
        },
        series: {
            name: 'Phage Type',
            type: 'pie',
            radius: '45%',
            data: chartData,
            color: [col3, col5, col7],
            emphasis: {
                itemStyle: {
                  shadowBlur: 10,
                  shadowOffsetX: 0,
                  shadowColor: cards
                }
            },
            itemStyle:{
                borderRadius: 0
            }
        }

    };

    chart.setOption(option);
    // download chart when button is clicked
    downloadEChartsChart(chart, "download-phagetype-chart-button", "PhageType_Distribution.png", "Phage Type Distribution of PhageExpressionAtlas")

}

/**
 * Function creates Phages Pie Chart 
 * @param {Dataset[]} datasets - Array of Datasets.
 */
function createPhagesPie(datasets) {

    // count how often each phageName appears in the dataset
    const chartData = createUniqueCountDataset(datasets, "phageName");
    
    const container = document.getElementById("dist-phages"); // get the container

    var chart = echarts.init(container); // initialize the echart in the container
    new ResizeObserver(() => chart.resize()).observe(container); // add resize observer to the container

    // create chart options
    var option = {
        title: {
            text: ''
        }, 
        tooltip: {
            trigger: 'item'
        },
        legend: {
            top: '5%',
            left: 'center',
            type: 'scroll',
        },
        label: {
            show: true,
            overflow: 'truncate',
            width: 90,
        },
        series: {
            name: 'Bacteriophage',
            type: 'pie',
            radius: '45%',
            data: chartData,
            color: [col4, col5, col6, col7, col8, col9, col3, col2, col1],
            emphasis: {
                itemStyle: {
                  shadowBlur: 10,
                  shadowOffsetX: 0,
                  shadowColor: cards
                }
            },
            itemStyle:{
                borderRadius: 0
            }
        }

    };

    chart.setOption(option); // set options

    // download chart when button is clicked
    downloadEChartsChart(chart, "download-phages-chart-button", "Phage_Distribution.png", "Phage Distribution of PhageExpressionAtlas")
}

/**
 * Function creates Phages Donut Chart 
 * @param {Dataset[]} datasets - Array of Datasets.
 */
function createPhagesDonut(datasets){

    // count how often each phageName appears in the dataset
    const chartData = createUniqueCountDataset(datasets, "phageName");
    
    const container = document.getElementById("dist-phages"); // get the container

    var chart = echarts.init(container); // initialize echart in the container 
    new ResizeObserver(() => chart.resize()).observe(container); // add resize observer to the container

    // create chart options
    var option = {
        tooltip: {
            trigger: 'item'
        },
        legend: {
            top: '5%',
            left: 'center'
        },
        label: {
            show: true,
            overflow: 'truncate',
            width: 90,
        },
        series: {
            name: 'Bacteriophage',
            type: 'pie',
            radius: ['30%', '50%'],
            avoidLabelOverlap: false,
            itemStyle: {
                borderRadius: 10,
                borderColor: '#fff',
                borderWidth: 2
            },
            data: chartData,
            color: [col4, col5, col6, col7, col8, col9, col3, col2, col1],
            emphasis: {
                itemStyle: {
                  shadowBlur: 10,
                  shadowOffsetX: 0,
                  shadowColor: cards
                }
            }
        }

    };

    chart.setOption(option); // set options
}


/**
 * Function to create Host sunburst chart 
 * @param {{}} data - Dictionary of labels, values and parents.
 */
function createHostsSunburst(data){
    const labels = data.labels;
    const values = data.values;
    const parents = data.parents;

    var sunburstData = [{
        type: "sunburst",
        labels: labels, 
        parents: parents, 
        values: values, 
        outsidetextfont: {size:20, color:textCol}, 
        leaf: {opacity: 0.6}, 
        marker: {line: {width: 2}}, 
    }];

    var layout = {
        margin: {l: 0, r: 0, b: 0, t: 0},
        sunburstcolorway: [col3, col5, col6, col4, col7, col1, col2, col8], 
        extendsunburstcolorway: true,
    };

    var config = {
        scrollZoom: true, 
        modeBarButtonsToRemove: ['resetScale2d'],
        displayModeBar: true,
        displaylogo: false, 
        responsive:true, 
        toImageButtonOptions: {
            format: 'png',
            filename: 'Host_Sunburst_PhageExpressionAtlas', 
            title: '',
            height:500, 
            width: 500, 
            scale: 5, 
        }

    }

    Plotly.newPlot('dist-hosts', sunburstData, layout, config); // create the plotly plot
}

/**
 * Function to count how often a value appears in a certain column in a dataset 
 * @param {Object[]} datasets - Array of Object e.g. Dataset or Phage.
 * @param {string} col - Column name of interest.
 * 
 * @returns {Object[]} result. 
 */
function createUniqueCountDataset(datasets, col){
    let counts = {};

    // count unique values in a column
    datasets.forEach(row => {
        const value = row[col];

        if (counts[value]){
            counts[value]++;
        }
        else{
            counts[value] = 1;
        }
    });

    // save it as an array of objects
    const result = [];
    for (const [key, value] of Object.entries(counts)) {
        result.push({ name: key, value: value });
    }
    
    return result;
}

/**
 * Function that creates the table for the dataset and allows filtering
 * @param {Dataset[]} datasets - Array of Datasets.
 */
function createDataTable(datasets){
    var filter_col_select = document.getElementById("filter-col-select");
    var filter_value_select = document.getElementById("filter-value-select")

    // custom formatter for the datasetexploration link
    var exploreIcon = function(cell, formatterParams, onRendered){
        return `<sl-tooltip content="Explore Dataset" class="table-tooltip">
                <svg id="table-explore-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M8 3.98438H14.1841L18 7.80029V17.9844C18 19.0889 17.1046 19.9844 16 19.9844H8C6.89543 19.9844 6 19.0889 6 17.9844V5.98438C6 4.87981 6.89543 3.98438 8 3.98438ZM14.1797 4.68604V6.80464C14.1797 7.35693 14.6274 7.80464 15.1797 7.80464H17.2744L14.2978 4.82806C14.2534 4.78362 14.214 4.73604 14.1797 4.68604ZM11.313 14.6626C12.105 14.6626 12.7471 14.0205 12.7471 13.2285C12.7471 12.4365 12.105 11.7944 11.313 11.7944C10.521 11.7944 9.87891 12.4365 9.87891 13.2285C9.87891 14.0205 10.521 14.6626 11.313 14.6626ZM11.313 15.6626C11.8309 15.6626 12.311 15.5009 12.7056 15.2251L14.3475 16.8671C14.5246 17.0442 14.8118 17.0442 14.9889 16.8671C15.166 16.69 15.166 16.4028 14.9889 16.2257L13.3399 14.5767C13.5971 14.1908 13.7471 13.7271 13.7471 13.2285C13.7471 11.8842 12.6573 10.7944 11.313 10.7944C9.96868 10.7944 8.87891 11.8842 8.87891 13.2285C8.87891 14.5728 9.96868 15.6626 11.313 15.6626Z" fill="#1D1B20"/>
                    </svg>
            </sl-tooltip>`
    }


    // create the columns for the table
    const tableCols = [
        {formatter: exploreIcon, width:100, hozAlign: "center", cellClick: function(e,cell){
            const rowData = cell.getRow().getData()

            // save the values for the select elements in sessionStorage, which can then be accessed in dataset exploration
            sessionStorage.setItem("overview-redirect-params", JSON.stringify({"select1": rowData.phageName, "select2": rowData.hostName, "select3": rowData.source}))
            
            // navigate to the Exploration page
            window.location.href = "/dataset-exploration";
            
        }},
        {title: "Study", field: "source"},
        {title: "Journal", field: "journal"},
        {title: "DOI", field: "doi", formatter:"link", width: 200},
        {title: "Phage Name", field: "phageName"},
        {title: "Host Name", field: "hostName"},
        {title: "First Author", field: "firstAuthor"},
        {title: "Year", field: "year"},
        {title: "Pubmed ID", field: "pubmedID"},
        {title: "Description", field: "description", formatter: "textarea", width: 450}
    ]

    const filterButton = document.getElementById("filter-button");
    const filterContainer = document.getElementById("filter-fields");
    const tooltip = document.getElementById("filter-tooltip");

    filterButton.addEventListener('click', () => {
        if (filterContainer.style.display === "none" || filterContainer.style.display === ''){
            filterButton.setAttribute("name", "funnel");
            tooltip.content = "Close Filter";
            filterContainer.style.display = "flex";
        } else {
            filterButton.setAttribute("name", "funnel-fill");
            filterContainer.style.display = "none";
            tooltip.content = "Open Filter";
            
        }
    });


    // create the options for the filter field 
    tableCols.forEach(column =>{
        const option = document.createElement("sl-option");
        option.value = column.field;
        option.textContent = column.title;
        filter_col_select.appendChild(option)
    })

    
    // trigger setFilter function with correct parameters
    function updateFilter(){
        var filterVal = filter_col_select.value; 
        
        const selectedOption = filter_value_select.querySelector(`sl-option[value="${filter_value_select.value}"]`); // get the selected option element
        const value = selectedOption ? selectedOption.textContent : ""; 
      
        if (filterVal) {
            // apply the filter
            table.setFilter(filterVal, "=", value); 
        }
    }

    // update filters on value change
    filter_col_select.addEventListener("sl-change", () => {
        var selectedColumn = filter_col_select.value;

        if (selectedColumn) {
            // select the unique values for the chosen column 
            var uniqueValues = [...new Set(table.getData().map(row => row[selectedColumn]))];

            // fill the filter value dropdown depending on the values inside the chosen column 
            filter_value_select.innerHTML = ''; // reset dropdown 

            // loop through all unique values 
            uniqueValues.forEach(value => {
                
                value = value.toString();

                // add options to the filter_value_select
                var option = document.createElement("sl-option");
                option.value = value.replace(/ /g, '_');
                option.textContent = value;
                filter_value_select.appendChild(option);

                
            });
        }
        updateFilter();
    });
    
    // add eventlistener that listens to changes and then updates the filter
    filter_value_select.addEventListener("sl-change", updateFilter);

    // clear filters on "Clear Filters" button click
    document.getElementById("filter-clear").addEventListener("click", () => {
        filter_col_select.value = "";
        filter_value_select.value = "";

        filter_value_select.innerHTML = '';

        table.clearFilter();
    });

    toggleSpinner("data-table-spinner", false) // hide the spinner

    // create the tabulator table 
    var table = new Tabulator("#data-table", {
        data: datasets,
        columns: tableCols,
        placeholder: "No data available",

        // add pagination
        pagination:"local",
        paginationSize: 9,
        paginationSizeSelector:[6, 9, 12, 30, 50],
        paginationCounter:"rows",  
    })

    // download table when button is clicked
    const downloadButton = document.getElementById("download-table-button");
    downloadButton.addEventListener('click', () => {
        table.download("csv", "data_overview.csv");
    });
}

/**
 * Function to download a echarts chart
 * @param {any} chart - Echarts chart.
 * @param {String} buttonID - Button ID.
 * @param {String} filename - File Name.
 * @param {String} title - Chart Title.
 */
function downloadEChartsChart(chart, buttonID, filename, title){

    chart.on('finished', () => {
        
        // add Chart title
        chart.setOption({
            title: {
                text: title,
                left: "center",
                top: "top",
            }, 
        });

        // create ECharts dataURL 
        const dataURL = chart.getDataURL({
            type: 'png', 
            pixelRatio: 2, 
            backgroundColor: '#fff' 
        });

        const downloadButton = document.getElementById(buttonID);
        

        // add chart url to download button
        downloadButton.href = dataURL;
        downloadButton.download = filename;

        // remove chart title
        chart.setOption({
            title: {
                text:'',
            }, 
        });
    });

    

}

/**
 * Function that creates an link that redirects to exploration page with the correct dataset etc selected
 * @param {String} select1Value - Value for Phage Select.
 * @param {String} select2Value - Value for Host Select.
 * @param {String} select3Value - Value for Study select.
 * 
 * @returns {String} - dataset exploration url. 
 */
function createExplorationUrl(select1Value, select2Value, select3Value){
    const url = `/dataset-exploration?select1=${select1Value}&select2=${select2Value}&select3=${select3Value}`;
    return url
}
