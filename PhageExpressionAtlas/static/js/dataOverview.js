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

    }
    catch(error){
        console.log("Error fetching dataset", error)
    }
    
    
    const phages = await fetch_phages_dict(); // fetch phages as dictionary
    createPhageTypePie(phages); // create default chart  

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
            trigger: 'item',
            formatter: function (params) {
                return `
                ${params.marker}
                <strong>${params.name}</strong><br/>
                Count: ${params.value}<br/>
                Percentage: ${params.percent}%
                `;
            }
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
            trigger: 'item',
            formatter: function (params) {
                return `
                ${params.marker}
                <strong>${params.name}</strong><br/>
                Count: ${params.value}<br/>
                Percentage: ${params.percent}%
                `;
            }
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
        hovertemplate: 'Name: %{label}<br>Value: %{value}<extra></extra>'
    }];

    var layout = {
        margin: {l: 0, r: 0, b: 0, t: 0},
        sunburstcolorway: [col3, col5, col6, col4, col7, col1, col2, col8], 
        extendsunburstcolorway: true,
    };

    const helpIcon = document.createElement("sl-icon");
    helpIcon.setAttribute("name", "question-circle-fill");


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
        },
        modeBarButtonsToAdd: [
            {
              name: "help",
              title: "Need help?",
              icon: Plotly.Icons.question,
              click: function(gd) {
                window.location.href = "/help#guide-overview"
              }
            },
          ],

    }

    Plotly.newPlot('dist-hosts', sunburstData, layout, config); // create the plotly plot
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
                <svg class="table-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M8 3.98438H14.1841L18 7.80029V17.9844C18 19.0889 17.1046 19.9844 16 19.9844H8C6.89543 19.9844 6 19.0889 6 17.9844V5.98438C6 4.87981 6.89543 3.98438 8 3.98438ZM14.1797 4.68604V6.80464C14.1797 7.35693 14.6274 7.80464 15.1797 7.80464H17.2744L14.2978 4.82806C14.2534 4.78362 14.214 4.73604 14.1797 4.68604ZM11.313 14.6626C12.105 14.6626 12.7471 14.0205 12.7471 13.2285C12.7471 12.4365 12.105 11.7944 11.313 11.7944C10.521 11.7944 9.87891 12.4365 9.87891 13.2285C9.87891 14.0205 10.521 14.6626 11.313 14.6626ZM11.313 15.6626C11.8309 15.6626 12.311 15.5009 12.7056 15.2251L14.3475 16.8671C14.5246 17.0442 14.8118 17.0442 14.9889 16.8671C15.166 16.69 15.166 16.4028 14.9889 16.2257L13.3399 14.5767C13.5971 14.1908 13.7471 13.7271 13.7471 13.2285C13.7471 11.8842 12.6573 10.7944 11.313 10.7944C9.96868 10.7944 8.87891 11.8842 8.87891 13.2285C8.87891 14.5728 9.96868 15.6626 11.313 15.6626Z" fill="#1D1B20"/>
                    </svg>
            </sl-tooltip>`
    }

    var genomeIcon = function(cell, formatterParams, onRendered){
        return `<sl-tooltip content="Explore Phage Genome" class="table-tooltip">
                <svg class="table-icon" width="24" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16.0033 19.4757L16.0026 19.4633C16.0019 19.4522 16.0008 19.4345 15.9992 19.4106C15.9958 19.3626 15.9903 19.2898 15.9819 19.1956C15.9649 19.0071 15.9361 18.7344 15.8894 18.4058C15.8666 18.2461 15.8398 18.0744 15.8083 17.8938H8.71294V16.3938H15.4668C15.4311 16.27 15.3932 16.1458 15.3529 16.0219C15.3197 15.9201 15.2853 15.8193 15.2495 15.72H8.71294V14.22H14.5176C14.4205 14.0758 14.3183 13.9414 14.2108 13.8185C13.7485 13.2899 13.2181 13 12.547 13C11.179 13 10.133 12.3618 9.37768 11.4982C8.64317 10.6584 8.16138 9.58702 7.83921 8.59689C7.51344 7.59567 7.32849 6.60665 7.22452 5.87599C7.17223 5.50849 7.1397 5.20115 7.12013 4.98362C7.11033 4.87475 7.10375 4.78806 7.09955 4.72723C7.09745 4.69681 7.09594 4.67284 7.09492 4.65576L7.09375 4.63536L7.09341 4.62914L7.09331 4.62705C7.09329 4.62673 7.09323 4.62564 8.09195 4.57495L7.09323 4.62564C7.06524 4.07406 7.48968 3.60423 8.04126 3.57624C8.59257 3.54826 9.06222 3.97228 9.09062 4.52347L9.09072 4.5253L9.09138 4.53674C9.09204 4.54776 9.09314 4.56548 9.0948 4.58944C9.09811 4.63738 9.10361 4.71022 9.11208 4.80437C9.12905 4.9929 9.15782 5.26565 9.20458 5.59424C9.2273 5.75393 9.2541 5.92561 9.2856 6.1062H17.0054V7.6062H9.62716C9.66282 7.72997 9.70075 7.85415 9.74107 7.97808C9.77421 8.07993 9.80867 8.18067 9.84447 8.28003H16.3942V9.78003H10.5763C10.6734 9.92425 10.7756 10.0586 10.8831 10.1815C11.3454 10.7101 11.8758 11 12.547 11C13.9149 11 14.9609 11.6382 15.7163 12.5018C16.4508 13.3416 16.9326 14.413 17.2547 15.4031C17.5805 16.4043 17.7655 17.3934 17.8694 18.124C17.9217 18.4915 17.9542 18.7988 17.9738 19.0164C17.9836 19.1253 17.9902 19.2119 17.9944 19.2728C17.9965 19.3032 17.998 19.3272 17.999 19.3442L18.0002 19.3646L18.0005 19.3709L18.0006 19.3729C18.0007 19.3733 18.0007 19.3744 17.002 19.425L18.0007 19.3744C18.0287 19.9259 17.6043 20.3958 17.0527 20.4238C16.5014 20.4517 16.0317 20.0269 16.0033 19.4757Z" fill="#1D1B20"/>
                        <path d="M9.09053 19.4755L9.09059 19.4745L9.09125 19.463C9.09191 19.452 9.09302 19.4343 9.09467 19.4103C9.09798 19.3624 9.10348 19.2896 9.11195 19.1954C9.12892 19.0069 9.1577 18.7341 9.20445 18.4055C9.29859 17.744 9.46274 16.8767 9.74095 16.0217C10.0228 15.1556 10.3998 14.3707 10.883 13.8183C11.3453 13.2897 11.8758 13 12.547 13C13.9149 13 14.9608 12.3616 15.7161 11.498C16.4507 10.6582 16.9324 9.5868 17.2546 8.59667C17.5804 7.59545 17.7653 6.60643 17.8693 5.87577C17.9216 5.50827 17.9541 5.20093 17.9737 4.9834C17.9835 4.87453 17.9901 4.78784 17.9943 4.72701C17.9964 4.69659 17.9979 4.67262 17.9989 4.65554L18.0001 4.63514L18.0004 4.62892L18.0005 4.62683C18.0005 4.62651 18.0006 4.62542 17.0019 4.57473L18.0006 4.62542C18.0286 4.07384 17.6041 3.60401 17.0526 3.57602C16.5013 3.54804 16.0316 3.97206 16.0032 4.52325C16.0032 4.52327 16.0032 4.52323 16.0032 4.52325L16.0031 4.52508L16.0024 4.53652C16.0018 4.54754 16.0007 4.56526 15.999 4.58922C15.9957 4.63716 15.9902 4.71 15.9817 4.80415C15.9648 4.99268 15.936 5.26543 15.8892 5.59402C15.7951 6.25557 15.631 7.12282 15.3528 7.97786C15.0709 8.844 14.6939 9.62889 14.2107 10.1813C13.7484 10.7099 13.2181 11 12.547 11C11.179 11 10.1329 11.638 9.37755 12.5016C8.64305 13.3414 8.16125 14.4128 7.83909 15.4029C7.51331 16.4041 7.32837 17.3931 7.2244 18.1238C7.1721 18.4913 7.13958 18.7986 7.12 19.0162C7.11021 19.125 7.10363 19.2117 7.09942 19.2725C7.09732 19.303 7.09582 19.3269 7.0948 19.344L7.09362 19.3644L7.09329 19.3706L7.09318 19.3727C7.09316 19.3731 7.09311 19.3741 8.09182 19.4248L7.09311 19.3741C7.06511 19.9257 7.48956 20.3955 8.04113 20.4235C8.59244 20.4515 9.06213 20.0267 9.09053 19.4755Z" fill="#1D1B20"/>
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
        {formatter: genomeIcon, width:100, hozAlign: "center", cellClick: async function(e,cell){
            const rowData = cell.getRow().getData()

            const genome_name = await fetch_genome_name_with_organism_name(rowData.phageName, 'phage');

            // save the values for the select elements in sessionStorage, which can then be accessed in dataset exploration
            sessionStorage.setItem("genome-redirect-params", JSON.stringify({"select1": genome_name, "select2": rowData.source}))
            
            // navigate to the Exploration page
            window.location.href = "/genome-viewer";
            
        }},
        {title: "Study", field: "source"},
        {title: "Journal", field: "journal"},
        {title: "DOI", field: "doi", formatter:"link", width: 200},
        {title: "Phage Name", field: "phageName"},
        {title: "Host Name", field: "hostName"},
        {title: "First Author", field: "firstAuthor"},
        {title: "Year", field: "year"},
        {title: "Pubmed ID", field: "pubmedID"},
        {title: "Description", field: "description", formatter: "textarea", width: 450},
        {title: "Date added", field: "uploadDate"},
    ]

    const filterButton = document.getElementById("filter-button");
    const filterContainer = document.getElementById("filter-fields");
    const tooltip = document.getElementById("filter-tooltip");
    const searchInput = document.getElementById("filter-search");

    filterButton.addEventListener('click', () => {
        if (filterContainer.style.display === "none" || filterContainer.style.display === ''){
            filterButton.setAttribute("name", "funnel");
            tooltip.content = "Close Field Filter";
            filterContainer.style.display = "flex";

            // hide search Input field and clear it
            searchInput.style.display = "none";
            searchInput.value = '';
            searchInput.dispatchEvent(new Event('sl-input', { bubbles: true }));
        } else {
            filterButton.setAttribute("name", "funnel-fill");
            filterContainer.style.display = "none";
            tooltip.content = "Open Field Filter";

            // show search field
            searchInput.style.display = "block";
            
        }
    });

    // add function to search field 
    searchInput.addEventListener("sl-input", (event) => {
        console.log(event.target.value)
        const input = event.target.value;

        const searchFilters = [];
        if(input){
            tableCols.forEach(column => {
                if(column.field){
                    searchFilters.push({field: column.field, type:"like", value: input});
                }
            });

            table.setFilter([searchFilters]);
        } else{
            table.clearFilter();
        }
        
    })


    // create the options for the filter field 
    tableCols.forEach(column =>{
        
        // create options only for the none empty columns => if column.field exists (because the redirecting route columns with icons won't need a filter)
        if(column.field){
            const option = document.createElement("sl-option");
            option.value = column.field;
            option.textContent = column.title;
            filter_col_select.appendChild(option)
        }
        
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